"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, User, Mail, Upload, X, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "../hooks/use-get-met";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { adminApi } from "@/services/admin-api";

const profileSchema = z.object({
  name: z.string().min(4, "Name must be at least 4 characters"),
});

export function ProfileForm() {
  const { data: admin, isLoading: isFetching } = useCurrentUser();
  const queryClient = useQueryClient();
  const [preview, setPreview] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [imgError, setImgError] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  });

  React.useEffect(() => {
    if (admin?.data) {
      form.reset({
        name: admin.data.name || "",
      });
      setImgError(false);
    }
  }, [admin?.data, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }
    setSelectedFile(file);
    setImgError(false);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: (payload: FormData) => adminApi.updateProfile(payload),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setPreview(null);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    },
  });

  const onSubmit = (values: { name: string }) => {
    const formData = new FormData();
    formData.append("name", values.name);
    if (selectedFile) formData.append("profilePicture", selectedFile);
    updateProfile(formData);
  };

  const isChanged = form.formState.isDirty || !!selectedFile;
  const avatarSrc = preview || (admin?.data?.profilePictureURL && !imgError ? admin.data.profilePictureURL : null);
  const initials = admin?.data?.name
    ? admin.data.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";

  if (isFetching) {
    return (
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-36 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="h-2.5 w-48 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
        <div className="flex justify-center py-4">
          <div className="h-28 w-28 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              Personal Details
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your display name, email and avatar photo
            </p>
          </div>
        </div>
        {admin?.data?.role && (
          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            {admin.data.role.replace("_", " ")}
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* ── Avatar Upload Section ── */}
        <div className="flex flex-col items-center sm:flex-row sm:items-center gap-6 p-4.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <div className="relative group">
            {/* Crisp Avatar Container with Primary ring */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative h-28 w-28 cursor-pointer overflow-hidden rounded-full ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 shadow-sm"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={admin?.data?.name || "Profile"}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-black text-3xl tracking-wider">
                  {initials}
                </div>
              )}

              {/* Hover overlay with Camera Icon */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-[2px]">
                <Camera className="h-6 w-6 mb-1 text-white animate-bounce" />
                <span className="text-[10px] font-bold tracking-wide uppercase">Change</span>
              </div>
            </div>

            {/* Quick Upload Badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-110"
              title="Upload new photo"
            >
              <Upload className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col text-center sm:text-left gap-1 flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                {admin?.data?.name || "Admin User"}
              </h3>
              {selectedFile && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                  New file selected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload a crisp JPG, PNG or WEBP avatar photo (Max 2MB).
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8.5 px-3 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Upload Photo
              </Button>
              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveSelectedFile}
                  className="h-8.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Form Inputs ── */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <User className="h-3.5 w-3.5 text-slate-400" />
              Full Name
            </label>
            <Input
              {...form.register("name")}
              placeholder="e.g. Alex Morgan"
              className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 text-sm dark:bg-slate-800/40"
            />
            {form.formState.errors.name && (
              <p className="text-xs font-medium text-rose-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Email Address (Read-Only / Immutable) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Email Address
              </label>
              <span className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                <Lock className="h-3 w-3 text-slate-400" />
                Managed by Organization • Locked
              </span>
            </div>
            <div className="flex items-center justify-between h-10.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-sm text-slate-700 dark:text-slate-300">
              <span className="font-medium">{admin?.data?.email || "admin@dwellr.tech"}</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Administrative email addresses are tied to your team seat and cannot be modified.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isUpdating || !isChanged}
              className="h-10.5 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 disabled:opacity-40 transition-all duration-200"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Profile Changes"
              )}
            </Button>
          </div>
        </form>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp"
      />
    </div>
  );
}
