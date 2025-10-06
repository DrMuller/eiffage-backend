import express from "express";
import {
    getEvaluations,
    getEvaluationByIdHandler,
    createEvaluationHandler,
    deleteEvaluationHandler,
    createCompleteEvaluationHandler,
    getEvaluationSkills,
    getEvaluationSkillsByEvaluationIdHandler,
    getEvaluationSkillByIdHandler,
    createEvaluationSkillHandler,
    deleteEvaluationSkillHandler,
    bulkCreateEvaluationSkillsHandler,
} from "../controller/evaluation.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";

const router = express.Router();

// Evaluation routes
router.get("/evaluations", [jwtMiddleware(['USER', 'MANAGER'])], getEvaluations);
router.get("/evaluations/:id", [jwtMiddleware(['USER', 'MANAGER'])], getEvaluationByIdHandler);
router.post("/evaluations", [jwtMiddleware(['USER', 'MANAGER'])], createEvaluationHandler);
router.delete("/evaluations/:id", [jwtMiddleware(['USER', 'MANAGER'])], deleteEvaluationHandler);

// Complete evaluation route (evaluation + skills in one request)
router.post("/evaluations/complete", [jwtMiddleware(['USER', 'MANAGER'])], createCompleteEvaluationHandler);

// EvaluationSkill routes
router.get("/evaluation-skills", [jwtMiddleware(['USER', 'MANAGER'])], getEvaluationSkills);
router.get("/evaluations/:evaluationId/skills", [jwtMiddleware(['USER', 'MANAGER'])], getEvaluationSkillsByEvaluationIdHandler);
router.get("/evaluation-skills/:id", [jwtMiddleware(['USER', 'MANAGER'])], getEvaluationSkillByIdHandler);
router.post("/evaluation-skills", [jwtMiddleware(['USER', 'MANAGER'])], createEvaluationSkillHandler);
router.delete("/evaluation-skills/:id", [jwtMiddleware(['USER', 'MANAGER'])], deleteEvaluationSkillHandler);

// Bulk create evaluation skills
router.post("/evaluation-skills/bulk", [jwtMiddleware(['USER', 'MANAGER'])], bulkCreateEvaluationSkillsHandler);

export default router;
