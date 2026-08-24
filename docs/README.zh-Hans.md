# Narrative Tracker（简体中文）

> [English](../README.md)

**看见你以为的自己，和你真实行动之间的距离。**

一个帮助年轻人用自己提交的事实，校准自我认知的本地 AI 工具。

---

## 核心原则

- **Local-first** — 所有数据存储在你的设备上
- **No server** — 没有后端，没有云数据库
- **No tracking** — 不监控、不截屏、不读取其他 App
- **Bring your own AI key** — 使用你自己的 OpenAI API Key
- **Open source** — 代码完全开源，数据流可验证

## 它是怎么工作的

1. **自我画像** — 首次使用时，回答关于你如何看待自己的问题
2. **事实日志** — 每天花 30-60 秒记录你实际做了什么（和没做什么）
3. **叙事审计** — AI 对比你的自我描述和事实记录，找出：
   - 一致的地方
   - 不一致的地方
   - 可能被你低估的进步
   - 可能被你高估的能力
   - 证据不足、无法判断的地方

## 语言

简体中文 · 繁體中文 · English · 日本語 · 한국어 · Español · Français ·
Deutsch · Tiếng Việt · ภาษาไทย

默认跟随设备语言，可在设置里手动切换。AI 生成的反馈也使用同一种语言。

新增语言只需一个文件：复制 `src/i18n/en.ts` 翻译即可，漏了哪个键编译器会直接报错。

> 中英之外的译文尚未经母语者复核。语气是这个产品的一部分（见 PRD 5.3），
> 欢迎指正。

## 技术栈

- React Native (Expo SDK 57)
- SQLite（本地数据库）
- SecureStore（API Key 安全存储）
- OpenAI-compatible API（用户自带 Key）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npx expo start

# 在 iOS 模拟器运行
npx expo start --ios

# 在 Android 模拟器运行
npx expo start --android
```

## 项目结构

```
src/
  database/        # SQLite 数据库层
  services/        # AI API 调用、Key 管理
  components/      # 通用 UI 组件
  screens/         # 界面
    OnboardingScreen   # 初始自我画像
    HomeScreen         # 事实日志
    FeedbackScreen     # AI 分析报告
    SettingsScreen     # 设置
  store/           # App 状态
  types/           # TypeScript 类型
  constants/       # 问题定义
docs/
  privacy.md       # 隐私策略
  data-flow.md     # 数据流说明
```

## 隐私

我们不拥有你的数据。我们不读取你的其他 App。我们不建立服务器。

详见 [docs/privacy.md](docs/privacy.md) 和 [docs/data-flow.md](docs/data-flow.md)。

## 开源许可

MIT License
