// PRD Section 3.1 — Initial self-portrait questions
export const SELF_PORTRAIT_QUESTIONS = [
  {
    id: 'discipline',
    question: '你觉得自己是一个自律的人吗？',
    type: 'scale' as const,
  },
  {
    id: 'engagement',
    question: '你觉得自己最近学习或工作的投入度如何？',
    type: 'scale' as const,
  },
  {
    id: 'procrastination',
    question: '你觉得自己拖延严重吗？',
    type: 'scale' as const,
  },
  {
    id: 'persistence',
    question: '你觉得自己能坚持长期目标吗？',
    type: 'scale' as const,
  },
  {
    id: 'strength',
    question: '你觉得自己最近最大的优势是什么？',
    type: 'text' as const,
  },
  {
    id: 'change',
    question: '你觉得自己最近最想改变的问题是什么？',
    type: 'text' as const,
  },
  {
    id: 'self_words',
    question: '用三个词描述现在的自己。',
    type: 'text' as const,
  },
];

// PRD Section 3.2 — Daily fact submission questions
export const FACT_LOG_QUESTIONS = [
  {
    id: 'completed',
    question: '今天你实际完成了什么？',
    hint: '列出具体的事情，哪怕很小',
  },
  {
    id: 'uncompleted',
    question: '今天你原本计划做但没有做的事情是什么？',
    hint: '诚实面对计划落差',
  },
  {
    id: 'progress',
    question: '今天有没有一件事证明你在靠近目标？',
    hint: '哪怕是很小的进展',
  },
  {
    id: 'avoidance',
    question: '今天有没有一次明显的逃避？',
    hint: '你回避了什么，为什么',
  },
  {
    id: 'representative',
    question: '今天最能代表你真实状态的事实是什么？',
    hint: '不用修饰，写最真实的那件',
  },
  {
    id: 'one_line',
    question: '如果只能写一句事实，你会写什么？',
    hint: '一句话总结今天的关键事实',
  },
];

export const CATEGORY_TAGS = ['学习', '工作', '健康', '社交', '情绪', '拖延', '自律', '其他'];

// 生成一次分析所需的最少「不同日子」数量。
// 同一天写多条不能说明任何跨时间的模式（PRD 5.2）。
export const MIN_DAYS_FOR_ANALYSIS = 3;

// 各档位的分析窗口（天）。
//
// 注意 free 是 7 而不是 PRD 8.2 写的 3：窗口若等于 MIN_DAYS_FOR_ANALYSIS，
// 用户必须连续三天一天不落才能看到反馈，漏一天窗口滚动就又要从头来。
// 这会让新用户在第一周大概率一次反馈都看不到，而 PRD 12「风险一」正是
// 「用户不愿持续输入」—— 那个设计恰好惩罚了它想鼓励的行为。
// 7 天也与 PRD 10.1 的成功指标「7 日内至少提交 3 次事实」一致。
export const TIER_LIMITS: Record<string, number> = {
  free: 7,
  plus: 30,
  pro: 365,
};
