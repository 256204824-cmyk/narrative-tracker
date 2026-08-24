// 导入文件的校验。
//
// 文件来自设备外部，可能是别的版本导出的、被手工编辑过的、或者根本不是本 App 的。
// 一律不信任：逐字段检查并给出人能看懂的错误，宁可拒绝也不要把坏数据写进库。

import { EXPORT_FORMAT_VERSION } from '../constants/format.ts';
import type { SelfPortrait, FactLog, AnalysisResult } from '../types';

export interface ValidatedImport {
  self_portraits: SelfPortrait[];
  fact_logs: FactLog[];
  analysis_results: AnalysisResult[];
}

export type ValidationResult =
  | { ok: true; data: ValidatedImport }
  | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

const intInRange = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** JSON 数组字段在库里以字符串存放，这里确保它至少是个能解析的数组 */
const jsonArray = (v: unknown): string => {
  if (typeof v !== 'string') return '[]';
  try {
    return Array.isArray(JSON.parse(v)) ? v : '[]';
  } catch {
    return '[]';
  }
};

export function validateImport(raw: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: '这不是一个有效的 JSON 文件。' };
  }

  if (!isObj(parsed)) {
    return { ok: false, error: '文件格式不对：顶层应该是一个对象。' };
  }

  const version = parsed.format_version;
  if (typeof version === 'number' && version > EXPORT_FORMAT_VERSION) {
    return {
      ok: false,
      error: `这个文件由更新版本的 App 导出（格式 v${version}，当前支持 v${EXPORT_FORMAT_VERSION}）。请先升级 App。`,
    };
  }

  const portraitsRaw = parsed.self_portraits;
  const factsRaw = parsed.fact_logs;
  const analysesRaw = parsed.analysis_results;

  if (!Array.isArray(portraitsRaw) || !Array.isArray(factsRaw)) {
    return {
      ok: false,
      error: '文件里没有找到 self_portraits 和 fact_logs，这可能不是 Narrative Tracker 导出的数据。',
    };
  }

  if (portraitsRaw.length === 0 && factsRaw.length === 0) {
    return { ok: false, error: '这个文件里没有任何自我画像或事实记录。' };
  }

  const self_portraits: SelfPortrait[] = [];
  for (let i = 0; i < portraitsRaw.length; i++) {
    const p = portraitsRaw[i];
    if (!isObj(p)) return { ok: false, error: `第 ${i + 1} 条自我画像不是一个对象。` };
    self_portraits.push({
      id: 0,
      discipline_score: intInRange(p.discipline_score, 1, 10, 5),
      engagement_score: intInRange(p.engagement_score, 1, 10, 5),
      procrastination_score: intInRange(p.procrastination_score, 1, 10, 5),
      persistence_score: intInRange(p.persistence_score, 1, 10, 5),
      strength_text: str(p.strength_text),
      change_text: str(p.change_text),
      self_words: str(p.self_words),
      created_at: str(p.created_at) || new Date().toISOString(),
    });
  }

  const fact_logs: FactLog[] = [];
  for (let i = 0; i < factsRaw.length; i++) {
    const f = factsRaw[i];
    if (!isObj(f)) return { ok: false, error: `第 ${i + 1} 条事实记录不是一个对象。` };
    const date = str(f.date);
    // date 是范围筛选和 tier 限制的依据，格式错了整个分析都会失效，必须拒绝
    if (!DATE_RE.test(date)) {
      return {
        ok: false,
        error: `第 ${i + 1} 条事实记录的日期「${date || '(空)'}」格式不对，应该是 YYYY-MM-DD。`,
      };
    }
    fact_logs.push({
      id: 0,
      date,
      completed_text: str(f.completed_text),
      uncompleted_text: str(f.uncompleted_text),
      progress_evidence: str(f.progress_evidence),
      avoidance_text: str(f.avoidance_text),
      representative_fact: str(f.representative_fact),
      one_line_fact: str(f.one_line_fact),
      category_tags: jsonArray(f.category_tags),
      created_at: str(f.created_at) || new Date().toISOString(),
    });
  }

  const analysis_results: AnalysisResult[] = [];
  if (Array.isArray(analysesRaw)) {
    for (const a of analysesRaw) {
      if (!isObj(a)) continue; // 分析结果可再生成，坏行直接跳过而不是整体失败
      const confidence = a.confidence;
      analysis_results.push({
        id: 0,
        period_start: str(a.period_start),
        period_end: str(a.period_end),
        summary: str(a.summary),
        alignment_score: intInRange(a.alignment_score, 0, 100, 0),
        confidence: confidence === 'high' || confidence === 'medium' ? confidence : 'low',
        matched_beliefs: jsonArray(a.matched_beliefs),
        gaps: jsonArray(a.gaps),
        insufficient_evidence: jsonArray(a.insufficient_evidence),
        suggested_reflection: str(a.suggested_reflection),
        created_at: str(a.created_at) || new Date().toISOString(),
      });
    }
  }

  return { ok: true, data: { self_portraits, fact_logs, analysis_results } };
}
