import { AdminMailSchema } from "@/features/auth/schema/send-mail.schema";
import { api } from "./api-client";

type GetAllAdminParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
};

export const adminApi = {
  getMe: async () => {
    const res = await api.get(`/admin/get-me-admin`);
    return res.data;
  },

  updateProfile: async (payload: FormData) => {
    // Do NOT set Content-Type manually: axios appends the multipart boundary
    // itself when given FormData, and a header without the boundary breaks
    // multer parsing on the backend.
    const res = await api.put(`/admin/update-admin`, payload);
    return res.data;
  },

  getAllAdmin: async (params: GetAllAdminParams) => {
    const res = await api.get(`/admin/get-all-admins`, {
      params,
    });
    return res.data;
  },

  getDashboardAnalytics: async () => {
    const res = await api.get("/admin/dashboard-analytics");
    return res.data;
  },

  getUserDetails: async (id: string) => {
    const res = await api.get(`/admin/user/${id}`);
    return res.data;
  },

  sendAdminMail: async (payload: unknown) => {
    const data = AdminMailSchema.parse(payload);
    const res = await api.post(`/admin/admin-mail`, data);

    return res.data;
  },

  softDeleteUser: async (id: string, payload?: { reason?: string; immediateHardDelete?: boolean }) => {
    const res = await api.post(`/admin/soft-delete-user/${id}`, payload || {});
    return res.data;
  },

  restoreUser: async (id: string) => {
    const res = await api.patch(`/admin/restore-user/${id}`);
    return res.data;
  },

  blockUser: async (id: string, payload: { blockedUntil: string; reason?: string }) => {
    const res = await api.patch(`/admin/block-user/${id}`, payload);
    return res.data;
  },

  unblockUser: async (id: string) => {
    const res = await api.patch(`/admin/unblock-user/${id}`);
    return res.data;
  },

  flagUser: async (id: string, payload: { action: 'BLOCK' | 'DELETE'; reason: string; note?: string }) => {
    const res = await api.post(`/admin/flag-user/${id}`, payload);
    return res.data;
  },

  resolveFlag: async (flagId: string, payload: { status: 'APPROVED' | 'REJECTED' }) => {
    const res = await api.patch(`/admin/resolve-flag/${flagId}`, payload);
    return res.data;
  },

  grantUserAccess: async (
    userId: string,
    payload: {
      plan: '1_month' | '3_months' | '6_months' | '1_year' | 'custom' | 'lifetime';
      customEndDate?: string;
      reason?: string;
      billingCycle?: 'monthly' | 'yearly';
    }
  ) => {
    const res = await api.patch(`/admin/grant-access/${userId}`, payload);
    return res.data;
  },

  revokeUserAccess: async (userId: string, payload?: { reason?: string }) => {
    const res = await api.patch(`/admin/revoke-access/${userId}`, payload || {});
    return res.data;
  },

  togglePasswordPermission: async (
    staffId: string,
    canChangePassword: boolean,
  ) => {
    const res = await api.patch(`/admin/toggle-password-permission/${staffId}`, {
      canChangePassword,
    });
    return res.data;
  },

  updatePermissions: async (
    staffId: string,
    permissions: {
      canDeleteQueries?: boolean;
      canViewUserDetails?: boolean;
      canChangePassword?: boolean;
      canManageFaqs?: boolean;
      canManagePages?: boolean;
      canManageTasks?: boolean;
      canManagePayments?: boolean;
      canManageReports?: boolean;
    }
  ) => {
    const res = await api.patch(`/admin/update-permissions/${staffId}`, permissions);
    return res.data;
  },

  getStaffProfile: async (staffId: string) => {
    const res = await api.get(`/admin/staff-profile/${staffId || "me"}`);
    return res.data;
  },

  getAuditLogs: async (params?: any) => {
    const res = await api.get(`/admin/audit-logs`, { params });
    return res.data;
  },

  getTeamWorkTimeSummary: async () => {
    const res = await api.get(`/admin/work-time-summary`);
    return res.data;
  },

  getStaffWorkTime: async (staffId: string) => {
    const res = await api.get(`/admin/staff-work-time/${staffId || "me"}`);
    return res.data;
  },

  // Real-Time Team Presence & Heartbeat
  sendPresenceHeartbeat: async (dto: {
    currentPath?: string;
    targetId?: string;
    targetType?: string;
    isTyping?: boolean;
  }) => {
    const res = await api.post(`/admin/presence/heartbeat`, dto);
    return res.data;
  },

  getActivePresence: async (targetId?: string) => {
    const res = await api.get(`/admin/presence/active`, {
      params: targetId ? { targetId } : undefined,
    });
    return res.data;
  },

  // Internal Staff Notes
  getInternalNotes: async (targetType: string, targetId: string) => {
    const res = await api.get(`/admin/internal-notes/${targetType}/${targetId}`);
    return res.data;
  },

  createInternalNote: async (dto: {
    targetType: string;
    targetId: string;
    content: string;
    isPinned?: boolean;
  }) => {
    const res = await api.post(`/admin/internal-notes`, dto);
    return res.data;
  },

  togglePinInternalNote: async (noteId: string) => {
    const res = await api.patch(`/admin/internal-notes/${noteId}/pin`);
    return res.data;
  },

  deleteInternalNote: async (noteId: string) => {
    const res = await api.delete(`/admin/internal-notes/${noteId}`);
    return res.data;
  },

  // Security & Anomaly Alerts
  getSecurityAlerts: async (isResolved?: boolean) => {
    const res = await api.get(`/admin/security-alerts`, {
      params: { isResolved: isResolved ? "true" : "false" },
    });
    return res.data;
  },

  resolveSecurityAlert: async (alertId: string) => {
    const res = await api.patch(`/admin/security-alerts/${alertId}/resolve`);
    return res.data;
  },

  // Super Admin: Impersonate User
  impersonateUser: async (userId: string) => {
    const res = await api.post(`/admin/impersonate-user/${userId}`);
    return res.data;
  },

  // VIP Grant Expiry Check Trigger
  triggerGrantExpiryCheck: async () => {
    const res = await api.post(`/admin/trigger-grant-expiry-check`);
    return res.data;
  },

  // System Status & Health Metrics
  getSystemStatus: async () => {
    const res = await api.get(`/admin/system/status`);
    return res.data;
  },

  // CSV Exports
  exportWorkTimeCsvUrl: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"}/admin/export/work-time-csv`,
  exportAuditLogsCsvUrl: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"}/admin/export/audit-logs-csv`,
};
