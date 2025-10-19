import express from "express";
import {
    getEvaluations,
    getEvaluationByIdHandler,
    createEvaluationHandler,
    deleteEvaluationHandler,
    createCompleteEvaluationHandler,
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

export default router;
