"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useLogin } from "@/features/auth/hooks/use-login";
import { loginSchema } from "@/features/auth/schema/login-payload.schema";
import { LoginFormData } from "@/features/auth/types/login.types";
import bg from "@/assets/img/login.png";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export default function LoginPage() {
  const { mutateAsync: loginMutation, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    try {
      await loginMutation(values);
    } catch {}
  };

  return (
    <section className="min-h-screen p-4 sm:p-6 lg:p-10 w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 min-h-[550px] lg:h-[88vh] shadow-2xl w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col lg:flex-row border border-slate-100 dark:border-slate-800">
        {/* Form Column */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="flex flex-col gap-y-6 w-full max-w-md">
            <div className="flex flex-col gap-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Admin Portal
                </span>
              </div>
              <h1 className="text-slate-900 dark:text-white font-extrabold text-3xl sm:text-4xl tracking-tight">
                {process.env.NEXT_PUBLIC_SITE_NAME || "Dwellr"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sign in with your administrator credentials
              </p>
            </div>

            <div className="flex flex-col gap-y-5 w-full">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    {...register("email")}
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary dark:bg-slate-800/40"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <PasswordInput
                    placeholder="••••••••"
                    {...register("password")}
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary dark:bg-slate-800/40"
                  />
                  {errors.password && (
                    <p className="text-xs text-rose-500 font-medium">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer transition-all"
                  disabled={isPending}
                >
                  {isPending ? "Signing in..." : "Sign In to Dashboard"}
                </Button>
              </form>

              <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                Protected admin area • Unauthorized access is monitored
              </p>
            </div>
          </div>
        </div>

        {/* Hero Image Column (hidden on mobile, visible on desktop) */}
        <div
          style={{
            background: `linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.7)), url(${bg.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          className="hidden lg:flex w-1/2 p-10 flex-col justify-between text-white relative"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
              Secure Operations
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Real-time Property Intelligence</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Manage inquiries, analytics, user operations, and system workflows seamlessly from a unified command center.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
