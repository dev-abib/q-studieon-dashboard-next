"use client";

import React from "react";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";
import { ShieldCheck } from "lucide-react";

export default function SettingsLayout() {
  return (
    <div className="space-y-10 pb-12 ">
      <div>
        <p className="text-xs font-medium tracking-widest text-amber-600">
          PLATFORM CONSOLE
        </p>
        <h1 className="text-3xl font-semibold tracking-tight mt-2">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account information and security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
