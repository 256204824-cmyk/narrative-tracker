# 测试

## 单测

```bash
npm test
```

用 Node 22 内置的类型擦除直接跑 `.ts`，不需要构建，也没有测试框架依赖。
覆盖不依赖 expo 原生模块的纯逻辑：日期工具、档位窗口、provider URL 校验、
导入校验、多语言完整性、标签 id 兼容。

多语言那组会递归比对 `zh.ts` 与 `en.ts` 的键，是类型检查之外的第二道防线；
另外会验证旧数据里存的中文标签名切到英文界面后仍显示正确译名——
存显示名而非 id 会让标签统计在切换语言后分裂，而那是 AI 判断证据充足性的依据。

为了让这些逻辑能脱离原生模块被测试，纯函数被刻意抽到了零依赖的模块里：

- `src/utils/date.ts`
- `src/services/providerUrl.ts`（`provider.ts` 再导出，调用方无感）
- `src/constants/format.ts`（`database/index.ts` 再导出）
- `src/utils/importValidation.ts`
- `src/i18n/catalog.ts`（`i18n/index.ts` 再导出并追加设备语言检测）

**注意**：纯逻辑要引 `i18n/catalog`，不要引 `i18n/index`——
后者依赖 expo-localization，会让 `npm test` 直接挂掉。

**新增纯逻辑时，优先放进这类零依赖模块，并在 `tests/run.ts` 里补测试。**

## 界面与数据库

涉及 SQLite、导航、平台分支的验证目前靠 Web 端的 CDP 脚本手工跑
（启动 `npx expo start --web` 后驱动 Chrome DevTools Protocol）。
这部分尚未纳入仓库，是已知缺口。

真机相关的部分——Keychain / Keystore、原生 Alert、文件选择、内购——
只能在 Expo Go 或真机构建上验证。
