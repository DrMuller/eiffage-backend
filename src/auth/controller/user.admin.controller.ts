import { Request, Response } from "express";
import { linkUserToOrganisation, getUsers, createUserWithoutPassword } from "../service/auth.service";
import { asyncHandler } from "../../utils/express/asyncHandler";
import { z } from "zod";
import { getOrganisationById } from "../service/organisation.service";


const linkUserToOrganisationSchema = z.object({
  organisationId: z.string().min(1, "Organisation ID is required")
});

export const linkUserToOrganisationHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { organisationId } = linkUserToOrganisationSchema.parse(req.body);
  await getOrganisationById(organisationId);
  const user = await linkUserToOrganisation(userId, organisationId);
  res.status(200).json(user);
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const organisationId = req.query.organisationId as string;
  const users = await getUsers(organisationId ? organisationId : undefined);
  res.status(200).json(users);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await createUserWithoutPassword(req.body);
  res.status(200).json(user);
});
