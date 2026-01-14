import { ObjectId } from "mongodb";

export interface MacroSkill {
    _id: ObjectId;
    name: string;
    jobId: ObjectId;
    macroSkillTypeId: ObjectId;
    createdAt: Date;
}
