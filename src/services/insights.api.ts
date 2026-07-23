import { api } from "./api-client";

export type GetAllInsightsParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "title" | "subTitle" | "createdAt";
  sortOrder?: "asc" | "desc";
};

export const insightsApi = {
  getAllInsights: async (params?: GetAllInsightsParams) => {
    const res = await api.get(`/insight/get-all`, { params });
    return res.data;
  },

  getInsightById: async (id: string) => {
    const res = await api.get(`/insight/${id}`);
    return res.data;
  },

  createInsight: async (formData: FormData) => {
    const res = await api.post(`/insight/create`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  updateInsight: async (id: string, formData: FormData) => {
    const res = await api.put(`/insight/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  deleteInsight: async (id: string) => {
    const res = await api.delete(`/insight/${id}`);
    return res.data;
  },
};
