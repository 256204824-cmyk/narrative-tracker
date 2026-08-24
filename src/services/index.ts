import { secureGet, secureSet, secureDelete } from './storage';
import type { AIAnalysisOutput, Tier, SelfPortrait, FactLog } from '../types';
import { getProviderConfig } from './provider';
import type { LocalePreference } from '../i18n/types';
import { migrateStoredLocale } from '../i18n/catalog';
import { t } from '../i18n';
import { tagLabel } from '../constants/questions';
import { inspectAnalysis, type FieldIssue } from './analysisShape';
import { SYSTEM_PROMPT, ANALYSIS_JSON_SCHEMA } from './analysisPrompt';
import { matchPreset } from './providerPresets';
import { IS_BUNDLED_BUILD, BUNDLED_KEY, BUNDLED_PROVIDER } from './bundledProvider';

/**
 * AI 返回结构不符合预期时抛出，携带足够界面展示的诊断信息。
 *
 * 只抛一句「格式不符合预期」的话，用户在真机上无从排查——
 * 既不知道哪个字段有问题，也看不到模型实际返回了什么。
 */
export class AnalysisFormatError extends Error {
  constructor(
    readonly issues: FieldIssue[],
    readonly raw: string,
    readonly baseUrl: string,
    readonly model: string,
    /** OpenAI 兼容接口的 finish_reason，'length' 表示被截断 */
    readonly finishReason?: string
  ) {
    super(t().ai.badShape);
    this.name = 'AnalysisFormatError';
  }
}

const API_KEY_STORE_KEY = 'narrative_tracker_api_key';
const ONBOARDING_STORE_KEY = 'narrative_tracker_onboarding_done';
const TIER_STORE_KEY = 'narrative_tracker_tier';
const LOCALE_STORE_KEY = 'narrative_tracker_locale';

// ── API Key Management ──

export async function saveApiKey(key: string): Promise<void> {
  await secureSet(API_KEY_STORE_KEY, key);
}

export async function getApiKey(): Promise<string | null> {
  // 测试包内置 Key，用户不需要（也不能）自己填
  if (IS_BUNDLED_BUILD) return BUNDLED_KEY;
  return secureGet(API_KEY_STORE_KEY);
}

export async function deleteApiKey(): Promise<void> {
  await secureDelete(API_KEY_STORE_KEY);
}

// ── Onboarding State ──

export async function setOnboardingComplete(): Promise<void> {
  await secureSet(ONBOARDING_STORE_KEY, 'true');
}

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await secureGet(ONBOARDING_STORE_KEY);
  return value === 'true';
}

/**
 * 清除 onboarding 标记，让 App 回到自我画像流程。
 * 删除全部数据时必须一并调用：自我画像被删掉后如果这个标记还在，
 * App 会停在主界面，而分析功能又要求存在画像，用户将无路可走。
 */
export async function clearOnboardingComplete(): Promise<void> {
  await secureDelete(ONBOARDING_STORE_KEY);
}

// ── Tier ──

export async function saveTier(tier: Tier): Promise<void> {
  await secureSet(TIER_STORE_KEY, tier);
}

export async function getTier(): Promise<Tier> {
  const value = await secureGet(TIER_STORE_KEY);
  return value === 'plus' || value === 'pro' ? value : 'free';
}

// ── Locale ──

export async function saveLocalePreference(pref: LocalePreference): Promise<void> {
  await secureSet(LOCALE_STORE_KEY, pref);
}

export async function getLocalePreference(): Promise<LocalePreference> {
  const value = await secureGet(LOCALE_STORE_KEY);
  // 只支持 zh / en 时期存下来的 'zh' 现在不是合法的 Locale，
  // 不迁移的话老用户的语言选择会被静默丢弃。
  return migrateStoredLocale(value) ?? 'system';
}

// ── AI Analysis ──

export interface AnalysisInput {
  /** 最新一版自我画像 */
  portrait: SelfPortrait;
  /** 更早的画像版本，按时间倒序；用于观察叙事本身的变化 */
  history: SelfPortrait[];
  facts: FactLog[];
  /** 分析窗口的天数（由 tier 决定） */
  windowDays: number;
}

const scoreLine = (p: SelfPortrait) =>
  `自律 ${p.discipline_score}/10、投入 ${p.engagement_score}/10、` +
  `拖延 ${p.procrastination_score}/10（越高越拖延）、坚持 ${p.persistence_score}/10`;

/**
 * 取出标签的**显示名**而不是库里的 id。
 *
 * 库里存的是 'study' 这类稳定 id（切换语言时统计不会分裂），
 * 但 prompt 是给模型读的，裸 id 会让它难以判断主题；
 * tagLabel 同时兼容旧数据里存的中文名。
 */
function parseTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').map((x) => tagLabel(x)) : [];
  } catch {
    return [];
  }
}

/**
 * 统计证据覆盖情况。
 *
 * 只给模型一堆事实、不给覆盖度，它无法区分「30 天全满」和「30 天里只有 5 天有记录」，
 * 而这正是 PRD 原则四要求的「证据是否充足」的判断依据。
 * 标签是结构化的、可数的，比让模型从自由文本里猜可靠得多。
 */
function buildCoverage(facts: FactLog[], windowDays: number): string {
  const days = new Set(facts.map((f) => f.date)).size;

  const tagCount = new Map<string, number>();
  for (const f of facts) {
    for (const tag of parseTags(f.category_tags)) {
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    }
  }

  const tagLine =
    tagCount.size > 0
      ? [...tagCount.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n} 条`).join('、')
      : '用户一次都没有使用过分类标签';

  const untagged = facts.filter((f) => parseTags(f.category_tags).length === 0).length;

  return `证据覆盖情况（请据此判断结论的可靠程度）：
- 分析窗口：最近 ${windowDays} 天
- 窗口内有记录的天数：${days} 天（即有 ${windowDays - days} 天没有任何记录）
- 事实条数：${facts.length} 条，其中 ${untagged} 条没有打标签
- 各主题的记录条数：${tagLine}

注意：某个主题的记录条数为 0 或极少时，不要对该主题下任何结论，
应当把它列进 insufficient_evidence。`;
}

function buildHistorySection(history: SelfPortrait[]): string {
  if (history.length === 0) return '';
  return `
用户更早的自我评价版本（从新到旧）：
${history.map((p) => `- ${p.created_at.split(' ')[0]}：${scoreLine(p)}；三个词「${p.self_words}」`).join('\n')}

如果自我评价随时间发生了明显变化，而事实记录并未同步变化（或相反），
这本身就是值得指出的模式。但版本很少时不要过度解读。`;
}

function buildAnalysisPrompt(input: AnalysisInput): string {
  const { portrait, history, facts, windowDays } = input;

  return `用户当前的自我评价（${portrait.created_at.split(' ')[0]}）：
- ${scoreLine(portrait)}
- 自认为的最大优势：${portrait.strength_text}
- 最想改变的问题：${portrait.change_text}
- 描述自己的三个词：${portrait.self_words}
${buildHistorySection(history)}

${buildCoverage(facts, windowDays)}

用户提交的事实记录：
${facts
  .map((f, i) => {
    const tags = parseTags(f.category_tags);
    const lines = [
      `第 ${i + 1} 条（${f.date}${tags.length ? ` · 标签：${tags.join('、')}` : ' · 无标签'}）：`,
      f.completed_text && `- 实际完成了：${f.completed_text}`,
      f.uncompleted_text && `- 计划做但没做：${f.uncompleted_text}`,
      f.progress_evidence && `- 靠近目标的证据：${f.progress_evidence}`,
      f.avoidance_text && `- 逃避事件：${f.avoidance_text}`,
      f.representative_fact && `- 最有代表性的事实：${f.representative_fact}`,
      f.one_line_fact && `- 一句总结：${f.one_line_fact}`,
    ].filter(Boolean);
    return lines.join('\n');
  })
  .join('\n\n')}

请分析以上数据，按系统提示里规定的 JSON 格式输出分析报告。`;
}

export async function requestAnalysis(input: AnalysisInput): Promise<AIAnalysisOutput> {
  const apiKey = await getApiKey();
  const userPrompt = buildAnalysisPrompt(input);
  const { baseUrl, model } = await getProviderConfig();

  // 本机模型（Ollama / LM Studio）不需要 Key，预设里也标了「无需 Key」——
  // 却在这里被无条件拦下，等于那两个选项根本用不了。
  const needsKey = matchPreset(baseUrl)?.needsKey ?? true;
  if (!apiKey && needsKey) {
    throw new Error(t().ai.noKey);
  }

  const messages = [
    // 报告是给用户读的，必须用界面语言写；prompt 骨架保持中文即可，
    // 模型理解中文指令没有问题，但输出语言必须显式指定。
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${t().locale.aiInstruction}` },
    { role: 'user', content: userPrompt },
  ];

  // 三级降级：json_schema 由服务端强制字段名，最可靠；
  // 不支持的服务退到 json_object（只保证是合法 JSON）；
  // 再不支持就裸调，靠提示词和解析层兜着。
  const MODES = ['json_schema', 'json_object', 'none'] as const;
  type Mode = (typeof MODES)[number];

  const responseFormat = (mode: Mode) => {
    if (mode === 'json_schema') {
      return { response_format: { type: 'json_schema', json_schema: ANALYSIS_JSON_SCHEMA } };
    }
    if (mode === 'json_object') return { response_format: { type: 'json_object' } };
    return {};
  };

  const call = (mode: Mode) =>
    fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 没有 Key 时（本机模型）不要发空的 Authorization 头，
        // 有些服务端会把它当成非法凭据直接拒绝
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        ...responseFormat(mode),
      }),
    });

  let response = await call('json_schema');
  for (let i = 1; i < MODES.length && !response.ok && response.status >= 400 && response.status < 500; i++) {
    response = await call(MODES[i]);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(t().ai.requestFailed(response.status, errorText.slice(0, 300), baseUrl, model));
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const content: string | undefined = choice?.message?.content;
  const finishReason: string | undefined = choice?.finish_reason;

  if (!content) {
    throw new AnalysisFormatError(
      [{ field: t().ai.wholeResponse, expected: 'string', actual: 'empty', fatal: true }],
      '',
      baseUrl,
      model,
      finishReason
    );
  }

  // 响应被截断时 JSON 一定不完整，与其让用户看到「不是合法的 JSON」，
  // 不如直接说清是截断，并给出可操作的建议。
  if (finishReason === 'length') {
    throw new AnalysisFormatError(
      [{ field: 'finish_reason', expected: 'stop', actual: 'length', fatal: true }],
      content,
      baseUrl,
      model,
      finishReason
    );
  }

  // 未走 json_object 模式时，很多模型会把 JSON 包在 ```json 围栏里
  const stripped = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new AnalysisFormatError(
      [{ field: t().ai.wholeResponse, expected: 'JSON', actual: t().ai.notJsonActual, fatal: true }],
      content,
      baseUrl,
      model,
      finishReason
    );
  }

  try {
    return inspectAnalysis(parsed).output;
  } catch (issues) {
    if (Array.isArray(issues)) {
      throw new AnalysisFormatError(issues as FieldIssue[], content, baseUrl, model, finishReason);
    }
    throw issues;
  }
}


