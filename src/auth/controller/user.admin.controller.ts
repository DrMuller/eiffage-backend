import { Request, Response } from "express";
import { getUsers, createUserWithoutPassword, updateUser, deleteUserById, getAllManagers, searchUsers } from "../service/auth.service";
import { asyncHandler } from "../../utils/express/asyncHandler";
import { UpdateUserSchema } from "../dto/auth.dto";

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await getUsers();
  res.status(200).json(users);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await createUserWithoutPassword(req.body);
  res.status(201).json(user);
});

export const updateUserById = asyncHandler(async (req: Request, res: Response) => {
  const update = UpdateUserSchema.parse(req.body);
  const { id } = req.params;
  const user = await updateUser(id, update);
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

export const searchUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const { q, skillName, jobName, observedLevel } = req.query as { q?: string; skillName?: string; jobName?: string; observedLevel?: string };
  // jobIds can be provided multiple times (?jobIds=a&jobIds=b) or as a comma-separated string
  const jobIdsRaw = req.query.jobIds;
  const jobIds = Array.isArray(jobIdsRaw)
    ? (jobIdsRaw as string[])
    : (typeof jobIdsRaw === 'string' && jobIdsRaw.length > 0 ? jobIdsRaw.split(',') : undefined);

  // skills can be provided as repeated params skillIds and levels pairing by index
  const toArray = (v: unknown): string[] => Array.isArray(v) ? (v as string[]) : (typeof v === 'string' ? [v] : []);
  const skillIds = toArray(req.query.skillIds);
  const levels = toArray(req.query.levels).map((n) => Number(n));
  const skills = skillIds.map((id, idx) => ({ skillId: id, minLevel: levels[idx] })).filter((p) => p.skillId && Number.isFinite(p.minLevel));

  const users = await searchUsers({ q, skillName, jobName, observedLevel, jobIds, skills: skills.length > 0 ? skills : undefined });
  res.status(200).json(users);
});