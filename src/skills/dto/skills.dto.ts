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
    macroSkillTypeId: z.string().min(1, "Macro skill type ID is required"),
});

export type CreateMacroSkillInput = z.infer<typeof createMacroSkillSchema>;

export type MacroSkillResponse = {
    _id: string;
    name: string;
    macroSkillTypeId: string;
    macroSkillType: MacroSkillTypeResponse;
    createdAt: Date;
};

// Skill schemas
export const createSkillSchema = z.object({
    name: z.string().min(1, "Name is required"),
    expectedLevel: z.number().nullable().optional(),
    macroSkillId: z.string().min(1, "Macro skill ID is required"),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;

export type SkillResponse = {
    _id: string;
    name: string;
    macroSkillId: string;
    macroSkillName: string;
    macroSkillTypeId: string;
    macroSkillTypeName: string;
    jobSkills: { jobId: string, expectedLevel: number }[];
    createdAt: Date;
};

export type JobSkillResponse = {
    _id: string;
    skillId: string;
    skillName: string;
    macroSkillId: string;
    macroSkillName: string;
    macroSkillTypeId: string;
    macroSkillTypeName: string;
    jobId: string;
    expectedLevel: number;
};
