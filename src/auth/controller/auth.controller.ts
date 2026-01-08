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
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ResetPasswordSchema,
  ResetPasswordTokenSchema,
} from "../dto/auth.dto";
import { asyncHandler } from "../../utils/express/asyncHandler";
import appConfig from "../../app.config";
import { z } from "zod";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const validation = RegisterSchema.parse(req.body);
  const user = await createUser(validation);
  res.status(201).json(user);
});

export const signin = asyncHandler(async (req: Request, res: Response) => {
  const request = LoginSchema.parse(req.body);
  const user = await loginUser(request);
  res.status(200).json(user);
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = RefreshTokenSchema.parse(req.body);
  const tokens = await refreshToken(token);
  res.status(200).json(tokens);
});

export const postResetPasswordToken = asyncHandler(async (req: Request, res: Response) => {
  const urlReset = appConfig.webapp.webappUrl + '/auth/reset-password';
  const resetPasswordToken = ResetPasswordTokenSchema.parse(req.body);
  await getResetPasswordToken(resetPasswordToken, urlReset);
  res.status(204).send();
});

export const postResetPasswordTokenEvaluation = asyncHandler(async (req: Request, res: Response) => {
  const urlReset = appConfig.webapp.evaluationWebappUrl + '/auth/reset-password';
  const resetPasswordToken = ResetPasswordTokenSchema.parse(req.body);
  await getResetPasswordToken(resetPasswordToken, urlReset);
  res.status(204).send();
});

export const postResetPassword = asyncHandler(async (req: Request, res: Response) => {
  const requestResetPassword = ResetPasswordSchema.parse(req.body);
  await resetPassword(requestResetPassword);
  res.status(204).send();
});

export const createUserWithoutPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  code: z.string().min(1, "Code requis"),
});
export type CreateUserWithoutPasswordRequest = z.infer<typeof createUserWithoutPasswordSchema>;


export const createUserWithoutPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const validation = createUserWithoutPasswordSchema.parse(req.body);
  const user = await createUserWithoutPassword(validation);
  res.status(201).json(user);
});
