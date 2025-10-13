import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { EvaluationCampaign } from "../model/evaluationCampaign";
import {
    CreateEvaluationCampaignInput,
    UpdateEvaluationCampaignInput,
    EvaluationCampaignResponse,
} from "../dto/evaluationCampaign.dto";
import { NotFoundException } from "../../utils/HttpException";

// Helper function for collection access
function getEvaluationCampaignsCollection(): MongoCollection<EvaluationCampaign> {
    return new MongoCollection<EvaluationCampaign>("evaluation_campaign");
}

// Helper function to convert model to response
function convertToEvaluationCampaignResponse(campaign: EvaluationCampaign): EvaluationCampaignResponse {
    return {
        _id: campaign._id.toString(),
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
    };
}

// CRUD Service Functions
export const getAllEvaluationCampaigns = async (): Promise<EvaluationCampaignResponse[]> => {
    const campaigns = await getEvaluationCampaignsCollection().find({});
    return campaigns.map(convertToEvaluationCampaignResponse);
};

// Get current active campaign (now between startDate and endDate). If none, 404.
export const getCurrentEvaluationCampaign = async (): Promise<EvaluationCampaignResponse> => {
    const now = new Date();
    const campaign = await getEvaluationCampaignsCollection().findOne(
        {
            startDate: { $lte: now } as any,
            endDate: { $gte: now } as any,
        } as any,
        { sort: { startDate: -1 } as any }
    );
    if (!campaign) throw new NotFoundException("No active evaluation campaign");
    return convertToEvaluationCampaignResponse(campaign);
};

export const getEvaluationCampaignById = async (id: string): Promise<EvaluationCampaignResponse> => {
    const campaign = await getEvaluationCampaignsCollection().findOneById(id);
    return convertToEvaluationCampaignResponse(campaign);
};

export const createEvaluationCampaign = async (params: CreateEvaluationCampaignInput): Promise<EvaluationCampaignResponse> => {
    const { startDate, endDate } = params;

    const newCampaign: EvaluationCampaign = {
        _id: new ObjectId(),
        startDate,
        endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as EvaluationCampaign;

    const campaign = await getEvaluationCampaignsCollection().insertOne(newCampaign as any);
    return convertToEvaluationCampaignResponse(campaign);
};

export const updateEvaluationCampaign = async (id: string, params: UpdateEvaluationCampaignInput): Promise<EvaluationCampaignResponse> => {
    const updateData = {
        ...params,
        updatedAt: new Date(),
    };

    await getEvaluationCampaignsCollection().findOneAndUpdate(
        { _id: new ObjectId(id) } as any,
        updateData
    );

    return await getEvaluationCampaignById(id);
};

export const deleteEvaluationCampaign = async (id: string): Promise<void> => {
    await getEvaluationCampaignsCollection().deleteOne({ _id: new ObjectId(id) } as any);
};

