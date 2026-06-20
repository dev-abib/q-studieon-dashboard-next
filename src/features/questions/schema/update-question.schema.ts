import { z } from "zod";

const ALLOWED_OPTIONS = ["yes", "no", "not_sure"] as const;

export const updateQuestionSchema = z
  .object({
    text: z.string().optional(),
    options: z
      .array(z.enum(ALLOWED_OPTIONS))
      .length(3, "Exactly 3 options are required")
      .refine(
        val =>
          val.includes("yes") &&
          val.includes("no") &&
          val.includes("not_sure"),
        "Options must include yes, no, and not_sure",
      )
      .optional(),
    categoryId: z.string().optional(),
  })
  .refine(data => Object.values(data).some(v => v !== undefined), {
    message: "At least one field must be provided",
  });
