import express from "express";
import {
    getEvaluations,
    getEvaluationByIdHandler,
    createEvaluationHandler,
    updateEvaluationHandler,
    deleteEvaluationHandler,
    createCompleteEvaluationHandler,
    getEvaluationSkills,
    getEvaluationSkillsByEvaluationIdHandler,
    getEvaluationSkillByIdHandler,
    createEvaluationSkillHandler,
    updateEvaluationSkillHandler,
    deleteEvaluationSkillHandler,
    bulkCreateEvaluationSkillsHandler,
} from "../controller/evaluation.controller";

const router = express.Router();

// Evaluation routes
router.get("/evaluations", getEvaluations);
router.get("/evaluations/:id", getEvaluationByIdHandler);
router.post("/evaluations", createEvaluationHandler);
router.put("/evaluations/:id", updateEvaluationHandler);
router.delete("/evaluations/:id", deleteEvaluationHandler);

// Complete evaluation route (evaluation + skills in one request)
router.post("/evaluations/complete", createCompleteEvaluationHandler);

// EvaluationSkill routes
router.get("/evaluation-skills", getEvaluationSkills);
router.get("/evaluations/:evaluationId/skills", getEvaluationSkillsByEvaluationIdHandler);
router.get("/evaluation-skills/:id", getEvaluationSkillByIdHandler);
router.post("/evaluation-skills", createEvaluationSkillHandler);
router.put("/evaluation-skills/:id", updateEvaluationSkillHandler);
router.delete("/evaluation-skills/:id", deleteEvaluationSkillHandler);

// Bulk create evaluation skills
router.post("/evaluation-skills/bulk", bulkCreateEvaluationSkillsHandler);

export default router;
