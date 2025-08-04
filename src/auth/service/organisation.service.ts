import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { Organisation } from "../model/organisation";
import { NotFoundException } from "../../utils/HttpException";

export interface CreateOrganisationParams {
    name: string;
    logoUrl?: string;
    address: string;
    siren: string;
}

export interface UpdateOrganisationParams {
    name?: string;
    logoUrl?: string;
    address?: string;
    siren?: string;
}

const getOrganisationsCollection = () => new MongoCollection<Organisation>("organisations");

export const createOrganisation = async (params: CreateOrganisationParams): Promise<Organisation> => {
    const { name, logoUrl, address, siren } = params;

    const newOrganisation = {
        _id: new ObjectId(),
        name,
        logoUrl: logoUrl || "", // Allow empty logoUrl that can be updated later with file upload
        address,
        siren,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    return getOrganisationsCollection().insertOne(newOrganisation);
};

export const updateOrganisation = async (organisationId: string, params: UpdateOrganisationParams): Promise<Organisation> => {
    // Get the current organization to ensure it exists
    await getOrganisationById(organisationId);

    // Create update data with new updatedAt timestamp
    const updateData = {
        ...params,
        updatedAt: new Date()
    };

    // Use findOneAndUpdate with proper syntax
    const updatedOrg = await getOrganisationsCollection().findOneAndUpdate(
        { _id: new ObjectId(organisationId) },
        updateData
    );

    return updatedOrg;
};

export const getOrganisationById = async (organisationId: string): Promise<Organisation> => {
    const organisation = await getOrganisationsCollection().findOne({ _id: new ObjectId(organisationId) });

    if (!organisation) {
        throw new NotFoundException(`Organisation with id ${organisationId} not found`);
    }

    return organisation;
};

export const getOrganisations = async (): Promise<Organisation[]> => {
    return getOrganisationsCollection().find({});
};
 