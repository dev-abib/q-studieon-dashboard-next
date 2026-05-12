import { api } from "./api-client";
import { PasswordUpdatePayload } from "@/features/admin/types/admin.types";

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
  updatePassword: async (payload: PasswordUpdatePayload) => {
    const { ...data } = payload;
    const res = await api.patch(`/admin/update-admin-password`, data);
    return res.data;
  },
};
