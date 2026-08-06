"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "ml-control-theme";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

function getPreferredTheme(): Theme {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (isTheme(storedTheme)) {
      return storedTheme;
    }
  } catch {
    // Si localStorage está bloqueado, usamos la preferencia del sistema.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const isDark = theme === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const preferredTheme = getPreferredTheme();

    applyTheme(preferredTheme);
    setTheme(preferredTheme);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    applyTheme(nextTheme);
    setTheme(nextTheme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // El tema cambia aunque no pueda guardarse.
    }
  }

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="h-10 w-10 rounded-[10px] border border-dashboard-border bg-dashboard-control"
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-dashboard-border bg-dashboard-control text-dashboard-muted transition-colors hover:border-dashboard-accent-border hover:bg-dashboard-accent-soft hover:text-dashboard-accent-foreground focus-visible:ring-2 focus-visible:ring-dashboard-accent"
    >
      {isDark ? (
        <Sun aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      ) : (
        <Moon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      )}
    </button>
  );
}