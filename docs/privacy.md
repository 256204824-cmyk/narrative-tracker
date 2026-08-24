# Privacy Policy

> [简体中文](privacy.zh-Hans.md)

## The promise

We do not own your data. We do not read your other apps. We do not take
screenshots. We run no server that holds your private data. We analyse only
what you choose to submit.

## What the app stores

| Data | What it is |
|---|---|
| Self-portraits | Your own ratings and short answers about how you see yourself. Every version is kept. |
| Fact log | The daily entries you type and save |
| Reports | Narrative-audit results generated from the two above |
| API key | The third-party AI key you choose to provide |
| Preferences | Interface language, report range (tier), provider base URL and model name |

## What the app never collects

- Screen time
- Data from any other app
- Location
- Contacts
- Health data
- Financial data
- Browser history
- Screenshots
- Any background activity

There is no telemetry, no analytics SDK, no crash reporting, no advertising
SDK, and no user identifier of any kind. The app does not know who you are
because there is nothing to know — there is no account.

## Where it is stored

**Everything stays on your device.**

- Entries, portraits and reports: a SQLite database in the app's own storage
- API key and preferences: the system secure store — iOS Keychain, Android
  Keystore

**We operate no server.** There is nothing to breach, subpoena, or sell,
because there is nothing on our side at all.

> **A caveat about the web build.** When run in a browser (development only),
> the secure store falls back to `localStorage`, which is *not* secure
> storage. The web build is for development and is not the shipping form of
> this app. Do not put a real API key into it.

## What leaves your device, and when

Exactly one outbound request exists in the whole app: the AI analysis call.
It happens **only when you tap "Generate report"** — never on a timer, never
in the background, never at launch.

It goes to **the endpoint you configured yourself** (Settings → AI provider;
OpenAI by default). If you point it at a model running on your own machine,
nothing leaves your network at all.

The request contains:

- Your current self-portrait: four ratings, plus your three short answers
- Up to five earlier portrait versions: their ratings, dates and three-word
  descriptions
- Your fact-log entries within the range you selected — dates, tags, and the
  text you wrote
- Counts derived from the above: how many days have entries, how many entries
  per topic

That is all. It is a subset of what you typed. There is no device identifier,
no account, no metadata about you.

Your API key travels in the `Authorization` header of that same request,
straight from your device to your provider. **It never passes through any
server of ours, because we do not have one.**

Your chosen provider will see this content and handles it under **their**
privacy policy, not ours. Choosing a provider is choosing who to trust with
that payload — please read theirs.

## What you can do

At any time you can:

- See every piece of data the app holds
- Export all of it as a JSON file
- Import a previously exported file — this **replaces** everything currently
  on the device
- Delete all local data permanently, which also returns the app to its first
  self-portrait
- Change or remove your API key
- Simply never generate a report, in which case the app makes no network
  requests at all

Deleting local data cannot be undone. Export a backup first if you may want
it later.

## Children

This app is not directed at children under 13.

## Verifying any of this

You do not have to take our word for it — that is the point of the app being
open source. See [data-flow.md](data-flow.md) for exactly which lines of code
to read and how to confirm with a network proxy.

## Contact

Open an issue on GitHub.

---

Last updated: 2026-08-24
