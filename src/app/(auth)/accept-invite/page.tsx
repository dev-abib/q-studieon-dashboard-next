"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/services/auth-api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

const acceptInviteSchema = z
  .object({
    name: z.string().min(2, "Full name is required"),
    password: z
      .string()
      .regex(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
        "Password must be at least 8 chars with uppercase, lowercase, number and special char",
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AcceptInviteForm = z.infer<typeof acceptInviteSchema>;

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [verifying, setVerifying] = useState(true);
  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteForm>({
    resolver: zodResolver(acceptInviteSchema),
  });

  useEffect(() => {
    if (!token) {
      setErrorMsg("Missing invitation token.");
      setVerifying(false);
      return;
    }

    authApi
      .verifyInvite(token)
      .then(res => {
        setInviteData(res.data || res);
        setVerifying(false);
      })
      .catch(err => {
        setErrorMsg(err?.response?.data?.message || "Invitation token is invalid or has expired.");
        setVerifying(false);
      });
  }, [token]);

  const { mutate: acceptInvite, isPending } = useMutation({
    mutationFn: authApi.acceptInvite,
    onSuccess: data => {
      toast.success(data.message || "Account activated! You can now sign in.");
      router.push("/login");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to activate account");
    },
  });

  const onSubmit = (values: AcceptInviteForm) => {
    acceptInvite({
      token,
      name: values.name,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Join the Team
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Set up your credentials to activate your admin account.
          </p>
        </div>

        {verifying ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs text-slate-400">Verifying invitation link…</p>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center text-center py-6 gap-3">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{errorMsg}</p>
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="mt-2 rounded-xl text-xs"
            >
              Back to Sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {inviteData?.email}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 capitalize">
                {inviteData?.role.replace("_", " ")}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <Input
                {...register("name")}
                placeholder="Jane Smith"
                className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary"
              />
              {errors.name && (
                <p className="text-xs text-rose-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Create Password
              </label>
              <PasswordInput
                {...register("password")}
                placeholder="••••••••"
                className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary"
              />
              {errors.password && (
                <p className="text-xs text-rose-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirm Password
              </label>
              <PasswordInput
                {...register("confirmPassword")}
                placeholder="••••••••"
                className="h-10 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-rose-500">{errors.confirmPassword.message}</p>
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
                  Activating Account…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Activate Account & Sign In
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
