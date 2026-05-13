"use client";
import { queryClient } from "@/providers/query-provider";
import { authApi } from "@/services/auth-api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useDeleteUser() {
  return useMutation({
    mutationFn: authApi.deleteUser,
    onSuccess: async data => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
    onError: (error: unknown) => {
      toast.error((error as any)?.response?.data?.message ?? "Login failed");
    },
  });
}
