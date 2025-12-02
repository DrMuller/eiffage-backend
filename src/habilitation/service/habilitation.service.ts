import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { BadRequestException, NotFoundException } from "../../utils/HttpException";
import { Habilitation } from "../model/habilitation";
import { CreateHabilitationInput, UpdateHabilitationInput, HabilitationResponse } from "../dto/habilitation.dto";
import { User } from "../../auth/model/user";
import { Job } from "../../job/model/job";
import type { GetHabilitationsQuery } from "../controller/habilitation.controller";
import type { PaginatedResponse } from "../../utils/pagination/pagination.helper";
import { createPaginatedResponse } from "../../utils/pagination/pagination.helper";

export interface SearchHabilitationsOptions {
    page?: number;
    limit?: number;
    skip?: number;
}

export async function searchHabilitations(
    query: GetHabilitationsQuery,
    options?: SearchHabilitationsOptions
): Promise<PaginatedResponse<HabilitationResponse>> {
    const filter: any = {};

    // Text search across multiple fields
    if (query.q) {
        const regex = new RegExp(query.q, 'i');
        filter.$or = [
            { code: { $regex: regex } },
            { label: { $regex: regex } },
            { type: { $regex: regex } },
            { payrollSection: { $regex: regex } },
            { establishment: { $regex: regex } },
            { profession: { $regex: regex } },
        ];
    }

    // Single user or job filter (backward compatibility)
    if (query.userId) {
        filter.userId = new ObjectId(query.userId);
    }
    if (query.jobId) {
        filter.jobId = new ObjectId(query.jobId);
    }

    // Multiple users filter
    if (query.userIds && query.userIds.length > 0) {
        filter.userId = { $in: query.userIds.map(id => new ObjectId(id)) };
    }

    // Multiple jobs filter
    if (query.jobIds && query.jobIds.length > 0) {
        filter.jobId = { $in: query.jobIds.map(id => new ObjectId(id)) };
    }

    // Date range filters
    if (query.startDateFrom) {
        filter.startDate = {};
        filter.startDate.$gte = new Date(query.startDateFrom);
    }

    if (query.endDateTo) {
        filter.endDate = {};
        filter.endDate.$lte = new Date(query.endDateTo);
    }

    // Get total count for pagination
    const total = await getHabilitationsCollection().count(filter);

    // Apply pagination if provided
    const findOptions: any = { sort: { createdAt: -1 } };
    if (options) {
        if (options.skip !== undefined) {
            findOptions.skip = options.skip;
        }
        if (options.limit !== undefined) {
            findOptions.limit = options.limit;
        }
    }

    const habilitations = await getHabilitationsCollection().find(filter, findOptions);
    const data = habilitations.map(convertToHabilitationResponse);

    // Return paginated response
    return createPaginatedResponse(
        data,
        options?.page || 1,
        options?.limit || 50,
        total
    );
}

export async function getHabilitationById(id: string): Promise<HabilitationResponse> {
    const habilitation = await getHabilitationsCollection().findOneById(id);
    return convertToHabilitationResponse(habilitation);
}

export async function createHabilitation(params: CreateHabilitationInput): Promise<HabilitationResponse> {
    const { userId, jobId, type, code, label, startDate, endDate, payrollSection, establishment, profession } = params;

    // Verify that user exists
    await getUsersCollection().findOneOrFail({ _id: new ObjectId(userId) });

    // Verify that job exists
    await getJobsCollection().findOneOrFail({ _id: new ObjectId(jobId) });

    // Validate date logic
    if (new Date(endDate) < new Date(startDate)) {
        throw new BadRequestException("End date must be after start date");
    }

    const newHabilitation: Habilitation = {
        _id: new ObjectId(),
        userId: new ObjectId(userId),
        jobId: new ObjectId(jobId),
        type,
        code,
        label,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        payrollSection,
        establishment,
        profession,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const inserted = await getHabilitationsCollection().insertOne(newHabilitation);
    return convertToHabilitationResponse(inserted);
}

export async function updateHabilitation(id: string, updates: UpdateHabilitationInput): Promise<HabilitationResponse> {
    const existing = await getHabilitationsCollection().findOneById(id);

    // If userId is being updated, verify the new user exists
    if (updates.userId) {
        await getUsersCollection().findOneOrFail({ _id: new ObjectId(updates.userId) });
    }

    // If jobId is being updated, verify the new job exists
    if (updates.jobId) {
        await getJobsCollection().findOneOrFail({ _id: new ObjectId(updates.jobId) });
    }

    // Validate date logic if dates are being updated
    const newStartDate = updates.startDate ? new Date(updates.startDate) : existing.startDate;
    const newEndDate = updates.endDate ? new Date(updates.endDate) : existing.endDate;

    if (newEndDate < newStartDate) {
        throw new BadRequestException("End date must be after start date");
    }

    const updated: Habilitation = {
        ...existing,
        ...(updates.userId && { userId: new ObjectId(updates.userId) }),
        ...(updates.jobId && { jobId: new ObjectId(updates.jobId) }),
        ...(updates.type && { type: updates.type }),
        ...(updates.code && { code: updates.code }),
        ...(updates.label && { label: updates.label }),
        ...(updates.startDate && { startDate: new Date(updates.startDate) }),
        ...(updates.endDate && { endDate: new Date(updates.endDate) }),
        ...(updates.payrollSection && { payrollSection: updates.payrollSection }),
        ...(updates.establishment && { establishment: updates.establishment }),
        ...(updates.profession && { profession: updates.profession }),
        updatedAt: new Date(),
    } as Habilitation;

    const result = await getHabilitationsCollection().update(updated);
    return convertToHabilitationResponse(result);
}

export async function deleteHabilitation(id: string): Promise<void> {
    // Ensure habilitation exists
    await getHabilitationsCollection().findOneById(id);
    // Delete habilitation
    await getHabilitationsCollection().deleteOne({ _id: new ObjectId(id) });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getHabilitationsCollection(): MongoCollection<Habilitation> {
    return new MongoCollection<Habilitation>("habilitation");
}

function getUsersCollection(): MongoCollection<User> {
    return new MongoCollection<User>("user");
}

function getJobsCollection(): MongoCollection<Job> {
    return new MongoCollection<Job>("job");
}

function convertToHabilitationResponse(habilitation: Habilitation): HabilitationResponse {
    return {
        _id: habilitation._id.toString(),
        userId: habilitation.userId.toString(),
        jobId: habilitation.jobId.toString(),
        type: habilitation.type,
        code: habilitation.code,
        label: habilitation.label,
        startDate: habilitation.startDate,
        endDate: habilitation.endDate,
        payrollSection: habilitation.payrollSection,
        establishment: habilitation.establishment,
        profession: habilitation.profession,
        createdAt: habilitation.createdAt,
        updatedAt: habilitation.updatedAt,
    };
}

