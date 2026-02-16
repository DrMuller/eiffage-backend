import { z } from 'zod';

export const sendHrCampaignRequestSchema = z.object({
    managerName: z.string().min(1, 'Le nom du manager est requis'),
});

export type SendHrCampaignRequestInput = z.infer<typeof sendHrCampaignRequestSchema>;
