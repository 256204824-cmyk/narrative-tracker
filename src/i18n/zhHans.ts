// 简体中文文案。这份是**唯一的真源**：
// `Messages` 类型由它推导，其他语言必须实现同样的键，缺一个就编译不过。
//
// 带参数的文案写成函数而不是模板占位符，这样参数类型也由编译器保证。

export const zhHans = {
  locale: {
    name: '简体中文',
    /** 传给 AI 的语言指令 */
    aiInstruction: '请全部用简体中文回答。',
  },

  common: {
    cancel: '取消',
    save: '保存',
    delete: '删除',
    confirm: '确定',
    retry: '请重试',
    saving: '保存中...',
    saved: '已保存',
    deleted: '已删除',
    modify: '修改',
    prev: '上一题',
    next: '下一题',
  },

  tabs: {
    home: '事实日志',
    feedback: '审计报告',
    settings: '设置',
  },

  portrait: {
    onboardingTitle: '了解你自己',
    onboardingSubtitle: '以下问题没有正确答案，如实回答就好。',
    onboardingSubmit: '完成初始画像',
    reassessTitle: '重新评价自己',
    reassessSubtitle: '按你现在的感受回答，不用参考上一次。',
    reassessSubmit: '保存这一版画像',
    textPhaseTitle: '再多了解你一点',
    textPhaseSubtitle: '用你自己的话来描述自己。',
    textPlaceholder: '写下你的真实想法...',
    continueToText: '继续填写',
    backOneStep: '返回上一题',
    incompleteTitle: '请填写所有问题',
    incompleteBody: '每个问题都能帮助 AI 更好地理解你。',
    saveFailed: '保存失败',
    reassessSavedBody: '这一版画像已记录，上一版仍然保留。',
  },

  questions: {
    portrait: {
      discipline: '你觉得自己是一个自律的人吗？',
      engagement: '你觉得自己最近学习或工作的投入度如何？',
      procrastination: '你觉得自己拖延严重吗？',
      persistence: '你觉得自己能坚持长期目标吗？',
      strength: '你觉得自己最近最大的优势是什么？',
      change: '你觉得自己最近最想改变的问题是什么？',
      self_words: '用三个词描述现在的自己。',
    },
    fact: {
      completed: { q: '今天你实际完成了什么？', hint: '列出具体的事情，哪怕很小' },
      uncompleted: { q: '今天你原本计划做但没有做的事情是什么？', hint: '诚实面对计划落差' },
      progress: { q: '今天有没有一件事证明你在靠近目标？', hint: '哪怕是很小的进展' },
      avoidance: { q: '今天有没有一次明显的逃避？', hint: '你回避了什么，为什么' },
      representative: { q: '今天最能代表你真实状态的事实是什么？', hint: '不用修饰，写最真实的那件' },
      one_line: { q: '如果只能写一句事实，你会写什么？', hint: '一句话总结今天的关键事实' },
    },
    tags: {
      study: '学习', work: '工作', health: '健康', social: '社交',
      emotion: '情绪', procrastination: '拖延', discipline: '自律', other: '其他',
    },
  },

  scale: {
    low: '1 非常不符合',
    high: '10 非常符合',
  },

  home: {
    title: '事实日志',
    empty: '记录你的真实行动，不评判，只观察。',
    counted: (n: number) => `已记录 ${n} 条事实`,
    add: '+ 记录今天的事实',
    tagsLabel: '分类标签（可选）',
    submit: '保存事实',
    historyTitle: '历史记录',
    viewAnalysis: '查看分析',
    needOneFieldTitle: '请至少填写一项',
    needOneFieldBody: '即使是简单的一句话也很重要。',
    saveFailed: '保存失败',
  },

  fact: {
    completed: '完成了',
    uncompleted: '未完成',
    progress: '靠近目标',
    avoidance: '逃避',
    representative: '最有代表性',
  },

  feedback: {
    title: '叙事审计',
    subtitle: '对比「你以为的自己」和「你记录的事实」',
    windowLabel: '分析范围',
    windowValue: (d: number) => `${d} 天`,
    factsLabel: '条事实',
    analysesLabel: '次分析',
    generate: '生成分析报告',
    alignment: '叙事-行为对齐度',
    highMatch: '高度一致',
    partialMatch: '部分一致',
    lowMatch: '差距较大',
    confidenceHigh: '置信度高',
    confidenceMedium: '置信度中',
    confidenceLow: '置信度低',
    summary: '总结',
    matched: '✓ 一致的地方',
    gaps: '! 不一致的地方',
    insufficient: '? 证据不足',
    suggestion: '建议',
    evidencePrefix: (e: string) => `证据：${e}`,
    historyTitle: '历史分析',
    historyScore: (n: number) => `对齐度：${n}`,
    noPortrait: '请先完成自我画像。',
    noFacts: '当前时间范围内没有事实记录。请先记录一些事实。',
    needMoreDays: (windowDays: number, have: number, need: number) =>
      `最近 ${windowDays} 天里你有 ${have} 天的记录，还需要再记录 ${need} 天。\n\n跨越不同日子的记录才能看出模式，同一天写多条不算。`,
    loadFailed: '读取本地记录失败，请重试。',
    genericFailure: '分析失败，请检查 API Key 和网络连接。',
  },

  settings: {
    title: '设置',

    languageTitle: '语言',
    languageDesc: '界面语言，同时决定 AI 用哪种语言写反馈。',
    languageSystem: '跟随系统',

    keyTitle: 'AI API Key',
    keyDesc: '你提供的 Key 直接保存在设备安全存储中，不会上传到任何服务器。',
    keySet: '已设置 Key',
    keyAdd: '+ 添加 API Key',
    keyRemove: '删除 Key',
    keyPlaceholder: 'sk-...',
    keyInvalid: '请输入有效的 API Key',
    keySavedBody: 'API Key 已安全存储在设备中。',
    keyRemoveTitle: '删除 API Key',
    keyRemoveBody: '删除后将无法使用 AI 分析功能。确定删除？',

    providerTitle: 'AI Provider',
    providerDesc: '任何兼容 OpenAI 接口格式的服务都可以用，包括跑在本机的模型。',
    baseUrlLabel: 'Base URL',
    baseUrlHint: '填到 /v1 为止，不要带 /chat/completions',
    modelLabel: '模型',
    providerInvalidTitle: 'base URL 无效',
    providerNeedModelTitle: '请填写模型名',
    providerNeedModelBody: '不同 provider 的模型名不同，例如 gpt-4o-mini、deepseek-chat。',
    providerSavedBody: '之后的分析请求会发往这个地址。',
    providerReset: '恢复默认（OpenAI）',
    providerResetDone: '已恢复默认',

    portraitTitle: '自我画像',
    portraitDescEmpty: '你对自己的看法会变。定期重评，才能看出叙事本身的变化。',
    portraitDescVersions: (n: number) =>
      `已保存 ${n} 个版本。每次重评都会新增一版，旧版本全部保留。`,
    portraitReassess: '重新评价自我画像',
    portraitLatest: '（最新）',
    portraitScores: (d: number, e: number, p: number, s: number) =>
      `自律 ${d} · 投入 ${e} · 拖延 ${p} · 坚持 ${s}`,

    tierTitle: '分析范围',
    tierDesc: '解锁更长时间范围的反馈。',
    tierFree: (d: number) => `最近 ${d} 天反馈`,
    tierPlus: '最近 1 个月反馈',
    tierPro: '最近 1 年反馈',

    dataTitle: '数据管理',
    dataDesc: (n: number) => `当前存储了 ${n} 条事实记录。所有数据仅保存在本机。`,
    export: '导出所有数据 (JSON)',
    exporting: '导出中...',
    exportDialogTitle: '导出叙事数据',
    exportOkTitle: '导出成功',
    exportOkBody: (uri: string) => `文件已保存到：${uri}`,
    exportFailed: '导出失败',
    import: '导入数据 (JSON)',
    importing: '导入中...',
    importTitle: '导入数据',
    importBody: (portraits: number, facts: number) =>
      `即将导入 ${portraits} 个自我画像版本和 ${facts} 条事实记录。\n\n这会替换掉当前设备上的全部数据，且不可撤销。建议先导出一份当前数据作为备份。`,
    importConfirm: '替换并导入',
    importRejected: '无法导入',
    importFailed: '导入失败',
    importDone: '导入完成',
    importDoneBody: (facts: number, portraits: number, analyses: number) =>
      `${facts} 条事实、${portraits} 个画像版本、${analyses} 份历史分析。`,
    deleteAll: '删除所有本地数据',
    deleteAllTitle: '删除所有数据',
    deleteAllBody:
      '此操作不可撤销。所有自我画像、事实记录和分析结果将被永久删除，App 会回到初始自我画像流程。确定继续？',
    deleteAllConfirm: '永久删除',
    deleteAllDone: '所有本地数据已被清除。',
    deleteFailed: '删除失败',

    devTitle: '开发工具',
    devDesc: '仅在开发模式下显示，不会出现在正式版本中。',
    devSeed: '载入 30 天演示数据',
    devSeeding: '载入中...',
    devSeedTitle: '载入演示数据',
    devSeedBody:
      '这会先清空当前所有数据，再写入 30 天的模拟记录，并把档位设为 Plus。仅用于预览界面效果。确定继续？',
    devSeedConfirm: '清空并载入',
    devSeedDone: '已载入',
    devSeedDoneBody: (n: number, from: string, to: string) =>
      `${n} 天演示记录（${from} ~ ${to}），档位已设为 Plus。`,
    devSeedFailed: '载入失败',

    privacyTitle: '隐私承诺',
    privacyLines: [
      '不拥有你的数据',
      '不读取其他 App',
      '不截屏',
      '不建立服务器保存你的隐私',
      '你提交什么，App 才分析什么',
    ],
    footer: 'Narrative Tracker v1.0.0 · Local-first · BYOK',
  },

  provider: {
    urlEmpty: 'base URL 不能为空',
    urlInvalid: '不是合法的 URL，需要以 http:// 或 https:// 开头',
    urlProtocol: '只支持 http:// 或 https://',
    urlPlaintextWarning:
      '这是明文 http 连接，你的 API Key 和事实记录会以明文经过网络。除非是本机服务，否则建议使用 https。',
  },

  ai: {
    noKey: 'API Key 未设置。请在设置中填写你的 AI API Key。',
    requestFailed: (status: number, body: string, baseUrl: string, model: string) =>
      `AI 请求失败 (${status})：${body}\n\n当前 provider：${baseUrl}，模型：${model}`,
    emptyResponse: (baseUrl: string, model: string) =>
      `AI 返回了空内容。当前 provider：${baseUrl}，模型：${model}`,
    badJson: (head: string) => `AI 返回的不是合法 JSON。原始内容开头：${head}`,
    badShape: 'AI 返回格式不符合预期',
  },

  importValidation: {
    notJson: '这不是一个有效的 JSON 文件。',
    notObject: '文件格式不对：顶层应该是一个对象。',
    tooNew: (fileVersion: number, supported: number) =>
      `这个文件由更新版本的 App 导出（格式 v${fileVersion}，当前支持 v${supported}）。请先升级 App。`,
    missingFields:
      '文件里没有找到 self_portraits 和 fact_logs，这可能不是 Narrative Tracker 导出的数据。',
    emptyData: '这个文件里没有任何自我画像或事实记录。',
    portraitNotObject: (i: number) => `第 ${i} 条自我画像不是一个对象。`,
    factNotObject: (i: number) => `第 ${i} 条事实记录不是一个对象。`,
    badDate: (i: number, date: string) =>
      `第 ${i} 条事实记录的日期「${date}」格式不对，应该是 YYYY-MM-DD。`,
    emptyDateLabel: '(空)',
    readFailed: (status: number) => `读取文件失败 (${status})`,
  },
} as const;
