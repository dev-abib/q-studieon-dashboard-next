"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { toast } from "sonner";

export interface SecurityAlertItem {
  id: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  staffId: string | null;
  staffEmail: string | null;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  isResolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

export function useSecurityAlerts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["security-alerts"],
    queryFn: async () => {
      const res = await adminApi.getSecurityAlerts(false);
      return res?.data as {
        alerts: SecurityAlertItem[];
        unresolvedCount: number;
      };
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const resolveMutation = useMutation({
    mutationFn: (alertId: string) => adminApi.resolveSecurityAlert(alertId),
    onSuccess: (data) => {
      toast.success(data.message || "Security alert resolved");
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] });
    },
  });

  return {
    alerts: query.data?.alerts || [],
    unresolvedCount: query.data?.unresolvedCount || 0,
    isLoading: query.isLoading,
    resolveAlert: resolveMutation.mutate,
    isResolving: resolveMutation.isPending,
  };
}
