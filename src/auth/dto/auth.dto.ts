import { z } from "zod";
import { Role, Roles } from "../model/user";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  code: z.string().min(1, "Code is required"),
  jobId: z.string().min(1).optional(),
});
export type RegisterRequest = z.infer<typeof RegisterSchema>;

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  jobId: z.string().min(1).optional(),
  managerUserId: z.string().min(1).nullable().optional(),
  roles: z.array(z.enum(Roles)).optional(),
});
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;

export const CreateUserWithoutPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  code: z.string().min(1, "Code is required"),
});
export type CreateUserWithoutPasswordRequest = z.infer<typeof CreateUserWithoutPasswordSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const ResetPasswordTokenSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  password: z.string(),
  token: z.string(),
});

export type AccountResetPasswordToken = z.infer<typeof ResetPasswordTokenSchema>;
export type AccountResetPassword = z.infer<typeof ResetPasswordSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export type UserResponse = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  code: string;
  jobId: string | null;
  managerUserId: string | null;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
};
