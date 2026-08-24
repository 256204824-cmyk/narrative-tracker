import type { Messages } from './types.ts';

export const en: Messages = {
  locale: {
    name: 'English',
    aiInstruction: 'Write your entire response in English.',
  },

  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    confirm: 'OK',
    retry: 'Please try again',
    saving: 'Saving…',
    saved: 'Saved',
    deleted: 'Deleted',
    modify: 'Edit',
    prev: 'Back',
    next: 'Next',
  },

  tabs: {
    home: 'Facts',
    feedback: 'Report',
    settings: 'Settings',
  },

  portrait: {
    onboardingTitle: 'About you',
    onboardingSubtitle: 'There are no right answers here. Just answer honestly.',
    onboardingSubmit: 'Finish',
    reassessTitle: 'Reassess yourself',
    reassessSubtitle: "Answer as you feel today. Don't try to match last time.",
    reassessSubmit: 'Save this version',
    textPhaseTitle: 'A little more',
    textPhaseSubtitle: 'Describe yourself in your own words.',
    textPlaceholder: 'Write what you actually think…',
    continueToText: 'Continue',
    backOneStep: 'Back to previous question',
    incompleteTitle: 'Please answer every question',
    incompleteBody: 'Each answer helps the AI understand you better.',
    saveFailed: "Couldn't save",
    reassessSavedBody: 'This version is saved. Your previous one is kept.',
  },

  questions: {
    portrait: {
      discipline: 'Do you consider yourself a disciplined person?',
      engagement: 'How engaged have you been with your work or studies lately?',
      procrastination: 'Do you procrastinate a lot?',
      persistence: 'Can you stick with long-term goals?',
      strength: "What's been your biggest strength lately?",
      change: 'What would you most like to change about yourself right now?',
      self_words: 'Describe yourself right now in three words.',
    },
    fact: {
      completed: { q: 'What did you actually get done today?', hint: 'List specifics, however small' },
      uncompleted: { q: 'What did you plan to do today but skip?', hint: 'Be honest about the gap' },
      progress: { q: 'Did anything today move you closer to a goal?', hint: 'Even tiny progress counts' },
      avoidance: { q: 'Did you clearly avoid something today?', hint: 'What did you dodge, and why' },
      representative: { q: 'Which fact best represents your real state today?', hint: 'No polish — the honest one' },
      one_line: { q: 'If you could record only one fact, what would it be?', hint: "Today's key fact in one line" },
    },
    tags: {
      study: 'Study', work: 'Work', health: 'Health', social: 'Social',
      emotion: 'Mood', procrastination: 'Procrastination', discipline: 'Discipline', other: 'Other',
    },
  },

  scale: {
    low: '1 Not at all',
    high: '10 Completely',
  },

  home: {
    title: 'Facts',
    empty: 'Record what you actually did. No judgement, just observation.',
    counted: (n: number) => `${n} ${n === 1 ? 'entry' : 'entries'} recorded`,
    add: "+ Record today's facts",
    tagsLabel: 'Tags (optional)',
    submit: 'Save',
    historyTitle: 'History',
    viewAnalysis: 'View report',
    needOneFieldTitle: 'Please fill in at least one field',
    needOneFieldBody: 'Even a single sentence matters.',
    saveFailed: "Couldn't save",
  },

  fact: {
    completed: 'Did',
    uncompleted: "Didn't do",
    progress: 'Toward the goal',
    avoidance: 'Avoided',
    representative: 'Most telling',
  },

  feedback: {
    title: 'Narrative audit',
    subtitle: 'Comparing who you think you are with what you recorded',
    windowLabel: 'Window',
    windowValue: (d: number) => `${d} days`,
    factsLabel: 'entries',
    analysesLabel: 'reports',
    generate: 'Generate report',
    alignment: 'Narrative–behaviour alignment',
    highMatch: 'Closely aligned',
    partialMatch: 'Partly aligned',
    lowMatch: 'Noticeable gap',
    confidenceHigh: 'High confidence',
    confidenceMedium: 'Medium confidence',
    confidenceLow: 'Low confidence',
    lowConfidenceLabel: 'Too few entries to draw a conclusion yet',
    lowConfidenceNoteGeneric: 'The evidence behind this report is thin, so treat the score below as a rough hint.',
    lowConfidenceSparse: (days: number, window: number) =>
      `Only ${days} of the last ${window} days have entries. A few more and it gets a lot more reliable.`,
    summary: 'Summary',
    matched: '✓ Where facts agree',
    gaps: '! Where facts differ',
    insufficient: '? Not enough evidence',
    suggestion: 'Suggestion',
    evidencePrefix: (e: string) => `Evidence: ${e}`,
    historyTitle: 'Past reports',
    historyScore: (n: number) => `Alignment: ${n}`,
    noPortrait: 'Please complete your self-portrait first.',
    noFacts: 'No entries in this time range yet. Record some facts first.',
    needMoreDays: (windowDays: number, have: number, need: number) =>
      `You have ${have} ${have === 1 ? 'day' : 'days'} recorded in the last ${windowDays} days. ${need} more to go.\n\nPatterns only show across different days — several entries on one day don't count.`,
    loadFailed: "Couldn't read local records. Please try again.",
    genericFailure: 'Analysis failed. Check your API key and network connection.',
  },

  settings: {
    title: 'Settings',

    languageTitle: 'Language',
    languageDesc: 'Sets the interface language, and the language the AI writes in.',
    languageSystem: 'Follow system',

    keyTitle: 'AI API key',
    keyDesc: 'Your key is stored in this device’s secure storage. It is never uploaded anywhere.',
    keySet: 'Key set',
    keyAdd: '+ Add API key',
    keyRemove: 'Remove key',
    keyPlaceholder: 'sk-…',
    keyInvalid: 'Please enter a valid API key',
    keySavedBody: 'Your API key is stored securely on this device.',
    keyRemoveTitle: 'Remove API key',
    keyRemoveBody: 'Without a key you cannot generate reports. Remove it?',

    providerTitle: 'AI provider',
    providerDesc:
      'Any OpenAI-compatible service works, including models running on your own machine.',
    baseUrlLabel: 'Base URL',
    baseUrlHint: 'Up to /v1 — do not include /chat/completions',
    modelLabel: 'Model',
    providerInvalidTitle: 'Invalid base URL',
    providerNeedModelTitle: 'Please enter a model name',
    providerNeedModelBody:
      'Model names differ per provider, e.g. gpt-4o-mini or deepseek-chat.',
    providerSavedBody: 'Future requests will go to this address.',
    presetsTitle: 'Common providers',
    presetsDesc: 'Sorted by privacy, not by price. This app sends your most personal notes — check what a provider does with them before checking whether it is free.',
    presetFree: 'free tier',
    presetNoKey: 'no key needed',
    presetNeedsComputer: 'needs a computer',
    presetGetKey: 'Get a key →',
    presetKeyReminder: (name: string) =>
      `${name} needs its own API key — the one you have saved will not work here and will return 401. Tap "Get a key" in the list to sign up, then replace it above.`,
    presetApplied: (name: string) => `Switched to ${name}. You may need to adjust the model name to whatever they currently offer.`,
    policyLocal: 'never leaves your device',
    policyNoRetainNoTrain: 'not retained, not used for training',
    policyRetainNoTrain: 'not used for training; kept briefly for abuse monitoring',
    policyMayTrain: 'may be used to improve models, including human review',
    policyUnknown: 'not verified — read their privacy policy yourself',
    providerReset: 'Reset to default (OpenAI)',
    providerResetDone: 'Reset to default',

    portraitTitle: 'Self-portrait',
    portraitDescEmpty:
      'How you see yourself changes. Reassessing regularly is what reveals the shift.',
    portraitDescVersions: (n: number) =>
      `${n} versions saved. Each reassessment adds one; older versions are kept.`,
    portraitReassess: 'Reassess yourself',
    portraitLatest: ' (latest)',
    portraitScores: (d: number, e: number, p: number, s: number) =>
      `Discipline ${d} · Focus ${e} · Procrastination ${p} · Persistence ${s}`,

    tierTitle: 'Report range',
    tierDesc: 'Unlock feedback over longer periods.',
    tierFree: (d: number) => `Last ${d} days`,
    tierPlus: 'Last month',
    tierPro: 'Last year',

    dataTitle: 'Your data',
    dataDesc: (n: number) =>
      `${n} ${n === 1 ? 'entry' : 'entries'} stored. Everything stays on this device.`,
    export: 'Export all data (JSON)',
    exporting: 'Exporting…',
    exportDialogTitle: 'Export your data',
    exportOkTitle: 'Exported',
    exportOkBody: (uri: string) => `Saved to: ${uri}`,
    exportFailed: 'Export failed',
    import: 'Import data (JSON)',
    importing: 'Importing…',
    importTitle: 'Import data',
    importBody: (portraits: number, facts: number) =>
      `About to import ${portraits} self-portrait version(s) and ${facts} entries.\n\nThis replaces everything currently on this device and cannot be undone. Consider exporting a backup first.`,
    importConfirm: 'Replace and import',
    importRejected: "Can't import",
    importFailed: 'Import failed',
    importDone: 'Import complete',
    importDoneBody: (facts: number, portraits: number, analyses: number) =>
      `${facts} entries, ${portraits} portrait version(s), ${analyses} past report(s).`,
    deleteAll: 'Delete all local data',
    deleteAllTitle: 'Delete all data',
    deleteAllBody:
      'This cannot be undone. Every self-portrait, entry and report will be permanently deleted, and the app will return to the initial self-portrait. Continue?',
    deleteAllConfirm: 'Delete permanently',
    deleteAllDone: 'All local data has been cleared.',
    deleteFailed: 'Delete failed',

    devTitle: 'Developer tools',
    devDesc: 'Shown in development builds only. Never appears in a release build.',
    devSeed: 'Load 30 days of demo data',
    devSeeding: 'Loading…',
    devSeedTitle: 'Load demo data',
    devSeedBody:
      'This clears all current data, writes 30 days of simulated entries, and sets the tier to Plus. For previewing the interface only. Continue?',
    devSeedConfirm: 'Clear and load',
    devSeedDone: 'Loaded',
    devSeedDoneBody: (n: number, from: string, to: string) =>
      `${n} days of demo entries (${from} – ${to}). Tier set to Plus.`,
    devSeedFailed: 'Loading failed',

    privacyTitle: 'Our promise',
    privacyLines: [
      'We do not own your data',
      'We do not read your other apps',
      'We do not take screenshots',
      'We run no server that holds your private data',
      'We analyse only what you choose to submit',
    ],
    footer: 'Narrative Tracker v1.0.0 · Local-first · BYOK',
  },

  provider: {
    urlEmpty: 'Base URL cannot be empty',
    urlInvalid: 'Not a valid URL — it must start with http:// or https://',
    urlProtocol: 'Only http:// and https:// are supported',
    urlPlaintextWarning:
      'This is a plaintext http connection — your API key and entries would travel unencrypted. Use https unless this is a service on your own machine.',
  },

  ai: {
    noKey: 'No API key set. Add your AI API key in Settings.',
    requestFailed: (status: number, body: string, baseUrl: string, model: string) =>
      `AI request failed (${status}): ${body}\n\nProvider: ${baseUrl}, model: ${model}`,
    emptyResponse: (baseUrl: string, model: string) =>
      `The AI returned empty content. Provider: ${baseUrl}, model: ${model}`,
    badJson: (head: string) => `The AI did not return valid JSON. Response starts with: ${head}`,
    badShape: 'The AI response did not match the expected format',
    notJsonActual: 'not valid JSON',
    wholeResponse: '(whole response)',
  },

  diagnostics: {
    title: 'Diagnostics',
    show: 'See what did not match',
    hide: 'Hide',
    fieldsHeader: 'Field check',
    colField: 'Field',
    colExpected: 'Expected',
    colActual: 'Received',
    fatalTag: 'blocking',
    recoveredTag: 'defaulted',
    metaHeader: 'Response metadata',
    finishReasonLabel: 'finish_reason',
    finishReasonMissing: '(not returned by the API)',
    truncatedNote: 'The response was cut off — the model hit its output length limit before finishing. Try a shorter report range (Settings → Report range), or a model with a higher output limit.',
    responseLength: (n: number) => `${n} characters`,
    rawHeader: 'Raw model response',
    rawEmpty: '(the model returned nothing)',
    copy: 'Copy diagnostics',
    copied: 'Copied to clipboard',
    providerHint: (baseUrl: string, model: string) =>
      `Provider: ${baseUrl}, model: ${model}. If this keeps happening, the model probably struggles to follow a JSON schema — try a stronger one in Settings.`,
  },

  importValidation: {
    notJson: 'This is not a valid JSON file.',
    notObject: 'Wrong format: the top level should be an object.',
    tooNew: (fileVersion: number, supported: number) =>
      `This file was exported by a newer version of the app (format v${fileVersion}, this app supports v${supported}). Please update first.`,
    missingFields:
      'No self_portraits or fact_logs found — this may not be a Narrative Tracker export.',
    emptyData: 'This file contains no self-portraits or entries.',
    portraitNotObject: (i: number) => `Self-portrait #${i} is not an object.`,
    factNotObject: (i: number) => `Entry #${i} is not an object.`,
    badDate: (i: number, date: string) =>
      `Entry #${i} has an invalid date "${date}" — it should be YYYY-MM-DD.`,
    emptyDateLabel: '(empty)',
    readFailed: (status: number) => `Could not read the file (${status})`,
  },
};
