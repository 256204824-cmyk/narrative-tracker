# Architecture

> [简体中文](architecture.zh-Hans.md)

Everything runs on the device. There is no server, no account, and no build
step beyond Expo. If you are looking for the privacy claims and how to verify
them, read [data-flow.md](data-flow.md) first — this document is about how the
code is laid out.

## Non-negotiables

These come from the [product requirements](product-requirements.md) and are
constraints, not preferences. A change that violates any of them should not be
merged.

1. **No surveillance.** No screenshots, screen time, other apps, location,
   contacts, health or financial data. If a feature needs to watch the user
   without being asked, it does not get built.
2. **Facts are submitted, never collected.** The app analyses only what the
   user actively typed and saved.
3. **The data belongs to the user.** No server, no account, no cloud sync.
   Everything local, always exportable, always deletable.
4. **The AI is a mirror, not a judge.** Every conclusion must cite a specific
   fact the user submitted. When evidence is thin it must say so rather than
   reach. No diagnosing, shaming, or commanding.
5. **Open source so it can be verified.** A reader should be able to confirm
   from the code that nothing is uploaded.

## Layout

```
App.tsx                     navigation (bottom tabs), wrapped in ErrorBoundary
src/
  types/index.ts            every domain type; start here when changing data shapes
  database/index.ts         SQLite. Three tables: self_portraits / fact_logs /
                            analysis_results. All SQL lives here — screens never
                            write SQL, so this file is the complete list of what
                            can be stored.
  services/
    index.ts                API key storage + the analysis request
    analysisPrompt.ts       system prompt and the output schema
    analysisShape.ts        field-by-field validation of what the model returns
    provider.ts             base URL / model settings
    providerUrl.ts          URL normalisation and checks
    providerPresets.ts      built-in providers, sorted by privacy
    storage.native.ts       keys via expo-secure-store (Keychain / Keystore)
    storage.ts              web fallback via localStorage (development only)
  i18n/
    zhHans.ts               Simplified Chinese — the single source of truth
    <locale>.ts             nine more languages, each typed against it
    catalog.ts              message lookup + active locale (no native deps)
    index.ts                catalog re-export + device locale detection
  constants/
    questions.ts            question ids, tier windows, tag mapping
    format.ts               export format version
  utils/
    date.ts                 local-timezone dates
    dialog.*.ts             alerts (native vs web)
    readTextFile.*.ts       reading a picked file
    saveTextFile.*.ts       writing an export
    importValidation.ts     field-by-field validation of imported files
  store/AppContext.tsx      key / tier / locale / onboarding state
  screens/                  SelfPortraitForm, Onboarding, Reassess, Home,
                            Feedback, Settings
  components/               RatingScale, FactCard, GapIndicator,
                            DiagnosticsPanel, ErrorBoundary
  dev/                      30-day demo data. Dev-only: metro.config.js swaps
                            seed.ts for a stub in production builds, because
                            Metro has no code splitting — __DEV__ and dynamic
                            import() both leave it in the bundle.
```

## Conventions worth knowing

Most of these exist because something broke once.

**The API key never touches SQLite or logs.** Only `services/storage.*`. On
web it falls back to `localStorage`, which is not secure storage — the web
build is for development, not for real keys.

**Dates come from `utils/date`.** Never
`new Date().toISOString().split('T')[0]` — that is a UTC date, and in UTC+8 it
writes yesterday's date between midnight and 8am, which then disagrees with
what the screen shows.

**Alerts go through `utils/dialog`.** `react-native-web` does not implement
`Alert`, so a call with buttons is a silent no-op in the browser — no confirm
dialog, no error message.

**Long lists use `FlatList`.** The Pro tier sells a year of history; rendering
365 cards at once is visible on a low-end phone. Pass the header as an
*element*, not a function — an inline function is treated as a new component
type on every render, which remounts the form inputs and drops focus mid-word.

**Tabs stay mounted when you switch away.** Anything that must reflect data
changed elsewhere uses `useFocusEffect`, not `useEffect`.

**Tier windows must exceed the minimum evidence requirement.** If they are
equal, a user has to log every single day without a miss, and one gap resets
them — new users would see no feedback at all in their first week.

**Pure logic lives in dependency-free modules** so it can run under `npm test`
without expo. Import `i18n/catalog`, not `i18n/index` — the latter pulls in
`expo-localization` and breaks the test runner.

**The output schema must appear in both the prompt and the validator.** Once
the prompt only said "reply in JSON" while the validator checked specific
fields; the model invented its own names and every report failed.

**Confidence modulates presentation.** A red "large gap" verdict on low
confidence is exactly the overreach the fourth principle forbids.

**Changing the data flow means updating the docs.**
[privacy.md](privacy.md) and [data-flow.md](data-flow.md) name specific files
and behaviours, and readers check them. Being inaccurate there is worse than
saying nothing.

## Phase 0 test builds

`src/services/bundledProvider.ts` supports a build flavour for handing the app
to testers: set `EXPO_PUBLIC_BUNDLED_AI_KEY` at build time and the app locks
the provider to a fixed endpoint, uses that key, and hides the API-key and
provider sections entirely. Leave it unset (the normal case) and nothing
changes — users bring their own key and pick their own provider.

The key is injected from a gitignored `.env`, never committed. Note that an
APK is a zip: anyone holding the file can extract the key. Use a dedicated key
with a spending limit and revoke it when the trial ends.

## Commands

```bash
npm install
npx expo start           # dev server; scan with Expo Go
npx expo start --web     # browser (do not set CI=1 — it disables watch mode)
npx tsc --noEmit         # type check
npm test                 # pure-logic unit tests, no build step
```

Web needs `metro.config.js` to register `wasm` as an asset extension,
otherwise `expo-sqlite`'s WASM build fails to resolve.

## Not built yet

- **In-app purchases.** Tiers are currently a local toggle with no StoreKit or
  Play Billing check — effectively every tier is free.
- **SQLite migrations.** Tables are created with `CREATE TABLE IF NOT EXISTS`,
  so existing installs will not pick up new columns without an explicit
  migration.
- **Phase 0.** The 5–10 person manual validation the requirements ask for has
  not happened. Materials are in [phase-0.md](phase-0.md). Until there is real
  user feedback, adding features is guesswork.
