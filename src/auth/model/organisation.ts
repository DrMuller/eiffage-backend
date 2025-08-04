import { ObjectId } from "mongodb";

export interface Organisation {
    _id: ObjectId;
    name: string;
    logoUrl: string;
    address: string;
    siren: string;
    createdAt: Date;
    updatedAt: Date;
} 