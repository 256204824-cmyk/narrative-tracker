// AI 返回结构的逐字段检查。
//
// 之前这里只有一个布尔判断，失败时抛「AI 返回格式不符合预期」——
// 用户在真机上看到这句话，既不知道哪个字段有问题，也看不到模型到底返回了什么，
// 完全无法排查。现在改成：能救的字段自动兜底，救不了的把具体原因带到界面上。

import type { AIAnalysisOutput, Gap, MatchedBelief } from '../types';

export interface FieldIssue {
  field: string;
  expected: string;
  actual: string;
  /** true = 无法继续；false = 已用默认值兜底，报告仍可生成 */
  fatal: boolean;
}

export interface ShapeResult {
  output: AIAnalysisOutput;
  issues: FieldIssue[];
}

/** 把任意值描述成人能读懂的一行，用于「实际收到」那一列 */
export function describe(v: unknown): string {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (Array.isArray(v)) return `array(${v.length})`;
  if (typeof v === 'object') {
    const keys = Object.keys(v as object);
    return `object {${keys.slice(0, 4).join(', ')}${keys.length > 4 ? ', …' : ''}}`;
  }
  if (typeof v === 'string') {
    const head = v.length > 40 ? `${v.slice(0, 40)}…` : v;
    return `string "${head}"`;
  }
  return `${typeof v} ${String(v)}`;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * 有些模型会把结果多包一层，例如 {"analysis": {...}} 或 {"result": {...}}。
 * 顶层找不到 summary 时，尝试从唯一的对象型子节点里取。
 */
export function unwrapPayload(raw: unknown): unknown {
  if (!isObj(raw)) return raw;
  if ('summary' in raw || 'alignment_score' in raw) return raw;
  const objChildren = Object.values(raw).filter(isObj);
  if (objChildren.length === 1) {
    const inner = objChildren[0];
    if ('summary' in inner || 'alignment_score' in inner) return inner;
  }
  return raw;
}

/**
 * 弱模型常用的近义字段名。
 *
 * BYOK 意味着用户会用各种便宜模型，光靠提示词约束太脆——
 * 实测 deepseek-v4-flash 会把 matched_beliefs 写成 consistent、
 * assessment 写成 analysis。这里做窄范围映射，
 * **并且每次映射都记为非致命问题，在诊断面板里明示**，不做无声改写。
 */
const TOP_LEVEL_ALIASES: Record<string, string[]> = {
  summary: ['overview', 'conclusion', 'overall', 'general_summary'],
  alignment_score: ['score', 'alignment', 'alignment_rate', 'consistency_score'],
  matched_beliefs: ['consistent', 'matches', 'matched', 'agreements', 'aligned'],
  gaps: ['inconsistent', 'discrepancies', 'mismatches', 'inconsistencies', 'divergences'],
  insufficient_evidence: ['insufficient', 'unknown', 'unclear', 'not_enough_evidence'],
  suggested_reflection: ['suggestion', 'reflection', 'next_step', 'advice'],
};

const ITEM_ALIASES: Record<string, string[]> = {
  belief: ['aspect', 'claim', 'statement', 'topic'],
  evidence: ['facts', 'examples', 'proof'],
  assessment: ['analysis', 'comment', 'conclusion', 'note'],
};

/** 按别名补齐缺失的顶层字段，返回补齐后的对象和发生过的映射 */
function applyAliases(
  obj: Record<string, unknown>
): { normalized: Record<string, unknown>; remapped: Array<[string, string]> } {
  const normalized = { ...obj };
  const remapped: Array<[string, string]> = [];
  for (const [canonical, aliases] of Object.entries(TOP_LEVEL_ALIASES)) {
    if (normalized[canonical] !== undefined) continue;
    const hit = aliases.find((a) => obj[a] !== undefined);
    if (hit) {
      normalized[canonical] = obj[hit];
      remapped.push([canonical, hit]);
    }
  }
  return { normalized, remapped };
}

/** 条目里的字段也可能换了名字；evidence 还可能是数组 */
function pickItemField(item: Record<string, unknown>, canonical: string): string {
  const candidates = [canonical, ...(ITEM_ALIASES[canonical] ?? [])];
  for (const key of candidates) {
    const v = item[key];
    if (typeof v === 'string' && v) return v;
    if (Array.isArray(v)) {
      const parts = v.filter((x): x is string => typeof x === 'string');
      if (parts.length) return parts.join('；');
    }
  }
  return '';
}

/** 数字，或能解析成数字的字符串（"72" / "72分" 这类模型很常见） */
function coerceNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const m = v.match(/-?\d+(\.\d+)?/);
    if (m) {
      const n = Number(m[0]);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function normalizeBeliefs(v: unknown): Array<MatchedBelief | Gap> {
  if (!Array.isArray(v)) return [];
  return v
    .filter(isObj)
    .map((item) => ({
      belief: pickItemField(item, 'belief'),
      evidence: pickItemField(item, 'evidence'),
      assessment: pickItemField(item, 'assessment'),
    }))
    .filter((b) => b.belief || b.evidence || b.assessment);
}

function normalizeStrings(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === 'string' ? x : isObj(x) && typeof x.text === 'string' ? x.text : ''))
    .filter(Boolean);
}

/**
 * 检查并规整 AI 输出。
 *
 * 判定原则：
 * - `alignment_score` 缺失或无法解析 → 致命。它是报告的头条数字，
 *   缺了不能填 0——0 会被渲染成红色「差距较大」，等于凭空捏造一个结论。
 * - 内容三块（summary / matched_beliefs / gaps）全空 → 致命，报告没有内容。
 * - 其余字段一律兜底，并记为非致命问题。
 */
export function inspectAnalysis(raw: unknown): ShapeResult {
  const unwrapped = unwrapPayload(raw);
  const issues: FieldIssue[] = [];

  if (!isObj(unwrapped)) {
    issues.push({ field: '（顶层）', expected: 'object', actual: describe(unwrapped), fatal: true });
    throw issues;
  }

  const { normalized: parsed, remapped } = applyAliases(unwrapped);
  for (const [canonical, from] of remapped) {
    issues.push({
      field: canonical,
      expected: canonical,
      actual: `由 "${from}" 映射而来`,
      fatal: false,
    });
  }

  const score = coerceNumber(parsed.alignment_score);
  if (score === null) {
    issues.push({
      field: 'alignment_score',
      expected: 'number 0-100',
      actual: describe(parsed.alignment_score),
      fatal: true,
    });
  } else if (typeof parsed.alignment_score !== 'number') {
    issues.push({
      field: 'alignment_score',
      expected: 'number 0-100',
      actual: describe(parsed.alignment_score),
      fatal: false,
    });
  }

  const summary = typeof parsed.summary === 'string' ? parsed.summary : '';
  if (!summary) {
    issues.push({ field: 'summary', expected: 'string', actual: describe(parsed.summary), fatal: false });
  }

  const matched = normalizeBeliefs(parsed.matched_beliefs);
  if (!Array.isArray(parsed.matched_beliefs)) {
    issues.push({
      field: 'matched_beliefs',
      expected: 'array',
      actual: describe(parsed.matched_beliefs),
      fatal: false,
    });
  }

  const gaps = normalizeBeliefs(parsed.gaps);
  if (!Array.isArray(parsed.gaps)) {
    issues.push({ field: 'gaps', expected: 'array', actual: describe(parsed.gaps), fatal: false });
  }

  const insufficient = normalizeStrings(parsed.insufficient_evidence);
  if (parsed.insufficient_evidence !== undefined && !Array.isArray(parsed.insufficient_evidence)) {
    issues.push({
      field: 'insufficient_evidence',
      expected: 'array of string',
      actual: describe(parsed.insufficient_evidence),
      fatal: false,
    });
  }

  const reflection =
    typeof parsed.suggested_reflection === 'string' ? parsed.suggested_reflection : '';

  const confidence =
    parsed.confidence === 'high' || parsed.confidence === 'medium' ? parsed.confidence : 'low';
  if (parsed.confidence !== undefined && parsed.confidence !== confidence) {
    issues.push({
      field: 'confidence',
      expected: "'low' | 'medium' | 'high'",
      actual: describe(parsed.confidence),
      fatal: false,
    });
  }

  // 三块内容全空的话，报告是一张白纸，没有生成的意义
  if (!summary && matched.length === 0 && gaps.length === 0) {
    issues.push({
      field: 'summary / matched_beliefs / gaps',
      expected: '至少有一项非空',
      actual: '三者都为空',
      fatal: true,
    });
  }

  if (issues.some((i) => i.fatal)) throw issues;

  return {
    output: {
      summary,
      alignment_score: Math.round(Math.min(100, Math.max(0, score as number))),
      confidence,
      matched_beliefs: matched as MatchedBelief[],
      gaps: gaps as Gap[],
      insufficient_evidence: insufficient,
      suggested_reflection: reflection,
    },
    issues,
  };
}
