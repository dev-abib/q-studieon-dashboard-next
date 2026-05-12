"use client";
import { queryClient } from "@/providers/query-provider";
import { authApi } from "@/services/auth-api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useDeleteAdmin() {
  return useMutation({
    mutationFn: authApi.deleteAdmin,
    onSuccess: async data => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["allAdmins"] });
    },
    onError: (error: unknown) => {
      toast.error((error as any)?.response?.data?.message ?? "Login failed");
    },
  });
}
