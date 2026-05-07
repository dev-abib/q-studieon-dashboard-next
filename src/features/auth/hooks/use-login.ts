"use client"; // ✅ hooks are always client
import { saveTokensAction } from "@/actions/auth-actions";
import { authApi } from "@/services/auth-api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async data => {
      toast.success(data.message);
      const { refreshToken, accessToken } = data.data.tokens;
      await saveTokensAction(accessToken, refreshToken);
      router.push("/dashboard");
    },
    onError: (error: unknown) => {
      toast.error((error as any)?.response?.data?.message ?? "Login failed");
    },
  });
}
