"use client";
import { adminApi } from "@/services/admin-api";
import { useQuery } from "@tanstack/react-query";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: adminApi.getMe,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
