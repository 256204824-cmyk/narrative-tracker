// 生产构建时替换掉 seed.ts 的空壳。
//
// Metro 不做 code splitting——动态 import() 依然会把 100KB 演示文本
// 连同十种语言一起打进正式包。所以在 metro.config.js 的解析层拦掉，
// 让非开发构建解析到这里。入口本来就被 __DEV__ 包着，永远不会被调用。

import type { Locale } from '../i18n/types';

export interface SeedResult {
  facts: number;
  from: string;
  to: string;
}

export async function seedDemoData(_locale: Locale): Promise<SeedResult> {
  throw new Error('Demo data is not available in production builds');
}
