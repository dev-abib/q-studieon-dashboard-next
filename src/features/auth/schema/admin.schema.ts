import { z } from "zod";

export const adminSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  profilePictureURL: z.string().nullable(),
  isPaid: z.boolean(),
  isGuest: z.boolean(),
  isOtpVerified: z.boolean(),
  guestExpiresAt: z.string().nullable(),
  authProvider: z.string(),
  billingCycle: z.string(),
  status: z.string(),
  currentPeriodEnd: z.string().nullable(),
  role: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  termsAndConditions: z.boolean(),
});
