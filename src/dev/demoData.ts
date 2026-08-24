// 演示数据：一个月的模拟记录，仅用于开发时预览界面效果。
//
// 人物设定：大三学生，考研 + 找实习。刻意埋入四种叙事偏差，
// 用来检验反馈是否真的基于证据：
//   1. 高估 —— 自评自律 8/10，事实里「计划开始时间被推迟」反复出现
//   2. 低估 —— 自评拖延 6/10，实际中断后恢复很快
//   3. 逃避线 —— 简历被推迟 18 天，同期学习几乎未断
//   4. 证据不足 —— 社交、情绪几乎没有记录，AI 不该对此下结论
//
// 这个文件只被 src/dev/seed.ts 引用，而后者的入口被 __DEV__ 包着，
// 生产构建会被完全剔除。

import type { FactLog, SelfPortrait } from '../types';

export const DEMO_PORTRAIT: Omit<SelfPortrait, 'id' | 'created_at'> = {
  "discipline_score": 8,
  "engagement_score": 7,
  "procrastination_score": 6,
  "persistence_score": 7,
  "strength_text": "执行力强，定了计划基本都能做到",
  "change_text": "手机占用时间太多，晚上总是刷到很晚",
  "self_words": "努力、焦虑、上进"
};

export const DEMO_FACTS: Array<Omit<FactLog, 'id' | 'created_at'>> = [
  {
    "date": "2026-07-25",
    "completed_text": "背了80个考研单词，做完一套英语阅读",
    "uncompleted_text": "原计划的数学强化第三章没开始",
    "progress_evidence": "阅读正确率从6/10提到8/10",
    "avoidance_text": "",
    "representative_fact": "计划9点开始，实际10点40才坐下",
    "one_line_fact": "今天的问题不是没做，是开始得太晚",
    "category_tags": "[\"study\",\"procrastination\"]"
  },
  {
    "date": "2026-07-26",
    "completed_text": "数学看了1.5小时视频课",
    "uncompleted_text": "课后习题一道没做",
    "progress_evidence": "",
    "avoidance_text": "把习题推到了明天",
    "representative_fact": "看完课觉得懂了，但没验证",
    "one_line_fact": "听课的舒适感骗了我",
    "category_tags": "[\"study\"]"
  },
  {
    "date": "2026-07-27",
    "completed_text": "",
    "uncompleted_text": "",
    "progress_evidence": "",
    "avoidance_text": "整天在刷短视频，晚上才意识到",
    "representative_fact": "周日什么都没做",
    "one_line_fact": "今天完全空白",
    "category_tags": "[\"procrastination\",\"emotion\"]"
  },
  {
    "date": "2026-07-28",
    "completed_text": "单词80个，数学习题补了12道",
    "uncompleted_text": "实习简历还是没动",
    "progress_evidence": "把昨天欠的习题补上了",
    "avoidance_text": "",
    "representative_fact": "补作业让我觉得踏实",
    "one_line_fact": "欠的债还上了一部分",
    "category_tags": "[\"study\"]"
  },
  {
    "date": "2026-07-29",
    "completed_text": "单词80个，英语阅读一套，跑步3公里",
    "uncompleted_text": "数学只看了半小时",
    "progress_evidence": "第一次把跑步加进日程",
    "avoidance_text": "",
    "representative_fact": "跑完步学习效率明显更高",
    "one_line_fact": "运动没有耽误学习，反而帮了忙",
    "category_tags": "[\"study\",\"health\"]"
  },
  {
    "date": "2026-07-30",
    "completed_text": "单词，数学2小时，跑步3公里",
    "uncompleted_text": "简历依旧没动",
    "progress_evidence": "数学第三章终于开始了",
    "avoidance_text": "一想到写简历就去做别的事",
    "representative_fact": "拖了六天的章节今天开了头",
    "one_line_fact": "逃避的是简历，不是学习",
    "category_tags": "[\"study\",\"health\",\"procrastination\"]"
  },
  {
    "date": "2026-07-31",
    "completed_text": "单词，数学习题20道",
    "uncompleted_text": "",
    "progress_evidence": "连续三天完成数学计划",
    "avoidance_text": "",
    "representative_fact": "计划9点开始，实际9点20",
    "one_line_fact": "开始时间比上周准了很多",
    "category_tags": "[\"study\"]"
  },
  {
    "date": "2026-08-01",
    "completed_text": "跑步3公里",
    "uncompleted_text": "学习计划全部没做",
    "progress_evidence": "周末也保持了运动",
    "avoidance_text": "",
    "representative_fact": "周六又是学习空白",
    "one_line_fact": "运动的连续性比学习强",
    "category_tags": "[\"health\",\"procrastination\"]"
  },
  {
    "date": "2026-08-02",
    "completed_text": "",
    "uncompleted_text": "",
    "progress_evidence": "",
    "avoidance_text": "",
    "representative_fact": "周日又空了",
    "one_line_fact": "连续两个周日都是空的",
    "category_tags": "[\"procrastination\"]"
  },
  {
    "date": "2026-08-03",
    "completed_text": "单词80，数学2小时，跑步",
    "uncompleted_text": "简历",
    "progress_evidence": "",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "",
    "category_tags": "[\"study\",\"health\"]"
  },
  {
    "date": "2026-08-04",
    "completed_text": "单词，英语阅读，数学习题",
    "uncompleted_text": "",
    "progress_evidence": "阅读正确率稳定在8/10",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "阅读似乎真的稳住了",
    "category_tags": "[\"study\"]"
  },
  {
    "date": "2026-08-05",
    "completed_text": "单词，数学2小时，跑步3公里",
    "uncompleted_text": "简历（第9天）",
    "progress_evidence": "",
    "avoidance_text": "每次打开简历模板就关掉",
    "representative_fact": "简历这件事我已经逃避了九天",
    "one_line_fact": "这是我最明显的逃避",
    "category_tags": "[\"study\",\"health\",\"procrastination\"]"
  },
  {
    "date": "2026-08-06",
    "completed_text": "单词，数学习题25道",
    "uncompleted_text": "",
    "progress_evidence": "数学进度追上了原计划",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "",
    "category_tags": "[\"study\"]"
  },
  {
    "date": "2026-08-07",
    "completed_text": "单词，英语作文一篇，跑步",
    "uncompleted_text": "数学",
    "progress_evidence": "写了第一篇作文，虽然很烂",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "开始比写好更重要",
    "category_tags": "[\"study\",\"health\"]"
  },
  {
    "date": "2026-08-08",
    "completed_text": "跑步3公里",
    "uncompleted_text": "学习",
    "progress_evidence": "周六第一次不是完全空白",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "周末的空白在变小",
    "category_tags": "[\"health\"]"
  },
  {
    "date": "2026-08-09",
    "completed_text": "单词80个",
    "uncompleted_text": "",
    "progress_evidence": "周日第一次做了事",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "连续空白的周末被打断了",
    "category_tags": "[\"study\"]"
  },
  {
    "date": "2026-08-10",
    "completed_text": "单词，数学2小时，跑步",
    "uncompleted_text": "",
    "progress_evidence": "",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "",
    "category_tags": "[\"study\",\"health\"]"
  },
  {
    "date": "2026-08-11",
    "completed_text": "单词，英语阅读，数学习题",
    "uncompleted_text": "简历（第15天）",
    "progress_evidence": "",
    "avoidance_text": "",
    "representative_fact": "半个月了，简历一个字没写",
    "one_line_fact": "其他事都在推进，只有简历卡死",
    "category_tags": "[\"study\",\"procrastination\"]"
  },
  {
    "date": "2026-08-12",
    "completed_text": "单词，数学2小时",
    "uncompleted_text": "跑步（第一次断）",
    "progress_evidence": "",
    "avoidance_text": "",
    "representative_fact": "连续12天的跑步断了",
    "one_line_fact": "断了之后有点想放弃",
    "category_tags": "[\"study\"]"
  },
  {
    "date": "2026-08-13",
    "completed_text": "单词，数学习题，跑步3公里",
    "uncompleted_text": "",
    "progress_evidence": "断一天之后重新跑起来了",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "断一天不等于结束",
    "category_tags": "[\"study\",\"health\"]"
  },
  {
    "date": "2026-08-14",
    "completed_text": "单词，英语作文，数学",
    "uncompleted_text": "",
    "progress_evidence": "",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "",
    "category_tags": "[\"study\"]"
  },
  {
    "date": "2026-08-15",
    "completed_text": "跑步，单词40个",
    "uncompleted_text": "数学",
    "progress_evidence": "周六做了一半的计划",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "周末不再是全空",
    "category_tags": "[\"study\",\"health\"]"
  },
  {
    "date": "2026-08-16",
    "completed_text": "单词，整理了实习岗位清单",
    "uncompleted_text": "简历正文",
    "progress_evidence": "终于碰了简历相关的事",
    "avoidance_text": "",
    "representative_fact": "列清单比写简历容易，但总算碰了",
    "one_line_fact": "逃避的边缘被推动了一点",
    "category_tags": "[\"study\",\"procrastination\"]"
  },
  {
    "date": "2026-08-17",
    "completed_text": "单词，数学2小时，跑步",
    "uncompleted_text": "",
    "progress_evidence": "",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "",
    "category_tags": "[\"study\",\"health\"]"
  },
  {
    "date": "2026-08-18",
    "completed_text": "单词，英语阅读，简历写了开头三行",
    "uncompleted_text": "",
    "progress_evidence": "简历第一次真正动笔",
    "avoidance_text": "",
    "representative_fact": "18天之后，简历终于有了三行字",
    "one_line_fact": "原来只是开始那一下最难",
    "category_tags": "[\"study\",\"procrastination\"]"
  },
  {
    "date": "2026-08-19",
    "completed_text": "单词，数学习题，简历项目经历一段",
    "uncompleted_text": "",
    "progress_evidence": "简历连续第二天推进",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "连续做两天就没那么抗拒了",
    "category_tags": "[\"study\"]"
  },
  {
    "date": "2026-08-20",
    "completed_text": "单词，数学2小时，跑步，简历改了一版",
    "uncompleted_text": "",
    "progress_evidence": "三件事同时推进",
    "avoidance_text": "",
    "representative_fact": "今天是这个月完成度最高的一天",
    "one_line_fact": "",
    "category_tags": "[\"study\",\"health\"]"
  },
  {
    "date": "2026-08-21",
    "completed_text": "单词，英语作文，简历定稿",
    "uncompleted_text": "",
    "progress_evidence": "简历从零到定稿用了4天",
    "avoidance_text": "",
    "representative_fact": "拖了18天的事，真做起来只花了4天",
    "one_line_fact": "拖延的成本远高于做事本身",
    "category_tags": "[\"study\",\"procrastination\"]"
  },
  {
    "date": "2026-08-22",
    "completed_text": "跑步，单词，投了3份实习",
    "uncompleted_text": "",
    "progress_evidence": "第一次投出简历",
    "avoidance_text": "",
    "representative_fact": "",
    "one_line_fact": "周六不再是空白",
    "category_tags": "[\"health\",\"work\"]"
  },
  {
    "date": "2026-08-23",
    "completed_text": "单词，数学复盘整月进度",
    "uncompleted_text": "",
    "progress_evidence": "",
    "avoidance_text": "",
    "representative_fact": "回看这个月，空白的都是周末",
    "one_line_fact": "",
    "category_tags": "[\"study\"]"
  }
];
