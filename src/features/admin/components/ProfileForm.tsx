"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "../hooks/use-get-met";
import { adminApi } from "@/services/admin-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

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
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-blue-50 rounded-2xl flex items-center justify-center">
          <User className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Profile Information</h2>
          <p className="text-sm text-stone-500">Update your personal details</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-10">
        <div
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Avatar className="h-28 w-28 ring-4 ring-white shadow-md">
            <AvatarImage src={preview || admin?.data?.profilePictureURL} />
            <AvatarFallback className="text-4xl bg-stone-100">
              {admin?.data?.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow border">
            <Camera className="h-4 w-4 text-stone-600" />
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <div>
            <label className="text-xs font-medium tracking-widest text-stone-500 mb-1.5 block">
              FULL NAME
            </label>
            <Input
              {...form.register("name")}
              className="h-12 text-base"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="text-xs font-medium tracking-widest text-stone-500 mb-1.5 block">
              EMAIL ADDRESS
            </label>
            <Input
              {...form.register("email")}
              type="email"
              className="h-12 text-base"
              placeholder="admin@example.com"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isUpdating || !isChanged}
          className="w-full h-12 text-base font-medium rounded-2xl bg-stone-900 hover:bg-black"
        >
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>

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
