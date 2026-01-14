import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { NotFoundException } from "../../utils/HttpException";
import { Job } from "../model/job";
import { Skill } from "../../skills/model/skill";
import { MacroSkill } from "../../skills/model/macroSkill";
import { SkillLevel } from "../../evaluation/model/skillLevel";
import {
    CreateJobInput,
    JobResponse,
    JobWithSkillsResponse,
    UpdateJobInput,
    JobSkillLevelDistribution,
} from "../dto/job.dto";
import { getSkillsByJobId } from "../../skills/service/skills.service";

export async function getAllJobs(): Promise<JobResponse[]> {
    const jobs = await getJobsCollection().find({}, { sort: { createdAt: -1 } });
    return jobs.map(convertToJobResponse);
}

export async function searchJobs(query: string): Promise<JobResponse[]> {
    const regex = new RegExp(query, 'i');
    const jobs = await getJobsCollection().find({
        $or: [
            { name: { $regex: regex } as any },
            { code: { $regex: regex } as any },
            { jobProfile: { $regex: regex } as any },
            { jobFamily: { $regex: regex } as any },
        ] as any,
    } as any, { sort: { createdAt: -1 } });
    return jobs.map(convertToJobResponse);
}

export async function getJobById(id: string): Promise<JobWithSkillsResponse> {
    const job = await getJobsCollection().findOneById(id);
    const skills = await getSkillsByJobId(id);
    return {
        ...convertToJobResponse(job),
        skills,
    };
}

export async function createJob(params: CreateJobInput): Promise<JobResponse> {
    const { name, code, jobProfile, jobFamily } = params;
    const newJob: Job = {
        _id: new ObjectId(),
        name,
        code,
        jobProfile,
        jobFamily: jobFamily,
        createdAt: new Date(),
    };

    const inserted = await getJobsCollection().insertOne(newJob);
    return convertToJobResponse(inserted);
}

export async function updateJob(id: string, updates: UpdateJobInput): Promise<JobResponse> {
    const existing = await getJobsCollection().findOneById(id);
    const updated: Job = {
        ...existing,
        ...updates,
    } as Job;
    const result = await getJobsCollection().update(updated);
    return convertToJobResponse(result);
}

export async function deleteJob(id: string): Promise<void> {
    // Ensure job exists
    await getJobsCollection().findOneById(id);
    
    // Check if any skills reference this job
    const skillsCount = await getSkillsCollection().count({ jobId: new ObjectId(id) });
    if (skillsCount > 0) {
        throw new NotFoundException(`Cannot delete job: ${skillsCount} skill(s) are linked to this job`);
    }
    
    // Check if any macro skills reference this job
    const macroSkillsCount = await getMacroSkillsCollection().count({ jobId: new ObjectId(id) });
    if (macroSkillsCount > 0) {
        throw new NotFoundException(`Cannot delete job: ${macroSkillsCount} macro skill(s) are linked to this job`);
    }
    
    // Delete job
    await getJobsCollection().deleteOne({ _id: new ObjectId(id) });
}


export async function getJobSkillLevelDistribution(jobId: string): Promise<JobSkillLevelDistribution[]> {
    // Ensure job exists
    await getJobsCollection().findOneById(jobId);

    // Get all skills for this job
    const skills = await getSkillsByJobId(jobId);

    // For each skill, get the distribution of skill levels
    const distributions: JobSkillLevelDistribution[] = [];

    for (const skill of skills) {
        const skillId = new ObjectId(skill._id);

        // Get all skill levels for this skill
        const skillLevels = await getSkillLevelsCollection().find({ skillId });

        // Count levels (0, 1, 2, 3, 4)
        const levelCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

        for (const skillLevel of skillLevels) {
            const level = skillLevel.level ?? 0;
            if (level >= 0 && level <= 4) {
                levelCounts[level]++;
            }
        }

        distributions.push({
            skillId: skill._id,
            skillName: skill.name,
            macroSkillName: skill.macroSkillName,
            macroSkillTypeName: skill.macroSkillTypeName,
            expectedLevel: skill.expectedLevel,
            levelDistribution: levelCounts,
        });
    }

    return distributions;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getJobsCollection(): MongoCollection<Job> {
    return new MongoCollection<Job>("job");
}

function getSkillsCollection(): MongoCollection<Skill> {
    return new MongoCollection<Skill>("skill");
}

function getMacroSkillsCollection(): MongoCollection<MacroSkill> {
    return new MongoCollection<MacroSkill>("macro_skill");
}

function getSkillLevelsCollection(): MongoCollection<SkillLevel> {
    return new MongoCollection<SkillLevel>("skill_level");
}

function convertToJobResponse(job: Job): JobResponse {
    return {
        _id: job._id.toString(),
        name: job.name,
        code: job.code,
        jobProfile: job.jobProfile,
        jobFamily: job.jobFamily,
        createdAt: job.createdAt,
    };
}



