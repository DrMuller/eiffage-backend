import express from "express";
import {
    getEvaluationCampaigns,
    getEvaluationCampaignByIdHandler,
    createEvaluationCampaignHandler,
    updateEvaluationCampaignHandler,
    deleteEvaluationCampaignHandler,
    getCurrentEvaluationCampaignHandler,
} from "../controller/evaluationCampaign.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";

const router = express.Router();

// EvaluationCampaign routes
router.get("/evaluation-campaigns", [jwtMiddleware(['USER', 'MANAGER'])], getEvaluationCampaigns);
router.get("/evaluation-campaigns/current", [jwtMiddleware(['USER', 'MANAGER'])], getCurrentEvaluationCampaignHandler);
router.get("/evaluation-campaigns/:id", [jwtMiddleware(['USER', 'MANAGER'])], getEvaluationCampaignByIdHandler);
router.post("/evaluation-campaigns", [jwtMiddleware(['USER', 'MANAGER'])], createEvaluationCampaignHandler);
router.put("/evaluation-campaigns/:id", [jwtMiddleware(['USER', 'MANAGER'])], updateEvaluationCampaignHandler);
router.delete("/evaluation-campaigns/:id", [jwtMiddleware(['USER', 'MANAGER'])], deleteEvaluationCampaignHandler);

export default router;

