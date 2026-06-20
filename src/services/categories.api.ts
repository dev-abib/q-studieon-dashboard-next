import { api } from "./api-client";

export type GetAllCategoriesParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "slug" | "createdAt";
  sortOrder?: "asc" | "desc";
};

export const categoriesApi = {
  getAllCategories: async (params?: GetAllCategoriesParams) => {
    const res = await api.get(`/categories/get-all-categories`, { params });
    return res.data;
  },

  getCategoryById: async (id: string) => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },

  createCategory: async (formData: FormData) => {
    const res = await api.post(`/categories/create-category`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  updateCategory: async (id: string, formData: FormData) => {
    const res = await api.put(`/categories/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  deleteCategory: async (id: string) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};
