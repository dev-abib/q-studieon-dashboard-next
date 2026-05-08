import { api } from "./api-client";

export const adminApi = {
  getMe: async () => {
    const res = await api.get(`/admin/get-me-admin`);
    console.log(res);

    return res.data;
  },
};
