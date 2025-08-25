import { z } from "zod";
import { Role } from "../model/user";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const resetPasswordTokenSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  password: z.string(),
  token: z.string(),
});

export type AccountResetPasswordToken = z.infer<typeof resetPasswordTokenSchema>;
export type AccountResetPassword = z.infer<typeof ResetPasswordSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export type UserResponse = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
};
