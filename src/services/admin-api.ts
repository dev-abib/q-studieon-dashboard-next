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
};
