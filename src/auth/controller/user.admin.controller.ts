import { Request, Response } from "express";
import { getUsers, createUserWithoutPassword, updateUser, deleteUserById, getAllManagers, searchUsers, sendUserInvite, getUserById } from "../service/auth.service";
import { asyncHandler } from "../../utils/express/asyncHandler";
import { UpdateUserSchema } from "../dto/auth.dto";
import { getPaginationParams, setPaginationHeaders } from "../../utils/pagination/pagination.helper";
import { BadRequestException } from "../../utils/HttpException";

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
  const { q, skillName, jobName, observedLevel } = req.query as { q?: string; skillName?: string; jobName?: string; observedLevel?: string };
  const gender = (req.query.gender as string | undefined)?.toUpperCase() as ('MALE' | 'FEMALE' | undefined);
  const establishmentName = req.query.establishmentName as string | undefined;
  const ageMin = typeof req.query.ageMin === 'string' ? Number(req.query.ageMin) : undefined;
  const ageMax = typeof req.query.ageMax === 'string' ? Number(req.query.ageMax) : undefined;
  const seniorityMin = typeof req.query.seniorityMin === 'string' ? Number(req.query.seniorityMin) : undefined;
  const seniorityMax = typeof req.query.seniorityMax === 'string' ? Number(req.query.seniorityMax) : undefined;
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

  const { page, limit, skip } = getPaginationParams(req, 50);
  // Validate establishmentName regex early (if provided)
  if (typeof establishmentName === 'string' && establishmentName.trim().length > 0) {
    try {
      // eslint-disable-next-line no-new
      new RegExp(establishmentName, 'i');
    } catch {
      throw new BadRequestException('Invalid establishmentName regex');
    }
  }
  const result = await searchUsers(
    {
      q,
      skillName,
      jobName,
      observedLevel,
      jobIds,
      skills: skills.length > 0 ? skills : undefined,
      gender: gender === 'MALE' || gender === 'FEMALE' ? gender : undefined,
      establishmentName: typeof establishmentName === 'string' && establishmentName.trim().length > 0 ? establishmentName : undefined,
      ageMin: Number.isFinite(ageMin) ? ageMin : undefined,
      ageMax: Number.isFinite(ageMax) ? ageMax : undefined,
      seniorityMin: Number.isFinite(seniorityMin) ? seniorityMin : undefined,
      seniorityMax: Number.isFinite(seniorityMax) ? seniorityMax : undefined,
    },
    { page, limit, skip }
  );
  setPaginationHeaders(res, result.meta);
  res.status(200).json(result);
});

export const inviteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await sendUserInvite(id);
  res.status(200).json({ message: "Invite email sent successfully" });
});