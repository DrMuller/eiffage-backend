import { Request, Response } from "express";
import {
    getAllEvaluationCampaigns,
    getEvaluationCampaignById,
    createEvaluationCampaign,
    updateEvaluationCampaign,
    deleteEvaluationCampaign,
} from "../service/evaluationCampaign.service";
import {
    createEvaluationCampaignSchema,
    updateEvaluationCampaignSchema,
} from "../dto/evaluationCampaign.dto";
import { asyncHandler } from "../../utils/express/asyncHandler";

// EvaluationCampaign Controllers
export const getEvaluationCampaigns = asyncHandler(async (req: Request, res: Response) => {
    const campaigns = await getAllEvaluationCampaigns();
    res.status(200).json(campaigns);
});

export const getEvaluationCampaignByIdHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const campaign = await getEvaluationCampaignById(id);
    res.status(200).json(campaign);
});

export const createEvaluationCampaignHandler = asyncHandler(async (req: Request, res: Response) => {
    const validation = createEvaluationCampaignSchema.parse(req.body);
    const campaign = await createEvaluationCampaign(validation);
    res.status(201).json(campaign);
});

export const updateEvaluationCampaignHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validation = updateEvaluationCampaignSchema.parse(req.body);
    const campaign = await updateEvaluationCampaign(id, validation);
    res.status(200).json(campaign);
});

export const deleteEvaluationCampaignHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteEvaluationCampaign(id);
    res.status(204).send();
});

