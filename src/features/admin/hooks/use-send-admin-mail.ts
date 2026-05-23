import { adminApi } from "@/services/admin-api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useSendAdminMail = () => {
  return useMutation({
    mutationFn: adminApi.sendAdminMail,
    onSuccess: async data => {
      toast.success(data.message);
    },
    onError: (error: unknown) => {
      toast.error((error as any)?.response?.data?.message);
    },
  });
};
