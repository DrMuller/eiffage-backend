import { ObjectId } from "mongodb";

export interface Evaluation {
    _id: ObjectId;
    // Employee information
    employeeName: string;
    employeeRegistrationNumber: string;
    managerId?: ObjectId;
    managerName?: string;
    observationDate: Date;
    
    // Job information
    employeeId: ObjectId;
    jobFamily: string;
    jobProfile: string;
    jobTitle: string;
    position: string;
    
    // Metadata
    createdAt: Date;
    updatedAt: Date;
    createdBy: ObjectId;
}
