import { z } from "zod";

// Evaluation schemas
export const createEvaluationSchema = z.object({
    userJobId: z.string().optional(),
    userJobCode: z.string().optional(),
    userId: z.string().min(1, "User ID is required"),
    userName: z.string().min(1, "User name is required"),
    userCode: z.string().min(1, "User code is required"),
    managerUserId: z.string().optional(),
    managerUserName: z.string().optional(),
    managerUserCode: z.string().optional(),
    observationDate: z.string().transform((str) => new Date(str)),
});

export const updateEvaluationSchema = z.object({
    userJobId: z.string().optional().nullable(),
    userJobCode: z.string().optional().nullable(),
    userId: z.string().optional(),
    userName: z.string().optional(),
    userCode: z.string().optional(),
    managerUserId: z.string().optional().nullable(),
    managerUserName: z.string().optional().nullable(),
    managerUserCode: z.string().optional().nullable(),
    observationDate: z.string().transform((str) => new Date(str)).optional(),
});

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;

export type EvaluationResponse = {
    _id: string;
    userJobId?: string;
    userJobCode?: string;
    userId: string;
    userName: string;
    userCode: string;
    managerUserId?: string;
    managerUserName?: string;
    managerUserCode?: string;
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
    expectedLevel: z.string().nullable().optional(),
    observedLevel: z.string().nullable().optional(),
});

export const updateEvaluationSkillSchema = z.object({
    expectedLevel: z.string().nullable().optional(),
    observedLevel: z.string().nullable().optional(),
});

export const bulkCreateEvaluationSkillsSchema = z.object({
    evaluationId: z.string().min(1, "Evaluation ID is required"),
    skills: z.array(z.object({
        skillId: z.string().min(1, "Skill ID is required"),
        expectedLevel: z.string().nullable().optional(),
        observedLevel: z.string().nullable().optional(),
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
    expectedLevel: string | null;
    observedLevel: string | null;
    gap: number | null;
    createdAt: Date;
    skill: {
        _id: string;
        name: string;
        expectedLevel: string | null;
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
        expectedLevel: z.string().nullable().optional(),
        observedLevel: z.string().nullable().optional(),
    })).min(1, "At least one skill is required"),
});

export type CreateCompleteEvaluationInput = z.infer<typeof createCompleteEvaluationSchema>;
