import type { zhHans } from './zhHans.ts';

/**
 * 文案的形状由简体中文版推导 —— 它是唯一真源。
 *
 * 其他语言文件标注 `: Messages` 后，少一个键、多一个键、
 * 或者参数签名对不上，都会在 `npx tsc` 阶段直接报错，
 * 不会等到运行时才发现某个界面是空白的。
 */
export type Messages = {
  -readonly [K in keyof typeof zhHans]: Mutable<(typeof zhHans)[K]>;
};

// `as const` 会把每条文案钉成字面量类型（'取消' 而不是 string），
// 直接拿它当契约的话，英文版填 'Cancel' 就会报类型不匹配。
// 所以在叶子节点把字面量放宽回基础类型，只保留「键的形状」这一层约束。
type Mutable<T> = T extends readonly (infer E)[]
  ? readonly Mutable<E>[]   // 保持 readonly：简体中文版是 as const 的元组
  : T extends (...args: infer A) => infer R
    ? (...args: A) => R
    : T extends object
      ? { -readonly [K in keyof T]: Mutable<T[K]> }
      : T extends string
        ? string
        : T extends number
          ? number
          : T extends boolean
            ? boolean
            : T;

/**
 * 支持的语言。
 *
 * 中文用完整的 script 标签而不是裸 `zh`：简繁两种书写系统的基础码
 * 都是 `zh`，只按基础码收敛的话它们会互相覆盖。
 */
export const SUPPORTED_LOCALES = [
  'zh-Hans',
  'zh-Hant',
  'en',
  'ja',
  'ko',
  'es',
  'fr',
  'de',
  'vi',
  'th',
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** 用户的语言选择；'system' 表示跟随设备 */
export type LocalePreference = Locale | 'system';
