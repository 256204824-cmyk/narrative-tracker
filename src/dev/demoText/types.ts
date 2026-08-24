import type { zhHansDemo } from './zhHans.ts';

/**
 * 演示文本的形状由简体中文版推导。
 *
 * 其他语言标注 `: DemoText` 后，少一天、多一天、
 * 或者某天少填一个字段，都会在 `npx tsc` 阶段报错。
 */
export type DemoText = {
  -readonly [K in keyof typeof zhHansDemo]: Widen<(typeof zhHansDemo)[K]>;
};

type Widen<T> = T extends readonly (infer E)[]
  ? readonly Widen<E>[]
  : T extends object
    ? { -readonly [K in keyof T]: Widen<T[K]> }
    : T extends string
      ? string
      : T;
