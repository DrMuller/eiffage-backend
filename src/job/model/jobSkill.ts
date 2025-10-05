import { ObjectId } from "mongodb";

export interface JobSkill {
    _id: ObjectId;
    jobId: ObjectId;
    skillId: ObjectId;
    levelExpected: string | null;
    createdAt: Date;
}


