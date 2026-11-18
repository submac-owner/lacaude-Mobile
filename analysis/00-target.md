# 00 — Target artifact

Everything below is **observed** from the shipped artifact via REA unless marked
*inference*.

## Sample under analysis

| Field | Value |
| --- | --- |
| Distribution | XAPK bundle: `claude-1-261116-19.xapk` (38.42 MB), SHA-256 `660F32F317E501DD6E240F0D72682D337B5A776DF59FDB95B418FFE5597213AE` |
| Base APK | `com.anthropic.claude.apk` (60,695,281 bytes) |
| Base APK SHA-256 | `d4caca5567cd72bdba6e2abc97047b5906180b9266d111a7cedd74db04859a0b` |
| Package | `com.anthropic.claude` |
| versionName / versionCode | `1.261116.19` / `26111619` |
| minSdk / targetSdk / compileSdk | 32 / 37 / 37 |
| ABI splits | `arm64-v8a` (5.9 MB), `armeabi-v7a` (4.2 MB) |
| Language splits | 25 locales |
| Density splits | mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi, tvdpi |
| Entry activity | `com.anthropic.claude.mainactivity.MainActivity` |

## Signing posture (REA `inspect_apk_signature`, evidence `ev_7d4e758e…`)

- Schemes present: **v2 and v3** (no v1, no v3.1), 1 signer each, agreeing.
- Signer certificate SHA-256: `305a1e8a432e5ec0c612b2465359c3b88e3c95d6253599ac6088562b818b64a0`
- Google Play **source stamp** present (cert `3257d599a49d2c961a471ca9843f59d341a405884583fc087df4237b733bbd6d`).
- `self_consistent: true`, no rotation lineage.
- **Caveat:** signatures are *not* cryptographically verified by REA; this records declared
  identity and self-consistency only — not authenticity.

## Platform / stack (observed)

- **Jetpack Compose + Compose Multiplatform.** Evidence:
  `assets/composeResources/claude.theme.generated.resources/` (the CMP resource
  layout) — the UI and theme live in a shared Kotlin module named `claude.theme`.
- **Kotlin Multiplatform shared core.** Native libs in the `arm64-v8a` split:

  | Library | Implied subsystem |
  | --- | --- |
  | `libsqliteJni.so` | SQLDelight (shared local DB) |
  | `libdatastore_shared_counter.so` | AndroidX DataStore |
  | `libandroidmath.so` | LaTeX/math rendering |
  | `libvoiceclient.so`, `libvoice_io.so`, `libopus_jni.so`, `libwebrtc_apm.so` | Voice mode |
  | `libsentry.so`, `libsentry-android.so` | Sentry crash reporting |

- **Design system named `cds`** ("Claude Design System"): icon font
  `assets/cds_icon_symbols.ttf` (324.9 KB) + 24 `cds_icon_*` vector drawables.
- **Syntax highlighting**: `assets/pegasus/*.peg` grammars (bash, c, cpp, css,
  dart, diff, go, graphql, handlebars, java, javascript, json, kotlin, less,
  lua, makefile, markdown, objectivec, perl, php, powershell, python, r, ruby,
  rust, scss, sql, swift, typescript, xml, yaml).
- **Math**: `assets/fonts/trimmed-math.otf` (411 KB, Latin Modern Math).
- **Markdown/analytics**: `assets/datadog.buildId`, `assets/sentry-debug-meta.properties`.
- **Widgets**: Jetpack Glance (`res/layout/glance_*`, `res/xml/claude_appwidget_info*.xml`).

## Brand fonts present in the artifact

Under `assets/composeResources/claude.theme.generated.resources/font/`:

| File | Size |
| --- | --- |
| `anthropic_sans.ttf` | 335.1 KB |
| `anthropic_sans_italic.ttf` | 304.2 KB |
| `anthropic_serif.ttf` | 804.9 KB |
| `anthropic_serif_italic.ttf` | 90.7 KB |
| `jetbrains_mono.ttf` | 296.0 KB |

*These are separately-licensed typefaces. They are measured for the type scale
but **not** redistributed in this repository.*

## Motion / signature assets

- `claude_spark_animated_shimmer.xml`, `..._thinking.xml`, `..._writing.xml`
- `res/drawable-anydpi-v21/claude_spark_{shimmer,thinking,writing}{1..8}.xml`
- `res/drawable/claude_spark_icon.xml`
- `res/raw/cds_pictogram_quill_frames.json` (quill loading pictogram)
- `res/interpolator/cds_ease_out.xml`

## Manifest component inventory (REA `inspect_android_package`)

Notable non-`androidx` components:

| Kind | Name |
| --- | --- |
| activity | `mainactivity.MainActivity` (LAUNCHER) |
| activity | `mainactivity.AssistantOverlayActivity` (`ASSIST`, `VOICE_ASSIST`) |
| activity | `mainactivity.AppOnlyAssistantOverlay` (alias) |
| activity | `artifactapp.ArtifactAppActivity` |
| activity | `notification.NotificationAnswerActivity` |
| activity | `deeplink.DeepLinkActivity` (SEND / SEND_MULTIPLE / PROCESS_TEXT) |
| activity | `deeplink.NewWindowActivity`, `deeplink.CallWindowActivity` |
| activity-alias | `deeplink.OpenWithClaude` |
| activity | `deeplink.PasswordManagerReturnActivity` (declared `enabled=false`) |
| provider | `androidx.startup.InitializationProvider` → `…personalfinance.plaidscreens.PlaidWindowsStartup` |

- Deep-link hosts declared: `claude.ai`, `claude-ai.staging.ant.dev`.
- Shared file types: images, pdf, rtf, epub, docx, doc, odt, xlsx, xls, pptx,
  ipynb, json, xml, yaml, js, sh, zip, video, audio.
- Health Connect read permissions (~50 metrics) → Health connector surface.
- `com.android.vending.BILLING` + `play-services-*` + `firebase-*` → Play
  billing + push.

## Evidence references

| Evidence id | Operation |
| --- | --- |
| `ev_7d4e758e33b093b3b5ed68daf25b220429f9d7f953d4ca060d045c189aa67217` | `inspect_apk_signature` |
| `ev_73f8772ea6ab521ac9c5663f97bc9ad73790f094c288ae743771fb091e46657c` | `inspect_android_package` |
| `ev_1866777ffb2244401cad16761cd8bab51660e5011451c96d27f41d4b2facb6a1` | `search_android_classes` |
| `ev_2cc8a9377dea77ea9b07c4ec87fd55b8b73b93d1467c5cd2a1b6811e6132505f` | class inventory (56,954 top-level classes) |

## Known unknowns

- UI class names are **R8-obfuscated** (`…ui.coil.a`, `…error.a`, …), so the
  Compose screen tree cannot be recovered by name; layout must be measured from
  composable behaviour/assets, not identifiers.
- Compose theme **values** (colors, type scale) are Kotlin constants, not
  `res/` resources — recovering them requires reading decompiled constants.
