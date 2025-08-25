import { z } from "zod";

// Evaluation schemas
export const createEvaluationSchema = z.object({
    employeeName: z.string().min(1, "Employee name is required"),
    employeeRegistrationNumber: z.string().min(1, "Employee registration number is required"),
    managerId: z.string().optional(),
    managerName: z.string().optional(),
    observationDate: z.string().transform((str) => new Date(str)),
    employeeId: z.string().min(1, "Employee ID is required"),
    jobFamily: z.string().min(1, "Job family is required"),
    jobProfile: z.string().min(1, "Job profile is required"),
    jobTitle: z.string().min(1, "Job title is required"),
    position: z.string().min(1, "Position is required"),
});

export const updateEvaluationSchema = z.object({
    employeeName: z.string().min(1).optional(),
    employeeRegistrationNumber: z.string().min(1).optional(),
    managerId: z.string().optional(),
    managerName: z.string().optional(),
    observationDate: z.string().transform((str) => new Date(str)).optional(),
    employeeId: z.string().min(1).optional(),
    jobFamily: z.string().min(1).optional(),
    jobProfile: z.string().min(1).optional(),
    jobTitle: z.string().min(1).optional(),
    position: z.string().min(1).optional(),
});

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;

export type EvaluationResponse = {
    _id: string;
    employeeName: string;
    employeeRegistrationNumber: string;
    managerId?: string;
    managerName?: string;
    observationDate: Date;
    employeeId: string;
    jobFamily: string;
    jobProfile: string;
    jobTitle: string;
    position: string;
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
