import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { NotFoundException, BadRequestException } from "../../utils/HttpException";
import { MacroSkillType } from "../model/macroSkillType";
import { MacroSkill } from "../model/macroSkill";
import { Skill } from "../model/skill";
import {
    CreateMacroSkillTypeInput,
    CreateMacroSkillInput,
    CreateSkillInput,
    MacroSkillTypeResponse,
    MacroSkillResponse,
    SkillResponse,
} from "../dto/skills.dto";

// MacroSkillType Service Functions
export const getAllMacroSkillTypes = async (): Promise<MacroSkillTypeResponse[]> => {
    const macroSkillTypes = await getMacroSkillTypesCollection().find({});
    return macroSkillTypes.map(convertToMacroSkillTypeResponse);
};

export const getMacroSkillTypeById = async (id: string): Promise<MacroSkillTypeResponse> => {
    const macroSkillType = await getMacroSkillTypesCollection().findOneById(id);
    return convertToMacroSkillTypeResponse(macroSkillType);
};

export const createMacroSkillType = async (params: CreateMacroSkillTypeInput): Promise<MacroSkillTypeResponse> => {
    const { name } = params;

    const newMacroSkillType = {
        _id: new ObjectId(),
        name,
        createdAt: new Date(),
    };

    const macroSkillType = await getMacroSkillTypesCollection().insertOne(newMacroSkillType);
    return convertToMacroSkillTypeResponse(macroSkillType);
};

// MacroSkill Service Functions
export const getAllMacroSkills = async (): Promise<MacroSkillResponse[]> => {
    const macroSkillsCollection = getMacroSkillsCollection();

    const pipeline = [
        {
            $lookup: {
                from: "macro_skill_type",
                localField: "macroSkillTypeId",
                foreignField: "_id",
                as: "macroSkillType"
            }
        },
        {
            $unwind: "$macroSkillType"
        }
    ];

    const cursor = macroSkillsCollection.aggregate<MacroSkill & { macroSkillType: MacroSkillType }>(pipeline);
    const results = await cursor.toArray();

    return results.map(result => ({
        _id: result._id.toString(),
        name: result.name,
        macroSkillTypeId: result.macroSkillTypeId.toString(),
        macroSkillType: convertToMacroSkillTypeResponse(result.macroSkillType),
        createdAt: result.createdAt,
    }));
};

export const getMacroSkillById = async (id: string): Promise<MacroSkillResponse> => {
    const macroSkillsCollection = getMacroSkillsCollection();

    const pipeline = [
        {
            $match: { _id: new ObjectId(id) }
        },
        {
            $lookup: {
                from: "macro_skill_type",
                localField: "macroSkillTypeId",
                foreignField: "_id",
                as: "macroSkillType"
            }
        },
        {
            $unwind: "$macroSkillType"
        }
    ];

    const cursor = macroSkillsCollection.aggregate<MacroSkill & { macroSkillType: MacroSkillType }>(pipeline);
    const results = await cursor.toArray();

    if (results.length === 0) {
        throw new NotFoundException("Macro skill not found");
    }

    const result = results[0];
    return {
        _id: result._id.toString(),
        name: result.name,
        macroSkillTypeId: result.macroSkillTypeId.toString(),
        macroSkillType: convertToMacroSkillTypeResponse(result.macroSkillType),
        createdAt: result.createdAt,
    };
};

export const createMacroSkill = async (params: CreateMacroSkillInput): Promise<MacroSkillResponse> => {
    const { name, macroSkillTypeId } = params;

    // Verify that the macro skill type exists
    try {
        await getMacroSkillTypesCollection().findOneById(macroSkillTypeId);
    } catch (error) {
        throw new BadRequestException("Invalid macro skill type ID");
    }

    const newMacroSkill = {
        _id: new ObjectId(),
        name,
        macroSkillTypeId: new ObjectId(macroSkillTypeId),
        createdAt: new Date(),
    };

    const macroSkill = await getMacroSkillsCollection().insertOne(newMacroSkill);

    // Fetch the created macro skill with its macro skill type
    return await getMacroSkillById(macroSkill._id.toString());
};

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
        }
    ];

    const cursor = skillsCollection.aggregate<Skill & {
        macroSkill: MacroSkill & { macroSkillType: MacroSkillType }
    }>(pipeline);
    const results = await cursor.toArray();

    return results.map(result => ({
        _id: result._id.toString(),
        name: result.name,
        expectedLevel: result.expectedLevel,
        macroSkillId: result.macroSkillId.toString(),
        macroSkill: {
            _id: result.macroSkill._id.toString(),
            name: result.macroSkill.name,
            macroSkillTypeId: result.macroSkill.macroSkillTypeId.toString(),
            macroSkillType: convertToMacroSkillTypeResponse(result.macroSkill.macroSkillType),
            createdAt: result.macroSkill.createdAt,
        },
        createdAt: result.createdAt,
    }));
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
        }
    ];

    const cursor = skillsCollection.aggregate<Skill & {
        macroSkill: MacroSkill & { macroSkillType: MacroSkillType }
    }>(pipeline);
    const results = await cursor.toArray();

    if (results.length === 0) {
        throw new NotFoundException("Skill not found");
    }

    const result = results[0];
    return {
        _id: result._id.toString(),
        name: result.name,
        expectedLevel: result.expectedLevel,
        macroSkillId: result.macroSkillId.toString(),
        macroSkill: {
            _id: result.macroSkill._id.toString(),
            name: result.macroSkill.name,
            macroSkillTypeId: result.macroSkill.macroSkillTypeId.toString(),
            macroSkillType: convertToMacroSkillTypeResponse(result.macroSkill.macroSkillType),
            createdAt: result.macroSkill.createdAt,
        },
        createdAt: result.createdAt,
    };
};

export const createSkill = async (params: CreateSkillInput): Promise<SkillResponse> => {
    const { name, expectedLevel, macroSkillId } = params;

    // Verify that the macro skill exists
    try {
        await getMacroSkillsCollection().findOneById(macroSkillId);
    } catch (error) {
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

// Helper functions for collection access
function getMacroSkillTypesCollection(): MongoCollection<MacroSkillType> {
    return new MongoCollection<MacroSkillType>("macro_skill_type");
}

function getMacroSkillsCollection(): MongoCollection<MacroSkill> {
    return new MongoCollection<MacroSkill>("macro_skill");
}

function getSkillsCollection(): MongoCollection<Skill> {
    return new MongoCollection<Skill>("skill");
}

// Helper function to convert model to response
function convertToMacroSkillTypeResponse(macroSkillType: MacroSkillType): MacroSkillTypeResponse {
    return {
        _id: macroSkillType._id.toString(),
        name: macroSkillType.name,
        createdAt: macroSkillType.createdAt,
    };
}
