import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { BadRequestException, ConflictException, NotFoundException } from "../../utils/HttpException";
import { Job } from "../model/job";
import { JobSkill } from "../model/jobSkill";
import { Skill } from "../../skills/model/skill";
import { MacroSkill } from "../../skills/model/macroSkill";
import { MacroSkillType } from "../../skills/model/macroSkillType";
import { EvaluationSkill } from "../../evaluation/model/evaluationSkill";
import { SkillLevel } from "../../evaluation/model/skillLevel";
import {
    AddSkillToJobInput,
    CreateJobInput,
    JobResponse,
    JobWithSkillsResponse,
    UpdateJobInput,
    UpdateJobSkillInput,
    JobSkillLevelDistribution,
} from "../dto/job.dto";
import { JobSkillResponse, MacroSkillTypeResponse, SkillResponse } from "../../skills/dto/skills.dto";
import { convertToSkillResponse } from "../../skills/service/skills.service";

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
    const jobSkills = await getJobSkills(id);
    console.log('jobSkills', jobSkills);
    return {
        ...convertToJobResponse(job),
        jobSkills,
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
    // Delete links first
    await getJobSkillsCollection().deleteMany({ jobId: new ObjectId(id) });
    // Delete job
    await getJobsCollection().deleteOne({ _id: new ObjectId(id) });
}

export async function getJobSkills(jobId: string): Promise<JobSkillResponse[]> {
    // Ensure job exists
    await getJobsCollection().findOneById(jobId);

    const collection = getJobSkillsCollection();
    const pipeline = [
        { $match: { jobId: new ObjectId(jobId) } },
        {
            $lookup: {
                from: "skill",
                localField: "skillId",
                foreignField: "_id",
                as: "skill",
            },
        },
        { $unwind: "$skill" },
        {
            $lookup: {
                from: "macro_skill",
                localField: "skill.macroSkillId",
                foreignField: "_id",
                as: "macroSkill",
            },
        },
        { $unwind: "$macroSkill" },
        {
            $lookup: {
                from: "macro_skill_type",
                localField: "macroSkill.macroSkillTypeId",
                foreignField: "_id",
                as: "macroSkill.macroSkillType",
            },
        },
        { $unwind: "$macroSkill.macroSkillType" },
    ];

    const cursor = collection.aggregate<JobSkill & { skill: Skill } & { macroSkill: MacroSkill & { macroSkillType: MacroSkillType } }>(pipeline);
    const results = await cursor.toArray();
    return results.map((r) => convertToJobSkillResponse(r));
}

export async function addSkillToJob(jobId: string, params: AddSkillToJobInput): Promise<JobSkill> {
    const { skillId, expectedLevel } = params;
    await getJobsCollection().findOneOrFail({ _id: new ObjectId(jobId) });
    await getSkillsCollection().findOneOrFail({ _id: new ObjectId(skillId) });

    const existing = await getJobSkillsCollection().findOne({ jobId: new ObjectId(jobId), skillId: new ObjectId(skillId) });
    if (existing) {
        throw new BadRequestException("Skill already linked to job");
    }
    const link: JobSkill = {
        _id: new ObjectId(),
        jobId: new ObjectId(jobId),
        skillId: new ObjectId(skillId),
        expectedLevel,
        createdAt: new Date(),
    };
    await getJobSkillsCollection().insertOne(link);
    return link;
}

export async function updateJobSkill(jobId: string, skillId: string, updates: UpdateJobSkillInput) {
    await getJobsCollection().findOneOrFail({ _id: new ObjectId(jobId) });
    await getSkillsCollection().findOneOrFail({ _id: new ObjectId(skillId) });

    const updated = await getJobSkillsCollection().findOneAndUpdate(
        { jobId: new ObjectId(jobId), skillId: new ObjectId(skillId) },
        { ...updates }
    );
    return updated;
}

export async function removeJobSkill(jobId: string, skillId: string): Promise<void> {
    await getJobsCollection().findOneOrFail({ _id: new ObjectId(jobId) });
    await getSkillsCollection().findOneOrFail({ _id: new ObjectId(skillId) });

    // Check if any evaluation skills are linked to this skill
    const evaluationSkillsCount = await getEvaluationSkillsCollection().count({
        skillId: new ObjectId(skillId)
    });

    if (evaluationSkillsCount > 0) {
        throw new ConflictException(
            "Cette compétence ne peut pas être retirée car elle est utilisée dans des évaluations existantes"
        );
    }

    // Remove the job-skill link
    const result = await getJobSkillsCollection().deleteOne({
        jobId: new ObjectId(jobId),
        skillId: new ObjectId(skillId)
    });

    if (result.deletedCount === 0) {
        throw new NotFoundException("Job skill link not found");
    }

    // Delete the skill itself
    await getSkillsCollection().deleteOne({ _id: new ObjectId(skillId) });
}

export async function getJobSkillLevelDistribution(jobId: string): Promise<JobSkillLevelDistribution[]> {
    // Ensure job exists
    await getJobsCollection().findOneById(jobId);

    // Get all job skills for this job
    const jobSkills = await getJobSkills(jobId);

    // For each job skill, get the distribution of skill levels
    const distributions: JobSkillLevelDistribution[] = [];

    for (const jobSkill of jobSkills) {
        const skillId = new ObjectId(jobSkill.skillId);

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
            skillId: jobSkill.skillId,
            skillName: jobSkill.skillName,
            macroSkillName: jobSkill.macroSkillName,
            macroSkillTypeName: jobSkill.macroSkillTypeName,
            expectedLevel: jobSkill.expectedLevel,
            levelDistribution: levelCounts,
        });
    }

    return distributions;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getJobsCollection(): MongoCollection<Job> {
    return new MongoCollection<Job>("job");
}

function getJobSkillsCollection(): MongoCollection<JobSkill> {
    return new MongoCollection<JobSkill>("job_skill");
}

function getSkillsCollection(): MongoCollection<Skill> {
    return new MongoCollection<Skill>("skill");
}

function getEvaluationSkillsCollection(): MongoCollection<EvaluationSkill> {
    return new MongoCollection<EvaluationSkill>("evaluation_skill");
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

function convertToMacroSkillTypeResponse(macroSkillType: MacroSkillType): MacroSkillTypeResponse {
    return {
        _id: macroSkillType._id.toString(),
        name: macroSkillType.name,
        createdAt: macroSkillType.createdAt,
    };
}


function convertToJobSkillResponse(
    jobSkill: JobSkill &
    { skill: Skill } &
    { macroSkill: MacroSkill & { macroSkillType: MacroSkillType } }

): JobSkillResponse {
    return {
        _id: jobSkill._id.toString(),
        skillId: jobSkill.skillId.toString(),
        skillName: jobSkill.skill.name,
        macroSkillId: jobSkill.macroSkill._id.toString(),
        macroSkillName: jobSkill.macroSkill.name,
        macroSkillTypeId: jobSkill.macroSkill.macroSkillTypeId.toString(),
        macroSkillTypeName: jobSkill.macroSkill.macroSkillType.name,
        jobId: jobSkill.jobId.toString(),
        expectedLevel: jobSkill.expectedLevel,
    };
}

async function getEnrichedSkill(skillId: string): Promise<SkillResponse> {
    const skillsCollection = getSkillsCollection();
    const pipeline = [
        { $match: { _id: new ObjectId(skillId) } },
        {
            $lookup: {
                from: "macro_skill",
                localField: "macroSkillId",
                foreignField: "_id",
                as: "macroSkill",
            },
        },
        { $unwind: "$macroSkill" },
        {
            $lookup: {
                from: "macro_skill_type",
                localField: "macroSkill.macroSkillTypeId",
                foreignField: "_id",
                as: "macroSkill.macroSkillType",
            },
        },
        { $unwind: "$macroSkill.macroSkillType" },
        {
            $lookup: {
                from: "job_skill",
                localField: "_id",
                foreignField: "skillId",
                as: "jobSkills",
            },
        },
    ];
    const cursor = skillsCollection.aggregate<
        Skill &
        {
            macroSkill: MacroSkill & { macroSkillType: MacroSkillType },
            jobSkills: { jobId: ObjectId, expectedLevel: number }[]
        }>(pipeline);
    const results = await cursor.toArray();
    if (results.length === 0) throw new NotFoundException("Skill not found");
    return convertToSkillResponse(results[0]);
}


