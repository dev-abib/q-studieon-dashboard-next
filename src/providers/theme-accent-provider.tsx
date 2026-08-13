"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type AccentColor =
  | "indigo"
  | "slate"
  | "emerald"
  | "sky"
  | "violet"
  | "rose"
  | "amber";

export interface AccentOption {
  id: AccentColor;
  name: string;
  hex: string;
  badgeBg: string;
  badgeText: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    id: "indigo",
    name: "Indigo (Vercel/Linear)",
    hex: "#6366f1",
    badgeBg: "bg-indigo-500/10",
    badgeText: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "slate",
    name: "Monochrome Slate",
    hex: "#475569",
    badgeBg: "bg-slate-500/10",
    badgeText: "text-slate-700 dark:text-slate-300",
  },
  {
    id: "emerald",
    name: "Forest Emerald",
    hex: "#10b981",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "sky",
    name: "Corporate Sky Blue",
    hex: "#0284c7",
    badgeBg: "bg-sky-500/10",
    badgeText: "text-sky-600 dark:text-sky-400",
  },
  {
    id: "violet",
    name: "Royal Violet",
    hex: "#8b5cf6",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "rose",
    name: "Crimson Rose",
    hex: "#f43f5e",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "amber",
    name: "Warm Amber",
    hex: "#f59e0b",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-600 dark:text-amber-400",
  },
];

interface ThemeAccentContextType {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  accentOption: AccentOption;
}

const ThemeAccentContext = createContext<ThemeAccentContextType | undefined>(
  undefined
);

const STORAGE_KEY = "dweller_theme_accent";

export function ThemeAccentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accentColor, setAccentState] = useState<AccentColor>("indigo");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as AccentColor | null;
    if (saved && ACCENT_OPTIONS.some(opt => opt.id === saved)) {
      setAccentState(saved);
      document.documentElement.setAttribute("data-accent", saved);
    } else {
      document.documentElement.setAttribute("data-accent", "indigo");
    }
  }, []);

  const setAccentColor = (color: AccentColor) => {
    setAccentState(color);
    localStorage.setItem(STORAGE_KEY, color);
    document.documentElement.setAttribute("data-accent", color);
  };

  const accentOption =
    ACCENT_OPTIONS.find(opt => opt.id === accentColor) ?? ACCENT_OPTIONS[0];

  return (
    <ThemeAccentContext.Provider
      value={{ accentColor, setAccentColor, accentOption }}
    >
      {children}
    </ThemeAccentContext.Provider>
  );
}

export function useThemeAccent() {
  const context = useContext(ThemeAccentContext);
  if (!context) {
    throw new Error(
      "useThemeAccent must be used within a ThemeAccentProvider"
    );
  }
  return context;
}
