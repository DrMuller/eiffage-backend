import { ObjectId } from "mongodb";

export interface Skill {
    _id: ObjectId;
    name: string;
    jobId: ObjectId;
    expectedLevel: number;
    macroSkillId: ObjectId;
    createdAt: Date;
}
