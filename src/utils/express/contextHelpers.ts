import { Request } from "express";
import { getOrganisationById } from "../../auth/service/organisation.service";
import { BadRequestException, ForbiddenException } from "../HttpException";

/**
 * Gets the organisationId from the JWT context
 * @param req Express request object containing JWT context
 * @returns The organisationId as a string
 * @throws BadRequestException if organisationId is not present in the JWT
 */
export const getOrganisationIdFromContext = (req: Request): string => {
    const { organisationId } = req.context.user;
    if (!organisationId) {
        throw new BadRequestException("User is not associated with an organisation");
    }
    return organisationId;
};

/**
 * Checks if the user has access to the specified organisation
 * @param req Express request object containing JWT context
 * @param organisationId The organisation ID to check access for
 * @throws ForbiddenException if the user does not have access to the organisation
 */
export const checkOrganisationAccess = (req: Request, organisationId: string): void => {
    const userOrganisationId = req.context.user.organisationId;
    if (req.context.user.roles.includes("ADMIN")) {
        return;
    }
    if (!userOrganisationId) {
        throw new ForbiddenException("User is not associated with any organisation");
    }

    if (userOrganisationId !== organisationId) {
        throw new ForbiddenException("User does not have access to this organisation");
    }
};

/**
 * Gets the organisation object from the JWT context
 * @param req Express request object containing JWT context
 * @returns Promise that resolves to the Organisation object
 * @throws BadRequestException if organisationId is not present in the JWT
 */
export const getOrganisationFromContext = async (req: Request) => {
    const organisationId = getOrganisationIdFromContext(req);
    return getOrganisationById(organisationId);
}; 