import { z } from "zod";
import { updatePageSchema } from "../schema/update.page.schema";

export type UpdatePageInput = z.infer<typeof updatePageSchema>;
