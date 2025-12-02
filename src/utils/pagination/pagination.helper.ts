import { Request, Response } from "express";

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

/**
 * Extract pagination parameters from request headers or query params
 * Headers have priority: x-page, x-limit
 * Fallback to query params: page, limit
 * @param req Express Request object
 * @param defaultLimit Default limit (default: 50)
 * @returns PaginationParams object with page, limit, and skip
 */
export function getPaginationParams(req: Request, defaultLimit: number = 50): PaginationParams {
    // Try to get from headers first
    const headerPage = req.headers['x-page'];
    const headerLimit = req.headers['x-limit'];
    
    // Fallback to query params
    const queryPage = req.query.page;
    const queryLimit = req.query.limit;
    
    // Parse page number (default to 1)
    const page = Math.max(1, parseInt((headerPage || queryPage || '1') as string, 10) || 1);
    
    // Parse limit (default to defaultLimit)
    const limit = Math.max(1, Math.min(100, parseInt((headerLimit || queryLimit || defaultLimit.toString()) as string, 10) || defaultLimit));
    
    // Calculate skip
    const skip = (page - 1) * limit;
    
    return { page, limit, skip };
}

/**
 * Create pagination metadata
 * @param page Current page number
 * @param limit Items per page
 * @param total Total number of items
 * @returns PaginationMeta object
 */
export function createPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    
    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}

/**
 * Set pagination headers on response
 * @param res Express Response object
 * @param meta PaginationMeta object
 */
export function setPaginationHeaders(res: Response, meta: PaginationMeta): void {
    res.setHeader('x-page', meta.page.toString());
    res.setHeader('x-limit', meta.limit.toString());
    res.setHeader('x-total', meta.total.toString());
    res.setHeader('x-total-pages', meta.totalPages.toString());
}

/**
 * Create a paginated response with data and metadata
 * @param data Array of items
 * @param page Current page number
 * @param limit Items per page
 * @param total Total number of items
 * @returns PaginatedResponse object
 */
export function createPaginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): PaginatedResponse<T> {
    const meta = createPaginationMeta(page, limit, total);
    
    return {
        data,
        meta,
    };
}

