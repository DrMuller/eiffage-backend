import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { MacroSkillType } from "../model/macroSkillType";
import {
    CreateMacroSkillTypeInput,
    MacroSkillTypeResponse,
} from "../dto/skills.dto";

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

    const newMacroSkillType: MacroSkillType = {
        _id: new ObjectId(),
        name,
        createdAt: new Date(),
    } as MacroSkillType;

    const inserted = await getMacroSkillTypesCollection().insertOne(newMacroSkillType);
    return convertToMacroSkillTypeResponse(inserted);
};

function getMacroSkillTypesCollection(): MongoCollection<MacroSkillType> {
    return new MongoCollection<MacroSkillType>("macro_skill_type");
}

function convertToMacroSkillTypeResponse(macroSkillType: MacroSkillType): MacroSkillTypeResponse {
    return {
        _id: macroSkillType._id.toString(),
        name: macroSkillType.name,
        createdAt: macroSkillType.createdAt,
    };
}


