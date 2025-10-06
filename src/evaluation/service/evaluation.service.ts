import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { NotFoundException } from "../../utils/HttpException";
import { Evaluation } from "../model/evaluation";
import { EvaluationSkill } from "../model/evaluationSkill";
import { Skill } from "../../skills/model/skill";
import { MacroSkill } from "../../skills/model/macroSkill";
import { MacroSkillType } from "../../skills/model/macroSkillType";
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
    } = params;

    const newEvaluation: Evaluation = {
        _id: new ObjectId(),
        userJobId: userJobId ? new ObjectId(userJobId) : undefined,
        userJobCode: userJobCode,
        userId: new ObjectId(userId),
        managerUserId: managerUserId ? new ObjectId(managerUserId) : undefined,
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
    return await getEvaluationWithSkills(evaluation._id);
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

    const cursor = evaluationSkillsCollection.aggregate<EvaluationSkill & {
        skill: Skill & {
            macroSkill: MacroSkill & { macroSkillType: MacroSkillType }
        }
    }>(pipeline);

    const results = await cursor.toArray();

    if (results.length === 0) {
        throw new NotFoundException("Evaluation skill not found");
    }

    return convertToEvaluationSkillResponse(results[0]);
};

export const createEvaluationSkill = async (params: CreateEvaluationSkillInput): Promise<EvaluationSkillResponse> => {
    const { evaluationId, skillId, expectedLevel, observedLevel } = params;

    // Verify that the evaluation exists
    await getEvaluationsCollection().findOneById(evaluationId);

    // Get the skill to extract macro skill information
    const skill = await getSkillsCollection().findOneById(skillId);
    const macroSkill = await getMacroSkillsCollection().findOneById(skill.macroSkillId.toString());

    // Calculate gap if both levels are provided
    let gap: number | null = null;
    if (expectedLevel && observedLevel) {
        const expectedNum = expectedLevel;
        const observedNum = observedLevel;
        if (!isNaN(expectedNum) && !isNaN(observedNum)) {
            gap = observedNum - expectedNum;
        }
    }

    const newEvaluationSkill = {
        _id: new ObjectId(),
        evaluationId: new ObjectId(evaluationId),
        skillId: new ObjectId(skillId),
        macroSkillId: skill.macroSkillId,
        macroSkillTypeId: macroSkill.macroSkillTypeId,
        expectedLevel: expectedLevel || null,
        observedLevel: observedLevel || null,
        gap,
        createdAt: new Date(),
    };

    const evaluationSkill = await getEvaluationSkillsCollection().insertOne(newEvaluationSkill);
    return await getEvaluationSkillById(evaluationSkill._id.toString());
};

export const updateEvaluationSkill = async (id: string, params: UpdateEvaluationSkillInput): Promise<EvaluationSkillResponse> => {
    const existingEvaluationSkill = await getEvaluationSkillsCollection().findOneById(id);

    // Calculate gap if both levels are provided
    let gap: number | null = null;
    const expectedLevel = params.expectedLevel !== undefined ? params.expectedLevel : existingEvaluationSkill.expectedLevel;
    const observedLevel = params.observedLevel !== undefined ? params.observedLevel : existingEvaluationSkill.observedLevel;

    if (expectedLevel && observedLevel) {
        const expectedNum = expectedLevel;
        const observedNum = observedLevel;
        if (!isNaN(expectedNum) && !isNaN(observedNum)) {
            gap = observedNum - expectedNum;
        }
    }

    const updateData = {
        ...params,
        gap,
    };

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
            expectedLevel: skillData.expectedLevel,
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

    const cursor = evaluationSkillsCollection.aggregate<EvaluationSkill & {
        skill: Skill & {
            macroSkill: MacroSkill & { macroSkillType: MacroSkillType }
        }
    }>(pipeline);

    const results = await cursor.toArray();
    return results.map(convertToEvaluationSkillResponse);
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
        createdAt: evaluation.createdAt,
        updatedAt: evaluation.updatedAt,
        createdBy: evaluation.createdBy.toString(),
    } as EvaluationResponse;
}

function convertToEvaluationSkillResponse(
    evaluationSkill: EvaluationSkill & {
        skill: Skill & {
            macroSkill: MacroSkill & { macroSkillType: MacroSkillType }
        }
    }
): EvaluationSkillResponse {
    return {
        _id: evaluationSkill._id.toString(),
        evaluationId: evaluationSkill.evaluationId.toString(),
        skillId: evaluationSkill.skillId.toString(),
        macroSkillId: evaluationSkill.macroSkillId.toString(),
        macroSkillTypeId: evaluationSkill.macroSkillTypeId.toString(),
        expectedLevel: evaluationSkill.expectedLevel,
        observedLevel: evaluationSkill.observedLevel,
        gap: evaluationSkill.gap,
        createdAt: evaluationSkill.createdAt,
        skill: {
            _id: evaluationSkill.skill._id.toString(),
            name: evaluationSkill.skill.name,
            expectedLevel: evaluationSkill.skill.expectedLevel,
            macroSkill: {
                _id: evaluationSkill.skill.macroSkill._id.toString(),
                name: evaluationSkill.skill.macroSkill.name,
                macroSkillType: {
                    _id: evaluationSkill.skill.macroSkill.macroSkillType._id.toString(),
                    name: evaluationSkill.skill.macroSkill.macroSkillType.name,
                    createdAt: evaluationSkill.skill.macroSkill.macroSkillType.createdAt,
                },
                createdAt: evaluationSkill.skill.macroSkill.createdAt,
            },
            createdAt: evaluationSkill.skill.createdAt,
        },
    };
}
