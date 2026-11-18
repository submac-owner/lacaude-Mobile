import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light, type ColorScheme } from './tokens';

export type SchemePref = 'light' | 'dark' | 'system';

type Ctx = { colors: ColorScheme; isDark: boolean };
const ThemeCtx = createContext<Ctx>({ colors: light, isDark: false });

/**
 * Font loading is intentionally inert: the shipped typefaces are separately
 * licensed and are not redistributed in this repo. To enable them, drop the
 * files into mobile/assets/fonts/ and uncomment the requires below, then set
 * the family to e.g. 'AnthropicSans'.
 */
const FONT_FAMILY = {
  sans: undefined as string | undefined,
  serif: undefined as string | undefined,
  mono: undefined as string | undefined,
};

export const fonts = FONT_FAMILY;

export function familyFor(kind: 'sans' | 'serif' | 'mono'): string | undefined {
  return FONT_FAMILY[kind];
}

export function ThemeProvider({
  pref,
  children,
}: {
  pref: SchemePref;
  children: React.ReactNode;
}) {
  const system = useColorScheme();
  const isDark = pref === 'dark' || (pref === 'system' && system === 'dark');
  const value = useMemo<Ctx>(() => ({ colors: isDark ? dark : light, isDark }), [isDark]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Ctx {
  return useContext(ThemeCtx);
}
