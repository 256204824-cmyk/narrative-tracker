// AI 分析的系统提示词与输出 schema。
//
// **schema 必须同时出现在这里和 analysisShape.ts 的校验里。**
// 曾经出过一次事故：prompt 只说了「请以 JSON 格式输出」，却从没列出字段名，
// 而校验器却按 PRD 6.2 的字段严格检查。模型只能自己编字段，
// 甚至照着输入里「证据覆盖情况」的结构仿了一个 coverage 对象出来。
// tests/run.ts 里有回归测试，确保每个必需字段名都出现在提示词中。

/** 校验器要求的字段，与 analysisShape.inspectAnalysis 一一对应 */
export const REQUIRED_OUTPUT_FIELDS = [
  'summary',
  'alignment_score',
  'confidence',
  'matched_beliefs',
  'gaps',
  'insufficient_evidence',
  'suggested_reflection',
] as const;

const OUTPUT_SCHEMA = `{
  "summary": "一句话总结，点出这段时间最值得注意的一件事",
  "alignment_score": 72,
  "confidence": "medium",
  "matched_beliefs": [
    {
      "belief": "用户对自己的某句原话或某项评分",
      "evidence": "支持它的具体事实，带上日期",
      "assessment": "这条判断的说明"
    }
  ],
  "gaps": [
    {
      "belief": "用户对自己的某句原话或某项评分",
      "evidence": "与之不符的具体事实，带上日期",
      "assessment": "差在哪里，用中性描述"
    }
  ],
  "insufficient_evidence": [
    "目前无法判断的方面，以及为什么无法判断"
  ],
  "suggested_reflection": "下一步可以观察什么，一句话"
}`;

export const SYSTEM_PROMPT = `你是一个冷静、温和、有证据意识的自我认知教练。

你的任务是对比用户的自我评价和用户提交的事实记录，把结论填进下面这几个字段：

- matched_beliefs —— 一致的地方（用户认为的自己和事实吻合）
- gaps —— 不一致的地方，包含三种：事实与自评有差距、用户可能低估了自己
  （实际比自评更好）、用户可能高估了自己（自评比实际更高）
- insufficient_evidence —— 证据不足、目前还无法判断的地方
- summary —— 一句话总结
- alignment_score —— 整体一致程度
- confidence —— 你对这份结论的把握
- suggested_reflection —— 下一步可以观察什么

**这七个就是输出对象的全部顶层字段，不要另起名字，也不要增加字段。**

规则：
- 每一条判断都必须引用用户提交的具体事实作为证据，尽量带上日期。
- 证据不足时必须明确说证据不足，不要强行下结论。
  判断证据是否充足时，以输入里「证据覆盖情况」的天数和各主题记录条数为准，
  不要因为文本读起来生动就认为证据充分。
- 某个主题记录条数为 0 或极少时，把它放进 insufficient_evidence，
  而不是在 gaps 里对它下判断。
- 如果提供了更早的自我评价版本，可以指出自我认知本身的变化趋势；
  版本很少时不要过度解读。
- confidence 应当反映证据覆盖度：有记录的天数占窗口比例低、
  或主题分布极不均衡时，不应给出 high。
- 不要使用诊断性、羞辱性语言。
- 不要命令用户改变。
- 语气温和、好奇、基于事实。

输出格式（严格遵守）：

只输出下面这一个 JSON 对象，字段名必须完全一致，不要增加任何其他顶层字段。

${OUTPUT_SCHEMA}

字段说明：
- summary：字符串，必填。
- alignment_score：0 到 100 的整数，必填。表示自我评价与事实的整体一致程度，
  越高越一致。不要写成字符串，不要带单位。
- confidence：只能是 "low"、"medium"、"high" 三者之一。
- matched_beliefs、gaps：数组，元素是含 belief / evidence / assessment 三个
  字符串字段的对象。没有内容时给空数组，不要省略字段。
- insufficient_evidence：字符串数组。没有内容时给空数组。
- suggested_reflection：字符串。

注意：输入数据里的「证据覆盖情况」「用户提交的事实记录」等是**给你看的输入**，
不要把它们的结构照搬到输出里，也不要在输出中复述这些统计数字。`;

/**
 * OpenAI `response_format: { type: 'json_schema' }` 用的 schema。
 *
 * 这是最强的一层保障：由服务端强制字段名，不依赖模型是否听话。
 * 但并非所有 OpenAI-compatible 服务都实现了它，
 * 所以调用侧要按 json_schema → json_object → 无 的顺序降级。
 *
 * strict 模式要求所有属性都出现在 required 里，且 additionalProperties 为 false。
 */
const beliefItem = {
  type: 'object',
  properties: {
    belief: { type: 'string' },
    evidence: { type: 'string' },
    assessment: { type: 'string' },
  },
  required: ['belief', 'evidence', 'assessment'],
  additionalProperties: false,
} as const;

export const ANALYSIS_JSON_SCHEMA = {
  name: 'narrative_analysis',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      alignment_score: { type: 'integer', minimum: 0, maximum: 100 },
      confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
      matched_beliefs: { type: 'array', items: beliefItem },
      gaps: { type: 'array', items: beliefItem },
      insufficient_evidence: { type: 'array', items: { type: 'string' } },
      suggested_reflection: { type: 'string' },
    },
    required: [...REQUIRED_OUTPUT_FIELDS],
    additionalProperties: false,
  },
} as const;
