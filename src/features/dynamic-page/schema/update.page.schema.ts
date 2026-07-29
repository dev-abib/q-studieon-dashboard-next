import { z } from "zod";

export const updatePageSchema = z
  .object({
    title: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    isPublished: z.boolean().optional(),
  })
  .refine(data => Object.values(data).some(v => v !== undefined), {
    message:
      "At least one field (title, slug, description, or isPublished) must be provided",
  });
