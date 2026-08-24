import { secureGet, secureSet } from './storage';
import type { ProviderConfig } from '../types';
import { normalizeBaseUrl } from './providerUrl';

// URL 相关的纯逻辑放在 providerUrl.ts（不依赖任何原生模块，可单独测试），
// 这里再导出一次，调用方无需关心这个拆分。
export { normalizeBaseUrl, checkBaseUrl } from './providerUrl';
export type { UrlCheck } from './providerUrl';

const BASE_URL_KEY = 'narrative_tracker_base_url';
const MODEL_KEY = 'narrative_tracker_model';

export const DEFAULT_PROVIDER: ProviderConfig = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
};

export async function saveProviderConfig(config: ProviderConfig): Promise<void> {
  await secureSet(BASE_URL_KEY, normalizeBaseUrl(config.baseUrl) || DEFAULT_PROVIDER.baseUrl);
  await secureSet(MODEL_KEY, config.model.trim() || DEFAULT_PROVIDER.model);
}

export async function getProviderConfig(): Promise<ProviderConfig> {
  const [baseUrl, model] = await Promise.all([secureGet(BASE_URL_KEY), secureGet(MODEL_KEY)]);
  return {
    baseUrl: baseUrl?.trim() || DEFAULT_PROVIDER.baseUrl,
    model: model?.trim() || DEFAULT_PROVIDER.model,
  };
}
