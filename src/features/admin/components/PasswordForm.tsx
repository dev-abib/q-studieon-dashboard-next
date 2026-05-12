"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/services/admin-api";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { PasswordUpdatePayload } from "../types/admin.types";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function PasswordForm() {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { mutate: updatePassword, isPending: isUpdating } = useMutation({
    mutationFn: (values: PasswordUpdatePayload) => adminApi.updatePassword(values),
    onSuccess: () => {
      toast.success("Password updated successfully");
      form.reset();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error?.response?.data?.message || "Failed to update password",
      );
    },
  });

  const onSubmit = (values: PasswordFormValues) => {
    updatePassword(values);
  };

  const { isDirty } = form.formState;

  return (
    <Card className="border-none shadow-sm ring-1 ring-border/50 h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/5 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage your password and security preferences.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 mt-10"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Current Password
            </label>
            <Input
              {...form.register("currentPassword")}
              type="password"
              placeholder="••••••••"
              className="bg-muted/30 focus-visible:ring-primary/20 p-5"
            />
            {form.formState.errors.currentPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                New Password
              </label>
              <Input
                {...form.register("newPassword")}
                type="password"
                placeholder="••••••••"
                className="bg-muted/30 focus-visible:ring-primary/20 p-5"
              />
              {form.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Confirm New Password
              </label>
              <Input
                {...form.register("confirmPassword")}
                type="password"
                placeholder="••••••••"
                className="bg-muted/30 focus-visible:ring-primary/20 p-5"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isUpdating || !isDirty}
              className="p-5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
