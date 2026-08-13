import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccentColor =
  | "indigo"
  | "slate"
  | "emerald"
  | "sky"
  | "violet"
  | "rose"
  | "amber"
  | "custom";

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

export function applyThemeToDOM(accentColor: AccentColor, customHex?: string) {
  if (typeof document === "undefined") return;
  if (accentColor === "custom" && customHex) {
    document.documentElement.style.setProperty("--primary", customHex);
    document.documentElement.style.setProperty("--ring", customHex);
    document.documentElement.setAttribute("data-accent", "custom");
  } else {
    document.documentElement.style.removeProperty("--primary");
    document.documentElement.style.removeProperty("--ring");
    document.documentElement.setAttribute("data-accent", accentColor);
  }
}

interface ThemeState {
  accentColor: AccentColor;
  customHex: string;
  setAccentColor: (color: AccentColor) => void;
  setCustomHex: (hex: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      accentColor: "indigo",
      customHex: "#ec4899", // Pink/Magenta default for custom
      setAccentColor: (color: AccentColor) => {
        applyThemeToDOM(color, get().customHex);
        set({ accentColor: color });
      },
      setCustomHex: (hex: string) => {
        applyThemeToDOM("custom", hex);
        set({ accentColor: "custom", customHex: hex });
      },
    }),
    {
      name: "dweller_theme_store",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.accentColor, state.customHex);
        }
      },
    }
  )
);
