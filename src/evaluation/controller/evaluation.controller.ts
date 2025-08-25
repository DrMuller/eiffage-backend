import { Request, Response } from "express";
import {
    getAllEvaluations,
    getEvaluationById,
    getEvaluationWithSkills,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    createCompleteEvaluation,
    getAllEvaluationSkills,
    getEvaluationSkillsByEvaluationId,
    getEvaluationSkillById,
    createEvaluationSkill,
    updateEvaluationSkill,
    deleteEvaluationSkill,
    bulkCreateEvaluationSkills,
} from "../service/evaluation.service";
import {
    createEvaluationSchema,
    updateEvaluationSchema,
    createCompleteEvaluationSchema,
    createEvaluationSkillSchema,
    updateEvaluationSkillSchema,
    bulkCreateEvaluationSkillsSchema,
} from "../dto/evaluation.dto";
import { asyncHandler } from "../../utils/express/asyncHandler";

// Evaluation Controllers
export const getEvaluations = asyncHandler(async (req: Request, res: Response) => {
    const evaluations = await getAllEvaluations();
    res.status(200).json(evaluations);
});

export const getEvaluationByIdHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const includeSkills = req.query.includeSkills === 'true';
    
    const evaluation = includeSkills 
        ? await getEvaluationWithSkills(id)
        : await getEvaluationById(id);
        
    res.status(200).json(evaluation);
});

export const createEvaluationHandler = asyncHandler(async (req: Request, res: Response) => {
    const validation = createEvaluationSchema.parse(req.body);
    const createdBy = req.user!._id.toString(); // Assuming JWT middleware sets req.user
    const evaluation = await createEvaluation(validation, createdBy);
    res.status(201).json(evaluation);
});

export const updateEvaluationHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validation = updateEvaluationSchema.parse(req.body);
    const evaluation = await updateEvaluation(id, validation);
    res.status(200).json(evaluation);
});

export const deleteEvaluationHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteEvaluation(id);
    res.status(204).send();
});

export const createCompleteEvaluationHandler = asyncHandler(async (req: Request, res: Response) => {
    const validation = createCompleteEvaluationSchema.parse(req.body);
    const createdBy = req.user!._id.toString(); // Assuming JWT middleware sets req.user
    const evaluation = await createCompleteEvaluation(validation, createdBy);
    res.status(201).json(evaluation);
});

// EvaluationSkill Controllers
export const getEvaluationSkills = asyncHandler(async (req: Request, res: Response) => {
    const evaluationSkills = await getAllEvaluationSkills();
    res.status(200).json(evaluationSkills);
});

export const getEvaluationSkillsByEvaluationIdHandler = asyncHandler(async (req: Request, res: Response) => {
    const { evaluationId } = req.params;
    const evaluationSkills = await getEvaluationSkillsByEvaluationId(evaluationId);
    res.status(200).json(evaluationSkills);
});

export const getEvaluationSkillByIdHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const evaluationSkill = await getEvaluationSkillById(id);
    res.status(200).json(evaluationSkill);
});

export const createEvaluationSkillHandler = asyncHandler(async (req: Request, res: Response) => {
    const validation = createEvaluationSkillSchema.parse(req.body);
    const evaluationSkill = await createEvaluationSkill(validation);
    res.status(201).json(evaluationSkill);
});

export const updateEvaluationSkillHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validation = updateEvaluationSkillSchema.parse(req.body);
    const evaluationSkill = await updateEvaluationSkill(id, validation);
    res.status(200).json(evaluationSkill);
});

export const deleteEvaluationSkillHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteEvaluationSkill(id);
    res.status(204).send();
});

export const bulkCreateEvaluationSkillsHandler = asyncHandler(async (req: Request, res: Response) => {
    const validation = bulkCreateEvaluationSkillsSchema.parse(req.body);
    const evaluationSkills = await bulkCreateEvaluationSkills(validation);
    res.status(201).json(evaluationSkills);
});
