import { Request, Response } from "express";
import { asyncHandler } from "../../utils/express/asyncHandler";
import {
    addSkillToJob,
    createJob,
    deleteJob,
    getAllJobs,
    getJobById,
    getJobSkills,
    removeJobSkill,
    updateJob,
    updateJobSkill,
    searchJobs,
    getJobSkillLevelDistribution,
} from "../service/job.service";
import { addSkillToJobSchema, createJobSchema, updateJobSchema, updateJobSkillSchema } from "../dto/job.dto";

export const getJobs = asyncHandler(async (req: Request, res: Response) => {
    const q = (req.query.q as string) || "";
    if (q) {
        const jobs = await searchJobs(q);
        res.status(200).json(jobs);
        return;
    }
    const jobs = await getAllJobs();
    res.status(200).json(jobs);
});

export const getJobByIdHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const job = await getJobById(id);
    res.status(200).json(job);
});

export const createJobHandler = asyncHandler(async (req: Request, res: Response) => {
    const validation = createJobSchema.parse(req.body);
    const job = await createJob(validation);
    res.status(201).json(job);
});

export const updateJobHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validation = updateJobSchema.parse(req.body);
    const job = await updateJob(id, validation);
    res.status(200).json(job);
});

export const deleteJobHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteJob(id);
    res.status(204).send();
});

export const getJobSkillsHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const skills = await getJobSkills(id);
    res.status(200).json(skills);
});

export const addSkillToJobHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validation = addSkillToJobSchema.parse(req.body);
    const result = await addSkillToJob(id, validation);
    res.status(201).json(result);
});

export const updateJobSkillHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id, skillId } = req.params as { id: string; skillId: string };
    const validation = updateJobSkillSchema.parse(req.body);
    const result = await updateJobSkill(id, skillId, validation);
    res.status(200).json(result);
});

export const removeJobSkillHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id, skillId } = req.params as { id: string; skillId: string };
    await removeJobSkill(id, skillId);
    res.status(204).send();
});

export const getJobSkillLevelDistributionHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const distribution = await getJobSkillLevelDistribution(id);
    res.status(200).json(distribution);
});


