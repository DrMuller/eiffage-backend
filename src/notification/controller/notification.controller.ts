import { Request, Response } from "express";
import { asyncHandler } from "../../utils/express/asyncHandler";
import { sendHrCampaignRequestSchema } from "../dto/notification.dto";
import { sendHrCampaignRequest } from "../service/notification.service";

export const sendHrCampaignRequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const input = sendHrCampaignRequestSchema.parse(req.body);
    const senderEmail = req.context.user.email;

    await sendHrCampaignRequest(input, senderEmail);

    res.status(200).json({ message: "Votre demande a bien été envoyée aux administrateurs RH." });
});
