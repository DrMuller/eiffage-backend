import { z } from "zod";

// MacroSkillType schemas
export const createMacroSkillTypeSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export type CreateMacroSkillTypeInput = z.infer<typeof createMacroSkillTypeSchema>;

export type MacroSkillTypeResponse = {
    _id: string;
    name: string;
    createdAt?: Date;
};

// MacroSkill schemas
export const createMacroSkillSchema = z.object({
    name: z.string().min(1, "Name is required"),
    jobId: z.string().min(1, "Job ID is required"),
    macroSkillTypeId: z.string().min(1, "Macro skill type ID is required"),
});

export type CreateMacroSkillInput = z.infer<typeof createMacroSkillSchema>;

export type MacroSkillResponse = {
    _id: string;
    name: string;
    jobId: string;
    jobName: string;
    macroSkillTypeId: string;
    macroSkillType: MacroSkillTypeResponse;
    createdAt: Date;
};

// Skill schemas
export const createSkillSchema = z.object({
    name: z.string().min(1, "Name is required"),
    jobId: z.string().min(1, "Job ID is required"),
    expectedLevel: z.number().min(0).max(4),
    macroSkillId: z.string().min(1, "Macro skill ID is required"),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;

export type SkillResponse = {
    _id: string;
    name: string;
    jobId: string;
    jobName: string;
    expectedLevel: number;
    macroSkillId: string;
    macroSkillName: string;
    macroSkillTypeId: string;
    macroSkillTypeName: string;
    createdAt: Date;
};
