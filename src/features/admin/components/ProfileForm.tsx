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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User, Mail } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "../hooks/use-get-met";
import { adminApi } from "@/services/admin-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { data: admin, isLoading: isFetching } = useCurrentUser();
  const queryClient = useQueryClient();
  const [preview, setPreview] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: admin?.data?.name || "",
      email: admin?.data?.email || "",
    },
  });

  React.useEffect(() => {
    if (admin?.data) {
      const { name, email, profilePictureURL } = admin.data;

      const currentValues = form.getValues();
      if (currentValues.name !== name || currentValues.email !== email) {
        form.reset({ name, email });
      }

      if (profilePictureURL && !preview) {
        setPreview(profilePictureURL);
      }
    }
  }, [admin?.data, form, preview]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) {
        toast.error("File size must be less than 2MB");
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        toast.success("Image selected. Save changes to update.");
      };
      reader.readAsDataURL(file);
    }
  };

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: (payload: FormData) => {
      return adminApi.updateProfile(payload);
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("email", values.email);
    if (selectedFile) {
      formData.append("profilePicture", selectedFile);
    }
    updateProfile(formData);
  };

  if (isFetching) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-none shadow-sm ring-1 ring-border/50 h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Update Admin Info
        </CardTitle>
        <CardDescription>
          Change your basic account information here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div
              className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-background shadow-xl cursor-pointer hover:border-primary/50 transition-colors"
              onClick={handleImageClick}
            >
              <Avatar className="h-full w-full">
                <AvatarImage
                  src={preview || admin?.data?.profilePictureURL}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/5 text-primary text-3xl font-bold">
                  {admin?.data?.name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
            </div>

            <button
              type="button"
              onClick={handleImageClick}
              className="absolute -bottom-1 -right-1 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
              title="Change Profile Picture"
            >
              <Camera className="h-5 w-5 cursor-pointer" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          <div className="text-center space-y-1">
            <h4 className="text-sm font-medium">Profile Picture</h4>
            <p className="text-xs text-muted-foreground">
              Click the camera or avatar to upload (Max 2MB)
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name
              </label>
              <Input
                {...form.register("name")}
                placeholder="John Doe"
                className="bg-muted/30 focus-visible:ring-primary/20 p-5"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </label>
              <Input
                {...form.register("email")}
                placeholder="admin@example.com"
                className="bg-muted/30 focus-visible:ring-primary/20 p-5"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isUpdating}
              className="p-5 cursor-pointer"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
