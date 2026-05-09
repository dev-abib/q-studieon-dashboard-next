import { api } from "./api-client";

type GetAllUsersParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
};

export const userApi = {
  getAllUsers: async (params: GetAllUsersParams) => {
    const res = await api.get(`/admin/get-all-users`, {
      params,
    });
    return res.data;
  },
};
