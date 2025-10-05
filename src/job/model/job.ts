import { ObjectId } from "mongodb";

export interface Job {
    _id: ObjectId;
    name: string;
    code: string;
    jobProfile: string;
    jobFamily?: string;
    createdAt: Date;
}


