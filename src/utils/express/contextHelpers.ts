import { Request } from "express";
import { BadRequestException } from "../HttpException";

/**
 * Gets the user ID from the JWT context
 * @param req Express request object
 * @returns The user ID as a string
 * @throws BadRequestException if user ID is not present in the JWT
 */
export const getUserIdFromContext = (req: Request): string => {
    const { _id } = req.context.user;
    if (!_id) {
        throw new BadRequestException("User ID not found in context");
    }
    return _id;
};

/**
 * Gets the user email from the JWT context
 * @param req Express request object
 * @returns The user email as a string
 */
export const getUserEmailFromContext = (req: Request): string => {
    return req.context.user.email;
};

/**
 * Gets the user roles from the JWT context
 * @param req Express request object
 * @returns Array of user roles
 */
export const getUserRolesFromContext = (req: Request): string[] => {
    return req.context.user.roles;
};

/**
 * Checks if the user has a specific role
 * @param req Express request object
 * @param role The role to check
 * @returns Boolean indicating if user has the role
 */
export const userHasRole = (req: Request, role: string): boolean => {
    return req.context.user.roles.includes(role);
};