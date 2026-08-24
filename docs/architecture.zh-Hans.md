# 代码结构

> [English](architecture.md)

全部在设备上运行。没有服务器、没有账号，除了 Expo 之外没有额外构建步骤。
如果你想核对隐私承诺、以及怎么自己验证，先看 [data-flow.zh-Hans.md](data-flow.zh-Hans.md) ——
这份文档讲的是代码怎么组织的。

## 不可妥协的五条

来自[产品需求文档](product-requirements.md)，是约束而不是偏好。违反其中任何一条的改动不应该被合入。

1. **不监控。** 不截屏、不读屏幕时间、不读其他 App、不读位置/通讯录/健康/财务。
   需要「偷偷观察用户」才能实现的功能，一律不做。
2. **事实只由用户主动提交。** 只分析用户主动输入、主动保存的内容。
3. **数据只属于用户。** 无服务器、无账号、无云同步。全部本地，可导出，可一键删除。
4. **AI 是镜子不是裁判。** 每条结论必须引用用户提交过的具体事实；证据不足时必须明说，
   不许强行下结论；禁止诊断、羞辱、命令式语言。
5. **开源可验证。** 读者应该能从代码里确认没有任何东西被上传。

## 目录

```
App.tsx                     导航（底部 Tab），外面包着 ErrorBoundary
src/
  types/index.ts            全部领域类型，改数据结构从这里开始
  database/index.ts         SQLite。三张表：self_portraits / fact_logs /
                            analysis_results。所有 SQL 集中在此——界面层不写 SQL，
                            所以这一个文件就是「能被存下来的东西」的完整清单
  services/
    index.ts                API Key 管理 + 分析请求
    analysisPrompt.ts       系统提示词与输出 schema
    analysisShape.ts        模型返回内容的逐字段校验
    provider.ts             base URL / 模型配置
    providerUrl.ts          URL 归一化与校验
    providerPresets.ts      内置服务商，按隐私强度排序
    storage.native.ts       Key 存储：expo-secure-store（Keychain / Keystore）
    storage.ts              Web 回退：localStorage（仅开发用）
  i18n/
    zhHans.ts               简体中文——唯一真源
    <locale>.ts             其余九种语言，类型由真源推导
    catalog.ts              文案查找 + 当前语言（零原生依赖）
    index.ts                catalog 再导出 + 设备语言检测
  constants/
    questions.ts            题目 id、档位窗口、标签映射
    format.ts               导出格式版本号
  utils/
    date.ts                 本地时区日期
    dialog.*.ts             对话框（原生 / Web）
    readTextFile.*.ts       读取选中的文件
    saveTextFile.*.ts       写出导出文件
    importValidation.ts     导入文件的逐字段校验
  store/AppContext.tsx      Key / 档位 / 语言 / onboarding 状态
  screens/                  SelfPortraitForm、Onboarding、Reassess、Home、
                            Feedback、Settings
  components/               RatingScale、FactCard、GapIndicator、
                            DiagnosticsPanel、ErrorBoundary
  dev/                      30 天演示数据，仅开发用，被 __DEV__ 包住
```

## 值得知道的约定

大部分是因为出过事才有的。

**API Key 绝不进 SQLite 或日志。** 只走 `services/storage.*`。
Web 上会退化为 `localStorage`，那不是安全存储——Web 版是开发用的，不要填真 Key。

**日期一律用 `utils/date`。** 不要 `new Date().toISOString().split('T')[0]` ——
那是 UTC 日期，东八区凌晨 0-8 点会写成前一天，和界面上显示的对不上。

**对话框走 `utils/dialog`。** `react-native-web` 不实现 `Alert`，
带按钮的调用在浏览器里是彻底的空操作——确认框和错误提示都不会出现。

**长列表用 `FlatList`。** Pro 档位卖的是一年的历史，365 张卡片全量渲染在低端机上看得出来。
表头传**元素**不要传函数——传内联函数会被 React 当成新组件类型，
导致表单输入框每敲一个字就重挂载、焦点丢失。

**Tab 切走后不会卸载。** 需要随别处数据变化刷新的页面用 `useFocusEffect`，不要用 `useEffect`。

**档位窗口必须大于最少证据天数。** 两者相等时用户必须一天不落，
漏一天就重来——新用户第一周会一次反馈都看不到。

**纯逻辑放进零依赖模块**，才能脱离 expo 跑 `npm test`。
引 `i18n/catalog` 而不是 `i18n/index`，后者依赖 `expo-localization`，会让测试挂掉。

**输出 schema 必须同时出现在提示词和校验器里。** 曾经提示词只说「以 JSON 输出」、
校验器却按具体字段检查，模型自己编了字段名，每次分析都失败。

**置信度要调制呈现强度。** 低置信度还打出红色「差距较大」，正是第四条原则禁止的强行下结论。

**改数据流就要改文档。** [privacy.zh-Hans.md](privacy.zh-Hans.md) 和
[data-flow.zh-Hans.md](data-flow.zh-Hans.md) 里点名了具体文件和行为，读者会照着核对。
写得不准比不写更糟。

## 常用命令

```bash
npm install
npx expo start           # 开发服务器，用 Expo Go 扫码
npx expo start --web     # 浏览器（不要加 CI=1，那会禁用 watch mode）
npx tsc --noEmit         # 类型检查
npm test                 # 纯逻辑单测，无需构建
```

Web 依赖 `metro.config.js` 把 `wasm` 登记为资源扩展名，
否则 `expo-sqlite` 的 WASM 构建无法解析。

## 尚未实现

- **内购未接。** 档位目前是本地开关，没有 StoreKit / Play Billing 校验，等同全部免费。
- **SQLite 无迁移机制。** 表用 `CREATE TABLE IF NOT EXISTS` 建，
  已安装的用户不会自动获得新列，加列要写显式迁移。
- **Phase 0 未进行。** 需求里要求的 5-10 人真人验证还没做，材料见
  [phase-0.md](phase-0.md)。在有真实用户反馈之前，加功能都是猜。
