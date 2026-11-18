import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light, type ColorScheme } from './tokens';
import { LOCAL_FONT_FAMILIES } from './fonts.local';

export type SchemePref = 'light' | 'dark' | 'system';

type Ctx = { colors: ColorScheme; isDark: boolean };
const ThemeCtx = createContext<Ctx>({ colors: light, isDark: false });

/**
 * Families resolve to the artifact's typefaces when they have been installed
 * locally (mobile/scripts/install-local-assets.mjs), otherwise to the platform
 * default. The licensed binaries are never part of this repository.
 */
export function familyFor(kind: 'sans' | 'serif' | 'mono'): string | undefined {
  return LOCAL_FONT_FAMILIES[kind];
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
