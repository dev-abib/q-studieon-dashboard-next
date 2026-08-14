import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";

export interface StaffDuty {
  id: string;
  title: string;
  category: string;
  description: string;
  status: "active" | "restricted" | "pending";
  coverage: string;
}

export interface StaffSession {
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
}

export interface StaffTimelineItem {
  id: string;
  type: string;
  title: string;
  detail: string;
  timestamp: string;
  badge: string;
}

export interface StaffProfileData {
  profile: {
    id: string;
    name: string;
    email: string;
    role: string;
    isOwner: boolean;
    isOtpVerified: boolean;
    profilePictureURL: string | null;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    lastActiveIp: string | null;
    loginCount: number;
    totalSessionMinutes: number;
  };
  permissions: {
    canViewUserDetails: boolean;
    canDeleteQueries: boolean;
    canChangePassword: boolean;
    isSuperAdmin: boolean;
  };
  stats: {
    queriesReplied: number;
    flagsCreated: number;
    invitationsSent: number;
    accessGrantedCount: number;
    totalSessions: number;
    totalSessionMinutes: number;
    dutiesCount: number;
    activeDutiesCount: number;
  };
  duties: StaffDuty[];
  recentSessions: StaffSession[];
  recentTimeline: StaffTimelineItem[];
  viewer: {
    id: string;
    role: string;
    isOwner: boolean;
    isSuperAdmin: boolean;
    isSelf: boolean;
  };
}

export function useStaffProfile(staffId: string) {
  return useQuery({
    queryKey: ["staff-profile", staffId || "me"],
    queryFn: async () => {
      const res = await adminApi.getStaffProfile(staffId);
      return res?.data as StaffProfileData;
    },
    enabled: Boolean(staffId),
    staleTime: 1000 * 60 * 2,
  });
}
