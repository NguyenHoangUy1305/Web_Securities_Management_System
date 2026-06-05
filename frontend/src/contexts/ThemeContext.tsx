import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface ThemeColors {
  primaryColor: string;
  bgColor: string;
  cardBgColor: string;
  textColor: string;
  accentColor: string;
}

interface LayoutSettings {
  sidebarWidth: 'narrow' | 'medium' | 'wide';
  fontSize: 'small' | 'medium' | 'large';
  roundedCorners: boolean;
  animations: boolean;
}

export interface ThemeSettings extends ThemeColors, LayoutSettings {}

interface ThemeContextType extends ThemeSettings {
  updateTheme: (settings: Partial<ThemeSettings>) => void;
  resetTheme: () => void;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#2563eb',   // blue-600
  bgColor: '#030712',        // gray-950
  cardBgColor: '#111827',    // gray-900
  textColor: '#ffffff',      // white
  accentColor: '#3b82f6',    // blue-500
  sidebarWidth: 'medium',
  fontSize: 'medium',
  roundedCorners: true,
  animations: true,
};

const STORAGE_KEY = 'app_theme';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function loadTheme(): ThemeSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ThemeSettings>;
      return { ...DEFAULT_THEME, ...parsed };
    }
  } catch {
    // Ignore corrupt data, fall through to defaults
  }
  return DEFAULT_THEME;
}

function applyCSSVars(theme: ThemeColors): void {
  const root = document.documentElement.style;
  root.setProperty('--color-primary', theme.primaryColor);
  root.setProperty('--color-bg', theme.bgColor);
  root.setProperty('--color-card', theme.cardBgColor);
  root.setProperty('--color-text', theme.textColor);
  root.setProperty('--color-accent', theme.accentColor);

  // Apply to body directly
  document.body.style.backgroundColor = theme.bgColor;
  document.body.style.color = theme.textColor;
}

function injectThemeStyles(theme: ThemeSettings): void {
  const existingId = 'theme-custom-styles';
  const existing = document.getElementById(existingId);
  if (existing) existing.remove();

  const fontSizeMap = { small: '14px', medium: '16px', large: '18px' };
  const sidebarWidthMap = { narrow: '48px', medium: '64px', wide: '80px' };

  const style = document.createElement('style');
  style.id = existingId;
  style.textContent = `
    body { font-size: ${fontSizeMap[theme.fontSize]} !important; }
    .sidebar-bg { background-color: ${theme.bgColor} !important; }
    .card-bg { background-color: ${theme.cardBgColor} !important; }
    .btn-primary { background-color: ${theme.primaryColor} !important; }
    .btn-primary:hover { opacity: 0.9; }
    .text-primary { color: ${theme.primaryColor} !important; }
    .border-primary { border-color: ${theme.primaryColor} !important; }
    *:focus-visible { outline-color: ${theme.primaryColor} !important; }
    ${!theme.animations ? '*, *::before, *::after { transition: none !important; animation: none !important; }' : ''}
    ${!theme.roundedCorners ? '*, *::before, *::after { border-radius: 0 !important; }' : ''}
  `;
  document.head.appendChild(style);
}

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(loadTheme);

  // Apply CSS variables whenever theme colors change
  useEffect(() => {
    const { sidebarWidth, fontSize, roundedCorners, animations, ...colors } = theme;
    applyCSSVars(colors);
    injectThemeStyles(theme);
  }, [theme]);

  const updateTheme = useCallback((settings: Partial<ThemeSettings>) => {
    setTheme((prev) => {
      const next = { ...prev, ...settings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_THEME));
  }, []);

  return (
    <ThemeContext.Provider value={{ ...theme, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
