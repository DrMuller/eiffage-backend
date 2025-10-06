import express from "express";
import {
    getMacroSkillTypes,
    getMacroSkillTypeByIdHandler,
    createMacroSkillTypeHandler,
    getMacroSkills,
    getMacroSkillByIdHandler,
    createMacroSkillHandler,
    getSkills,
    getSkillByIdHandler,
    createSkillHandler,
} from "../controller/skills.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";

const router = express.Router();

// MacroSkillType routes
router.get("/macro-skill-types", [jwtMiddleware(['USER'])], getMacroSkillTypes);
router.get("/macro-skill-types/:id", [jwtMiddleware(['USER'])], getMacroSkillTypeByIdHandler);
router.post("/macro-skill-types", [jwtMiddleware(['USER', 'ADMIN'])], createMacroSkillTypeHandler);

// MacroSkill routes
router.get("/macro-skills", [jwtMiddleware(['USER'])], getMacroSkills);
router.get("/macro-skills/:id", [jwtMiddleware(['USER'])], getMacroSkillByIdHandler);
router.post("/macro-skills", [jwtMiddleware(['USER', 'ADMIN'])], createMacroSkillHandler);

// Skill routes
router.get("/skills", [jwtMiddleware(['USER'])], getSkills);
router.get("/skills/:id", [jwtMiddleware(['USER'])], getSkillByIdHandler);
router.post("/skills", [jwtMiddleware(['USER', 'ADMIN'])], createSkillHandler);

export default router;
