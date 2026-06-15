import { z } from "zod";

export const createQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  slug: z.string().min(1, "Slug is required"),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .min(1, "At least one option is required"),
});
