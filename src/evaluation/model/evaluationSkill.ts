import { ObjectId } from "mongodb";

export interface EvaluationSkill {
    _id: ObjectId;
    evaluationId: ObjectId;
    evaluationCampaignId: ObjectId;
    skillId: ObjectId;
    macroSkillId: ObjectId;
    macroSkillTypeId: ObjectId;
    observedLevel: number;
    createdAt: Date;
}

export interface EvaluationSkillEnriched extends EvaluationSkill {
    skillName: string;
    macroSkillName: string;
    macroSkillTypeName: string;
}
