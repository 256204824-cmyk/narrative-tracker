# Narrative Tracker

**See the distance between who you think you are and what you actually do.**

A local-first tool that helps you calibrate your self-image against facts you
choose to submit — nothing else.

[简体中文](docs/README.zh-Hans.md)

---

## Why

Most people aren't lying to themselves on purpose. They just have no steady
feedback loop. So they say things like:

> I'm disciplined. · I've been working hard lately. · I'm bad at socialising.
> · I always procrastinate. · I'm too stressed to get anything done.

Any of those might be true. They might also be a story that hardened years ago
and never got checked. Narrative Tracker doesn't judge you and doesn't watch
you. It takes the facts **you** submit and helps you see:

- What do I think I'm like?
- What did I actually do?
- Do those two agree?
- Where they don't — how far apart are they?

## Principles

These are constraints, not marketing. A feature that violates any of them
does not ship.

1. **No surveillance.** No screenshots, no screen time, no reading other apps,
   no location, no contacts, no health data, no financial data. If a feature
   requires watching you without your say-so, it doesn't get built.
2. **You submit the facts.** The app only analyses what you actively typed and
   actively saved.
3. **The data is yours.** No server, no account, no cloud sync, no cloud
   database. Everything stays on your device, and you can export all of it or
   delete all of it at any time.
4. **The AI is a mirror, not a judge.** Every conclusion must cite a specific
   fact you submitted. When the evidence is thin it has to say so instead of
   reaching. No diagnosing, no shaming, no orders.
5. **Open source so you can verify it.** For a privacy tool, "trust us" isn't
   good enough. Read the code and check that nothing leaves your device.

## How it works

1. **Self-portrait** — answer a few questions about how you see yourself.
   Re-do it whenever you like; every version is kept, because how your story
   changes over time is the point.
2. **Daily facts** — 30–60 seconds. What you actually did, what you planned
   and skipped, what you avoided.
3. **Narrative audit** — when *you* ask for it, the AI compares the two and
   reports where they agree, where they don't, what you may be underrating,
   and what there simply isn't enough evidence to say.

Analysis never runs on its own. You decide when to look.

## Bring your own key

There is no backend. Your requests go straight from your device to whichever
AI provider you configure, using your own API key. The key is stored in the
system keychain (iOS Keychain / Android Keystore) — never in the database,
never in logs, never uploaded.

Any OpenAI-compatible endpoint works, including models running on your own
machine. Point it at `http://localhost:11434/v1` and nothing leaves your LAN
at all.

## Privacy

| Data | Where it lives | Sent to a developer server? |
|---|---|---|
| Self-portraits | Your device | No |
| Fact log | Your device | No |
| AI reports | Your device | No |
| API key | System secure storage | No |

The only outbound network request the app ever makes is the AI analysis call —
to the provider *you* chose, containing only your self-portrait and the fact
log for the window you selected. See [docs/data-flow.md](docs/data-flow.md).

## Languages

简体中文 · 繁體中文 · English · 日本語 · 한국어 · Español · Français ·
Deutsch · Tiếng Việt · ภาษาไทย

Follows your device language by default; switchable in Settings. The AI writes
its reports in the same language.

Adding one is a single file — copy `src/i18n/en.ts`, translate it, and the
compiler will tell you exactly what you missed.

> Translations beyond Chinese and English have not been reviewed by native
> speakers. Tone is part of this product (see PRD §5.3) — corrections are very
> welcome.

## Getting started

```bash
npm install
npx expo start          # scan the QR code with Expo Go
```

No Xcode or Android SDK needed — Expo Go bundles everything this app uses.

```bash
npm test                # pure-logic unit tests, no build step
npx tsc --noEmit        # type check
```

## Tech

React Native (Expo SDK 57) · TypeScript · SQLite (`expo-sqlite`) ·
`expo-secure-store` · OpenAI-compatible API

## Status

The local loop works end to end. **Phase 0 — the 5–10 person manual
validation the PRD asks for — has not happened yet**, and until it does no
new features should be added. Materials for running it are in
[docs/phase-0.md](docs/phase-0.md).

Not built yet: in-app purchases (tiers are currently a free local toggle) and
SQLite migrations.

## Docs

- [Product requirements](docs/product-requirements.md) (Chinese, v2.0 — the
  authoritative spec)
- [Privacy policy](docs/privacy.md)
- [Data flow](docs/data-flow.md)
- [Phase 0 materials](docs/phase-0.md)

## Licence

MIT
