import { ObjectId } from "mongodb";

export interface MacroSkill {
    _id: ObjectId;
    name: string;
    macroSkillTypeId: ObjectId;
    createdAt: Date;
}
