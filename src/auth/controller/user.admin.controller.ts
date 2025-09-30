import { Request, Response } from "express";
import { getUsers, createUserWithoutPassword, updateUser, deleteUserById, getAllManagers } from "../service/auth.service";
import { asyncHandler } from "../../utils/express/asyncHandler";

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await getUsers();
  res.status(200).json(users);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await createUserWithoutPassword(req.body);
  res.status(201).json(user);
});

export const updateUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await updateUser(id, req.body);
  res.status(200).json(user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await deleteUserById(id);
  res.status(200).json({ message: "User deleted successfully" });
});

export const getManagers = asyncHandler(async (req: Request, res: Response) => {
  const managers = await getAllManagers();
  res.status(200).json(managers);
});