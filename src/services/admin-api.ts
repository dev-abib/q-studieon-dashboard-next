import { api } from "./api-client";
import { PasswordUpdatePayload } from "@/features/admin/types/admin.types";

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
    const res = await api.put(`/admin/update-admin`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  getAllAdmin: async (params: GetAllAdminParams) => {
    const res = await api.get(`/admin/get-all-admins`, {
      params,
    });
    return res.data;
  },
};
