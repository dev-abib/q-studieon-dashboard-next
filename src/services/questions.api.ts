import { api } from "./api-client";

export type GetAllQuestionsParams = {
  page?: number;
  limit?: number;
  sortBy?: "text" | "createdAt";
  sortOrder?: "asc" | "desc";
  search?: string;
  categoryId?: string;
};

export type CreateQuestionPayload = {
  text: string;
  options: string[];
  categoryId: string;
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
