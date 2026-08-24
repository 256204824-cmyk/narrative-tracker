import { t } from '../i18n/catalog.ts';

// 生成一次分析所需的最少「不同日子」数量。
// 同一天写多条不能说明任何跨时间的模式（PRD 5.2）。
export const MIN_DAYS_FOR_ANALYSIS = 3;

// 各档位的分析窗口（天）。
//
// 注意 free 是 7 而不是 PRD 8.2 写的 3：窗口若等于 MIN_DAYS_FOR_ANALYSIS，
// 用户必须连续三天一天不落才能看到反馈，漏一天窗口滚动就又要从头来。
// 这会让新用户在第一周大概率一次反馈都看不到，而 PRD 12「风险一」正是
// 「用户不愿持续输入」—— 那个设计恰好惩罚了它想鼓励的行为。
// 7 天也与 PRD 10.1 的成功指标「7 日内至少提交 3 次事实」一致。
export const TIER_LIMITS: Record<string, number> = {
  free: 7,
  plus: 30,
  pro: 365,
};

// 题目的 id 与结构在此定义，文案在 i18n 里。
// id 同时是数据库列名的来源，**改 id 等于改 schema**，不要随意改动。

export const PORTRAIT_SCALE_IDS = [
  'discipline',
  'engagement',
  'procrastination',
  'persistence',
] as const;

export const PORTRAIT_TEXT_IDS = ['strength', 'change', 'self_words'] as const;

export const FACT_IDS = [
  'completed',
  'uncompleted',
  'progress',
  'avoidance',
  'representative',
  'one_line',
] as const;

export const TAG_IDS = [
  'study', 'work', 'health', 'social',
  'emotion', 'procrastination', 'discipline', 'other',
] as const;

export type PortraitScaleId = (typeof PORTRAIT_SCALE_IDS)[number];
export type PortraitTextId = (typeof PORTRAIT_TEXT_IDS)[number];
export type FactId = (typeof FACT_IDS)[number];
export type TagId = (typeof TAG_IDS)[number];

/**
 * 多语言之前的版本把中文显示名直接存进了库，
 * 这里把它们映射回 id，否则老记录的标签统计会和新记录对不上。
 */
const LEGACY_TAG_ALIASES: Record<string, TagId> = {
  学习: 'study',
  工作: 'work',
  健康: 'health',
  社交: 'social',
  情绪: 'emotion',
  拖延: 'procrastination',
  自律: 'discipline',
  其他: 'other',
};

/** 把库里的标签值收敛成 id（兼容旧数据） */
export function normalizeTag(raw: string): string {
  return LEGACY_TAG_ALIASES[raw] ?? raw;
}

/**
 * 标签在数据库里存的是 id（如 'study'），不是显示文案。
 *
 * 存显示文案的话，用户切换语言后旧记录的标签会和新标签对不上，
 * 统计就断了 —— 而那正是 AI prompt 里主题计数的依据。
 */
export function tagLabel(raw: string): string {
  const tags = t().questions.tags as Record<string, string>;
  return tags[normalizeTag(raw)] ?? raw;
}
