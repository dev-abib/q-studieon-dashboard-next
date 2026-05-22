import { z } from "zod";

export const AdminMailSchema = z.object({
  email: z.string(),
  subject: z.string(),
  message: z.string(),
});
