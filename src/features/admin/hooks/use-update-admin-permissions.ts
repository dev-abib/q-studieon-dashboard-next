import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { toast } from "sonner";

export const useUpdateAdminPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      staffId,
      permissions,
    }: {
      staffId: string;
      permissions: {
        canDeleteQueries?: boolean;
        canViewUserDetails?: boolean;
        canChangePassword?: boolean;
        canManageFaqs?: boolean;
        canManagePages?: boolean;
        canManageTasks?: boolean;
        canManagePayments?: boolean;
        canManageReports?: boolean;
      };
    }) => adminApi.updatePermissions(staffId, permissions),

    onSuccess: (data) => {
      toast.success(data.message || "Permissions updated successfully");
      queryClient.invalidateQueries({ queryKey: ["contact-queries", "staff-members"] });
      queryClient.invalidateQueries({ queryKey: ["contact-queries-stats"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["adminProfile"] });
    },

    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to update permissions";
      toast.error(msg);
    },
  });
};
