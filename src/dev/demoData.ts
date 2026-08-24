// 演示数据：骨架（日期 / 标签 / 评分）+ 当前语言的文本。
//
// 切换语言后重新载入演示数据，内容也会跟着换语言——
// 否则英文界面里躺着 30 条中文记录，等于没法预览效果。
//
// 人物设定：大三学生，考研 + 找实习。刻意埋入四种叙事偏差：
//   1. 高估 —— 自评自律 8/10，事实里「计划开始时间被推迟」反复出现
//   2. 低估 —— 自评拖延 6/10，实际中断后恢复很快
//   3. 逃避线 —— 简历被推迟 18 天，同期学习几乎未断
//   4. 证据不足 —— 社交、情绪几乎没有记录，AI 不该对此下结论
//
// 这个文件只被 src/dev/seed.ts 引用，而后者的入口被 __DEV__ 包着，
// 生产构建会被完全剔除。

import type { FactLog, SelfPortrait } from '../types';
import type { Locale } from '../i18n/types';
import { DEMO_SKELETON, DEMO_SCORES } from './demoSkeleton';
import { demoTextFor } from './demoText';

export function demoPortrait(locale: Locale): Omit<SelfPortrait, 'id' | 'created_at'> {
  const { portrait } = demoTextFor(locale);
  return {
    ...DEMO_SCORES,
    strength_text: portrait.strength,
    change_text: portrait.change,
    self_words: portrait.selfWords,
  };
}

export function demoFacts(locale: Locale): Array<Omit<FactLog, 'id' | 'created_at'>> {
  const { days } = demoTextFor(locale);
  return DEMO_SKELETON.map((day, i) => {
    const text = days[i] as Partial<Record<string, string>>;
    return {
      date: day.date,
      completed_text: text.completed ?? '',
      uncompleted_text: text.uncompleted ?? '',
      progress_evidence: text.progress ?? '',
      avoidance_text: text.avoidance ?? '',
      representative_fact: text.representative ?? '',
      one_line_fact: text.oneLine ?? '',
      category_tags: JSON.stringify(day.tags),
    };
  });
}
