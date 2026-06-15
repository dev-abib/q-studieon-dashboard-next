import { z } from "zod";

export const updateQuestionSchema = z
  .object({
    text: z.string().optional(),
    slug: z.string().optional(),
    options: z.array(z.string().min(1, "Option cannot be empty")).optional(),
  })
  .refine(data => Object.values(data).some(v => v !== undefined), {
    message: "At least one field must be provided",
  });
