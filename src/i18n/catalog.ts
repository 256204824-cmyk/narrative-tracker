// 文案目录与当前语言。**不依赖任何原生模块**，可脱离 expo 直接测试。
//
// 设备语言检测（需要 expo-localization）在 index.ts 里，
// 不要把它引到这个文件来，否则 npm test 会挂。

import { zh } from './zh.ts';
import { en } from './en.ts';
import { SUPPORTED_LOCALES, type Locale, type Messages } from './types.ts';

const CATALOG: Record<Locale, Messages> = { zh: zh as Messages, en };

export const DEFAULT_LOCALE: Locale = 'en';

/** 把任意 BCP-47 标签收敛到支持的语言，例如 zh-Hans-CN → zh */
export function resolveLocaleTag(tag: string | null | undefined): Locale | null {
  if (!tag) return null;
  const base = tag.toLowerCase().split(/[-_]/)[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(base) ? (base as Locale) : null;
}

export function messagesFor(locale: Locale): Messages {
  return CATALOG[locale] ?? CATALOG[DEFAULT_LOCALE];
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
