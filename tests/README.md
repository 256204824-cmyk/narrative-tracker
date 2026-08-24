# 测试

## 单测

```bash
npm test
```

用 Node 22 内置的类型擦除直接跑 `.ts`，不需要构建，也没有测试框架依赖。
覆盖不依赖 expo 原生模块的纯逻辑：日期工具、档位窗口、provider URL 校验、导入校验。

为了让这些逻辑能脱离原生模块被测试，纯函数被刻意抽到了零依赖的模块里：

- `src/utils/date.ts`
- `src/services/providerUrl.ts`（`provider.ts` 再导出，调用方无感）
- `src/constants/format.ts`（`database/index.ts` 再导出）
- `src/utils/importValidation.ts`

**新增纯逻辑时，优先放进这类零依赖模块，并在 `tests/run.ts` 里补测试。**

## 界面与数据库

涉及 SQLite、导航、平台分支的验证目前靠 Web 端的 CDP 脚本手工跑
（启动 `npx expo start --web` 后驱动 Chrome DevTools Protocol）。
这部分尚未纳入仓库，是已知缺口。

真机相关的部分——Keychain / Keystore、原生 Alert、文件选择、内购——
只能在 Expo Go 或真机构建上验证。
