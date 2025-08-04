import { Request, Response } from "express";
import { getMe, linkUserToOrganisation } from "../service/auth.service";
import { asyncHandler } from "../../utils/express/asyncHandler";
import { z } from "zod";
import { getOrganisationById } from "../service/organisation.service";

export const me = asyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.context.user;
  const user = await getMe(_id);
  res.status(201).json(user);
});

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

