import { Request, Response } from "express";
import { getUsers, createUserWithoutPassword, updateUser, deleteUserById, getAllManagers, searchUsers, sendUserInvite, getUserById } from "../service/auth.service";
import { getTeamStats } from "../service/teamStats.service";
import { asyncHandler } from "../../utils/express/asyncHandler";
import { UpdateUserSchema } from "../dto/auth.dto";
import { getPaginationParams, setPaginationHeaders } from "../../utils/pagination/pagination.helper";
import { z } from "zod";

const SearchUsersQuerySchema = z.object({
  q: z.string().optional(),
  skillName: z.string().optional(),
  jobName: z.string().optional(),
  observedLevel: z.string().optional(),
  gender: z.string().toUpperCase().pipe(z.enum(['MALE', 'FEMALE'])).optional(),
  establishmentName: z.string().optional(),
  managerUserId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  ageMin: z.coerce.number().optional(),
  ageMax: z.coerce.number().optional(),
  seniorityMin: z.coerce.number().optional(),
  seniorityMax: z.coerce.number().optional(),
  jobIds: z.union([z.string(), z.array(z.string())]).optional(),
  skillIds: z.union([z.string(), z.array(z.string())]).optional(),
  levels: z.union([z.string(), z.array(z.string())]).optional(),
});
type SearchUsersQuery = z.infer<typeof SearchUsersQuerySchema>;

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(req, 50);
  const result = await getUsers({ page, limit, skip });
  setPaginationHeaders(res, result.meta);
  res.status(200).json(result);
});

export const getUserByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await getUserById(id);
  res.status(200).json(user);
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
  const parsed: SearchUsersQuery = SearchUsersQuerySchema.parse(req.query);
  const { q, skillName, jobName, observedLevel, gender, establishmentName, managerUserId, ageMin, ageMax, seniorityMin, seniorityMax, jobIds, skillIds, levels } = parsed;

  // jobIds can be provided multiple times (?jobIds=a&jobIds=b) or as a comma-separated string
  const jobIdsList = Array.isArray(jobIds)
    ? jobIds
    : (typeof jobIds === 'string' && jobIds.length > 0 ? jobIds.split(',') : undefined);

  // skills can be provided as repeated params skillIds and levels pairing by index
  const toArray = (v: unknown): string[] => Array.isArray(v) ? (v as string[]) : (typeof v === 'string' ? [v] : []);
  const skillIdsList = toArray(skillIds);
  const levelsList = toArray(levels).map((n) => Number(n));
  const skills = skillIdsList.map((id, idx) => ({ skillId: id, minLevel: levelsList[idx] })).filter((p) => p.skillId && Number.isFinite(p.minLevel));

  const { page, limit, skip } = getPaginationParams(req, 50);
  const result = await searchUsers(
    {
      q,
      skillName,
      jobName,
      observedLevel,
      jobIds: jobIdsList,
      skills: skills.length > 0 ? skills : undefined,
      gender,
      establishmentName: establishmentName && establishmentName.trim().length > 0 ? establishmentName : undefined,
      managerUserId,
      ageMin,
      ageMax,
      seniorityMin,
      seniorityMax,
    },
    { page, limit, skip }
  );
  setPaginationHeaders(res, result.meta);
  res.status(200).json(result);
});

export const inviteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, webapp } = req.body as { role?: 'ADMIN' | 'MANAGER'; webapp?: 'main' | 'evaluation' };
  const emailContent = await sendUserInvite(id, role, webapp);
  res.status(200).json(emailContent);
});

export const getTeamStatsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { managerId } = req.params;
  const stats = await getTeamStats(managerId);
  res.status(200).json(stats);
});