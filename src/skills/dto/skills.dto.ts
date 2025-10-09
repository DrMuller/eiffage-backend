import { z } from "zod";
import { MacroSkillType } from "../model/macroSkillType";
import { MacroSkill } from "../model/macroSkill";
import { Skill } from "../model/skill";

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
    expectedLevel: number | null;
    macroSkillId: string;
    macroSkill: {
        _id: string;
        name: string;
        macroSkillTypeId: string;
        macroSkillType: MacroSkillTypeResponse;
        createdAt: Date;
    };
    jobIds: string[];
    createdAt: Date;
};
