import { z } from "zod";
import { adminSchema } from "../schema/admin.schema";

export type Admin = z.infer<typeof adminSchema>;
