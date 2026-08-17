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
    <section className="min-h-screen p-4 sm:p-6 md:p-10 w-full flex items-center justify-center bg-slate-100/60 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 min-h-[540px] md:h-[88vh] max-w-5xl shadow-2xl rounded-3xl overflow-hidden w-full flex flex-col md:flex-row justify-between border border-slate-200/80 dark:border-slate-800">
        <div className="w-full md:w-1/2 p-6 sm:p-10 lg:p-12 flex items-center justify-center">
          <div className="flex flex-col gap-y-6 w-full max-w-sm">
            <div className="flex flex-col gap-y-2">
              <h1 className="text-slate-900 dark:text-white font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight">
                {process.env.NEXT_PUBLIC_SITE_NAME || "Dwellr"}
              </h1>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
                Sign in to access your dashboard
              </p>
            </div>

            <div className="flex flex-col gap-y-5 w-full relative">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <Input
                    type="email"
                    placeholder="Email address"
                    {...register("email")}
                    className="h-11 rounded-xl text-sm"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <PasswordInput
                    placeholder="Password"
                    {...register("password")}
                    className="h-11 rounded-xl text-sm"
                  />
                  {errors.password && (
                    <p className="text-xs text-rose-500">
                      {errors.password.message}
                    </p>
                  )}
                  <div className="flex justify-end pt-1">
                    <Link
                      href="/forgot-password"
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold rounded-xl cursor-pointer"
                  disabled={isPending}
                >
                  {isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                Protected admin area • Unauthorized access is monitored
              </p>
            </div>
          </div>
        </div>
        <div
          style={{
            background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bg.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          className="hidden md:flex md:w-1/2 h-full items-center justify-center"
        ></div>
      </div>
    </section>
  );
}
