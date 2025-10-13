import { ObjectId } from "mongodb";

export interface SkillLevel {
    _id: ObjectId;
    userId: ObjectId;
    skillId: ObjectId;
    level: number | null;
    createdAt: Date;
    updatedAt: Date;
}



