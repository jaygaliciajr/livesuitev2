"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("ls-theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
      document.documentElement.dataset.theme = stored;
      return;
    }
    document.documentElement.dataset.theme = "dark";
    window.localStorage.setItem("ls-theme", "dark");
  }, []);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    document.documentElement.classList.add("theme-switching");
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("ls-theme", nextTheme);
    window.setTimeout(() => document.documentElement.classList.remove("theme-switching"), 280);
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === "light" ? "dark" : "light"),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
