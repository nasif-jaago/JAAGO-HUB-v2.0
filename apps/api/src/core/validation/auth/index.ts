import { z } from "zod";
import { emailSchema } from "../common/index.js";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const inviteUserSchema = z.object({
  email: emailSchema,
  roleId: z.string().uuid("Must be a valid role ID"),
  officeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  message: z.string().max(500).optional(),
});

export const acceptInvitationSchema = z
  .object({
    token: z.string().min(1),
    displayName: z.string().min(2).max(100),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
