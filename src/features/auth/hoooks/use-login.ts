import { authApi } from "@/services/auth-api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useLogin() {
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: data => {
      toast.success(data.message);
    },
    onError: (error: unknown) => {
      toast.error((error as any)?.response?.data?.message);
    },
  });
}
