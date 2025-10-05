import { z } from "zod";
import type { SkillResponse } from "../../skills/dto/skills.dto";

export const createJobSchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required"),
    jobProfile: z.string().min(1, "Job profile is required"),
    jobFamily: z.string().min(1, "Job family is required").optional(),
});

export const updateJobSchema = z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    jobProfile: z.string().min(1).optional(),
    jobFamily: z.string().min(1).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export const addSkillToJobSchema = z.object({
    skillId: z.string().min(1, "Skill ID is required"),
    levelExpected: z.string().nullable().optional(),
});

export const updateJobSkillSchema = z.object({
    levelExpected: z.string().nullable().optional(),
});

export type AddSkillToJobInput = z.infer<typeof addSkillToJobSchema>;
export type UpdateJobSkillInput = z.infer<typeof updateJobSkillSchema>;

export type JobResponse = {
    _id: string;
    name: string;
    code: string;
    jobProfile: string;
    jobFamily?: string;
    createdAt: Date;
};

export type JobWithSkillsResponse = JobResponse & {
    skills: Array<{
        skill: SkillResponse;
        levelExpected: string | null;
    }>;
};


