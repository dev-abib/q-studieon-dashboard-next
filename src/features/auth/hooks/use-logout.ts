"use client";
import { queryClient } from "@/providers/query-provider";
import { authApi } from "@/services/auth-api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useLogOut() {
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logOut,
    onSuccess: async data => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      router.push("/");
    },
    onError: (error: unknown) => {
      toast.error((error as any)?.response?.data?.message ?? "Logout failed");
    },
  });
}
