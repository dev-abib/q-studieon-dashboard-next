import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";

export interface AuditLogItem {
  id: string;
  staffId: string;
  staffName: string | null;
  staffEmail: string | null;
  staffRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityTitle: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  staff?: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    isOwner: boolean;
    profilePictureURL: string | null;
  };
}

export interface TeamLeaderboardItem {
  id: string;
  name: string;
  email: string | null;
  role: string;
  isOwner: boolean;
  profilePictureURL: string | null;
  lastLoginAt: string | null;
  totalHours: number;
  todayHours: number;
  thisWeekHours: number;
  sessionCount: number;
  tasksPerformed: number;
  isActiveToday: boolean;
}

export interface TeamWorkTimeSummaryData {
  metrics: {
    totalTeamHours: number;
    todayTeamHours: number;
    totalStaffCount: number;
    activeTodayCount: number;
  };
  leaderboard: TeamLeaderboardItem[];
  dailyBreakdown: Array<{
    date: string;
    hours: number;
    minutes: number;
  }>;
}

export interface StaffWorkTimeDetailsData {
  staff: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    isOwner: boolean;
    profilePictureURL: string | null;
    lastLoginAt: string | null;
    lastActiveIp: string | null;
  };
  workTime: {
    totalHours: number;
    todayHours: number;
    thisWeekHours: number;
    avgSessionMinutes: number;
    totalSessions: number;
    tasksCount: number;
  };
  dailyBreakdown: Array<{
    date: string;
    hours: number;
    minutes: number;
  }>;
  sessions: Array<{
    id: string;
    ipAddress?: string | null;
    browser?: string | null;
    os?: string | null;
    device?: string | null;
    city?: string | null;
    country?: string | null;
    loginAt: string;
    lastActiveAt: string;
    durationSeconds: number;
    isCurrent: boolean;
  }>;
}

export function useAuditLogs(params?: {
  page?: number;
  limit?: number;
  staffId?: string;
  action?: string;
  entityType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: async () => {
      const res = await adminApi.getAuditLogs(params);
      return res?.data as {
        logs: AuditLogItem[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useTeamWorkTimeSummary() {
  return useQuery({
    queryKey: ["team-work-time-summary"],
    queryFn: async () => {
      const res = await adminApi.getTeamWorkTimeSummary();
      return res?.data as TeamWorkTimeSummaryData;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useStaffWorkTime(staffId: string) {
  return useQuery({
    queryKey: ["staff-work-time", staffId || "me"],
    queryFn: async () => {
      const res = await adminApi.getStaffWorkTime(staffId);
      return res?.data as StaffWorkTimeDetailsData;
    },
    enabled: Boolean(staffId),
    staleTime: 1000 * 60,
  });
}
