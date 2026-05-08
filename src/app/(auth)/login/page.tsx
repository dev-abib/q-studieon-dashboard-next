"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    } catch {
      // handled in useLogin onError
    }
  };

  return (
    <section className="min-h-screen p-10  w-full relative ">
      <div className=" bg-gray-100 h-[90vh] shadow-2xl w-full flex flex-row justify-between ">
        <div className="w-[50%] h-full flex items-center justify-center ">
          <div className=" flex flex-col gap-y-6">
            <div className=" flex flex-col gap-y-4">
              <h1 className="text-off-gray font-bold text-5xl tracking-[4.031px] ">
                {" "}
                {process.env.NEXT_PUBLIC_SITE_NAME as string}{" "}
              </h1>
              <p className="text-lg text-gray-500">
                Sign in to access your dashboard
              </p>
            </div>

            <div className="flex flex-col gap-y-5 w-full relative ">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <Input
                    type="email"
                    placeholder="Email address"
                    {...register("email")}
                    className="h-11"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Input
                    type="password"
                    placeholder="Password"
                    {...register("password")}
                    className="h-11"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-md rounded-xl cursor-pointer "
                  disabled={isPending}
                >
                  {isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <p className="text-sm text-center text-gray-400">
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
          className=" flex w-[50%] h-full items-center justify-center  "
        ></div>
      </div>
    </section>
  );
}
