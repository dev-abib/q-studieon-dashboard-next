"use client";
import { queryClient } from "@/providers/query-provider";
import { authApi } from "@/services/auth-api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useChangePassword() {
    const router = useRouter();
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: async data => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      router.push("/dashboard");
    },
    onError: (error: unknown) => {
      toast.error(
        (error as any)?.response?.data?.message ?? "Password change failed",
      );
    },
  });
}
