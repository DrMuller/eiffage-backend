import { ObjectId } from "mongodb";

export interface Skill {
    _id: ObjectId;
    name: string;
    macroSkillId: ObjectId;
    createdAt: Date;
}
