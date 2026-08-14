"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApi } from "@/services/admin-api";
import { usePathname } from "next/navigation";

export interface ActiveStaffItem {
  staffId: string;
  name: string;
  email: string;
  role: string;
  profilePictureURL: string | null;
  currentPath: string;
  targetId: string | null;
  targetType: string | null;
  isTyping: boolean;
  lastHeartbeat: string;
}

export function useTeamPresence(targetId?: string, targetType?: string) {
  const pathname = usePathname();

  // Pulse heartbeat mutation
  const { mutate: sendHeartbeat } = useMutation({
    mutationFn: (dto: {
      currentPath?: string;
      targetId?: string;
      targetType?: string;
      isTyping?: boolean;
    }) => adminApi.sendPresenceHeartbeat(dto),
  });

  // Automatically pulse heartbeat on path change and every 25 seconds
  useEffect(() => {
    sendHeartbeat({
      currentPath: pathname,
      targetId,
      targetType,
    });

    const interval = setInterval(() => {
      sendHeartbeat({
        currentPath: pathname,
        targetId,
        targetType,
      });
    }, 25000);

    return () => clearInterval(interval);
  }, [pathname, targetId, targetType, sendHeartbeat]);

  // Query active staff & collisions
  const { data, refetch } = useQuery({
    queryKey: ["team-presence", targetId],
    queryFn: async () => {
      const res = await adminApi.getActivePresence(targetId);
      return res?.data as {
        activeStaff: ActiveStaffItem[];
        activeCount: number;
        collisions: ActiveStaffItem[];
      };
    },
    refetchInterval: 10000, // Poll every 10s
    staleTime: 5000,
  });

  return {
    activeStaff: data?.activeStaff || [],
    activeCount: data?.activeCount || 0,
    collisions: data?.collisions || [],
    refetch,
  };
}
