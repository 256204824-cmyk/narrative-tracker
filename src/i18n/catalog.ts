// 文案目录与当前语言。**不依赖任何原生模块**，可脱离 expo 直接测试。
//
// 设备语言检测（需要 expo-localization）在 index.ts 里，
// 不要把它引到这个文件来，否则 npm test 会挂。

import { zhHans } from './zhHans.ts';
import { zhHant } from './zhHant.ts';
import { en } from './en.ts';
import { ja } from './ja.ts';
import { ko } from './ko.ts';
import { es } from './es.ts';
import { fr } from './fr.ts';
import { de } from './de.ts';
import { vi } from './vi.ts';
import { th } from './th.ts';
import { SUPPORTED_LOCALES, type Locale, type Messages } from './types.ts';

const CATALOG: Record<Locale, Messages> = {
  'zh-Hans': zhHans as Messages,
  'zh-Hant': zhHant,
  en,
  ja,
  ko,
  es,
  fr,
  de,
  vi,
  th,
};

export const DEFAULT_LOCALE: Locale = 'en';

/** 繁体优先的地区。zh-TW / zh-HK / zh-MO 都不带 script 子标签。 */
const HANT_REGIONS = new Set(['tw', 'hk', 'mo']);

/**
 * 把任意 BCP-47 标签收敛到支持的语言。
 *
 * 中文要特殊处理：`zh-Hans-CN`、`zh-CN`、`zh` 都归到 zh-Hans，
 * 而 `zh-Hant-TW`、`zh-TW`、`zh-HK` 归到 zh-Hant。
 * 只看基础码 `zh` 的话，简繁会互相覆盖。
 */
export function resolveLocaleTag(tag: string | null | undefined): Locale | null {
  if (!tag) return null;
  const parts = tag.toLowerCase().split(/[-_]/).filter(Boolean);
  const base = parts[0];
  if (!base) return null;

  if (base === 'zh') {
    if (parts.includes('hant')) return 'zh-Hant';
    if (parts.includes('hans')) return 'zh-Hans';
    return parts.some((p) => HANT_REGIONS.has(p)) ? 'zh-Hant' : 'zh-Hans';
  }

  const hit = (SUPPORTED_LOCALES as readonly string[]).find((l) => l.toLowerCase() === base);
  return (hit as Locale) ?? null;
}

/**
 * 兼容只支持 zh / en 时期存下来的偏好值。
 * 旧值 'zh' 现在不是合法的 Locale，不迁移的话用户的选择会被静默丢弃。
 */
export function migrateStoredLocale(stored: string | null | undefined): Locale | 'system' | null {
  if (!stored) return null;
  if (stored === 'system') return 'system';
  if ((SUPPORTED_LOCALES as readonly string[]).includes(stored)) return stored as Locale;
  return resolveLocaleTag(stored);
}

export function messagesFor(locale: Locale): Messages {
  return CATALOG[locale] ?? CATALOG[DEFAULT_LOCALE];
}

/** 按 SUPPORTED_LOCALES 顺序列出所有语言及其自称名，供设置页渲染 */
export function localeOptions(): Array<{ locale: Locale; name: string }> {
  return SUPPORTED_LOCALES.map((locale) => ({ locale, name: CATALOG[locale].locale.name }));
}

// ── 模块级当前语言 ──
//
// 界面通过 useT() 拿文案（跟随 React 状态），但 services / utils 里的
// 纯函数拿不到 React context，需要一个同步可读的当前值。
// AppContext 在语言变化时调用 setActiveLocale 保持两者一致。

let activeLocale: Locale = DEFAULT_LOCALE;

export function setActiveLocale(locale: Locale): void {
  activeLocale = locale;
}

export function getActiveLocale(): Locale {
  return activeLocale;
}

/** 非 React 场景取文案 */
export function t(): Messages {
  return messagesFor(activeLocale);
}
