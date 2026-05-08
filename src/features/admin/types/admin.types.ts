import { z } from "zod";
import { adminSchema } from "../../auth/schema/admin.schema";

export type Admin = z.infer<typeof adminSchema>;
