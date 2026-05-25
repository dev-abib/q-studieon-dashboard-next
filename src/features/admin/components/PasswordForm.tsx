"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChangePassword } from "@/features/auth/hooks/use-change-password";
import { ChangePasswordInput } from "@/features/auth/types/change-pass.types";
import { ChangePasswordSchema } from "@/features/auth/schema/change-password.schema";

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const strengths = [
    { label: "Weak",   color: "bg-rose-400"   },
    { label: "Fair",   color: "bg-amber-400"  },
    { label: "Good",   color: "bg-sky-400"    },
    { label: "Strong", color: "bg-teal-500"   },
  ];
  return { score, label: strengths[score - 1]?.label || "", color: strengths[score - 1]?.color || "" };
}

export function PasswordForm() {
  const [newPassword, setNewPassword] = React.useState("");
  const strength = getPasswordStrength(newPassword);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { oldPassword: "", password: "", confirmPassword: "" },
  });

  const { mutate: updatePassword, isPending: isUpdating } = useChangePassword();
  const onSubmit = (values: ChangePasswordInput) => updatePassword(values);
  const isDirty = form.formState.isDirty;

  return (
    <div
      className="flex h-full flex-col rounded-xl border border-stone-100 bg-white shadow-sm"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Card header ── */}
      <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p
            className="text-base font-normal text-stone-700"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Password & Security
          </p>
          <p className="text-[11px] tracking-wide text-stone-400">
            Keep your account secure
          </p>
        </div>
      </div>

      <div className="p-5">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Current password */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
              <Lock className="h-3 w-3 text-stone-300" />
              Current Password
            </label>
            <Input
              {...form.register("oldPassword")}
              type="password"
              placeholder="••••••••"
              className="h-9 rounded-lg border-stone-200 text-sm text-stone-700 placeholder:text-stone-300 focus-visible:ring-amber-400"
            />
            {form.formState.errors.oldPassword && (
              <p className="text-[11px] text-rose-500">
                {form.formState.errors.oldPassword.message}
              </p>
            )}
          </div>

          {/* New password */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
              <Lock className="h-3 w-3 text-stone-300" />
              New Password
            </label>
            <Input
              {...form.register("password")}
              type="password"
              placeholder="Enter new password"
              className="h-9 rounded-lg border-stone-200 text-sm text-stone-700 placeholder:text-stone-300 focus-visible:ring-amber-400"
              onChange={e => {
                form.register("password").onChange(e);
                setNewPassword(e.target.value);
              }}
            />
            {/* Strength meter */}
            {newPassword && (
              <div className="mt-1 flex flex-col gap-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all",
                        i <= strength.score ? strength.color : "bg-stone-100",
                      )}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
                  {strength.label}
                </p>
              </div>
            )}
            {form.formState.errors.password && (
              <p className="text-[11px] text-rose-500">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
              <Lock className="h-3 w-3 text-stone-300" />
              Confirm New Password
            </label>
            <Input
              {...form.register("confirmPassword")}
              type="password"
              placeholder="Confirm new password"
              className="h-9 rounded-lg border-stone-200 text-sm text-stone-700 placeholder:text-stone-300 focus-visible:ring-amber-400"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-[11px] text-rose-500">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isUpdating || !isDirty}
            className="mt-1 h-9 w-full rounded-lg bg-stone-800 text-xs font-medium text-white shadow-none hover:bg-stone-900 disabled:opacity-50"
          >
            {isUpdating && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}