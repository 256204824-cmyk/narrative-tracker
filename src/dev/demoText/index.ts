import type { Locale } from '../../i18n/types.ts';
import type { DemoText } from './types.ts';
import { zhHansDemo } from './zhHans.ts';
import { zhHantDemo } from './zhHant.ts';
import { enDemo } from './en.ts';
import { jaDemo } from './ja.ts';
import { koDemo } from './ko.ts';
import { esDemo } from './es.ts';
import { frDemo } from './fr.ts';
import { deDemo } from './de.ts';
import { viDemo } from './vi.ts';
import { thDemo } from './th.ts';

const DEMO_CATALOG: Record<Locale, DemoText> = {
  'zh-Hans': zhHansDemo as DemoText,
  'zh-Hant': zhHantDemo,
  en: enDemo,
  ja: jaDemo,
  ko: koDemo,
  es: esDemo,
  fr: frDemo,
  de: deDemo,
  vi: viDemo,
  th: thDemo,
};

export function demoTextFor(locale: Locale): DemoText {
  return DEMO_CATALOG[locale] ?? enDemo;
}

export type { DemoText };
