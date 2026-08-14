import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { toast } from "sonner";

export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      blockedUntil,
      reason,
    }: {
      id: string;
      blockedUntil: string;
      reason?: string;
    }) => adminApi.blockUser(id, { blockedUntil, reason }),

    onSuccess: data => {
      toast.success(data.message || "User soft-blocked successfully");
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      queryClient.invalidateQueries({ queryKey: ["userDetails"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },

    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to block user";
      toast.error(msg);
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.unblockUser(id),

    onSuccess: data => {
      toast.success(data.message || "User unblocked successfully");
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      queryClient.invalidateQueries({ queryKey: ["userDetails"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },

    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to unblock user";
      toast.error(msg);
    },
  });
};

export const useSoftDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      reason,
      immediateHardDelete,
    }: {
      id: string;
      reason?: string;
      immediateHardDelete?: boolean;
    }) => adminApi.softDeleteUser(id, { reason, immediateHardDelete }),

    onSuccess: data => {
      toast.success(data.message || "User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      queryClient.invalidateQueries({ queryKey: ["userDetails"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },

    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to delete user";
      toast.error(msg);
    },
  });
};

export const useRestoreUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.restoreUser(id),

    onSuccess: data => {
      toast.success(data.message || "User restored successfully");
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      queryClient.invalidateQueries({ queryKey: ["userDetails"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },

    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to restore user";
      toast.error(msg);
    },
  });
};

export const useFlagUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
      reason,
      note,
    }: {
      id: string;
      action: "BLOCK" | "DELETE";
      reason: string;
      note?: string;
    }) => adminApi.flagUser(id, { action, reason, note }),

    onSuccess: data => {
      toast.success(data.message || "Flag submitted to Super Admin");
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      queryClient.invalidateQueries({ queryKey: ["userDetails"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },

    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to submit moderation flag";
      toast.error(msg);
    },
  });
};

export const useResolveFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      flagId,
      status,
    }: {
      flagId: string;
      status: "APPROVED" | "REJECTED";
    }) => adminApi.resolveFlag(flagId, { status }),

    onSuccess: data => {
      toast.success(data.message || "Flag resolved successfully");
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      queryClient.invalidateQueries({ queryKey: ["userDetails"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },

    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to resolve flag";
      toast.error(msg);
    },
  });
};
