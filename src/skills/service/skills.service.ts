import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { NotFoundException, BadRequestException } from "../../utils/HttpException";
import { MacroSkillType } from "../model/macroSkillType";
import { MacroSkill } from "../model/macroSkill";
import { Skill } from "../model/skill";
import {
    CreateSkillInput,
    SkillResponse,
} from "../dto/skills.dto";

// (moved MacroSkillType and MacroSkill services to dedicated files)

// Skill Service Functions
export const getAllSkills = async (): Promise<SkillResponse[]> => {
    const skillsCollection = getSkillsCollection();

    const pipeline = [
        {
            $lookup: {
                from: "macro_skill",
                localField: "macroSkillId",
                foreignField: "_id",
                as: "macroSkill"
            }
        },
        {
            $unwind: "$macroSkill"
        },
        {
            $lookup: {
                from: "macro_skill_type",
                localField: "macroSkill.macroSkillTypeId",
                foreignField: "_id",
                as: "macroSkill.macroSkillType"
            }
        },
        {
            $unwind: "$macroSkill.macroSkillType"
        },
        {
            $lookup: {
                from: "job_skill",
                localField: "_id",
                foreignField: "skillId",
                as: "jobSkills"
            }
        }
    ];

    const cursor = skillsCollection.aggregate<Skill & {
        macroSkill: MacroSkill & { macroSkillType: MacroSkillType },
        jobSkills: { jobId: ObjectId, expectedLevel: number }[]
    }>(pipeline);
    const results = await cursor.toArray();

    return results.map(result => convertToSkillResponse(result));
};

export const getSkillById = async (id: string): Promise<SkillResponse> => {
    const skillsCollection = getSkillsCollection();

    const pipeline = [
        {
            $match: { _id: new ObjectId(id) }
        },
        {
            $lookup: {
                from: "macro_skill",
                localField: "macroSkillId",
                foreignField: "_id",
                as: "macroSkill"
            }
        },
        {
            $unwind: "$macroSkill"
        },
        {
            $lookup: {
                from: "macro_skill_type",
                localField: "macroSkill.macroSkillTypeId",
                foreignField: "_id",
                as: "macroSkill.macroSkillType"
            }
        },
        {
            $unwind: "$macroSkill.macroSkillType"
        },
        {
            $lookup: {
                from: "job_skill",
                localField: "_id",
                foreignField: "skillId",
                as: "jobSkills"
            }
        }
    ];

    const cursor = skillsCollection.aggregate<Skill & {
        macroSkill: MacroSkill & { macroSkillType: MacroSkillType },
        jobSkills: { jobId: ObjectId, expectedLevel: number }[]
    }>(pipeline);
    const results = await cursor.toArray();

    if (results.length === 0) {
        throw new NotFoundException("Skill not found");
    }

    const result = results[0];
    return {
        _id: result._id.toString(),
        name: result.name,
        macroSkillId: result.macroSkillId.toString(),
        macroSkillName: result.macroSkill.name,
        macroSkillTypeId: result.macroSkill.macroSkillTypeId.toString(),
        macroSkillTypeName: result.macroSkill.macroSkillType.name,
        jobSkills: result.jobSkills?.map(js => ({
            jobId: js.jobId.toString(),
            expectedLevel: js.expectedLevel
        })) || [],
        createdAt: result.createdAt,
    };
};

export const createSkill = async (params: CreateSkillInput): Promise<SkillResponse> => {
    const { name, expectedLevel, macroSkillId } = params;

    // Verify that the macro skill exists
    try {
        // ensure referenced macro skill exists
        await new MongoCollection<MacroSkill>("macro_skill").findOneById(macroSkillId);
    } catch {
        throw new BadRequestException("Invalid macro skill ID");
    }

    const newSkill = {
        _id: new ObjectId(),
        name,
        expectedLevel: expectedLevel || null,
        macroSkillId: new ObjectId(macroSkillId),
        createdAt: new Date(),
    };

    const skill = await getSkillsCollection().insertOne(newSkill);

    // Fetch the created skill with its macro skill and macro skill type
    return await getSkillById(skill._id.toString());
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getSkillsCollection(): MongoCollection<Skill> {
    return new MongoCollection<Skill>("skill");
}

// Helper function to convert model to response
export function convertToSkillResponse(
    skill: Skill &
    { jobSkills: { jobId: ObjectId, expectedLevel: number }[] } &
    { macroSkill: MacroSkill & { macroSkillType: MacroSkillType } }

): SkillResponse {
    return {
        _id: skill._id.toString(),
        name: skill.name,
        macroSkillId: skill.macroSkillId.toString(),
        macroSkillName: skill.macroSkill.name,
        macroSkillTypeId: skill.macroSkill.macroSkillTypeId.toString(),
        macroSkillTypeName: skill.macroSkill.macroSkillType.name,
        jobSkills: skill.jobSkills?.map(js => {
            return {
                jobId: js.jobId.toString(),
                expectedLevel: js.expectedLevel
            }
        }) || [],
        createdAt: skill.createdAt,
    };
}
