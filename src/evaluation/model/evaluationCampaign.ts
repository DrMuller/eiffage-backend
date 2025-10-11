import { ObjectId } from "mongodb";

export interface EvaluationCampaign {
    _id: ObjectId;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

