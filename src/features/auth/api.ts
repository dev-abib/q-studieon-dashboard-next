import { api } from "@/services/api-client";
import { adminSchema } from "./schema/admin.schema";

const getMe = async () => {
  const res = await api.get("/admin/get-me-admin");
  return adminSchema.parse(res.data.data);
};
