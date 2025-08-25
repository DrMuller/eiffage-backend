import { ObjectId } from "mongodb";

export interface Skill {
    _id: ObjectId;
    name: string;
    expectedLevel: string | null;
    macroSkillId: ObjectId;
    createdAt: Date;
}
