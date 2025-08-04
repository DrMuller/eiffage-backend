import { Request, Response } from "express";
import { asyncHandler } from "../../utils/express/asyncHandler";
import { getOrganisationById, updateOrganisation } from "../service/organisation.service";
import { z } from "zod";
import { checkOrganisationAccess, getOrganisationFromContext } from "../../utils/express/contextHelpers";
import { BadRequestException } from "../../utils/HttpException";
import { getUsers } from "../service/auth.service";


const organisationUpdateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    logoUrl: z.string().url("Logo URL must be a valid URL").optional(),
    address: z.string().min(1, "Address is required").optional(),
    siren: z.string().min(9, "SIREN number must be at least 9 characters").optional()
});

export const getOrganisation = asyncHandler(async (req: Request, res: Response) => {
    const organisationId = req.params.id;

    // Check if user has access to this organisation
    checkOrganisationAccess(req, organisationId);

    const organisation = await getOrganisationById(organisationId);
    res.status(200).json({
        _id: organisation._id.toHexString(),
        name: organisation.name,
        logoUrl: organisation.logoUrl,
        address: organisation.address,
        siren: organisation.siren,
        createdAt: organisation.createdAt,
        updatedAt: organisation.updatedAt
    });
});

export const updateExistingOrganisation = asyncHandler(async (req: Request, res: Response) => {
    const organisationId = req.params.id;

    // Check if user has access to this organisation
    checkOrganisationAccess(req, organisationId);

    const updateData = organisationUpdateSchema.parse(req.body);
    const organisation = await updateOrganisation(organisationId, updateData);
    res.status(200).json({
        _id: organisation._id.toHexString(),
        name: organisation.name,
        logoUrl: organisation.logoUrl,
        address: organisation.address,
        siren: organisation.siren,
        createdAt: organisation.createdAt,
        updatedAt: organisation.updatedAt
    });
});

export const getCurrentUserOrganisation = asyncHandler(async (req: Request, res: Response) => {
    const organisation = await getOrganisationFromContext(req);
    res.status(200).json({
        _id: organisation._id.toHexString(),
        name: organisation.name,
        logoUrl: organisation.logoUrl,
        address: organisation.address,
        siren: organisation.siren,
        createdAt: organisation.createdAt,
        updatedAt: organisation.updatedAt
    });
}); 

export const getOrganisationUsers = asyncHandler(async (req: Request, res: Response) => {
    const organisationId = req.params.id;
    checkOrganisationAccess(req, organisationId);
    const users = await getUsers(organisationId);
    res.status(200).json(users);
});