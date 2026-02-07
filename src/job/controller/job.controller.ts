import { Request, Response } from "express";
import { asyncHandler } from "../../utils/express/asyncHandler";
import {
    createJob,
    deleteJob,
    getAllJobs,
    getJobById,
    updateJob,
    searchJobs,
    getJobSkillLevelDistribution,
} from "../service/job.service";
import { createJobSchema, updateJobSchema } from "../dto/job.dto";
import { getSkillsByJobId } from "../../skills/service/skills.service";

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
    const id = req.params.id as string;
    const job = await getJobById(id);
    res.status(200).json(job);
});

export const createJobHandler = asyncHandler(async (req: Request, res: Response) => {
    const validation = createJobSchema.parse(req.body);
    const job = await createJob(validation);
    res.status(201).json(job);
});

export const updateJobHandler = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const validation = updateJobSchema.parse(req.body);
    const job = await updateJob(id, validation);
    res.status(200).json(job);
});

export const deleteJobHandler = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await deleteJob(id);
    res.status(204).send();
});

export const getJobSkillsHandler = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const skills = await getSkillsByJobId(id);
    res.status(200).json(skills);
});

export const getJobSkillLevelDistributionHandler = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const distribution = await getJobSkillLevelDistribution(id);
    res.status(200).json(distribution);
});


