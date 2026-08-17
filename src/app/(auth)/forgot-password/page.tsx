"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/services/auth-api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const { mutate: sendForgotPassword, isPending } = useMutation({
    mutationFn: (values: ForgotPasswordForm) => authApi.forgotPassword(values.email),
    onSuccess: (data, variables) => {
      setSubmittedEmail(variables.email);
      toast.success(data.message || "Password reset link sent to your email!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to request password reset");
    },
  });

  const onSubmit = (values: ForgotPasswordForm) => {
    sendForgotPassword(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Admin Password Reset
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enter your admin email to receive a password reset link.
          </p>
        </div>

        {submittedEmail ? (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Check Your Email
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                If an admin account exists for{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {submittedEmail}
                </span>
                , we have dispatched a password reset link.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline mt-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="admin@example.com"
                  className="h-10 pl-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Link…
                </>
              ) : (
                "Send Password Reset Link"
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
        )}
      </div>
    </div>
  );
}
