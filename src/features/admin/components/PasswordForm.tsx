"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { ShieldCheck, Loader2, Lock, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChangePassword } from "@/features/auth/hooks/use-change-password";
import { ChangePasswordInput } from "@/features/auth/types/change-pass.types";
import { ChangePasswordSchema } from "@/features/auth/schema/change-password.schema";

import { useCurrentUser } from "../hooks/use-get-met";
import { authApi } from "@/services/auth-api";
import { toast } from "sonner";
import { ShieldAlert, Mail } from "lucide-react";

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const strengths = [
    { label: "Weak", color: "bg-rose-500" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-sky-500" },
    { label: "Strong", color: "bg-emerald-500" },
  ];
  return { score, label: strengths[score - 1]?.label || "", color: strengths[score - 1]?.color || "" };
}

export function PasswordForm() {
  const { data: userData } = useCurrentUser();
  const currentUser = userData?.data || userData;
  const canChangePassword =
    currentUser?.role === "super_admin" ||
    currentUser?.isOwner ||
    Boolean(currentUser?.canChangePassword);

  const [isSendingReset, setIsSendingReset] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const strength = getPasswordStrength(newPassword);

  const requirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Contains number", met: /[0-9]/.test(newPassword) },
    { label: "Contains special symbol", met: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { oldPassword: "", password: "", confirmPassword: "" },
  });

  const { mutate: updatePassword, isPending: isUpdating } = useChangePassword();
  const onSubmit = (values: ChangePasswordInput) => updatePassword(values);
  const isDirty = form.formState.isDirty;

  const handleSendResetEmail = async () => {
    if (!currentUser?.email) return;
    setIsSendingReset(true);
    try {
      const res = await authApi.forgotPassword(currentUser.email);
      toast.success(res.message || "Password reset link sent to your email!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send reset link");
    } finally {
      setIsSendingReset(false);
    }
  };

  if (!canChangePassword) {
    return (
      <div className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* ── Card Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                Password & Security
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Staff credential modification policy
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <Lock className="h-3 w-3" />
            Restricted by Super Admin
          </span>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm mb-1 text-amber-950 dark:text-amber-100">
                Direct Password Modification Locked
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300/90">
                Staff members are not permitted to change their account password manually unless granted permission by a <strong>Super Admin</strong>.
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1">
                If you have forgotten your password or require a credential update, you can trigger a secure recovery link to your verified email (<strong>{currentUser?.email}</strong>).
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Need assistance? Contact your organization administrator.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSendingReset}
              onClick={handleSendResetEmail}
              className="rounded-xl h-9 px-4 text-xs font-bold gap-2 text-primary border-primary/30 hover:bg-primary/10"
            >
              {isSendingReset ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email Me Password Reset Link</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* ── Card Header ── */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
            Password & Security
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Keep your credentials updated & secure
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 flex flex-col gap-5">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Current Password */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              Current Password
            </label>
            <PasswordInput
              {...form.register("oldPassword")}
              placeholder="••••••••"
              className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 text-sm dark:bg-slate-800/40"
            />
            {form.formState.errors.oldPassword && (
              <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.oldPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              New Password
            </label>
            <PasswordInput
              {...form.register("password")}
              placeholder="Enter new password"
              className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 text-sm dark:bg-slate-800/40"
              onChange={(e) => {
                form.register("password").onChange(e);
                setNewPassword(e.target.value);
              }}
            />

            {/* Password Strength Meter */}
            {newPassword && (
              <div className="mt-1 flex flex-col gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Password Strength:
                  </span>
                  <span className={cn("text-[11px] font-bold uppercase tracking-wide", strength.score === 4 ? "text-emerald-500" : "text-amber-500")}>
                    {strength.label}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-all duration-300",
                        i <= strength.score ? strength.color : "bg-slate-200 dark:bg-slate-700",
                      )}
                    />
                  ))}
                </div>

                {/* Requirements Checklist */}
                <div className="grid grid-cols-2 gap-1.5 mt-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
                  {requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      {req.met ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-3 w-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                      )}
                      <span className={cn("text-[10px] font-medium", req.met ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500")}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {form.formState.errors.password && (
              <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              Confirm Password
            </label>
            <PasswordInput
              {...form.register("confirmPassword")}
              placeholder="Confirm new password"
              className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 text-sm dark:bg-slate-800/40"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isUpdating || !isDirty}
              className="h-10.5 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 disabled:opacity-40 transition-all duration-200"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
