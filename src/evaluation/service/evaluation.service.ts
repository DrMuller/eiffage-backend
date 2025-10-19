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
    SkillLevelResponse,
} from "../dto/evaluation.dto";

// Evaluation Service Functions
export const getAllEvaluations = async (): Promise<EvaluationResponse[]> => {
    const evaluations = await getEvaluationsCollection().find({}, { sort: { createdAt: -1 } });
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

// SkillLevel Service Functions
export const getAllSkillLevels = async (userId: string): Promise<SkillLevelResponse[]> => {
    const levels = await getSkillLevelsCollection().find({ userId: new ObjectId(userId) });
    return levels.map(convertToSkillLevelResponse);
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

async function findLatestOtherEvaluationInCampaign(evaluation: Evaluation): Promise<Evaluation | null> {
    return await getEvaluationsCollection().findOne(
        {
            userId: evaluation.userId,
            evaluationCampaignId: evaluation.evaluationCampaignId,
            managerUserId: { $ne: evaluation.managerUserId } as any,
        } as any,
        { sort: { createdAt: -1 } }
    );
}

function buildObservedLevelMap(skills: EvaluationSkill[]): Map<string, number> {
    return new Map(skills.map((s) => [s.skillId.toString(), s.observedLevel]));
}

function computeAggregatedLevel(currentObserved: number, otherObserved?: number): number {
    if (typeof otherObserved === "number") return (currentObserved + otherObserved) / 2;
    return currentObserved;
}

async function upsertUserSkillLevel(userId: ObjectId, skillId: ObjectId, level: number, now: Date): Promise<void> {
    const skillLevels = getSkillLevelsCollection();
    const existing = await skillLevels.findOne({ userId, skillId } as any);
    if (existing) {
        await skillLevels.findOneAndUpdate(
            { _id: existing._id } as any,
            { level, updatedAt: now } as Partial<SkillLevel>
        );
        return;
    }
    await skillLevels.insertOne({
        _id: new ObjectId(),
        userId,
        skillId,
        level,
        createdAt: now,
        updatedAt: now,
    } as SkillLevel);
}

// Update SkillLevel according to rules after an evaluation is created
async function updateSkillLevelsAfterEvaluation(evaluation: Evaluation): Promise<void> {
    // Ensure campaign exists (fetched but not used explicitly beyond validation)
    await getEvaluationCampaignsCollection().findOneById(evaluation.evaluationCampaignId.toString());

    // Fetch the skills for the current evaluation
    const evaluationSkillsCollection = getEvaluationSkillsCollection();
    const currentEvaluationSkills = await evaluationSkillsCollection.find({ evaluationId: evaluation._id });
    if (!currentEvaluationSkills || currentEvaluationSkills.length === 0) return;

    // Find the latest other evaluation in same campaign for same user but with a different manager
    const otherEvaluation = await findLatestOtherEvaluationInCampaign(evaluation);
    const otherEvaluationSkillMap = otherEvaluation
        ? buildObservedLevelMap(await evaluationSkillsCollection.find({ evaluationId: evaluation._id }))
        : null;

    const now = new Date();
    for (const currentSkill of currentEvaluationSkills) {
        const otherObserved = otherEvaluationSkillMap?.get(currentSkill.skillId.toString());
        const levelToSave = computeAggregatedLevel(currentSkill.observedLevel, otherObserved);
        await upsertUserSkillLevel(evaluation.userId, currentSkill.skillId, levelToSave, now);
    }
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

function convertToSkillLevelResponse(skillLevel: SkillLevel): SkillLevelResponse {
    return {
        _id: skillLevel._id.toString(),
        userId: skillLevel.userId.toString(),
        skillId: skillLevel.skillId.toString(),
        level: skillLevel.level,
        createdAt: skillLevel.createdAt,
        updatedAt: skillLevel.updatedAt,
    };
}
