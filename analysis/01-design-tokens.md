# 01 — Design tokens (measured)

All values below are **observed** from the artifact (resource tables + decoded
smali constants) unless a row says *inferred*.

## 1. Semantic color tokens (light / dark)

Source: `res/values/colors.xml` and `res/values-night/colors.xml`, the same
resource id with different values. Resource names were collapsed by
`aapt2 optimize --collapse-resource-names`, so the ids are the identity.

| Token (assigned) | Light | Dark | Resource id |
| --- | --- | --- | --- |
| `bg` | `#f9f9f7` | `#151515` | `0x7f060034` |
| `bgSubtle` | `#f0efec` | `#0d0d0d` | `0x7f060021` |
| `surface` | `#ffffff` | `#20201f` | `0x7f060035` |
| `surfaceAlt` | `#f3f3f0` | `#1a1a19` | `0x7f06003f` |
| `border` | `#e7e6e1` | `#313130` | `0x7f060044` |
| `text` | `#0b0b0b` | `#f0efec` | `0x7f060036` |
| `textMuted` | `#7b7974` | `#97958d` | `0x7f060038`, `0x7f060039` |
| `accent` | `#d97757` | `#d97757` | `0x7f060037` |
| `accentStrong` | `#ba5b3c` | `#d97757` | `0x7f06003a` |
| `scrim` | `#1a29261b` | `#40f5f4ef` | `0x7f06003b` |

Brand block (used by splash/branding):

| Token | Value | Resource id |
| --- | --- | --- |
| `brandCream` | `#faf9f5` | `0x7f0605cc` |
| `brandInk` | `#141413` | `0x7f0605cd` |
| `brandInkAlt` | `#131313` | `0x7f0605d4` |

> `#faf9f5` / `#141413` / `#d97757` are the same anchors used across Anthropic's
> product surfaces; their presence here is observed, not assumed.

## 2. Color primitives (the "ramp" system)

Source: `smali/o30/v.smali` — an abstract class of **146 `static final long`**
fields (`A…Z`, `a…z`, `A0…`, `a0…`, `A1…`, `z1…`) holding Compose packed colors.
145 are initialised. These are the raw scales the semantic tokens draw from.

**Warm neutral ramp** (the Claude greys): `#fcfcfc #f9f9f9 #f6f6f4 #f3f3f3
#f3f3f0 #f0efec #efefef #edece8 #ececec #eae9e4 #e7e6e1 #e6e6e6 #e4e3dd
#e3e3e3 #e1e0d9 #e0e0e0 #d2d1c7 #d1d1d1 #c3c2b7 #c2c2c2 #b4b3a8 #b3b3b3
#a5a49a #a4a4a4 #97958d #959595 #898781 #878787 #7b7974 #797979 #6b6b6b
#5e5e5e #515151 #444444 #383838 #2c2c2c #202020 #1e1e1e #1a1a1a #151515
#131313 #111111 #0d0d0d #0b0b0b #ffffff`

**Clay / accent ramp**: `#f6b293 #f18a59 #f47230 #e76624 #d25f25 #ba5b3c #90370f
#632508 #391406` + anchor `#d97757`

Other hue ramps present (red, yellow/amber, green, teal, blue, purple, pink) with
values in the same file.

## 3. Typography

**Font families — observed** (Compose Multiplatform resources, wire names from
`smali/cu/g0.smali` and `smali/dd/a.smali`):

| Wire name | File in artifact | Size |
| --- | --- | --- |
| `anthropic_sans` | `…/font/anthropic_sans.ttf` | 335.1 KB |
| `anthropic_sans_italic` | `…/font/anthropic_sans_italic.ttf` | 304.2 KB |
| `anthropic_serif` | `…/font/anthropic_serif.ttf` | 804.9 KB |
| `anthropic_serif_italic` | `…/font/anthropic_serif_italic.ttf` | 90.7 KB |
| `jetbrains_mono` | `…/font/jetbrains_mono.ttf` | 296.0 KB |

There is a single family of 5 faces, exposed as lazy resources in `dd/a` (indices
`0x14`–`0x18`).

**Size scale — inferred.** R8 renamed every Compose class (`androidx.compose.ui.text.*`
is gone; only 53 files still name `androidx/compose/*`), so `TextStyle`/`TextUnit`
constructors carry no recoverable identity, and no `.sp` table is present as a
literal cluster. The scale below is a *placeholder* to be replaced once measured:

| Role | Size / line | Weight | Face |
| --- | --- | --- | --- |
| `display` | 28 / 34 | 400 | serif |
| `title` | 20 / 26 | 600 | sans |
| `body` | 17 / 24 | 400 | sans |
| `label` | 14 / 20 | 500 | sans |
| `caption` | 13 / 18 | 400 | sans |
| `code` | 14 / 21 | 400 | mono |

## 4. Shape / motion

| Token | Value | Source |
| --- | --- | --- |
| Corner radii | 2, 4, 6, 8, 12, 14 dp present in `res/values/dimens.xml` | observed |
| Standard spacing steps | 2, 4, 6, 8, 12, 14, 16, 24 dp | observed (`dimens.xml`) |
| Dialog exit | `res/anim/cds_dialog_window_exit.xml` | observed |
| Easing | `res/interpolator/cds_ease_out.xml` | observed |

## 5. Iconography — observed

`assets/cds_icon_symbols.ttf` (324.9 KB icon font) plus 23 monochrome 20×20
vector drawables:

`arrow_clockwise, artifacts, camera, caret_right, chat, chats, code, create,
dispatch, file, globe, image, microphone, microphone_slash, pause_filled,
play_filled, projects, scroll, search, shapes, stop_filled, tasks, voice`

All 23 are ported losslessly to `mobile/src/components/icons.generated.ts`
(see `analysis/tools/gen-icons.mjs`).

## 6. Brand marks

- `res/drawable/logo_claude_splash.xml` — the Claude **sunburst** mark, fill `#d97757`.
- `res/drawable/branding_claude_splash.xml` — the "Claude" **wordmark**, fill `#7b7974`.
- `claude_spark_animated_{shimmer,thinking,writing}.xml` + `…{1..8}.xml` frames —
  the animated thinking indicator.
- `res/raw/cds_pictogram_quill_frames.json` — quill pictogram frames.

> The wordmark/logo are Anthropic **trademarks**. This repo reproduces the
> sunburst only as a local placeholder and does not present the wordmark as its
> own identity.

## 7. Copy — observed

From `res/values/strings.xml` (7,490 entries):

| Purpose | Value |
| --- | --- |
| Composer placeholder | `Ask anything.` |
| Reply placeholder | `Reply.` |
| Send button label | `Send` / `Send message` |
| Send failure | `Failed to send message` |
| Retry hint | `Send a new message to retry.` |
| Queued | `Message queued - waiting for assistant` |
| App label | `Claude` |

Most-referenced strings in code: `Something went wrong` (45), `Loading` (45),
`Cancel` (37), `Open menu` (35), `Retry` (34), `Try again` (32), `Untitled` (29).

## 8. Still unknown (explicit)

- Compose screen composition and exact paddings (all symbols obfuscated).
- Assistant/user bubble fills and message radius (not in reachable resources).
- Exact `TextStyle` sizes/weights/line-heights.
- The chat rendering pipeline (whether assistant markdown is rendered by a
  native Compose renderer or an embedded view engine).
