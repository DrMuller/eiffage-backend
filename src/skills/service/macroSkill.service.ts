import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { NotFoundException, BadRequestException } from "../../utils/HttpException";
import { MacroSkillType } from "../model/macroSkillType";
import { MacroSkill } from "../model/macroSkill";
import {
    CreateMacroSkillInput,
    MacroSkillTypeResponse,
    MacroSkillResponse,
} from "../dto/skills.dto";

export const getAllMacroSkills = async (jobId?: string): Promise<MacroSkillResponse[]> => {
    const macroSkillsCollection = getMacroSkillsCollection();
    const match = jobId ? { jobId: new ObjectId(jobId) } : {};

    const pipeline = [
        { $match: match },
        {
            $lookup: {
                from: "job",
                localField: "jobId",
                foreignField: "_id",
                as: "job"
            }
        },
        { $unwind: "$job" },
        {
            $lookup: {
                from: "macro_skill_type",
                localField: "macroSkillTypeId",
                foreignField: "_id",
                as: "macroSkillType"
            }
        },
        { $unwind: "$macroSkillType" }
    ];

    const cursor = macroSkillsCollection.aggregate<MacroSkill & { 
        job: { _id: ObjectId, name: string },
        macroSkillType: MacroSkillType 
    }>(pipeline);
    const results = await cursor.toArray();

    return results.map(result => ({
        _id: result._id.toString(),
        name: result.name,
        jobId: result.jobId.toString(),
        jobName: result.job.name,
        macroSkillTypeId: result.macroSkillTypeId.toString(),
        macroSkillType: convertToMacroSkillTypeResponse(result.macroSkillType),
        createdAt: result.createdAt,
    }));
};

export const getMacroSkillById = async (id: string): Promise<MacroSkillResponse> => {
    const macroSkillsCollection = getMacroSkillsCollection();

    const pipeline = [
        { $match: { _id: new ObjectId(id) } },
        {
            $lookup: {
                from: "job",
                localField: "jobId",
                foreignField: "_id",
                as: "job"
            }
        },
        { $unwind: "$job" },
        {
            $lookup: {
                from: "macro_skill_type",
                localField: "macroSkillTypeId",
                foreignField: "_id",
                as: "macroSkillType"
            }
        },
        { $unwind: "$macroSkillType" }
    ];

    const cursor = macroSkillsCollection.aggregate<MacroSkill & { 
        job: { _id: ObjectId, name: string },
        macroSkillType: MacroSkillType 
    }>(pipeline);
    const results = await cursor.toArray();

    if (results.length === 0) {
        throw new NotFoundException("Macro skill not found");
    }

    const result = results[0];
    return {
        _id: result._id.toString(),
        name: result.name,
        jobId: result.jobId.toString(),
        jobName: result.job.name,
        macroSkillTypeId: result.macroSkillTypeId.toString(),
        macroSkillType: convertToMacroSkillTypeResponse(result.macroSkillType),
        createdAt: result.createdAt,
    };
};

export const createMacroSkill = async (params: CreateMacroSkillInput): Promise<MacroSkillResponse> => {
    const { name, jobId, macroSkillTypeId } = params;

    try {
        await getMacroSkillTypesCollection().findOneById(macroSkillTypeId);
    } catch {
        throw new BadRequestException("Invalid macro skill type ID");
    }

    try {
        await new MongoCollection("job").findOneById(jobId);
    } catch {
        throw new BadRequestException("Invalid job ID");
    }

    const newMacroSkill: MacroSkill = {
        _id: new ObjectId(),
        name,
        jobId: new ObjectId(jobId),
        macroSkillTypeId: new ObjectId(macroSkillTypeId),
        createdAt: new Date(),
    };

    const inserted = await getMacroSkillsCollection().insertOne(newMacroSkill);
    return await getMacroSkillById(inserted._id.toString());
};

export const getMacroSkillsByJobId = async (jobId: string): Promise<MacroSkillResponse[]> => {
    const macroSkillsCollection = getMacroSkillsCollection();

    const pipeline = [
        { $match: { jobId: new ObjectId(jobId) } },
        {
            $lookup: {
                from: "job",
                localField: "jobId",
                foreignField: "_id",
                as: "job"
            }
        },
        { $unwind: "$job" },
        {
            $lookup: {
                from: "macro_skill_type",
                localField: "macroSkillTypeId",
                foreignField: "_id",
                as: "macroSkillType"
            }
        },
        { $unwind: "$macroSkillType" }
    ];

    const cursor = macroSkillsCollection.aggregate<MacroSkill & {
        job: { _id: ObjectId, name: string },
        macroSkillType: MacroSkillType
    }>(pipeline);
    const results = await cursor.toArray();

    return results.map(result => ({
        _id: result._id.toString(),
        name: result.name,
        jobId: result.jobId.toString(),
        jobName: result.job.name,
        macroSkillTypeId: result.macroSkillTypeId.toString(),
        macroSkillType: convertToMacroSkillTypeResponse(result.macroSkillType),
        createdAt: result.createdAt,
    }));
};

export const getJobsWithoutMacroSkills = async (): Promise<Array<{ _id: string; code: string; name: string; jobProfile: string; jobFamily?: string }>> => {
    const jobsCollection = new MongoCollection("job");

    const pipeline = [
        {
            $lookup: {
                from: "macro_skill",
                localField: "_id",
                foreignField: "jobId",
                as: "macroSkills"
            }
        },
        {
            $match: {
                macroSkills: { $size: 0 }
            }
        },
        {
            $project: {
                _id: 1,
                code: 1,
                name: 1,
                jobProfile: 1,
                jobFamily: 1
            }
        },
        {
            $sort: { code: 1 }
        }
    ];

    const cursor = jobsCollection.aggregate<{
        _id: ObjectId;
        code: string;
        name: string;
        jobProfile: string;
        jobFamily?: string
    }>(pipeline);
    const results = await cursor.toArray();

    return results.map(job => ({
        _id: job._id.toString(),
        code: job.code,
        name: job.name,
        jobProfile: job.jobProfile,
        jobFamily: job.jobFamily,
    }));
};

function getMacroSkillTypesCollection(): MongoCollection<MacroSkillType> {
    return new MongoCollection<MacroSkillType>("macro_skill_type");
}

function getMacroSkillsCollection(): MongoCollection<MacroSkill> {
    return new MongoCollection<MacroSkill>("macro_skill");
}

function convertToMacroSkillTypeResponse(macroSkillType: MacroSkillType): MacroSkillTypeResponse {
    return {
        _id: macroSkillType._id.toString(),
        name: macroSkillType.name,
        createdAt: macroSkillType.createdAt,
    };
}


