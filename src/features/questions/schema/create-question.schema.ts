import { z } from "zod";

const ALLOWED_OPTIONS = ["yes", "no", "not_sure"] as const;

export const createQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  options: z
    .array(z.enum(ALLOWED_OPTIONS))
    .length(3, "Exactly 3 options are required")
    .refine(
      val =>
        val.includes("yes") &&
        val.includes("no") &&
        val.includes("not_sure"),
      "Options must include yes, no, and not_sure",
    ),
  categoryId: z.string().min(1, "Category is required"),
});
