import { Request, Response } from "express";
import {
    getAllSkills,
    getSkillById,
    createSkill,
    updateSkill,
    deleteSkill,
} from "../service/skills.service";
import {
    getAllMacroSkillTypes,
    getMacroSkillTypeById,
    createMacroSkillType,
} from "../service/macroSkillType.service";
import {
    getAllMacroSkills,
    getMacroSkillById,
    createMacroSkill,
} from "../service/macroSkill.service";
import {
    createMacroSkillTypeSchema,
    createMacroSkillSchema,
    createSkillSchema,
} from "../dto/skills.dto";
import { asyncHandler } from "../../utils/express/asyncHandler";

// MacroSkillType Controllers
export const getMacroSkillTypes = asyncHandler(async (req: Request, res: Response) => {
    const macroSkillTypes = await getAllMacroSkillTypes();
    res.status(200).json(macroSkillTypes);
});

export const getMacroSkillTypeByIdHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const macroSkillType = await getMacroSkillTypeById(id);
    res.status(200).json(macroSkillType);
});

export const createMacroSkillTypeHandler = asyncHandler(async (req: Request, res: Response) => {
    const validation = createMacroSkillTypeSchema.parse(req.body);
    const macroSkillType = await createMacroSkillType(validation);
    res.status(201).json(macroSkillType);
});

// MacroSkill Controllers
export const getMacroSkills = asyncHandler(async (req: Request, res: Response) => {
    const macroSkills = await getAllMacroSkills();
    res.status(200).json(macroSkills);
});

export const getMacroSkillByIdHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const macroSkill = await getMacroSkillById(id);
    res.status(200).json(macroSkill);
});

export const createMacroSkillHandler = asyncHandler(async (req: Request, res: Response) => {
    const validation = createMacroSkillSchema.parse(req.body);
    const macroSkill = await createMacroSkill(validation);
    res.status(201).json(macroSkill);
});

// Skill Controllers
export const getSkills = asyncHandler(async (req: Request, res: Response) => {
    const skills = await getAllSkills();
    res.status(200).json(skills);
});

export const getSkillByIdHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const skill = await getSkillById(id);
    res.status(200).json(skill);
});

export const createSkillHandler = asyncHandler(async (req: Request, res: Response) => {
    const validation = createSkillSchema.parse(req.body);
    const skill = await createSkill(validation);
    res.status(201).json(skill);
});

export const updateSkillHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const skill = await updateSkill(id, req.body);
    res.status(200).json(skill);
});

export const deleteSkillHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteSkill(id);
    res.status(204).send();
});
