"use client";

import React from "react";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

export default function SettingsLayout() {
  return (
    <div
      className="flex flex-col gap-5 pb-10 pt-6"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Heading ── */}
      <div>
        <p className="mb-1.5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-600">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          Platform Console
        </p>
        <h1
          className="text-3xl font-normal leading-tight text-stone-800 md:text-4xl"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          Account <em className="italic text-amber-600">Settings</em>
        </h1>
        <p className="mt-1.5 text-sm text-stone-400">
          Manage your profile information and security preferences
        </p>
      </div>

      {/* ── Forms grid ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
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
