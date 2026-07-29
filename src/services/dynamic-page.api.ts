import { createPageSchema } from "@/features/dynamic-page/schema/create.page.schema";
import { api } from "./api-client";
import { updatePageSchema } from "@/features/dynamic-page/schema/update.page.schema";

export type GetAllPagesParams = {
  page?: number;
  limit?: number;
  sortBy?: "title" | "slug" | "createdAt";
  sortOrder?: "asc" | "desc";
  search?: string;
  published?: boolean;
};

type CreatePagePayload = {
  title: string;
  slug: string;
  description: string;
  isPublished?: boolean;
};

type UpdatePagePayload = Partial<CreatePagePayload>;

export const dynamicPageApi = {
  getAllPages: async (params?: GetAllPagesParams) => {
    const res = await api.get(`/dynamic-page/get-all-pages`, { params });
    return res.data;
  },

  getPageBySlug: async (slug: string) => {
    const res = await api.get(`/dynamic-page/${slug}`);
    return res.data;
  },

  createPage: async (payload: unknown) => {
    const data = createPageSchema.parse(payload);
    const res = await api.post(`/dynamic-page/create-page`, data);
    return res.data;
  },

  updatePage: async (slug: string, payload: unknown) => {
    const data = updatePageSchema.parse(payload);
    const res = await api.put(`/dynamic-page/update/${slug}`, data);
    return res.data;
  },

  deletePage: async (slug: string) => {
    const res = await api.delete(`/dynamic-page/delete/${slug}`);
    return res.data;
  },
};
