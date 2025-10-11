import { z } from "zod";

// EvaluationCampaign schemas
export const createEvaluationCampaignSchema = z.object({
    startDate: z.string().or(z.date()).transform((val) => new Date(val)),
    endDate: z.string().or(z.date()).transform((val) => new Date(val)),
});

export const updateEvaluationCampaignSchema = z.object({
    startDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    endDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
});

export type CreateEvaluationCampaignInput = z.infer<typeof createEvaluationCampaignSchema>;
export type UpdateEvaluationCampaignInput = z.infer<typeof updateEvaluationCampaignSchema>;

export type EvaluationCampaignResponse = {
    _id: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
};

