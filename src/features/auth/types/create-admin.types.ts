import { z } from "zod";
import { createAdminSchema } from "../schema/create-admin.schema";

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
