import { ObjectId } from "mongodb";

export interface Skill {
    _id: ObjectId;
    name: string;
    expectedLevel: number | null;
    macroSkillId: ObjectId;
    createdAt: Date;
}
