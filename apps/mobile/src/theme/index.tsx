import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ColorScheme, Theme } from './tokens';
import { createTheme } from './tokens';

export * from './tokens';
export * from './typography';

interface ThemeContextValue {
  theme: Theme;
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
  toggleScheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialScheme = 'dark',
}: {
  children: React.ReactNode;
  initialScheme?: ColorScheme;
}) {
  // Dark-first by design. The salon chair area is dim, phones are held low,
  // and a bright white screen reads as glare. Light mode exists, it is not the default.
  const [scheme, setScheme] = useState<ColorScheme>(initialScheme);
  const theme = useMemo(() => createTheme(scheme), [scheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      scheme,
      setScheme,
      toggleScheme: () => setScheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme, scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

export function useColorSchemeController() {
  const { scheme, setScheme, toggleScheme } = useThemeContext();
  return { scheme, setScheme, toggleScheme };
}
