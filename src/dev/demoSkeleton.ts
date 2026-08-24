// 演示数据的骨架：日期与标签。文本在 demoText/ 下按语言分文件。
//
// 拆开是因为切换语言后演示数据也应该跟着换语言——
// 否则英文界面里躺着 30 条中文记录，等于没法预览效果。
// 日期和标签与语言无关，放在这里只维护一份。

export const DEMO_SKELETON = [
  { date: '2026-07-25', tags: ['study', 'procrastination'] },
  { date: '2026-07-26', tags: ['study'] },
  { date: '2026-07-27', tags: ['procrastination', 'emotion'] },
  { date: '2026-07-28', tags: ['study'] },
  { date: '2026-07-29', tags: ['study', 'health'] },
  { date: '2026-07-30', tags: ['study', 'health', 'procrastination'] },
  { date: '2026-07-31', tags: ['study'] },
  { date: '2026-08-01', tags: ['health', 'procrastination'] },
  { date: '2026-08-02', tags: ['procrastination'] },
  { date: '2026-08-03', tags: ['study', 'health'] },
  { date: '2026-08-04', tags: ['study'] },
  { date: '2026-08-05', tags: ['study', 'health', 'procrastination'] },
  { date: '2026-08-06', tags: ['study'] },
  { date: '2026-08-07', tags: ['study', 'health'] },
  { date: '2026-08-08', tags: ['health'] },
  { date: '2026-08-09', tags: ['study'] },
  { date: '2026-08-10', tags: ['study', 'health'] },
  { date: '2026-08-11', tags: ['study', 'procrastination'] },
  { date: '2026-08-12', tags: ['study'] },
  { date: '2026-08-13', tags: ['study', 'health'] },
  { date: '2026-08-14', tags: ['study'] },
  { date: '2026-08-15', tags: ['study', 'health'] },
  { date: '2026-08-16', tags: ['study', 'procrastination'] },
  { date: '2026-08-17', tags: ['study', 'health'] },
  { date: '2026-08-18', tags: ['study', 'procrastination'] },
  { date: '2026-08-19', tags: ['study'] },
  { date: '2026-08-20', tags: ['study', 'health'] },
  { date: '2026-08-21', tags: ['study', 'procrastination'] },
  { date: '2026-08-22', tags: ['health', 'work'] },
  { date: '2026-08-23', tags: ['study'] },
] as const;

/** 画像的四项评分，与语言无关 */
export const DEMO_SCORES = {
  discipline_score: 8,
  engagement_score: 7,
  procrastination_score: 6,
  persistence_score: 7,
} as const;
