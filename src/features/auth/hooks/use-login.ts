"use client";
import { queryClient } from "@/providers/query-provider";
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
      router.push("/dashboard");
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error: unknown) => {
      console.log(error);

      toast.error((error as any)?.response?.data?.message);
    },
  });
}
