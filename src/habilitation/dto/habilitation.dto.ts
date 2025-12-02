import { z } from "zod";

export const createHabilitationSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    jobId: z.string().min(1, "Job ID is required"),
    type: z.string().min(1, "Type is required"),
    code: z.string().min(1, "Code is required"),
    label: z.string().min(1, "Label is required"),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)),
    endDate: z.string().or(z.date()).transform((val) => new Date(val)),
    payrollSection: z.string().min(1, "Payroll section is required"),
    establishment: z.string().min(1, "Establishment is required"),
    profession: z.string().min(1, "Profession is required"),
});

export const updateHabilitationSchema = z.object({
    userId: z.string().min(1).optional(),
    jobId: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    endDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    payrollSection: z.string().min(1).optional(),
    establishment: z.string().min(1).optional(),
    profession: z.string().min(1).optional(),
});

export type CreateHabilitationInput = z.infer<typeof createHabilitationSchema>;
export type UpdateHabilitationInput = z.infer<typeof updateHabilitationSchema>;

export type HabilitationResponse = {
    _id: string;
    userId: string;
    jobId: string;
    type: string;
    code: string;
    label: string;
    startDate: Date;
    endDate: Date;
    payrollSection: string;
    establishment: string;
    profession: string;
    createdAt: Date;
    updatedAt: Date;
};

