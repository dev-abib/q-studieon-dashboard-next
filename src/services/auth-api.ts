import { loginSchema } from "@/features/auth/schema/login-payload.schema";
import { api } from "./api-client";

export const authApi = {
  login: async (payload: unknown) => {
    const data = loginSchema.parse(payload);

    const res = await api.post(`/auth/admin/login`, data);
    return res.data;
  },
};
