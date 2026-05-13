import { loginSchema } from "@/features/auth/schema/login-payload.schema";
import { api } from "./api-client";
import { createAdminSchema } from "@/features/auth/schema/create-admin.schema";

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
};
