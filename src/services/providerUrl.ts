// Provider base URL 的归一化与校验。
//
// 只依赖 i18n（纯数据，无原生模块），仍可脱离 expo 被直接测试。

import { t } from '../i18n/catalog.ts';

export interface UrlCheck {
  ok: boolean;
  /** 可用但需要提醒用户的情况（例如明文 http） */
  warning?: string;
  error?: string;
}

/**
 * 归一化用户填写的 base URL。
 *
 * 用户可能填 `https://x.com`、`https://x.com/`、`https://x.com/v1/`
 * 甚至把完整的 `/chat/completions` 也粘进来，这里统一收敛成
 * 不带尾斜杠、不含 endpoint 路径的形式。
 */
export function normalizeBaseUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return '';
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/chat\/completions$/, '');
  return url;
}

export function checkBaseUrl(raw: string): UrlCheck {
  const url = normalizeBaseUrl(raw);
  if (!url) return { ok: false, error: t().provider.urlEmpty };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: t().provider.urlInvalid };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, error: t().provider.urlProtocol };
  }

  const host = parsed.hostname;
  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);

  if (parsed.protocol === 'http:' && !isLocal) {
    return {
      ok: true,
      warning: t().provider.urlPlaintextWarning,
    };
  }

  return { ok: true };
}
