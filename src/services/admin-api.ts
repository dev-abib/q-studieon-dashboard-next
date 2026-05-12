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

  getAllAdmin: async (params: GetAllAdminParams) => {
    const res = await api.get(`/admin/get-all-admins`, {
      params,
    });
    return res.data;
  },
};
