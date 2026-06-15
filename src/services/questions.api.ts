import { api } from "./api-client";

export type GetAllQuestionsParams = {
  page?: number;
  limit?: number;
  sortBy?: "text" | "slug" | "createdAt";
  sortOrder?: "asc" | "desc";
  search?: string;
};

export type CreateQuestionPayload = {
  text: string;
  slug: string;
  options: string[];
};

export type UpdateQuestionPayload = Partial<CreateQuestionPayload>;

export const questionsApi = {
  getAllQuestions: async (params?: GetAllQuestionsParams) => {
    const res = await api.get(`/questions/get-all-questions`, {
      params,
    });
    return res.data;
  },

  getQuestionById: async (id: string) => {
    const res = await api.get(`/questions/${id}`);
    return res.data;
  },

  getQuestionsBySlug: async (slug: string) => {
    const res = await api.get(`/questions/by-slug/${slug}`);
    return res.data;
  },

  createQuestion: async (payload: CreateQuestionPayload) => {
    const res = await api.post(`/questions/create-questions`, payload);
    return res.data;
  },

  updateQuestion: async (id: string, payload: UpdateQuestionPayload) => {
    const res = await api.put(`/questions/${id}`, payload);
    return res.data;
  },

  deleteQuestion: async (id: string) => {
    const res = await api.delete(`/questions/${id}`);
    return res.data;
  },
};
