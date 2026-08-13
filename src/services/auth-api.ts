import { loginSchema } from "@/features/auth/schema/login-payload.schema";
import { api } from "./api-client";
import { createAdminSchema } from "@/features/auth/schema/create-admin.schema";
import { ChangePasswordSchema } from "@/features/auth/schema/change-password.schema";

export const authApi = {
  login: async (payload: unknown) => {
    const data = loginSchema.parse(payload);
    const res = await api.post(`/auth/admin/login`, data);    
    return res.data;
  },

  logOut: async () => {
    const res = await api.post(`/auth/admin/log-out`);
    return res.data;
  },

  createAdmin: async (payload: unknown) => {
    const data = createAdminSchema.parse(payload);
    const res = await api.post(`/admin/create-admin`, data);
    return res.data;
  },

  deleteAdmin: async (id: string) => {
    const res = await api.delete(`/admin/delete-admin/${id}`);
    return res.data;
  },

  deleteUser: async (id: string) => {
    const res = await api.delete(`/admin/delete-user/${id}`);
    return res.data;
  },

  changePassword: async (payload: unknown) => {
    const data = ChangePasswordSchema.parse(payload);
    const res = await api.put(`/auth/admin/change-password`, data);
    return res.data;
  },

  inviteMember: async (payload: { email: string; role: string }) => {
    const res = await api.post(`/admin/invite-member`, payload);
    return res.data;
  },

  verifyInvite: async (token: string) => {
    const res = await api.get(`/admin/verify-invite?token=${token}`);
    return res.data;
  },

  acceptInvite: async (payload: {
    token: string;
    name: string;
    password: string;
    confirmPassword: string;
  }) => {
    const res = await api.post(`/admin/accept-invite`, payload);
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post(`/admin/forgot-password`, { email });
    return res.data;
  },

  resetPassword: async (payload: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const res = await api.post(`/admin/reset-password`, payload);
    return res.data;
  },
};
