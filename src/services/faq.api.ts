import { api } from "./api-client";

export type GetAllFaqsParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "title" | "sortOrder" | "createdAt";
  sortOrder?: "asc" | "desc";
};

export const faqApi = {
  getAllFaqs: async (params?: GetAllFaqsParams) => {
    const res = await api.get(`/faq/get-all`, { params });
    return res.data;
  },

  getFaqById: async (id: string) => {
    const res = await api.get(`/faq/${id}`);
    return res.data;
  },

  createFaq: async (formData: FormData) => {
    const res = await api.post(`/faq/create`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  updateFaq: async (id: string, formData: FormData) => {
    const res = await api.put(`/faq/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  deleteFaq: async (id: string) => {
    const res = await api.delete(`/faq/${id}`);
    return res.data;
  },
};
