"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User, Mail } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "../hooks/use-get-met";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { adminApi } from "@/services/admin-api";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

export function ProfileForm() {
  const { data: admin, isLoading: isFetching } = useCurrentUser();
  const queryClient = useQueryClient();
  const [preview, setPreview] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });

  React.useEffect(() => {
    if (admin?.data) {
      form.reset({
        name: admin.data.name || "",
        email: admin.data.email || "",
      });
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
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
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

  const onSubmit = (values: any) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("email", values.email);
    if (selectedFile) formData.append("profilePicture", selectedFile);
    updateProfile(formData);
  };

  const isChanged = form.formState.isDirty || !!selectedFile;

  if (isFetching) {
    return (
      <div
        className="flex flex-col gap-5 rounded-xl border border-stone-100 bg-white p-5 shadow-sm"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* header skeleton */}
        <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-stone-100" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-36 animate-pulse rounded-full bg-stone-100" />
            <div className="h-2.5 w-48 animate-pulse rounded-full bg-stone-100" />
          </div>
        </div>
        {/* avatar skeleton */}
        <div className="flex justify-center py-2">
          <div className="h-20 w-20 animate-pulse rounded-full bg-stone-100" />
        </div>
        {/* fields skeleton */}
        {[0, 1].map(i => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-2.5 w-24 animate-pulse rounded-full bg-stone-100" />
            <div className="h-9 w-full animate-pulse rounded-lg bg-stone-100" />
          </div>
        ))}
        <div className="h-9 w-full animate-pulse rounded-lg bg-stone-100" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col rounded-xl border border-stone-100 bg-white shadow-sm"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Card header ── */}
      <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <User className="h-4 w-4" />
        </div>
        <div>
          <p
            className="text-base font-normal text-stone-700"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            Profile Information
          </p>
          <p className="text-[11px] tracking-wide text-stone-400">
            Update your personal details
          </p>
        </div>
      </div>

      <div className="p-5">
        {/* ── Avatar ── */}
        <div className="mb-6 flex justify-center">
          <div
            className="relative cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className="h-20 w-20 ring-2 ring-stone-100 ring-offset-2">
              <AvatarImage src={preview || admin?.data?.profilePictureURL} />
              <AvatarFallback
                className="text-2xl font-medium"
                style={{ background: "#fef3c7", color: "#92400e" }}
              >
                {admin?.data?.name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm">
              <Camera className="h-3 w-3 text-stone-500" />
            </div>
          </div>
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Full name */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
              <User className="h-3 w-3 text-stone-300" />
              Full Name
            </label>
            <Input
              {...form.register("name")}
              placeholder="John Doe"
              className="h-9 rounded-lg border-stone-200 text-sm text-stone-700 placeholder:text-stone-300 focus-visible:ring-amber-400"
            />
            {form.formState.errors.name && (
              <p className="text-[11px] text-rose-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
              <Mail className="h-3 w-3 text-stone-300" />
              Email Address
            </label>
            <Input
              {...form.register("email")}
              type="email"
              placeholder="admin@example.com"
              className="h-9 rounded-lg border-stone-200 text-sm text-stone-700 placeholder:text-stone-300 focus-visible:ring-amber-400"
            />
            {form.formState.errors.email && (
              <p className="text-[11px] text-rose-500">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isUpdating || !isChanged}
            className="mt-1 h-9 w-full rounded-lg bg-amber-500 text-xs font-medium text-white shadow-none hover:bg-amber-600 disabled:opacity-50"
          >
            {isUpdating && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
}
