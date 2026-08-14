"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/services/auth-api";
import { toast } from "sonner";

export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => authApi.deleteAdmin(id),
    onSuccess: async data => {
      toast.success(data.message || "Admin access revoked successfully");
      queryClient.invalidateQueries({ queryKey: ["allAdmins"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["contact-queries", "staff-members"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to revoke admin access",
      );
    },
  });
}

