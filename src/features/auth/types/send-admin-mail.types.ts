import { z } from "zod";
import { AdminMailSchema } from "../schema/send-mail.schema";

export type CreateAdminMailInput = z.infer<typeof AdminMailSchema>;
