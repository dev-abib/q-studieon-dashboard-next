import { z } from "zod";
import { ChangePasswordSchema } from "../schema/change-password.schema";

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
