import { getLocales } from 'expo-localization';
import { DEFAULT_LOCALE, resolveLocaleTag } from './catalog';
import type { Locale, LocalePreference, Messages } from './types';

export type { Messages, Locale, LocalePreference };
export { SUPPORTED_LOCALES } from './types';
export {
  DEFAULT_LOCALE,
  resolveLocaleTag,
  setActiveLocale,
  getActiveLocale,
  localeOptions,
  migrateStoredLocale,
  messagesFor,
  t,
} from './catalog';

/** 设备语言；无法识别时回退到默认语言 */
export function deviceLocale(): Locale {
  try {
    for (const l of getLocales()) {
      const hit = resolveLocaleTag(l.languageTag ?? l.languageCode);
      if (hit) return hit;
    }
  } catch {
    // getLocales 在极少数环境下会抛，不该因此让 App 起不来
  }
  return DEFAULT_LOCALE;
}

export function resolvePreference(pref: LocalePreference): Locale {
  return pref === 'system' ? deviceLocale() : pref;
}
