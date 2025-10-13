import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { NotFoundException } from "../../utils/HttpException";
import { Evaluation } from "../model/evaluation";
import { EvaluationSkill, EvaluationSkillEnriched } from "../model/evaluationSkill";
import { Skill } from "../../skills/model/skill";
import { MacroSkill } from "../../skills/model/macroSkill";
import { SkillLevel } from "../model/skillLevel";
import { EvaluationCampaign } from "../model/evaluationCampaign";
import {
    CreateEvaluationInput,
    EvaluationResponse,
    CreateEvaluationSkillInput,
    UpdateEvaluationSkillInput,
    EvaluationSkillResponse,
    BulkCreateEvaluationSkillsInput,
    CreateCompleteEvaluationInput,
} from "../dto/evaluation.dto";

// Evaluation Service Functions
export const getAllEvaluations = async (): Promise<EvaluationResponse[]> => {
    const evaluations = await getEvaluationsCollection().find({});
    return evaluations.map(convertToEvaluationResponse);
};

export const getEvaluationById = async (id: string): Promise<EvaluationResponse> => {
    const evaluation = await getEvaluationsCollection().findOneById(id);
    return convertToEvaluationResponse(evaluation);
};

export const getEvaluationWithSkills = async (id: string): Promise<EvaluationResponse> => {
    const evaluation = await getEvaluationsCollection().findOneById(id);
    const evaluationSkills = await getEvaluationSkillsWithDetails(id);

    return {
        ...convertToEvaluationResponse(evaluation),
        evaluationSkills,
    };
};

export const createEvaluation = async (params: CreateEvaluationInput, createdBy: string): Promise<EvaluationResponse> => {
    const {
        userJobId,
        userJobCode,
        userId,
        managerUserId,
        evaluationCampaignId,
    } = params;

    const newEvaluation: Evaluation = {
        _id: new ObjectId(),
        userJobId: userJobId ? new ObjectId(userJobId) : undefined,
        userJobCode: userJobCode,
        userId: new ObjectId(userId),
        managerUserId: managerUserId ? new ObjectId(managerUserId) : undefined,
        evaluationCampaignId: new ObjectId(evaluationCampaignId),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: new ObjectId(createdBy),
    } as Evaluation;

    const evaluation = await getEvaluationsCollection().insertOne(newEvaluation as any);
    return convertToEvaluationResponse(evaluation);
};

export const deleteEvaluation = async (id: string): Promise<void> => {
    // First delete all related evaluation skills
    await getEvaluationSkillsCollection().deleteMany({ evaluationId: new ObjectId(id) });

    // Then delete the evaluation
    await getEvaluationsCollection().deleteOne({ _id: new ObjectId(id) } as any);
};

export const createCompleteEvaluation = async (
    params: CreateCompleteEvaluationInput,
    createdBy: string
): Promise<EvaluationResponse> => {
    // Create the evaluation first
    const evaluation = await createEvaluation(params.evaluation, createdBy);

    // Then create all the evaluation skills
    const skillsData = {
        evaluationId: evaluation._id,
        skills: params.skills,
    };

    await bulkCreateEvaluationSkills(skillsData);

    // Return the complete evaluation with skills
    const evaluationWithSkills = await getEvaluationWithSkills(evaluation._id);

    // Update SkillLevel entries based on rules
    const evaluationModel = await getEvaluationsCollection().findOneById(evaluation._id);
    await updateSkillLevelsAfterEvaluation(evaluationModel);

    return evaluationWithSkills;
};

// EvaluationSkill Service Functions
export const getAllEvaluationSkills = async (): Promise<EvaluationSkillResponse[]> => {
    return await getEvaluationSkillsWithDetails();
};

export const getEvaluationSkillsByEvaluationId = async (evaluationId: string): Promise<EvaluationSkillResponse[]> => {
    return await getEvaluationSkillsWithDetails(evaluationId);
};

export const getEvaluationSkillById = async (id: string): Promise<EvaluationSkillResponse> => {
    const evaluationSkillsCollection = getEvaluationSkillsCollection();

    const pipeline = [
        { $match: { _id: new ObjectId(id) } },
        ...getEvaluationSkillAggregationPipeline(),
    ];

    const cursor = evaluationSkillsCollection.aggregate<EvaluationSkillEnriched>(pipeline);

    const results = await cursor.toArray();

    if (results.length === 0) {
        throw new NotFoundException("Evaluation skill not found");
    }

    return convertToEvaluationSkillResponse(results[0]);
};

export const createEvaluationSkill = async (params: CreateEvaluationSkillInput): Promise<EvaluationSkillResponse> => {
    const { evaluationId, skillId, observedLevel } = params;

    // Verify that the evaluation exists
    const evaluation = await getEvaluationsCollection().findOneById(evaluationId);

    // Get the skill to extract macro skill information
    const skill = await getSkillsCollection().findOneById(skillId);
    const macroSkill = await getMacroSkillsCollection().findOneById(skill.macroSkillId.toString());

    const newEvaluationSkill = {
        _id: new ObjectId(),
        evaluationId: new ObjectId(evaluationId),
        evaluationCampaignId: evaluation.evaluationCampaignId,
        skillId: new ObjectId(skillId),
        macroSkillId: skill.macroSkillId,
        macroSkillTypeId: macroSkill.macroSkillTypeId,
        observedLevel: observedLevel,
        createdAt: new Date(),
    };

    const evaluationSkill = await getEvaluationSkillsCollection().insertOne(newEvaluationSkill);
    return await getEvaluationSkillById(evaluationSkill._id.toString());
};

export const updateEvaluationSkill = async (id: string, params: UpdateEvaluationSkillInput): Promise<EvaluationSkillResponse> => {
    // Only observedLevel can be updated on EvaluationSkill now
    const updateData = { ...params } as Partial<EvaluationSkill>;

    await getEvaluationSkillsCollection().findOneAndUpdate(
        { _id: new ObjectId(id) } as any,
        updateData
    );
    return await getEvaluationSkillById(id);
};

export const deleteEvaluationSkill = async (id: string): Promise<void> => {
    await getEvaluationSkillsCollection().deleteOne({ _id: new ObjectId(id) } as any);
};

export const bulkCreateEvaluationSkills = async (params: BulkCreateEvaluationSkillsInput): Promise<EvaluationSkillResponse[]> => {
    const { evaluationId, skills } = params;

    // Verify that the evaluation exists
    await getEvaluationsCollection().findOneById(evaluationId);

    const results: EvaluationSkillResponse[] = [];

    for (const skillData of skills) {
        const evaluationSkill = await createEvaluationSkill({
            evaluationId,
            skillId: skillData.skillId,
            observedLevel: skillData.observedLevel,
        });
        results.push(evaluationSkill);
    }

    return results;
};

// Helper functions for collection access
function getEvaluationsCollection(): MongoCollection<Evaluation> {
    return new MongoCollection<Evaluation>("evaluation");
}

function getEvaluationSkillsCollection(): MongoCollection<EvaluationSkill> {
    return new MongoCollection<EvaluationSkill>("evaluation_skill");
}

function getSkillsCollection(): MongoCollection<Skill> {
    return new MongoCollection<Skill>("skill");
}

function getMacroSkillsCollection(): MongoCollection<MacroSkill> {
    return new MongoCollection<MacroSkill>("macro_skill");
}

// function getMacroSkillTypesCollection(): MongoCollection<MacroSkillType> {
//     return new MongoCollection<MacroSkillType>("macro_skill_type");
// }

// Helper function to get evaluation skills with full details
async function getEvaluationSkillsWithDetails(evaluationId?: string): Promise<EvaluationSkillResponse[]> {
    const evaluationSkillsCollection = getEvaluationSkillsCollection();

    const matchStage = evaluationId
        ? { $match: { evaluationId: new ObjectId(evaluationId) } }
        : { $match: {} };

    const pipeline = [
        matchStage,
        ...getEvaluationSkillAggregationPipeline(),
    ];

    const cursor = evaluationSkillsCollection.aggregate<EvaluationSkillEnriched>(pipeline);
    const results = await cursor.toArray();
    return results.map(convertToEvaluationSkillResponse);
}

// Additional collections
function getEvaluationCampaignsCollection(): MongoCollection<EvaluationCampaign> {
    return new MongoCollection<EvaluationCampaign>("evaluation_campaign");
}

function getSkillLevelsCollection(): MongoCollection<SkillLevel> {
    return new MongoCollection<SkillLevel>("skill_level");
}

// Update SkillLevel according to rules after an evaluation is created
async function updateSkillLevelsAfterEvaluation(evaluation: Evaluation): Promise<void> {
    // Ensure campaign exists (fetched but not used explicitly beyond validation)
    await getEvaluationCampaignsCollection().findOneById(evaluation.evaluationCampaignId.toString());

    // Get skills created for this evaluation
    const createdSkills = await getEvaluationSkillsWithDetails(evaluation._id.toString());

    for (const created of createdSkills) {
        const newLevel = created.observedLevel;
        // Find previous evaluationSkill for this user+skill, excluding current evaluation
        const previous = await findPreviousEvaluationSkillOfUserForSkill(
            evaluation.userId,
            new ObjectId(created.skillId),
            evaluation._id
        );

        let levelToSave: number = newLevel;

        if (previous) {
            const sameCampaign = previous.evaluation.evaluationCampaignId.toString() === evaluation.evaluationCampaignId.toString();
            const previousLevel = previous.observedLevel ?? newLevel;
            if (sameCampaign) {
                levelToSave = average(previousLevel, newLevel);
            } else {
                const existingSkillLevel = await getSkillLevelsCollection().findOne({
                    userId: evaluation.userId,
                    skillId: new ObjectId(created.skillId),
                } as any);
                if (existingSkillLevel) {
                    levelToSave = average(existingSkillLevel.level ?? newLevel, newLevel);
                } else {
                    levelToSave = newLevel;
                }
            }
        } else {
            const existingSkillLevel = await getSkillLevelsCollection().findOne({
                userId: evaluation.userId,
                skillId: new ObjectId(created.skillId),
            } as any);
            if (existingSkillLevel) {
                levelToSave = average(existingSkillLevel.level ?? newLevel, newLevel);
            } else {
                levelToSave = newLevel;
            }
        }

        // Upsert SkillLevel
        const existing = await getSkillLevelsCollection().findOne({
            userId: evaluation.userId,
            skillId: new ObjectId(created.skillId),
        } as any);

        if (existing) {
            await getSkillLevelsCollection().findOneAndUpdate(
                { _id: existing._id } as any,
                {
                    level: levelToSave,
                    updatedAt: new Date(),
                }
            );
        } else {
            await getSkillLevelsCollection().insertOne({
                _id: new ObjectId(),
                userId: evaluation.userId,
                skillId: new ObjectId(created.skillId),
                level: levelToSave,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }
}

function average(a: number, b: number): number {
    return (a + b) / 2;
}


// Find the previous evaluationSkill for a user and skill, excluding the current evaluation
async function findPreviousEvaluationSkillOfUserForSkill(
    userId: ObjectId,
    skillId: ObjectId,
    currentEvaluationId: ObjectId
): Promise<(EvaluationSkill & { evaluation: Evaluation }) | null> {
    const evaluationSkillsCollection = getEvaluationSkillsCollection();

    const pipeline: any[] = [
        { $match: { skillId } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "evaluation",
                localField: "evaluationId",
                foreignField: "_id",
                as: "evaluation",
            },
        },
        { $unwind: "$evaluation" },
        { $match: { "evaluation.userId": userId, "evaluation._id": { $ne: currentEvaluationId } } },
        { $limit: 1 },
    ];

    const cursor = evaluationSkillsCollection.aggregate<EvaluationSkill & { evaluation: Evaluation }>(pipeline);
    const results = await cursor.toArray();
    return results[0] || null;
}

// Helper function to get the aggregation pipeline for evaluation skills
function getEvaluationSkillAggregationPipeline() {
    return [
        {
            $lookup: {
                from: "skill",
                localField: "skillId",
                foreignField: "_id",
                as: "skill"
            }
        },
        { $unwind: "$skill" },
        {
            $lookup: {
                from: "macro_skill",
                localField: "skill.macroSkillId",
                foreignField: "_id",
                as: "skill.macroSkill"
            }
        },
        { $unwind: "$skill.macroSkill" },
        {
            $lookup: {
                from: "macro_skill_type",
                localField: "skill.macroSkill.macroSkillTypeId",
                foreignField: "_id",
                as: "skill.macroSkill.macroSkillType"
            }
        },
        { $unwind: "$skill.macroSkill.macroSkillType" },
        {
            $project:
            {
                _id: 1,
                evaluationId: 1,
                evaluationCampaignId: 1,
                skillId: 1,
                skillName: "$skill.name",
                macroSkillId: 1,
                macroSkillName: "$skill.macroSkill.name",
                macroSkillTypeId: 1,
                macroSkillTypeName: "$skill.macroSkill.macroSkillType.name",
                observedLevel: 1,
                createdAt: 1
            }
        },
    ];
}

// Helper functions to convert models to responses
function convertToEvaluationResponse(evaluation: Evaluation): EvaluationResponse {
    return {
        _id: evaluation._id.toString(),
        userJobId: evaluation.userJobId?.toString(),
        userJobCode: evaluation.userJobCode,
        userId: evaluation.userId.toString(),
        managerUserId: evaluation.managerUserId?.toString(),
        evaluationCampaignId: evaluation.evaluationCampaignId?.toString(),
        createdAt: evaluation.createdAt,
        updatedAt: evaluation.updatedAt,
        createdBy: evaluation.createdBy.toString(),
    } as EvaluationResponse;
}

function convertToEvaluationSkillResponse(
    evaluationSkill: EvaluationSkillEnriched
): EvaluationSkillResponse {
    return {
        _id: evaluationSkill._id.toString(),
        evaluationId: evaluationSkill.evaluationId.toString(),
        evaluationCampaignId: evaluationSkill.evaluationCampaignId?.toString(),
        skillId: evaluationSkill.skillId.toString(),
        macroSkillId: evaluationSkill.macroSkillId.toString(),
        macroSkillTypeId: evaluationSkill.macroSkillTypeId.toString(),
        observedLevel: evaluationSkill.observedLevel,
        skillName: evaluationSkill.skillName,
        macroSkillName: evaluationSkill.macroSkillName,
        macroSkillTypeName: evaluationSkill.macroSkillTypeName,
        createdAt: evaluationSkill.createdAt,
    };
}
