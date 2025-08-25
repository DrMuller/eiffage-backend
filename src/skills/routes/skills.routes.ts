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

const router = express.Router();

// MacroSkillType routes
router.get("/macro-skill-types", getMacroSkillTypes);
router.get("/macro-skill-types/:id", getMacroSkillTypeByIdHandler);
router.post("/macro-skill-types", createMacroSkillTypeHandler);

// MacroSkill routes
router.get("/macro-skills", getMacroSkills);
router.get("/macro-skills/:id", getMacroSkillByIdHandler);
router.post("/macro-skills", createMacroSkillHandler);

// Skill routes
router.get("/skills", getSkills);
router.get("/skills/:id", getSkillByIdHandler);
router.post("/skills", createSkillHandler);

export default router;
