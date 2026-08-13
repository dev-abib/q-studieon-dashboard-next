"use client";

import { useEffect, useState, useRef } from "react";
import { Palette, Check, Sparkles, Pipette } from "lucide-react";
import {
  useThemeStore,
  ACCENT_OPTIONS,
  applyThemeToDOM,
} from "@/stores/use-theme-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ThemeAccentPicker() {
  const { accentColor, customHex, setAccentColor, setCustomHex } =
    useThemeStore();
  const [mounted, setMounted] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    applyThemeToDOM(accentColor, customHex);
  }, [accentColor, customHex]);

  const activeOption =
    accentColor === "custom"
      ? { name: "Custom Color", hex: customHex }
      : ACCENT_OPTIONS.find(opt => opt.id === accentColor) ?? ACCENT_OPTIONS[0];

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70"
      >
        <Palette className="h-4 w-4 text-slate-600 dark:text-slate-300" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={`Theme Accent: ${activeOption.name}`}
          className="relative h-9 w-9 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus-visible:ring-0"
        >
          <Palette className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-slate-900"
            style={{ backgroundColor: activeOption.hex }}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[100] w-72 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl backdrop-blur-xl animate-in fade-in-90 zoom-in-95"
      >
        <div className="flex items-center justify-between pb-2.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Theme Color Palette
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
            {accentColor === "custom" ? customHex : accentColor}
          </span>
        </div>

        {/* Preset Colors */}
        <div className="flex flex-col gap-1">
          {ACCENT_OPTIONS.map(option => {
            const isSelected = accentColor === option.id;
            return (
              <DropdownMenuItem
                key={option.id}
                onClick={() => setAccentColor(option.id)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isSelected
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-4 w-4 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                    style={{ backgroundColor: option.hex }}
                  />
                  <span>{option.name}</span>
                </div>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-slate-800" />

        {/* Custom Color Wheel Picker Card */}
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className="relative h-7 w-7 rounded-full overflow-hidden border border-black/10 dark:border-white/20 shrink-0 cursor-pointer shadow-xs hover:scale-105 transition-transform"
              style={{ backgroundColor: customHex }}
              title="Click to pick custom color"
            >
              <input
                ref={colorInputRef}
                type="color"
                value={customHex}
                onChange={e => setCustomHex(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
              />
            </button>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Custom Spectrum
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {customHex.toUpperCase()}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => colorInputRef.current?.click()}
            className="h-7 px-2.5 text-[11px] font-semibold rounded-lg border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Pipette className="mr-1 h-3 w-3 text-slate-500" />
            Pick Color
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
