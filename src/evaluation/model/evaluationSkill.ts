import { ObjectId } from "mongodb";

export interface EvaluationSkill {
    _id: ObjectId;
    evaluationId: ObjectId;
    skillId: ObjectId;
    macroSkillId: ObjectId;
    macroSkillTypeId: ObjectId;
    expectedLevel: number | null;
    observedLevel: number | null;
    gap: number | null; // Calculated field: observedLevel - expectedLevel
    createdAt: Date;
}
