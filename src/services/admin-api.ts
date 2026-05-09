import { api } from "./api-client";

export const adminApi = {
  getMe: async () => {
    const res = await api.get(`/admin/get-me-admin`);
    return res.data;
  },
};
