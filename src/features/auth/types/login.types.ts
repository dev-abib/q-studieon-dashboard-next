import { z } from "zod";
import { loginSchema } from "../schema/login-payload.schema";

export type LoginFormData = z.infer<typeof loginSchema>;
