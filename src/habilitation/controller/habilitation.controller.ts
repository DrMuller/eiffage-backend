import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/express/asyncHandler";
import {
    createHabilitation,
    deleteHabilitation,
    getHabilitationById,
    updateHabilitation,
    searchHabilitations,
} from "../service/habilitation.service";
import { createHabilitationSchema, updateHabilitationSchema } from "../dto/habilitation.dto";
import { getPaginationParams, setPaginationHeaders } from "../../utils/pagination/pagination.helper";

const mongoIdRegex = /^[a-f\d]{24}$/i;

const getHabilitationsQuerySchema = z.object({
    q: z.string().optional(),
    userId: z.string().regex(mongoIdRegex, "Format de userId invalide").optional(),
    jobId: z.string().regex(mongoIdRegex, "Format de jobId invalide").optional(),
    userIds: z.union([
        z.string().regex(mongoIdRegex, "Format de userIds invalide"),
        z.array(z.string().regex(mongoIdRegex, "Format de userIds invalide"))
    ]).optional().transform(val => val ? (Array.isArray(val) ? val : [val]) : undefined),
    jobIds: z.union([
        z.string().regex(mongoIdRegex, "Invalid jobIds format"),
        z.array(z.string().regex(mongoIdRegex, "Invalid jobIds format"))
    ]).optional().transform(val => val ? (Array.isArray(val) ? val : [val]) : undefined),
    startDateFrom: z.string().optional(),
    endDateTo: z.string().optional(),
});

export type GetHabilitationsQuery = z.infer<typeof getHabilitationsQuerySchema>;

export const getHabilitations = asyncHandler(async (req: Request, res: Response) => {
    const query = getHabilitationsQuerySchema.parse(req.query);
    const { page, limit, skip } = getPaginationParams(req, 50);

    const result = await searchHabilitations(query, { page, limit, skip });

    setPaginationHeaders(res, result.meta);
    res.status(200).json(result);
});

export const getHabilitationByIdHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const habilitation = await getHabilitationById(id);
    res.status(200).json(habilitation);
});

export const createHabilitationHandler = asyncHandler(async (req: Request, res: Response) => {
    const validation = createHabilitationSchema.parse(req.body);
    const habilitation = await createHabilitation(validation);
    res.status(201).json(habilitation);
});

export const updateHabilitationHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validation = updateHabilitationSchema.parse(req.body);
    const habilitation = await updateHabilitation(id, validation);
    res.status(200).json(habilitation);
});

export const deleteHabilitationHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteHabilitation(id);
    res.status(204).send();
});

