import { z } from "zod";

// Evaluation schemas
export const createEvaluationSchema = z.object({
    userJobId: z.string().optional(),
    userJobCode: z.string().optional(),
    userId: z.string(),
    managerUserId: z.string(),
});

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;

export type EvaluationResponse = {
    _id: string;
    userJobId?: string;
    userJobCode?: string;
    userId: string;
    managerUserId: string;
    observationDate: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    evaluationSkills?: EvaluationSkillResponse[];
};

// EvaluationSkill schemas
export const createEvaluationSkillSchema = z.object({
    evaluationId: z.string().min(1, "Evaluation ID is required"),
    skillId: z.string().min(1, "Skill ID is required"),
    expectedLevel: z.number().nullable().optional(),
    observedLevel: z.number().nullable().optional(),
});

export const updateEvaluationSkillSchema = z.object({
    expectedLevel: z.number().nullable().optional(),
    observedLevel: z.number().nullable().optional(),
});

export const bulkCreateEvaluationSkillsSchema = z.object({
    evaluationId: z.string().min(1, "Evaluation ID is required"),
    skills: z.array(z.object({
        skillId: z.string().min(1, "Skill ID is required"),
        expectedLevel: z.number().nullable().optional(),
        observedLevel: z.number().nullable().optional(),
    })).min(1, "At least one skill is required"),
});

export type CreateEvaluationSkillInput = z.infer<typeof createEvaluationSkillSchema>;
export type UpdateEvaluationSkillInput = z.infer<typeof updateEvaluationSkillSchema>;
export type BulkCreateEvaluationSkillsInput = z.infer<typeof bulkCreateEvaluationSkillsSchema>;

export type EvaluationSkillResponse = {
    _id: string;
    evaluationId: string;
    skillId: string;
    macroSkillId: string;
    macroSkillTypeId: string;
    expectedLevel: number | null;
    observedLevel: number | null;
    gap: number | null;
    createdAt: Date;
    skill: {
        _id: string;
        name: string;
        expectedLevel: number | null;
        macroSkill: {
            _id: string;
            name: string;
            macroSkillType: {
                _id: string;
                name: string;
                createdAt?: Date;
            };
            createdAt?: Date;
        };
        createdAt: Date;
    };
};

// Complete evaluation with skills
export const createCompleteEvaluationSchema = z.object({
    evaluation: createEvaluationSchema,
    skills: z.array(z.object({
        skillId: z.string().min(1, "Skill ID is required"),
        expectedLevel: z.number().nullable().optional(),
        observedLevel: z.number().nullable().optional(),
    })).min(1, "At least one skill is required"),
});

export type CreateCompleteEvaluationInput = z.infer<typeof createCompleteEvaluationSchema>;
