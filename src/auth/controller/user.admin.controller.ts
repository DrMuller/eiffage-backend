import { Request, Response } from "express";
import { getUsers, createUserWithoutPassword } from "../service/auth.service";
import { asyncHandler } from "../../utils/express/asyncHandler";

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await getUsers();
  res.status(200).json(users);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await createUserWithoutPassword(req.body);
  res.status(201).json(user);
});