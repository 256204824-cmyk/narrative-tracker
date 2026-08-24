// Phase 0 测试包专用：把 provider 固定下来，并内置一个 API Key。
//
// **仅用于给试用者分发的内部测试包，不是产品形态。**
// 常规构建下 EXPO_PUBLIC_BUNDLED_AI_KEY 为空，这里全部失效，
// App 行为不变（用户自带 Key、自选 provider）。
//
// 安全提醒：APK 就是个 zip，内置的 Key 用 unzip + strings 就能翻出来。
// 拿到安装包的人等于拿到这个 Key。所以：
//   1. 用专门新建的 Key，不要用日常那个
//   2. 给账户设消费上限
//   3. 试用结束立刻吊销
// Key 通过构建时环境变量注入，永远不进仓库（.env 已被 gitignore）。

const RAW_KEY = process.env.EXPO_PUBLIC_BUNDLED_AI_KEY ?? '';

/** 内置了 Key 的测试包？ */
export const IS_BUNDLED_BUILD = RAW_KEY.trim().length > 0;

export const BUNDLED_KEY = RAW_KEY.trim();

export const BUNDLED_PROVIDER = {
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-v4-flash',
} as const;
