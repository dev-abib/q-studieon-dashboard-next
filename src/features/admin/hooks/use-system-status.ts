import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";

export interface SystemStatusData {
  timestamp: string;
  overallStatus: "all_systems_operational" | "degraded_performance" | "major_outage";
  uptime: {
    seconds: number;
    formatted: string;
    percentage: string;
  };
  aiTokenMetrics: {
    totalTokensUsed: number;
    promptTokens: number;
    completionTokens: number;
    monthlyQuota: number;
    tokensRemaining: number;
    quotaUsedPercent: number;
    estimatedCostUsd: number;
    modelDistribution: Array<{
      model: string;
      percentage: number;
      tokens: number;
    }>;
    dailyTokens: Array<{
      date: string;
      tokens: number;
      cost: number;
    }>;
  };
  databaseMetrics: {
    status: string;
    pingLatencyMs: number;
    connectionPool: {
      activeClients: number;
      maxPoolSize: number;
      idleTimeoutMs: number;
      connectionTimeoutMs: number;
    };
    tableCounts: {
      users: number;
      reports: number;
      onsiteReports: number;
      collections: number;
      contactQueries: number;
      auditLogs: number;
      sessions: number;
      securityAlerts: number;
      internalNotes: number;
    };
    storageEstimatedMb: number;
  };
  serverHealth: {
    nodeVersion: string;
    platform: string;
    cpuCores: number;
    cpuModel: string;
    memoryUsage: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
      systemTotalMb: number;
      systemFreeMb: number;
    };
    activePresenceCount: number;
  };
  integrations: Array<{
    name: string;
    category: string;
    status: "operational" | "degraded" | "outage";
    latency: string;
    icon: string;
    description: string;
  }>;
}

export function useSystemStatus() {
  return useQuery<SystemStatusData>({
    queryKey: ["system-status"],
    queryFn: async () => {
      const res = await adminApi.getSystemStatus();
      return res.data;
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}
