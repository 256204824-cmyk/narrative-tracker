// 开发用的演示数据装载器。
//
// 调用方必须自己用 __DEV__ 把入口包起来（见 SettingsScreen），
// 这样整个模块在生产构建里会被 tree-shake 掉。

import { saveSelfPortrait, saveFactLog, getFactLogCount, deleteAllData } from '../database';
import { saveTier } from '../services';
import { demoPortrait, demoFacts } from './demoData';
import type { Locale } from '../i18n/types';

export interface SeedResult {
  facts: number;
  from: string;
  to: string;
}

/**
 * 清空现有数据后写入一个月的演示记录，并把档位设为 plus
 * （free 窗口较短，看不到整月效果）。
 *
 * 文本按传入的语言生成——切换语言后重新载入，演示内容也会跟着换语言。
 */
export async function seedDemoData(locale: Locale): Promise<SeedResult> {
  await deleteAllData();
  await saveSelfPortrait(demoPortrait(locale));

  // 按日期升序写入，让 created_at 的顺序和 date 一致
  const sorted = [...demoFacts(locale)].sort((a, b) => a.date.localeCompare(b.date));
  for (const fact of sorted) {
    await saveFactLog(fact);
  }

  await saveTier('plus');

  return {
    facts: await getFactLogCount(),
    from: sorted[0].date,
    to: sorted[sorted.length - 1].date,
  };
}
