"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/features/auth/hoooks/use-login";
import { loginSchema } from "@/features/auth/schema/login-payload.schema";
import { LoginFormData } from "@/features/auth/types/login.types";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function LoginPage() {
  const { data, mutate: loginMutation, error, isPending } = useLogin();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    loginMutation(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4">
      <Card className="w-full max-w-md p-8 shadow-xl rounded-2xl border border-gray-200">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to access your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <Input
              placeholder="Email address"
              {...register("email")}
              className="h-11"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Input
              type="password"
              placeholder="Password"
              {...register("password")}
              className="h-11"
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Button */}
          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          Protected admin area • Unauthorized access is monitored
        </p>
      </Card>
    </div>
  );
}
