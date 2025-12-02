import { ObjectId } from "mongodb";

export interface Habilitation {
    _id: ObjectId;
    userId: ObjectId;
    jobId: ObjectId;
    type: string;
    code: string;
    label: string;
    startDate: Date;
    endDate: Date;
    payrollSection: string;
    establishment: string;
    profession: string;
    createdAt: Date;
    updatedAt: Date;
}

