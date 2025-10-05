import { ObjectId } from "mongodb";

export interface Evaluation {
    _id: ObjectId;
    userJobId?: ObjectId;
    userJobCode?: string;

    // Employee information
    userId: ObjectId;
    userName: string;
    userCode: string;

    managerUserId?: ObjectId;
    managerUserName?: string;
    managerUserCode?: string;
    observationDate: Date;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    createdBy: ObjectId;
}
