"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/services/admin-api";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { PasswordUpdatePayload } from "../types/admin.types";
import { cn } from "@/lib/utils";
import { useChangePassword } from "@/features/auth/hooks/use-change-password";
import { ChangePasswordInput } from "@/features/auth/types/change-pass.types";
import { ChangePasswordSchema } from "@/features/auth/schema/change-password.schema";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const strengths = [
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-blue-500" },
    { label: "Strong", color: "bg-emerald-500" },
  ];

  return {
    score,
    label: strengths[score - 1]?.label || "",
    color: strengths[score - 1]?.color || "",
  };
}

export function PasswordForm() {
  const [newPassword, setNewPassword] = React.useState("");
  const strength = getPasswordStrength(newPassword);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      oldPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate: updatePassword, isPending: isUpdating } = useChangePassword();

  const onSubmit = (values: ChangePasswordInput) => updatePassword(values);
  const isDirty = form.formState.isDirty;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8 h-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-amber-50 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Password & Security</h2>
          <p className="text-sm text-stone-500">Keep your account secure</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-8">
          {/* Current Password */}
          <div>
            <label className="text-xs font-medium tracking-widest text-stone-500 mb-1.5 block">
              CURRENT PASSWORD
            </label>
            <Input
              {...form.register("oldPassword")}
              type="password"
              placeholder="••••••••"
              className="h-12 text-base"
            />
            {form.formState.errors.oldPassword && (
              <p className="text-red-500 text-xs mt-1.5">
                {form.formState.errors.oldPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="text-xs font-medium tracking-widest text-stone-500 mb-1.5 block">
              NEW PASSWORD
            </label>
            <Input
              {...form.register("password")}
              type="password"
              placeholder="Enter new password"
              className="h-12 text-base"
              onChange={e => {
                form.register("password").onChange(e);
                setNewPassword(e.target.value);
              }}
            />

            {newPassword && (
              <div className="mt-4">
                <div className="flex gap-1.5 h-1 mb-2">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 rounded-full transition-all",
                        i <= strength.score ? strength.color : "bg-stone-200",
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-stone-500">
                  {strength.label}
                </p>
              </div>
            )}

            {form.formState.errors.password && (
              <p className="text-red-500 text-xs mt-1.5">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-medium tracking-widest text-stone-500 mb-1.5 block">
              CONFIRM NEW PASSWORD
            </label>
            <Input
              {...form.register("confirmPassword")}
              type="password"
              placeholder="Confirm new password"
              className="h-12 text-base"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1.5">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isUpdating || !isDirty}
          className="w-full h-12 text-base font-medium rounded-2xl bg-stone-900 hover:bg-black"
        >
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Password
        </Button>
      </form>
    </div>
  );
}
