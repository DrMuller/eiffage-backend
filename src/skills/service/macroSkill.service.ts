import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { NotFoundException, BadRequestException } from "../../utils/HttpException";
import { MacroSkillType } from "../model/macroSkillType";
import { MacroSkill } from "../model/macroSkill";
import {
    CreateMacroSkillInput,
    MacroSkillTypeResponse,
    MacroSkillResponse,
} from "../dto/skills.dto";

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
        { $unwind: "$macroSkillType" }
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
        { $match: { _id: new ObjectId(id) } },
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

    try {
        await getMacroSkillTypesCollection().findOneById(macroSkillTypeId);
    } catch {
        throw new BadRequestException("Invalid macro skill type ID");
    }

    const newMacroSkill: MacroSkill = {
        _id: new ObjectId(),
        name,
        macroSkillTypeId: new ObjectId(macroSkillTypeId),
        createdAt: new Date(),
    } as MacroSkill;

    const inserted = await getMacroSkillsCollection().insertOne(newMacroSkill);
    return await getMacroSkillById(inserted._id.toString());
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


