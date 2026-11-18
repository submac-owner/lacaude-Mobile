# lacaude-Mobile

A **BYOK** (bring your own key) mobile chat client that reimplements the core
conversation experience of the Claude Android app, built from REA
(reverse-engineering analysis) of the shipped APK.

> **Not affiliated with Anthropic.** "Claude" is a trademark of Anthropic PBC.
> This project does not ship Anthropic's code, brand fonts, or logos. It is an
> independent, source-available client that talks to **any** LLM provider using
> a key **you** provide.

## Why BYOK

The official app authenticates against an Anthropic account. This client uses
provider API keys instead, so it runs without account auth and is not tied to a
single vendor.

## Providers

One common interface, per-vendor wire adapters, selectable presets:

| Preset | Protocol | Default endpoint |
| --- | --- | --- |
| Anthropic | `/v1/messages` | `https://api.anthropic.com` |
| OpenAI | `/chat/completions` | `https://api.openai.com/v1` |
| Google Gemini | `:streamGenerateContent` | `https://generativelanguage.googleapis.com/v1beta` |
| OpenRouter | OpenAI-compatible | `https://openrouter.ai/api/v1` |
| TokenHarbor | OpenAI-compatible | *supply in Settings* |
| Agnes AI | OpenAI-compatible | *supply in Settings* |
| Custom | OpenAI-compatible | *supply in Settings* |

Presets whose endpoint is not publicly fixed ship blank rather than guessed —
set the base URL and model id in Settings. Any provider also accepts a typed
model id, so a stale preset list never blocks you.

Streaming (SSE) is supported for all three protocol families. Keys are stored
per provider in `expo-secure-store` on device.

## How it was derived

Everything structural comes from REA analysis of the shipped artifact, recorded
under `analysis/`:

- `analysis/00-target.md` — artifact identity, signature, platform, stack
- `analysis/01-design-tokens.md` — measured colors, fonts, icons, copy
- `analysis/tools/` — the scripts that extract icons/brand marks/tokens

Visual values are **measured**, not guessed: e.g. background `#f9f9f7` (light) /
`#151515` (dark), text `#0b0b0b` / `#f0efec`, accent `#d97757`, all from the
app's own resource tables. The 23 `cds_icon_*` vectors and the sunburst mark are
ported programmatically from the artifact's vector drawables.

Values that could not be recovered are labelled *inferred* in the analysis docs
rather than presented as fact.

## Status

- [x] Target acquired and verified (signature + hashes)
- [x] Platform/stack identified (Jetpack Compose + Compose Multiplatform, KMP)
- [x] Design tokens measured (colors, fonts, icons, copy)
- [x] Multi-provider BYOK core with streaming + presets
- [x] Local conversation store (per device)
- [ ] Message markdown/code rendering
- [ ] Typography scale measurement (currently *inferred*)
- [ ] Attachments, voice, artifacts (out of scope for now)

## Layout

```
artifacts/   analyzed target + tools (git-ignored, never redistributed)
analysis/    REA evidence, token measurements, extraction scripts
mobile/      the client (Expo / React Native, TypeScript)
```

## Run

```bash
cd mobile
npm install
npm run web      # or: npm run android / npm run ios
```

Then open Settings, pick a provider, paste a key, and chat.

## Licensing notes

The analyzed app's typefaces (`anthropic_*`, `jetbrains_mono`) are separately
licensed and are **not** included. Drop licensed copies into
`mobile/assets/fonts/` and wire them in `src/theme/ThemeProvider.tsx` to enable;
otherwise the app uses platform fonts. The Claude sunburst and wordmark are
Anthropic trademarks and are used here only as a local placeholder, never as
this project's own identity.
