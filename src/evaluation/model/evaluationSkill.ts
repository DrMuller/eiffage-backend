import { ObjectId } from "mongodb";

export interface EvaluationSkill {
    _id: ObjectId;
    evaluationId: ObjectId;
    skillId: ObjectId;
    macroSkillId: ObjectId;
    macroSkillTypeId: ObjectId;
    expectedLevel: string | null;
    observedLevel: string | null;
    gap: number | null; // Calculated field: observedLevel - expectedLevel
    createdAt: Date;
}
