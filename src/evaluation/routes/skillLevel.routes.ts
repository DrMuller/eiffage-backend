import express from "express";
import {
    getSkillLevelsHandler,
} from "../controller/evaluation.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";

const router = express.Router();
router.get("/skill-levels", [jwtMiddleware(['USER', 'MANAGER'])], getSkillLevelsHandler);

export default router;
