"use client";

import React from "react";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

export function SettingsLayout() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Update your profile information and account security.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full lg:w-1/2">
          <ProfileForm />
        </div>
        <div className="flex-1 w-full lg:w-1/2">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
