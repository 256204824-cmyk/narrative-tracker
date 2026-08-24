import * as SQLite from 'expo-sqlite';
import type { SelfPortrait, FactLog, AnalysisResult } from '../types';
import { EXPORT_FORMAT_VERSION } from '../constants/format';

// 缓存的是 promise 而不是连接本身：
// 若先赋值连接再 await 建表，并发的首次调用可能拿到「表还没建好」的连接。
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const database = await SQLite.openDatabaseAsync('narrative_tracker.db');
      await initTables(database);
      return database;
    })();
    // 初始化失败时不要把失败的 promise 永久缓存住
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

async function initTables(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS self_portraits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discipline_score INTEGER NOT NULL,
      engagement_score INTEGER NOT NULL,
      procrastination_score INTEGER NOT NULL,
      persistence_score INTEGER NOT NULL,
      strength_text TEXT NOT NULL DEFAULT '',
      change_text TEXT NOT NULL DEFAULT '',
      self_words TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fact_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      completed_text TEXT NOT NULL DEFAULT '',
      uncompleted_text TEXT NOT NULL DEFAULT '',
      progress_evidence TEXT NOT NULL DEFAULT '',
      avoidance_text TEXT NOT NULL DEFAULT '',
      representative_fact TEXT NOT NULL DEFAULT '',
      one_line_fact TEXT NOT NULL DEFAULT '',
      category_tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analysis_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      alignment_score INTEGER NOT NULL DEFAULT 0,
      confidence TEXT NOT NULL DEFAULT 'low',
      matched_beliefs TEXT NOT NULL DEFAULT '[]',
      gaps TEXT NOT NULL DEFAULT '[]',
      insufficient_evidence TEXT NOT NULL DEFAULT '[]',
      suggested_reflection TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// ── Self Portrait CRUD ──

export async function saveSelfPortrait(portrait: Omit<SelfPortrait, 'id' | 'created_at'>): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO self_portraits (discipline_score, engagement_score, procrastination_score, persistence_score, strength_text, change_text, self_words)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      portrait.discipline_score,
      portrait.engagement_score,
      portrait.procrastination_score,
      portrait.persistence_score,
      portrait.strength_text,
      portrait.change_text,
      portrait.self_words,
    ]
  );
  return result.lastInsertRowId;
}

export async function getLatestSelfPortrait(): Promise<SelfPortrait | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<SelfPortrait>(
    'SELECT * FROM self_portraits ORDER BY created_at DESC LIMIT 1'
  );
  return row || null;
}

export async function getAllSelfPortraits(): Promise<SelfPortrait[]> {
  const database = await getDatabase();
  return database.getAllAsync<SelfPortrait>(
    'SELECT * FROM self_portraits ORDER BY created_at DESC'
  );
}

// ── Fact Log CRUD ──

export async function saveFactLog(fact: Omit<FactLog, 'id' | 'created_at'>): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO fact_logs (date, completed_text, uncompleted_text, progress_evidence, avoidance_text, representative_fact, one_line_fact, category_tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fact.date,
      fact.completed_text,
      fact.uncompleted_text,
      fact.progress_evidence,
      fact.avoidance_text,
      fact.representative_fact,
      fact.one_line_fact,
      fact.category_tags,
    ]
  );
  return result.lastInsertRowId;
}

export async function getFactLogsSince(since: string): Promise<FactLog[]> {
  const database = await getDatabase();
  return database.getAllAsync<FactLog>(
    'SELECT * FROM fact_logs WHERE date >= ? ORDER BY date DESC',
    [since]
  );
}

export async function getFactLogsBetween(start: string, end: string): Promise<FactLog[]> {
  const database = await getDatabase();
  return database.getAllAsync<FactLog>(
    'SELECT * FROM fact_logs WHERE date >= ? AND date <= ? ORDER BY date DESC',
    [start, end]
  );
}

export async function getAllFactLogs(): Promise<FactLog[]> {
  const database = await getDatabase();
  return database.getAllAsync<FactLog>(
    'SELECT * FROM fact_logs ORDER BY date DESC'
  );
}

export async function getFactLogCount(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM fact_logs'
  );
  return row?.count ?? 0;
}

// ── Analysis Results CRUD ──

export async function saveAnalysisResult(result: Omit<AnalysisResult, 'id' | 'created_at'>): Promise<number> {
  const database = await getDatabase();
  const res = await database.runAsync(
    `INSERT INTO analysis_results (period_start, period_end, summary, alignment_score, confidence, matched_beliefs, gaps, insufficient_evidence, suggested_reflection)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      result.period_start,
      result.period_end,
      result.summary,
      result.alignment_score,
      result.confidence,
      result.matched_beliefs,
      result.gaps,
      result.insufficient_evidence,
      result.suggested_reflection,
    ]
  );
  return res.lastInsertRowId;
}

export async function getLatestAnalysis(): Promise<AnalysisResult | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<AnalysisResult>(
    'SELECT * FROM analysis_results ORDER BY created_at DESC LIMIT 1'
  );
  return row || null;
}

export async function getAllAnalyses(): Promise<AnalysisResult[]> {
  const database = await getDatabase();
  return database.getAllAsync<AnalysisResult>(
    'SELECT * FROM analysis_results ORDER BY created_at DESC'
  );
}

// ── Data Management ──

export { EXPORT_FORMAT_VERSION } from '../constants/format';

export async function deleteAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM self_portraits;
    DELETE FROM fact_logs;
    DELETE FROM analysis_results;
  `);
}

export async function exportAllData(): Promise<string> {
  const database = await getDatabase();
  const portraits = await database.getAllAsync('SELECT * FROM self_portraits ORDER BY created_at DESC');
  const facts = await database.getAllAsync('SELECT * FROM fact_logs ORDER BY date DESC');
  const analyses = await database.getAllAsync('SELECT * FROM analysis_results ORDER BY created_at DESC');

  return JSON.stringify(
    {
      format_version: EXPORT_FORMAT_VERSION,
      exported_at: new Date().toISOString(),
      self_portraits: portraits,
      fact_logs: facts,
      analysis_results: analyses,
    },
    null,
    2
  );
}

export interface ImportCounts {
  portraits: number;
  facts: number;
  analyses: number;
}

/**
 * 用导入的数据替换本地全部内容（恢复备份语义）。
 *
 * 整个过程放在一个事务里：任何一行插入失败都会整体回滚，
 * 不会留下「删掉了旧数据、新数据只写进去一半」的状态。
 * created_at 按原样写回，否则恢复后所有记录的时间戳都会变成今天。
 */
export async function importAllData(data: {
  self_portraits: SelfPortrait[];
  fact_logs: FactLog[];
  analysis_results: AnalysisResult[];
}): Promise<ImportCounts> {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    await database.execAsync(`
      DELETE FROM self_portraits;
      DELETE FROM fact_logs;
      DELETE FROM analysis_results;
    `);

    for (const p of data.self_portraits) {
      await database.runAsync(
        `INSERT INTO self_portraits (discipline_score, engagement_score, procrastination_score, persistence_score, strength_text, change_text, self_words, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.discipline_score, p.engagement_score, p.procrastination_score, p.persistence_score,
         p.strength_text, p.change_text, p.self_words, p.created_at]
      );
    }

    for (const f of data.fact_logs) {
      await database.runAsync(
        `INSERT INTO fact_logs (date, completed_text, uncompleted_text, progress_evidence, avoidance_text, representative_fact, one_line_fact, category_tags, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [f.date, f.completed_text, f.uncompleted_text, f.progress_evidence, f.avoidance_text,
         f.representative_fact, f.one_line_fact, f.category_tags, f.created_at]
      );
    }

    for (const a of data.analysis_results) {
      await database.runAsync(
        `INSERT INTO analysis_results (period_start, period_end, summary, alignment_score, confidence, matched_beliefs, gaps, insufficient_evidence, suggested_reflection, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.period_start, a.period_end, a.summary, a.alignment_score, a.confidence,
         a.matched_beliefs, a.gaps, a.insufficient_evidence, a.suggested_reflection, a.created_at]
      );
    }
  });

  return {
    portraits: data.self_portraits.length,
    facts: data.fact_logs.length,
    analyses: data.analysis_results.length,
  };
}
