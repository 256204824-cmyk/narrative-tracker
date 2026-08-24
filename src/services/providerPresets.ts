// 可选的 AI Provider 预设。零依赖，可单测。
//
// **排序原则是隐私，不是免费。**
// 这个 App 往 API 送的是用户最私密的东西——诚实的自我评价、每天的失败和逃避。
// 有些「免费」服务的商业模式就是拿数据训练，甚至包含人工审阅。
// 如果 App 自己推荐了这类服务，README 上那句「我们尊重你的隐私」就是空话。
// 所以本机模型排最前，会训练用户数据的排最后，并且每一条都标注它对数据做什么。
//
// 注意：**模型名会过期**。例如 Groq 在 2026-06-17 弃用了 llama-3.3-70b-versatile。
// 预设里的 base URL 相对稳定，模型名只是建议值；填错时 provider 会返回 4xx，
// 诊断面板会把错误原文显示出来，用户在设置里改一下即可。
//
// 刻意**不做**「拉取模型列表」：那需要第二个网络请求，
// 而 docs/data-flow.md 承诺「点生成报告之前不会有任何流量」。
// 这个承诺比省一次手填更值钱。

export type DataPolicy =
  /** 完全不出设备 */
  | 'local'
  /** 不保留、不用于训练 */
  | 'noRetainNoTrain'
  /** 不用于训练，但会短期保留用于滥用监控 */
  | 'retainNoTrain'
  /** 可能用于改进模型，包括人工审阅 */
  | 'mayTrain'
  /** 未核实 */
  | 'unknown';

export interface ProviderPreset {
  id: string;
  /** 服务商名称，不翻译 */
  name: string;
  baseUrl: string;
  /** 建议模型，可能随服务商调整而失效 */
  model: string;
  policy: DataPolicy;
  /** 有可长期使用的免费额度（不是一次性试用额度） */
  free: boolean;
  /** 本机运行，不需要 API Key */
  needsKey: boolean;
}

/**
 * 按隐私强度排序，最安全的在最前。
 * 核实时间：2026-08-24。各家政策会变，改动时请重新核对并更新 docs/providers.md。
 */
export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'ollama',
    name: 'Ollama（本机）',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3.2',
    policy: 'local',
    free: true,
    needsKey: false,
  },
  {
    id: 'lmstudio',
    name: 'LM Studio（本机）',
    baseUrl: 'http://localhost:1234/v1',
    model: 'local-model',
    policy: 'local',
    free: true,
    needsKey: false,
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'openai/gpt-oss-120b',
    policy: 'noRetainNoTrain',
    free: true,
    needsKey: true,
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    model: 'qwen-3-32b',
    policy: 'noRetainNoTrain',
    free: true,
    needsKey: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    policy: 'retainNoTrain',
    free: false,
    needsKey: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    policy: 'unknown',
    free: false,
    needsKey: true,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-flash',
    policy: 'mayTrain',
    free: true,
    needsKey: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    policy: 'mayTrain',
    free: true,
    needsKey: true,
  },
];

/** 隐私强度排序，用于「最安全的排最前」以及测试断言 */
export const POLICY_RANK: Record<DataPolicy, number> = {
  local: 0,
  noRetainNoTrain: 1,
  retainNoTrain: 2,
  unknown: 3,
  mayTrain: 4,
};

export function presetById(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id);
}

/** 当前配置匹配到的预设（用于在列表里打勾） */
export function matchPreset(baseUrl: string): ProviderPreset | undefined {
  const normalized = baseUrl.replace(/\/+$/, '');
  return PROVIDER_PRESETS.find((p) => p.baseUrl === normalized);
}
