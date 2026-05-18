import { z } from "zod";
import { createPageSchema } from "../schema/create.page.schema";

export type CreatePagedInput = z.infer<typeof createPageSchema>;
