"use client";

import { useMemo } from "react";
import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from "next-themes";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="ls-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}

export function useTheme(): ThemeContextValue {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const activeTheme = ((theme === "system" ? resolvedTheme : theme) || "dark") as Theme;

  return useMemo(
    () => ({
      theme: activeTheme,
      setTheme: (nextTheme: Theme) => {
        document.documentElement.classList.add("theme-switching");
        setTheme(nextTheme);
        window.setTimeout(() => document.documentElement.classList.remove("theme-switching"), 240);
      },
      toggleTheme: () => {
        document.documentElement.classList.add("theme-switching");
        setTheme(activeTheme === "dark" ? "light" : "dark");
        window.setTimeout(() => document.documentElement.classList.remove("theme-switching"), 240);
      },
    }),
    [activeTheme, setTheme],
  );
}
