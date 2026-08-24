// 全 App 统一的日期处理。
//
// 注意：不要用 `new Date().toISOString().split('T')[0]` 取「今天」——
// toISOString 返回的是 UTC 日期，在东八区凌晨 0-8 点会得到前一天，
// 而界面上用 toLocaleDateString 渲染的是本地日期，两者会差一天。

/** 把 Date 格式化成本地时区的 YYYY-MM-DD */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 本地时区的今天 */
export function today(): string {
  return toLocalDateString();
}

/** 本地时区里 n 天前的日期 */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toLocalDateString(d);
}

/** 统计一组事实覆盖了多少个不同的日子 */
export function countDistinctDays(items: Array<{ date: string }>): number {
  return new Set(items.map((i) => i.date)).size;
}
