# Data Flow

> [简体中文](data-flow.zh-Hans.md)

This document exists so you can **check the privacy claims yourself** instead
of believing them. It names the exact files to read.

## Overview

Narrative Tracker runs entirely on your device. There is no developer server.

```
┌─────────────────────────── your device ───────────────────────────┐
│                                                                   │
│   self-portraits ─┐                                               │
│   fact log ───────┼──▶  SQLite  (app-private storage)             │
│   reports ────────┘         │                                     │
│                             │  read only when you tap             │
│                             │  "Generate report"                  │
│                             ▼                                     │
│                      build the prompt                             │
│                             │                                     │
│   API key ──────────────────┤                                     │
│   (Keychain / Keystore)     │                                     │
│                             │                                     │
└─────────────────────────────┼─────────────────────────────────────┘
                              │  HTTPS, direct
                              ▼
                  the endpoint YOU configured
                  (OpenAI by default; can be
                   a model on your own machine)

                  ── no developer server anywhere in this diagram ──
```

There is no "local analysis engine". The comparison is done by the model you
chose. The app's job is to decide **what is allowed into the prompt** and to
validate what comes back.

## The four flows

### 1. Writing data — never touches the network

```
you type  →  validate  →  SQLite INSERT  →  done
```

`src/database/index.ts` holds every SQL statement in the app. Screens never
write SQL directly, so this one file is the complete list of what can be
stored.

### 2. Generating a report — the only outbound request

```
you tap "Generate report"
  → read the self-portrait versions from SQLite
  → read fact-log rows inside the selected date range
  → derive coverage counts (days with entries, entries per topic)
  → read the API key from Keychain / Keystore
  → build the prompt
  → HTTPS POST to the base URL you configured
  → validate the response against the expected schema
  → write the report to SQLite
```

Read `requestAnalysis` in `src/services/index.ts`. It contains the only
`fetch` that talks to a network. The prompt is assembled by
`buildAnalysisPrompt` in the same file, and the fixed instructions live in
`src/services/analysisPrompt.ts` — both are plain text you can read end to
end.

> Grepping for `fetch` finds a second hit, in `src/utils/readTextFile.ts`.
> That one is the **web-only** file reader: browsers hand a picked file to the
> page as a `blob:` or `data:` URI, and `fetch` is how you read such a URI.
> It reaches no network and does not exist in the native build, which uses
> `expo-file-system` instead (`readTextFile.native.ts`). We mention it here so
> that finding it does not look like something we hid.

Key points:

- The request is sent by your device, straight to your provider
- The API key rides in the `Authorization` header of that request
- **There is no developer server that could intercept it**
- The body contains only data you typed, plus counts derived from it

### 3. Export and import

```
export:  SQLite  →  JSON  →  a file  →  system share sheet
import:  file  →  validate every field  →  single transaction  →  SQLite
```

Import **replaces** everything on the device and runs inside one transaction:
if any row fails, the whole thing rolls back, so you can never end up with the
old data deleted and the new data half-written. Validation lives in
`src/utils/importValidation.ts`.

### 4. Deleting everything

```
you tap "Delete all local data"
  → confirmation
  → DELETE FROM every table
  → clear the onboarding flag, returning the app to the first self-portrait
```

Not recoverable. Export first if you might want it back.

## Network request checklist

The complete list of requests this app can make:

| Request | Destination | Trigger | Payload |
|---|---|---|---|
| AI analysis | the base URL in Settings | you tap the button | portrait versions, fact-log rows in range, derived counts |

Requests this app does **not** make:

- ❌ Uploading your data anywhere
- ❌ Telemetry or analytics
- ❌ Crash reporting
- ❌ Behavioural tracking
- ❌ Advertising SDKs
- ❌ Update or licence checks
- ❌ Anything at all on launch, on a timer, or in the background

## How to verify

**Read four files.** They are short.

1. `src/services/index.ts` — search for `fetch`. Exactly one network call.
   (A second `fetch` lives in `src/utils/readTextFile.ts`; it reads a
   `blob:`/`data:` URI in the web build and touches no network — see above.)
2. `src/services/analysisPrompt.ts` — the fixed instructions sent to the model.
3. `src/database/index.ts` — every SQL statement in the app.
4. `package.json` — the dependency list. No analytics, no crash reporter, no
   ad SDK.

**Then confirm at runtime.** Point a proxy (Charles, Proxyman, mitmproxy) at
the device and use the app normally. You should see zero traffic until you tap
"Generate report", and then exactly one request — to the endpoint you set.

**Or remove the variable entirely.** Set the provider base URL to a model
running on your own machine (for example `http://localhost:11434/v1`). Then
nothing leaves your network, and the privacy question is settled by
construction rather than by trust.
