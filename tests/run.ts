// 纯逻辑单测。用 Node 22 内置的类型擦除直接跑 .ts，无需构建、无需测试框架：
//   npm test
//
// 这里只覆盖不依赖 expo 原生模块的纯函数（日期、导入校验、provider URL）。
// 涉及界面和 SQLite 的验证见 tests/README.md 里说的 CDP 集成脚本。

import { toLocalDateString, today, daysAgo, countDistinctDays } from '../src/utils/date.ts';
import { normalizeBaseUrl, checkBaseUrl } from '../src/services/providerUrl.ts';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
import { validateImport } from '../src/utils/importValidation.ts';
import { TIER_LIMITS, MIN_DAYS_FOR_ANALYSIS } from '../src/constants/questions.ts';

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

console.log(`\n${'═'.repeat(40)}`);
console.log(`${passed} 通过 · ${failed} 失败`);
if (failed > 0) process.exit(1);
