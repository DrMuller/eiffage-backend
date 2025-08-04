import { Request, Response } from "express";
import {
  refreshToken,
  createUser,
  loginUser,
  getResetPasswordToken,
  resetPassword,
  createUserWithoutPassword,
} from "../service/auth.service";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  ResetPasswordSchema,
  resetPasswordTokenSchema,
} from "../dto/auth.dto";
import { asyncHandler } from "../../utils/express/asyncHandler";
import appConfig from "../../app.config";
import { z } from "zod";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const validation = registerSchema.parse(req.body);
  const user = await createUser(validation);
  res.status(201).json(user);
});

export const signin = asyncHandler(async (req: Request, res: Response) => {
  const request = loginSchema.parse(req.body);
  const user = await loginUser(request);
  res.status(200).json(user);
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = refreshTokenSchema.parse(req.body);
  const tokens = await refreshToken(token);
  res.status(200).json(tokens);
});

export const postResetPasswordToken = asyncHandler(async (req: Request, res: Response) => {
  const urlReset = appConfig.webapp.resetUrl;
  const resetPasswordToken = resetPasswordTokenSchema.parse(req.body);
  await getResetPasswordToken(resetPasswordToken, urlReset);
  res.status(204).send();
});

export const postResetPassword = asyncHandler(async (req: Request, res: Response) => {
  const requestResetPassword = ResetPasswordSchema.parse(req.body);
  await resetPassword(requestResetPassword);
  res.status(204).send();
});

const createUserWithoutPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
});

export const createUserWithoutPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const validation = createUserWithoutPasswordSchema.parse(req.body);
  const user = await createUserWithoutPassword(validation);
  res.status(201).json(user);
});
