import express from "express";
import jwtMiddleware from "../../middleware/jwt.middleware";
import { sendHrCampaignRequestHandler } from "../controller/notification.controller";

const router = express.Router();

router.post("/notifications/hr-campaign-request", [jwtMiddleware(['USER', 'MANAGER'])], sendHrCampaignRequestHandler);

export default router;
