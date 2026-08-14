import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { toast } from "sonner";

export const useTogglePasswordPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      staffId,
      canChangePassword,
    }: {
      staffId: string;
      canChangePassword: boolean;
    }) => adminApi.togglePasswordPermission(staffId, canChangePassword),

    onSuccess: data => {
      toast.success(data.message || "Password change permission updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["contact-queries", "staff-members"] });
    },

    onError: (error: any) => {
      const msg =
        error.response?.data?.message || "Failed to update password permission";
      toast.error(msg);
    },
  });
};
