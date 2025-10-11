import { ObjectId } from "mongodb";

export interface Evaluation {
    _id: ObjectId;
    userJobId?: ObjectId;
    userJobCode?: string;
    userId: ObjectId;
    managerUserId?: ObjectId;
    evaluationCampaignId: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    createdBy: ObjectId;
}
