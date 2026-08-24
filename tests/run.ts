// 纯逻辑单测。用 Node 22 内置的类型擦除直接跑 .ts，无需构建、无需测试框架：
//   npm test
//
// 这里只覆盖不依赖 expo 原生模块的纯函数（日期、导入校验、provider URL）。
// 涉及界面和 SQLite 的验证见 tests/README.md 里说的 CDP 集成脚本。

import { toLocalDateString, today, daysAgo, countDistinctDays } from '../src/utils/date.ts';
import { normalizeBaseUrl, checkBaseUrl } from '../src/services/providerUrl.ts';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
import { validateImport } from '../src/utils/importValidation.ts';
import { TIER_LIMITS, MIN_DAYS_FOR_ANALYSIS, tagLabel, normalizeTag, TAG_IDS } from '../src/constants/questions.ts';
import { zhHans } from '../src/i18n/zhHans.ts';
import { en } from '../src/i18n/en.ts';
import { messagesFor, setActiveLocale, resolveLocaleTag, migrateStoredLocale, localeOptions, t as activeMessages } from '../src/i18n/catalog.ts';
import { SUPPORTED_LOCALES } from '../src/i18n/types.ts';
import { inspectAnalysis, describe as describeValue, unwrapPayload } from '../src/services/analysisShape.ts';
import { SYSTEM_PROMPT, REQUIRED_OUTPUT_FIELDS } from '../src/services/analysisPrompt.ts';
import { demoTextFor } from '../src/dev/demoText/index.ts';
import { DEMO_SKELETON } from '../src/dev/demoSkeleton.ts';
import { gapPresentation } from '../src/components/gapPresentation.ts';
import { zhHansDemo } from '../src/dev/demoText/zhHans.ts';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failed++;
    failures.push(`  ✗ ${name}\n      期望 ${e}\n      实际 ${a}`);
  }
}

function ok(name: string, cond: boolean) {
  check(name, cond, true);
}

function group(title: string, fn: () => void) {
  console.log(`\n── ${title} ──`);
  const before = failed;
  fn();
  console.log(failed === before ? '  全部通过' : failures.splice(0).join('\n'));
}

// ────────────────────────────────────────────────
group('日期工具（本地时区）', () => {
  check('格式化补零', toLocalDateString(new Date(2026, 7, 3)), '2026-08-03');
  check('跨年', toLocalDateString(new Date(2025, 11, 31)), '2025-12-31');
  ok('today 是 YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(today()));
  ok('daysAgo(0) 等于 today', daysAgo(0) === today());
  ok('daysAgo(1) 小于 today', daysAgo(1) < today());
  check('daysAgo 跨月', (() => {
    const d = new Date(2026, 8, 1); // 2026-09-01
    d.setDate(d.getDate() - 1);
    return toLocalDateString(d);
  })(), '2026-08-31');
  check('不同天数统计', countDistinctDays([
    { date: '2026-08-01' }, { date: '2026-08-01' }, { date: '2026-08-02' },
  ]), 2);
  check('空数组', countDistinctDays([]), 0);
});

// ────────────────────────────────────────────────
group('档位窗口', () => {
  // 回归：窗口若等于最少证据天数，用户必须一天不落，漏一天就永远看不到反馈
  ok('free 窗口必须大于最少证据天数', TIER_LIMITS.free > MIN_DAYS_FOR_ANALYSIS);
  ok('plus 窗口大于 free', TIER_LIMITS.plus > TIER_LIMITS.free);
  ok('pro 窗口大于 plus', TIER_LIMITS.pro > TIER_LIMITS.plus);
  // free 用户在窗口内允许缺席的天数
  ok('free 至少容许缺席 4 天', TIER_LIMITS.free - MIN_DAYS_FOR_ANALYSIS >= 4);
});

// ────────────────────────────────────────────────
group('Provider base URL', () => {
  check('去尾斜杠', normalizeBaseUrl('https://api.openai.com/v1/'), 'https://api.openai.com/v1');
  check('多个尾斜杠', normalizeBaseUrl('https://x.com/v1///'), 'https://x.com/v1');
  check('剥离 endpoint', normalizeBaseUrl('https://x.com/v1/chat/completions'), 'https://x.com/v1');
  check('去空格', normalizeBaseUrl('  https://x.com/v1  '), 'https://x.com/v1');
  check('空串', normalizeBaseUrl('   '), '');

  ok('拒绝空 URL', !checkBaseUrl('').ok);
  ok('拒绝非 URL', !checkBaseUrl('不是网址').ok);
  ok('拒绝非 http 协议', !checkBaseUrl('ftp://x.com/v1').ok);
  ok('接受 https', checkBaseUrl('https://api.openai.com/v1').ok);
  ok('https 不告警', !checkBaseUrl('https://api.openai.com/v1').warning);
  ok('localhost 明文不告警', !checkBaseUrl('http://localhost:11434/v1').warning);
  ok('内网明文不告警', !checkBaseUrl('http://192.168.1.9:11434/v1').warning);
  ok('公网明文要告警', !!checkBaseUrl('http://example.com/v1').warning);
  ok('默认值合法', checkBaseUrl(DEFAULT_BASE_URL).ok);
});

// ────────────────────────────────────────────────
group('导入校验', () => {
  const valid = JSON.stringify({
    format_version: 1,
    self_portraits: [{ discipline_score: 8, engagement_score: 7, procrastination_score: 6,
      persistence_score: 7, strength_text: 'a', change_text: 'b', self_words: 'c',
      created_at: '2026-08-01 10:00:00' }],
    fact_logs: [{ date: '2026-08-01', completed_text: '做了事', category_tags: '["学习"]',
      created_at: '2026-08-01 10:00:00' }],
    analysis_results: [],
  });

  ok('接受正常文件', validateImport(valid).ok);
  ok('拒绝非 JSON', !validateImport('这不是json{{{').ok);
  ok('拒绝顶层数组', !validateImport('[1,2,3]').ok);
  ok('拒绝无关 JSON', !validateImport('{"foo":"bar"}').ok);
  ok('拒绝空数据', !validateImport('{"self_portraits":[],"fact_logs":[]}').ok);
  ok('拒绝更高版本', !validateImport(JSON.stringify({
    format_version: 99, self_portraits: [], fact_logs: [{ date: '2026-08-01' }] })).ok);
  ok('拒绝错误日期格式', !validateImport(JSON.stringify({
    self_portraits: [], fact_logs: [{ date: '2026/8/1' }] })).ok);
  ok('拒绝空日期', !validateImport(JSON.stringify({
    self_portraits: [], fact_logs: [{ date: '' }] })).ok);

  // 脏值应钳制而非拒绝
  const dirty = validateImport(JSON.stringify({
    self_portraits: [{ discipline_score: 999, engagement_score: -5, procrastination_score: 'x' }],
    fact_logs: [{ date: '2026-08-01', category_tags: '不是json' }],
    analysis_results: [{ alignment_score: 500, confidence: 'bogus' }],
  }));
  ok('脏数据不整体拒绝', dirty.ok);
  if (dirty.ok) {
    check('分数上界钳制', dirty.data.self_portraits[0].discipline_score, 10);
    check('分数下界钳制', dirty.data.self_portraits[0].engagement_score, 1);
    check('类型错误取默认', dirty.data.self_portraits[0].procrastination_score, 5);
    check('非法 tags 归零', dirty.data.fact_logs[0].category_tags, '[]');
    check('对齐度钳制', dirty.data.analysis_results[0].alignment_score, 100);
    check('非法置信度收敛', dirty.data.analysis_results[0].confidence, 'low');
    ok('created_at 有兜底', dirty.data.fact_logs[0].created_at.length > 0);
  }

  // 保真：合法数据不能被改动
  const roundtrip = validateImport(valid);
  if (roundtrip.ok) {
    check('日期原样保留', roundtrip.data.fact_logs[0].date, '2026-08-01');
    check('created_at 原样保留', roundtrip.data.fact_logs[0].created_at, '2026-08-01 10:00:00');
    check('标签原样保留', roundtrip.data.fact_logs[0].category_tags, '["学习"]');
    check('分数原样保留', roundtrip.data.self_portraits[0].discipline_score, 8);
  }
});

// ────────────────────────────────────────────────
group('多语言', () => {
  // 递归比对两套文案的键，防止漏译（类型系统已覆盖，这里再兜一层运行时）
  const shape = (o: unknown, prefix = ''): string[] => {
    if (typeof o === 'function') return [`${prefix}()`];
    if (Array.isArray(o)) return [`${prefix}[]`];
    if (o && typeof o === 'object') {
      return Object.entries(o).flatMap(([k, v]) => shape(v, prefix ? `${prefix}.${k}` : k));
    }
    return [prefix];
  };
  // 每种语言都要和简体中文（真源）键完全一致
  const reference = shape(zhHans).sort();
  for (const loc of SUPPORTED_LOCALES) {
    check(`${loc} 的键与 zh-Hans 完全一致`, shape(messagesFor(loc)).sort(), reference);
  }

  for (const loc of SUPPORTED_LOCALES) {
    const m = messagesFor(loc);
    ok(`${loc} 有语言名`, m.locale.name.length > 0);
    ok(`${loc} 有 AI 语言指令`, m.locale.aiInstruction.length > 0);
    ok(`${loc} 隐私承诺 5 条`, m.settings.privacyLines.length === 5);
    // 每个标签 id 都要有译名，否则 prompt 里会漏出裸 id
    ok(`${loc} 标签全部有译名`, TAG_IDS.every((id) => !!(m.questions.tags as Record<string, string>)[id]));
  }

  // 每种语言的标题必须两两不同，避免复制粘贴后忘了翻译
  const titles = SUPPORTED_LOCALES.map((l) => messagesFor(l).home.title);
  check('各语言标题互不重复', new Set(titles).size, SUPPORTED_LOCALES.length);
  ok('带参文案也切换', zhHans.home.counted(3) !== en.home.counted(3));
  check('设置页语言选项数量', localeOptions().length, SUPPORTED_LOCALES.length);

  // 简繁必须区分开——两者的基础码都是 zh
  check('zh-Hans-CN', resolveLocaleTag('zh-Hans-CN'), 'zh-Hans');
  check('zh-CN', resolveLocaleTag('zh-CN'), 'zh-Hans');
  check('裸 zh 默认简体', resolveLocaleTag('zh'), 'zh-Hans');
  check('zh-Hant-TW', resolveLocaleTag('zh-Hant-TW'), 'zh-Hant');
  check('zh-TW 无 script 也判繁体', resolveLocaleTag('zh-TW'), 'zh-Hant');
  check('zh-HK', resolveLocaleTag('zh-HK'), 'zh-Hant');
  check('zh-MO', resolveLocaleTag('zh-MO'), 'zh-Hant');
  check('en-US', resolveLocaleTag('en-US'), 'en');
  check('ja-JP', resolveLocaleTag('ja-JP'), 'ja');
  check('th-TH', resolveLocaleTag('th-TH'), 'th');
  check('vi-VN', resolveLocaleTag('vi-VN'), 'vi');
  check('不支持的语言返回 null', resolveLocaleTag('pt-BR'), null);
  check('空值返回 null', resolveLocaleTag(null), null);

  // 旧版只存 'zh' / 'en'，不迁移的话老用户的选择会被丢弃
  check('旧值 zh 迁移到 zh-Hans', migrateStoredLocale('zh'), 'zh-Hans');
  check('旧值 en 保持', migrateStoredLocale('en'), 'en');
  check('system 保持', migrateStoredLocale('system'), 'system');
  check('无法识别的值返回 null', migrateStoredLocale('klingon'), null);

  // 模块级当前语言
  setActiveLocale('zh-Hant');
  check('t() 跟随 zh-Hant', activeMessages().home.title, messagesFor('zh-Hant').home.title);
  setActiveLocale('ja');
  check('t() 跟随 ja', activeMessages().home.title, messagesFor('ja').home.title);
  setActiveLocale('en');
});

// ────────────────────────────────────────────────
group('标签 id 与旧数据兼容', () => {
  check('旧中文标签映射回 id', normalizeTag('学习'), 'study');
  check('id 保持不变', normalizeTag('study'), 'study');
  check('未知值原样返回', normalizeTag('whatever'), 'whatever');

  setActiveLocale('zh-Hans');
  check('中文界面下 id 显示中文', tagLabel('study'), '学习');
  check('中文界面下旧数据也显示中文', tagLabel('学习'), '学习');
  setActiveLocale('en');
  check('英文界面下 id 显示英文', tagLabel('study'), 'Study');
  // 关键：旧记录存的是中文名，切到英文后也必须显示英文，否则统计会分裂
  check('英文界面下旧数据显示英文', tagLabel('学习'), 'Study');
});

// ────────────────────────────────────────────────
group('AI 返回结构检查', () => {
  const good = {
    summary: '还行',
    alignment_score: 72,
    confidence: 'medium',
    matched_beliefs: [{ belief: 'a', evidence: 'b', assessment: 'c' }],
    gaps: [],
    insufficient_evidence: ['社交没有记录'],
    suggested_reflection: '下周留意开始时间',
  };

  const run = (input: unknown) => {
    try {
      return { ok: true as const, ...inspectAnalysis(input) };
    } catch (issues) {
      return { ok: false as const, issues: issues as Array<{ field: string; fatal: boolean }> };
    }
  };

  // 正常输入原样通过
  const r1 = run(good);
  ok('正常结构通过', r1.ok);
  if (r1.ok) {
    check('无遗留问题', r1.issues.length, 0);
    check('分数保留', r1.output.alignment_score, 72);
    check('置信度保留', r1.output.confidence, 'medium');
  }

  // 分数是字符串——真实 provider 很常见，应当救回来而不是报错
  const r2 = run({ ...good, alignment_score: '72' });
  ok('字符串分数被救回', r2.ok);
  if (r2.ok) {
    check('字符串分数解析正确', r2.output.alignment_score, 72);
    check('并记为非致命问题', r2.issues.filter((i) => !i.fatal).length, 1);
  }
  const r2b = run({ ...good, alignment_score: '72分' });
  ok('带单位的分数也能解析', r2b.ok && r2b.output.alignment_score === 72);

  // 分数越界仍要钳制
  const r3 = run({ ...good, alignment_score: 142 });
  ok('越界分数钳到 100', r3.ok && r3.output.alignment_score === 100);

  // 分数缺失 = 致命：填 0 会被渲染成红色「差距较大」，等于凭空造结论
  const r4 = run({ ...good, alignment_score: undefined });
  ok('缺分数判为致命', !r4.ok);
  if (!r4.ok) {
    ok('致命字段指名 alignment_score', r4.issues.some((i) => i.field === 'alignment_score' && i.fatal));
  }
  ok('分数为文字时致命', !run({ ...good, alignment_score: '很高' }).ok);

  // 数组字段类型不对 → 兜底成空数组，不阻断
  const r5 = run({ ...good, matched_beliefs: {}, gaps: null });
  ok('数组字段异常不阻断', r5.ok);
  if (r5.ok) {
    check('matched_beliefs 兜底', r5.output.matched_beliefs.length, 0);
    check('gaps 兜底', r5.output.gaps.length, 0);
    ok('两个字段都被记录', r5.issues.filter((i) => !i.fatal).length >= 2);
  }

  // 三块内容全空 → 报告是白纸，判致命
  ok('内容全空判为致命', !run({ alignment_score: 50, summary: '', matched_beliefs: [], gaps: [] }).ok);

  // 只要有一块内容就够
  ok('只有 gaps 也可生成', run({ alignment_score: 50, gaps: [{ belief: 'x', evidence: 'y', assessment: 'z' }] }).ok);

  // 非法 confidence 收敛
  const r6 = run({ ...good, confidence: 'bogus' });
  ok('非法置信度收敛为 low', r6.ok && r6.output.confidence === 'low');

  // 条目里字段缺失时不要产生空壳
  const r7 = run({ ...good, matched_beliefs: [{ belief: 'a' }, {}, 'not an object'] });
  ok('丢弃空壳条目', r7.ok && r7.output.matched_beliefs.length === 1);

  // 多包一层的返回要能解开
  check('解开 {analysis:{...}}', (unwrapPayload({ analysis: good }) as any).alignment_score, 72);
  check('已在顶层则原样返回', (unwrapPayload(good) as any).alignment_score, 72);
  ok('嵌套结构可直接通过', run({ result: good }).ok);

  // 顶层不是对象
  ok('顶层是数组判致命', !run([1, 2, 3]).ok);
  ok('顶层是字符串判致命', !run('nope').ok);

  // 真机上 deepseek-v4-flash 实际返回过的结构：
  // consistent / aspect / analysis，evidence 还是数组
  const deepseekShape = {
    consistent: [
      {
        aspect: '努力、上进、有行动力',
        evidence: ['07-28 把昨天欠的习题补上了', '07-30 数学第三章终于开始'],
        analysis: '事实里大量日期的学习任务都在推进',
      },
    ],
    inconsistent: [{ aspect: '我很自律', evidence: ['多次推迟开始'], analysis: '启动成本偏高' }],
    score: 64,
    overview: '整体还算一致',
    suggestion: '下周记录开始时间',
  };
  const r8 = run(deepseekShape);
  ok('真机上出现过的字段名能被映射', r8.ok);
  if (r8.ok) {
    check('consistent → matched_beliefs', r8.output.matched_beliefs.length, 1);
    check('inconsistent → gaps', r8.output.gaps.length, 1);
    check('score → alignment_score', r8.output.alignment_score, 64);
    check('overview → summary', r8.output.summary, '整体还算一致');
    check('suggestion → suggested_reflection', r8.output.suggested_reflection, '下周记录开始时间');
    check('aspect → belief', r8.output.matched_beliefs[0].belief, '努力、上进、有行动力');
    check('analysis → assessment', r8.output.matched_beliefs[0].assessment, '事实里大量日期的学习任务都在推进');
    ok('数组型 evidence 被合并', r8.output.matched_beliefs[0].evidence.includes('07-28'));
    // 映射必须可见，不能无声改写
    ok('映射被记录为非致命问题', r8.issues.filter((i) => i.actual.includes('映射')).length >= 4);
  }

  // 正名优先于别名
  const r9 = run({ ...good, score: 1, overview: 'x' });
  ok('正名优先于别名', r9.ok && r9.output.alignment_score === 72 && r9.output.summary === '还行');

  // describe 要能给出人读得懂的描述
  check('describe undefined', describeValue(undefined), 'undefined');
  check('describe 数组', describeValue([1, 2]), 'array(2)');
  check('describe 字符串', describeValue('hi'), 'string "hi"');
  check('describe 数字', describeValue(7), 'number 7');
  ok('describe 对象列出键名', describeValue({ a: 1, b: 2 }).includes('a, b'));
});

// ────────────────────────────────────────────────
group('提示词与校验器的 schema 必须一致', () => {
  // 真实事故：prompt 只说「请以 JSON 格式输出」，从未列出字段名，
  // 校验器却按 PRD 6.2 严格检查。模型只能自己编字段，
  // 甚至照着输入里「证据覆盖情况」的结构仿了一个 coverage 对象。
  // 用 stub 测试永远发现不了——stub 按正确格式返回是人为构造的。
  for (const field of REQUIRED_OUTPUT_FIELDS) {
    ok(`提示词里出现了 ${field}`, SYSTEM_PROMPT.includes(field));
  }

  // 提示词里的示例对象本身要能通过校验
  const example = {
    summary: '一句话总结',
    alignment_score: 72,
    confidence: 'medium',
    matched_beliefs: [{ belief: 'b', evidence: 'e', assessment: 'a' }],
    gaps: [{ belief: 'b', evidence: 'e', assessment: 'a' }],
    insufficient_evidence: ['x'],
    suggested_reflection: 'r',
  };
  let exampleOk = false;
  try {
    inspectAnalysis(example);
    exampleOk = true;
  } catch {}
  ok('提示词示例能通过校验器', exampleOk);

  // 提示词必须说清 alignment_score 是数字而不是字符串
  ok('说明了分数是整数', SYSTEM_PROMPT.includes('0 到 100 的整数'));
  // 必须阻止模型照搬输入结构——这正是本次事故的直接诱因
  ok('警告不要照搬输入结构', SYSTEM_PROMPT.includes('不要把它们的结构照搬到输出里'));
});

// ────────────────────────────────────────────────
group('演示数据的多语言完整性', () => {
  const refShape = (o: unknown, prefix = ''): string[] => {
    if (Array.isArray(o)) return o.flatMap((v, i) => refShape(v, `${prefix}[${i}]`));
    if (o && typeof o === 'object') {
      return Object.entries(o).flatMap(([k, v]) => refShape(v, prefix ? `${prefix}.${k}` : k));
    }
    return [prefix];
  };
  const reference = refShape(zhHansDemo).sort();

  for (const loc of SUPPORTED_LOCALES) {
    const demo = demoTextFor(loc);
    check(`${loc} 的演示文本结构与真源一致`, refShape(demo).sort(), reference);
    check(`${loc} 天数等于骨架`, demo.days.length, DEMO_SKELETON.length);
    ok(`${loc} 没有空字符串`, refShape(demo).length > 0 &&
      JSON.stringify(demo).indexOf("''") === -1);
  }

  // 各语言的首日文本必须互不相同，防止复制粘贴后忘了翻译
  // 每天填的字段不同（第 3 天就没有 completed），取整天序列化后比对
  const firstDay = SUPPORTED_LOCALES.map((l) => JSON.stringify(demoTextFor(l).days[0]));
  check('各语言首日文本互不重复', new Set(firstDay).size, SUPPORTED_LOCALES.length);

  // 骨架里的标签必须都是合法 id，否则统计会漏
  const tagIds = new Set<string>(TAG_IDS);
  ok('骨架标签都是合法 id', DEMO_SKELETON.every((d) => d.tags.every((t) => tagIds.has(t))));
});

// ────────────────────────────────────────────────
group('置信度必须调制呈现强度（PRD 5.2）', () => {
  // 高置信度：正常判决色
  check('高置信 + 低分 → 红色判决', gapPresentation(32, 'high').tone, 'bad');
  check('高置信 + 中分 → 黄色', gapPresentation(64, 'high').tone, 'warn');
  check('高置信 + 高分 → 绿色', gapPresentation(88, 'high').tone, 'good');
  ok('高置信不降级', !gapPresentation(32, 'high').tentative);

  // 中置信度同样给判决色——降级只发生在 low
  check('中置信仍给判决色', gapPresentation(32, 'medium').tone, 'bad');
  ok('中置信不降级', !gapPresentation(32, 'medium').tentative);

  // 低置信度：无论分数多少都不上判决色
  for (const score of [0, 32, 64, 88, 100]) {
    const p = gapPresentation(score, 'low');
    check(`低置信 ${score} 分 → 中性色`, p.tone, 'neutral');
    ok(`低置信 ${score} 分要降级`, p.tentative);
  }

  // 分数仍然钳制，且不隐藏信息
  check('越界分数钳到 100', gapPresentation(142, 'low').score, 100);
  check('负分钳到 0', gapPresentation(-5, 'high').score, 0);
  check('NaN 兜底为 0', gapPresentation(NaN, 'high').score, 0);

  // 只有记录确实稀疏时才点名天数——
  // 否则会出现「最近 30 天里只有 30 天有记录」这种荒谬文案
  ok('30 天窗口满记录不算稀疏', !gapPresentation(32, 'low', 30, 30).sparse);
  ok('30 天里 20 天不算稀疏', !gapPresentation(32, 'low', 20, 30).sparse);
  ok('30 天里 5 天算稀疏', gapPresentation(32, 'low', 5, 30).sparse);
  ok('7 天里 3 天算稀疏', gapPresentation(32, 'low', 3, 7).sparse);
  ok('缺参数时不点名天数', !gapPresentation(32, 'low').sparse);
  ok('高置信永不点名天数', !gapPresentation(32, 'high', 1, 30).sparse);

  // 文案必须齐备，否则降级后是一片空白
  for (const loc of SUPPORTED_LOCALES) {
    const m = messagesFor(loc);
    ok(`${loc} 有降级标签`, m.feedback.lowConfidenceLabel.length > 0);
    ok(`${loc} 有降级说明`, m.feedback.lowConfidenceNoteGeneric.length > 0);
    ok(`${loc} 稀疏说明含天数`, m.feedback.lowConfidenceSparse(5, 30).includes('5'));
    // 降级标签不能和判决标签雷同，否则等于没降级
    ok(`${loc} 降级标签不同于「差距较大」`, m.feedback.lowConfidenceLabel !== m.feedback.lowMatch);
  }
});

console.log(`\n${'═'.repeat(40)}`);
console.log(`${passed} 通过 · ${failed} 失败`);
if (failed > 0) process.exit(1);
