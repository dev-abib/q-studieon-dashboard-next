"use client";
import { adminApi } from "@/services/admin-api";
import { useQuery } from "@tanstack/react-query";

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: adminApi.getDashboardAnalytics,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
