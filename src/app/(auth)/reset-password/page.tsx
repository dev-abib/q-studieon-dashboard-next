"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/services/auth-api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .regex(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
        "Password must be at least 8 chars with uppercase, lowercase, number and special char",
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const { mutate: resetPassword, isPending } = useMutation({
    mutationFn: (values: ResetPasswordForm) =>
      authApi.resetPassword({
        token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      }),
    onSuccess: data => {
      toast.success(data.message || "Password reset successfully! You can now sign in.");
      router.push("/login");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to reset password. Link may be expired.");
    },
  });

  const onSubmit = (values: ResetPasswordForm) => {
    if (!token) {
      toast.error("Missing password reset token from email link.");
      return;
    }
    resetPassword(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Set New Password
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create a strong new password for your admin account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              New Password
            </label>
            <Input
              type="password"
              {...register("newPassword")}
              placeholder="••••••••"
              className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-amber-500"
            />
            {errors.newPassword && (
              <p className="text-xs text-rose-500">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Confirm New Password
            </label>
            <Input
              type="password"
              {...register("confirmPassword")}
              placeholder="••••••••"
              className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-amber-500"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-rose-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password…
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Update Password & Sign In
              </>
            )}
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
