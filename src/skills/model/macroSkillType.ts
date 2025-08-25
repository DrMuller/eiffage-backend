import { ObjectId } from "mongodb";

export interface MacroSkillType {
    _id: ObjectId;
    name: string;
    createdAt?: Date;
}
