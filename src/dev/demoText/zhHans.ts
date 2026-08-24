// 演示数据的简体中文文本。**这是唯一真源**：
// DemoText 类型由它推导，其他语言缺一条就编译不过。
//
// 人物设定：大三学生，考研 + 找实习。刻意埋入四种叙事偏差
// （高估自律、低估恢复力、简历拖延 18 天、社交无记录），
// 翻译时要保住这些张力，不要改成泛泛的正面记录。

export const zhHansDemo = {
  portrait: {
    strength: '执行力强，定了计划基本都能做到',
    change: '手机占用时间太多，晚上总是刷到很晚',
    selfWords: '努力、焦虑、上进',
  },
  days: [
    { // 1
      completed: '背了80个考研单词，做完一套英语阅读',
      uncompleted: '原计划的数学强化第三章没开始',
      progress: '阅读正确率从6/10提到8/10',
      representative: '计划9点开始，实际10点40才坐下',
      oneLine: '今天的问题不是没做，是开始得太晚',
    },
    { // 2
      completed: '数学看了1.5小时视频课',
      uncompleted: '课后习题一道没做',
      avoidance: '把习题推到了明天',
      representative: '看完课觉得懂了，但没验证',
      oneLine: '听课的舒适感骗了我',
    },
    { // 3
      avoidance: '整天在刷短视频，晚上才意识到',
      representative: '周日什么都没做',
      oneLine: '今天完全空白',
    },
    { // 4
      completed: '单词80个，数学习题补了12道',
      uncompleted: '实习简历还是没动',
      progress: '把昨天欠的习题补上了',
      representative: '补作业让我觉得踏实',
      oneLine: '欠的债还上了一部分',
    },
    { // 5
      completed: '单词80个，英语阅读一套，跑步3公里',
      uncompleted: '数学只看了半小时',
      progress: '第一次把跑步加进日程',
      representative: '跑完步学习效率明显更高',
      oneLine: '运动没有耽误学习，反而帮了忙',
    },
    { // 6
      completed: '单词，数学2小时，跑步3公里',
      uncompleted: '简历依旧没动',
      progress: '数学第三章终于开始了',
      avoidance: '一想到写简历就去做别的事',
      representative: '拖了六天的章节今天开了头',
      oneLine: '逃避的是简历，不是学习',
    },
    { // 7
      completed: '单词，数学习题20道',
      progress: '连续三天完成数学计划',
      representative: '计划9点开始，实际9点20',
      oneLine: '开始时间比上周准了很多',
    },
    { // 8
      completed: '跑步3公里',
      uncompleted: '学习计划全部没做',
      progress: '周末也保持了运动',
      representative: '周六又是学习空白',
      oneLine: '运动的连续性比学习强',
    },
    { // 9
      representative: '周日又空了',
      oneLine: '连续两个周日都是空的',
    },
    { // 10
      completed: '单词80，数学2小时，跑步',
      uncompleted: '简历',
    },
    { // 11
      completed: '单词，英语阅读，数学习题',
      progress: '阅读正确率稳定在8/10',
      oneLine: '阅读似乎真的稳住了',
    },
    { // 12
      completed: '单词，数学2小时，跑步3公里',
      uncompleted: '简历（第9天）',
      avoidance: '每次打开简历模板就关掉',
      representative: '简历这件事我已经逃避了九天',
      oneLine: '这是我最明显的逃避',
    },
    { // 13
      completed: '单词，数学习题25道',
      progress: '数学进度追上了原计划',
    },
    { // 14
      completed: '单词，英语作文一篇，跑步',
      uncompleted: '数学',
      progress: '写了第一篇作文，虽然很烂',
      oneLine: '开始比写好更重要',
    },
    { // 15
      completed: '跑步3公里',
      uncompleted: '学习',
      progress: '周六第一次不是完全空白',
      oneLine: '周末的空白在变小',
    },
    { // 16
      completed: '单词80个',
      progress: '周日第一次做了事',
      oneLine: '连续空白的周末被打断了',
    },
    { // 17
      completed: '单词，数学2小时，跑步',
    },
    { // 18
      completed: '单词，英语阅读，数学习题',
      uncompleted: '简历（第15天）',
      representative: '半个月了，简历一个字没写',
      oneLine: '其他事都在推进，只有简历卡死',
    },
    { // 19
      completed: '单词，数学2小时',
      uncompleted: '跑步（第一次断）',
      representative: '连续12天的跑步断了',
      oneLine: '断了之后有点想放弃',
    },
    { // 20
      completed: '单词，数学习题，跑步3公里',
      progress: '断一天之后重新跑起来了',
      oneLine: '断一天不等于结束',
    },
    { // 21
      completed: '单词，英语作文，数学',
    },
    { // 22
      completed: '跑步，单词40个',
      uncompleted: '数学',
      progress: '周六做了一半的计划',
      oneLine: '周末不再是全空',
    },
    { // 23
      completed: '单词，整理了实习岗位清单',
      uncompleted: '简历正文',
      progress: '终于碰了简历相关的事',
      representative: '列清单比写简历容易，但总算碰了',
      oneLine: '逃避的边缘被推动了一点',
    },
    { // 24
      completed: '单词，数学2小时，跑步',
    },
    { // 25
      completed: '单词，英语阅读，简历写了开头三行',
      progress: '简历第一次真正动笔',
      representative: '18天之后，简历终于有了三行字',
      oneLine: '原来只是开始那一下最难',
    },
    { // 26
      completed: '单词，数学习题，简历项目经历一段',
      progress: '简历连续第二天推进',
      oneLine: '连续做两天就没那么抗拒了',
    },
    { // 27
      completed: '单词，数学2小时，跑步，简历改了一版',
      progress: '三件事同时推进',
      representative: '今天是这个月完成度最高的一天',
    },
    { // 28
      completed: '单词，英语作文，简历定稿',
      progress: '简历从零到定稿用了4天',
      representative: '拖了18天的事，真做起来只花了4天',
      oneLine: '拖延的成本远高于做事本身',
    },
    { // 29
      completed: '跑步，单词，投了3份实习',
      progress: '第一次投出简历',
      oneLine: '周六不再是空白',
    },
    { // 30
      completed: '单词，数学复盘整月进度',
      representative: '回看这个月，空白的都是周末',
    },
  ],
} as const;
