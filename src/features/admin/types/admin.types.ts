import { z } from "zod";
import { adminSchema } from "../../auth/schema/admin.schema";

export type Admin = z.infer<typeof adminSchema>;

export type AdminUpdatePayload = {
  name?: string;
  email?: string;
  profilePictureURL?: string;
};

export type PasswordUpdatePayload = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};
