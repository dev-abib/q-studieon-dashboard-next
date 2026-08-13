"use client";

import React, { useRef } from "react";
import {
  Settings,
  Shield,
  UserCheck,
  KeyRound,
  CheckCircle2,
  Palette,
  Check,
  Sparkles,
  Pipette,
} from "lucide-react";
import { PageHeader } from "@/components/layout/dashboard/PageHeader";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";
import { useCurrentUser } from "../hooks/use-get-met";
import { useThemeStore, ACCENT_OPTIONS } from "@/stores/use-theme-store";
import { Button } from "@/components/ui/button";
import { useFontStore } from '@/stores/use-font-store';
export default function SettingsLayout() {
  const { data: userData } = useCurrentUser();
  const admin = userData?.data;
  const { accentColor, customHex, setAccentColor, setCustomHex } =
    useThemeStore();
  const { font, setFont } = useFontStore();
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <PageHeader
        kicker="Account & Security"
        title="Settings & Customization"
        icon={Settings}
        description="Manage your profile details, display photo, security preferences, and dashboard color theme"
      />

      {/* ── Account Summary Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white/70 dark:bg-slate-900/70 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <Shield className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                {admin?.name || "Admin Account"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 capitalize">
                {admin?.role?.replace("_", " ") || "Admin"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {admin?.email || "admin@dwellr.tech"}
            </p>
          </div>
        </div>

        {/* Quick Account Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-400">
            <UserCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>{admin?.role?.replace("_", " ") || "Admin"}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Verified
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-400">
            <KeyRound className="h-3.5 w-3.5 text-slate-500" />
            2FA Active
          </div>
        </div>
      </div>

      {/* ── Dynamic Theme Accent Palette Picker Card ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Dashboard Theme Color Palette
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose a preset theme or pick a custom hex color spectrum
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Real-time persistence</span>
          </div>
        </div>

        {/* Palette Grid + Custom Picker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
          {/* Preset Buttons */}
          {ACCENT_OPTIONS.map(option => {
            const isSelected = accentColor === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setAccentColor(option.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                  isSelected
                    ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800/80 shadow-sm ring-1 ring-slate-900 dark:ring-slate-100"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-full shadow-xs transition-transform group-hover:scale-105"
                  style={{ backgroundColor: option.hex }}
                >
                  {isSelected && <Check className="h-4 w-4 text-white" />}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                  {option.name.split(" ")[0]}
                </span>
              </button>
            );
          })}

          {/* Custom Color Button */}
          <div
            onClick={() => colorInputRef.current?.click()}
            className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center cursor-pointer ${
              accentColor === "custom"
                ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800/80 shadow-sm ring-1 ring-slate-900 dark:ring-slate-100"
                : "border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
            }`}
          >
            <div
              className="relative flex h-9 w-9 items-center justify-center rounded-full shadow-xs transition-transform group-hover:scale-105 overflow-hidden"
              style={{ backgroundColor: customHex }}
            >
              {accentColor === "custom" ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <Pipette className="h-4 w-4 text-white drop-shadow-xs" />
              )}
              <input
                ref={colorInputRef}
                type="color"
                value={customHex}
                onChange={e => setCustomHex(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
              />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full">
              Custom Hex
            </span>
          </div>
        </div>

        {/* Custom Color Input Field */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Custom Theme Color:
            </span>
            <div className="flex items-center gap-2">
              <span
                className="h-5 w-5 rounded-full border border-black/10 dark:border-white/20"
                style={{ backgroundColor: customHex }}
              />
              <input
                type="text"
                value={customHex}
                onChange={e => {
                  const val = e.target.value;
                  if (val.startsWith("#") && (val.length === 4 || val.length === 7)) {
                    setCustomHex(val);
                  } else {
                    setCustomHex(val);
                  }
                }}
                className="h-8 w-28 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 font-mono text-xs font-bold text-slate-900 dark:text-white uppercase bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => colorInputRef.current?.click()}
            className="h-8 px-3 text-xs font-semibold rounded-lg border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Pipette className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Open Color Wheel
          </Button>
        </div>
      </div>

      {/* ── Font Selection Card ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 shadow-sm flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Dashboard Font</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose a typeface for the entire dashboard</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {([
            { key: 'inter',           label: 'Inter',           style: { fontFamily: 'Inter, sans-serif' } },
            { key: 'roboto',          label: 'Roboto',          style: { fontFamily: 'Roboto, sans-serif' } },
            { key: 'poppins',         label: 'Poppins',         style: { fontFamily: 'Poppins, sans-serif' } },
            { key: 'lato',            label: 'Lato',            style: { fontFamily: 'Lato, sans-serif' } },
            { key: 'montserrat',      label: 'Montserrat',      style: { fontFamily: 'Montserrat, sans-serif' } },
            { key: 'open-sans',       label: 'Open Sans',       style: { fontFamily: "'Open Sans', sans-serif" } },
            { key: 'source-sans-pro', label: 'Source Sans',     style: { fontFamily: "'Source Sans Pro', sans-serif" } },
            { key: 'nunito',          label: 'Nunito',          style: { fontFamily: 'Nunito, sans-serif' } },
            { key: 'raleway',         label: 'Raleway',         style: { fontFamily: 'Raleway, sans-serif' } },
            { key: 'playfair-display',label: 'Playfair',        style: { fontFamily: "'Playfair Display', serif" } },
          ] as { key: import('@/stores/use-font-store').FontOption; label: string; style: React.CSSProperties }[]).map(({ key, label, style }) => {
            const isSelected = font === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFont(key)}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border py-3 px-2 transition-all duration-150 cursor-pointer
                  ${isSelected
                    ? 'border-primary bg-primary/8 dark:bg-primary/10 shadow-sm ring-2 ring-primary/40'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
                <span style={style} className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-none">Aa</span>
                <span style={style} className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate w-full text-center">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* ── Forms Grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProfileForm />
        </div>
        <div className="lg:col-span-2">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
