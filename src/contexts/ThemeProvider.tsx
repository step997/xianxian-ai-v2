import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import type { ThemeContextValue } from './ThemeContext';
import type { Theme } from '../types/theme';
import { getTheme, setTheme as saveTheme } from '../utils/storage';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = getTheme();
    if (saved === 'dark' || saved === 'light' || saved === 'blue') return saved;
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) =>
      prev === 'dark' ? 'light' : prev === 'light' ? 'blue' : 'dark'
    );
  }, []);

  const value: ThemeContextValue = { theme, setTheme, cycleTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
