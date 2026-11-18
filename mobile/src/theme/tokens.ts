/**
 * Design tokens for lacaude-Mobile.
 *
 * MEASURED from the analyzed artifact (com.anthropic.claude 1.261116.19).
 * See analysis/01-design-tokens.md for per-value provenance and resource ids.
 * Values marked [inferred] are placeholders pending measurement.
 */

export type ColorScheme = {
  bg: string;
  bgSubtle: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentStrong: string;
  onAccent: string;
  scrim: string;
  brandCream: string;
  brandInk: string;
  danger: string;
};

export const light: ColorScheme = {
  bg: '#f9f9f7',          // 0x7f060034
  bgSubtle: '#f0efec',    // 0x7f060021
  surface: '#ffffff',     // 0x7f060035
  surfaceAlt: '#f3f3f0',  // 0x7f06003f
  border: '#e7e6e1',      // 0x7f060044
  text: '#0b0b0b',        // 0x7f060036
  textMuted: '#7b7974',   // 0x7f060038 / 0x7f060039
  accent: '#d97757',      // 0x7f060037
  accentStrong: '#ba5b3c',// 0x7f06003a
  onAccent: '#ffffff',
  scrim: 'rgba(41,38,27,0.10)', // 0x1a29261b
  brandCream: '#faf9f5',  // 0x7f0605cc
  brandInk: '#141413',    // 0x7f0605cd
  danger: '#d93025',      // 0x7f06002f
};

export const dark: ColorScheme = {
  bg: '#151515',
  bgSubtle: '#0d0d0d',
  surface: '#20201f',
  surfaceAlt: '#1a1a19',
  border: '#313130',
  text: '#f0efec',
  textMuted: '#97958d',
  accent: '#d97757',
  accentStrong: '#d97757',
  onAccent: '#ffffff',
  scrim: 'rgba(245,244,239,0.25)', // 0x40f5f4ef
  brandCream: '#faf9f5',
  brandInk: '#f9f9f7',    // 0x7f0605d4 dark value
  danger: '#d93025',
};

/** Neutral ramp — from o30/v (see doc). */
export const neutralRamp = [
  '#ffffff', '#fcfcfc', '#f9f9f9', '#f3f3f3', '#efefef', '#ececec', '#e6e6e6',
  '#e0e0e0', '#d1d1d1', '#c2c2c2', '#b3b3b3', '#a4a4a4', '#959595', '#878787',
  '#797979', '#6b6b6b', '#5e5e5e', '#515151', '#444444', '#383838', '#2c2c2c',
  '#202020', '#1e1e1e', '#1a1a1a', '#151515', '#131313', '#111111', '#0d0d0d',
  '#0b0b0b',
] as const;

/**
 * Type scale. [inferred] — Compose symbols are R8-obfuscated so sizes were not
 * recoverable by name; families ARE measured (see FONTS).
 */
export const type = {
  display: { size: 28, lineHeight: 34, weight: '400' as const, family: 'serif' as const },
  title: { size: 20, lineHeight: 26, weight: '600' as const, family: 'sans' as const },
  body: { size: 17, lineHeight: 24, weight: '400' as const, family: 'sans' as const },
  label: { size: 14, lineHeight: 20, weight: '500' as const, family: 'sans' as const },
  caption: { size: 13, lineHeight: 18, weight: '400' as const, family: 'sans' as const },
  code: { size: 14, lineHeight: 21, weight: '400' as const, family: 'mono' as const },
};

/** Spacing steps observed in res/values/dimens.xml. */
export const space = { xs: 2, sm: 4, md: 6, lg: 8, xl: 12, xxl: 16, xxxl: 24 } as const;
export const radius = { xs: 2, sm: 4, md: 8, lg: 12, xl: 14, pill: 999 } as const;

/**
 * Font faces shipped in the artifact under
 * assets/composeResources/claude.theme.generated.resources/font/.
 * These are separately-licensed typefaces; they are NOT redistributed here.
 * Drop licensed copies into mobile/assets/fonts/ to enable, otherwise the app
 * falls back to platform fonts (which is what the preview does).
 */
export const FONT_FILES = {
  sans: 'anthropic_sans.ttf',
  sansItalic: 'anthropic_sans_italic.ttf',
  serif: 'anthropic_serif.ttf',
  serifItalic: 'anthropic_serif_italic.ttf',
  mono: 'jetbrains_mono.ttf',
} as const;

/** Measured UI copy (res/values/strings.xml). */
export const copy = {
  composerPlaceholder: 'Ask anything.',
  replyPlaceholder: 'Reply.',
  send: 'Send',
  sendMessage: 'Send message',
  sendFailed: 'Failed to send message',
  retryHint: 'Send a new message to retry.',
  queued: 'Message queued - waiting for assistant',
  appLabel: 'Claude',
} as const;
