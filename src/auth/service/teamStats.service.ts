import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { User } from "../model/user";
import { SkillLevel } from "../../evaluation/model/skillLevel";
import { Skill } from "../../skills/model/skill";
import { Evaluation } from "../../evaluation/model/evaluation";
import { EvaluationCampaign } from "../../evaluation/model/evaluationCampaign";
import { NotFoundException } from "../../utils/HttpException";

export interface TeamStatsResponse {
    managerId: string;
    managerName: string;
    teamSize: number;
    currentCampaign: {
        _id: string;
        startDate: Date;
        endDate: Date;
    } | null;
    // Key skills mastery: percentage of skills where observed level >= expected level
    keySkillsMastery: {
        masteredSkillsCount: number;
        totalEvaluatedSkillsCount: number;
        percentage: number;
    };
    // Evaluation progress: team members with at least one evaluation in current campaign
    evaluationProgress: {
        evaluatedMembersCount: number;
        totalMembersCount: number;
        percentage: number;
    };
}

// Get current active campaign
async function getCurrentCampaign(): Promise<EvaluationCampaign | null> {
    const now = new Date();
    const campaign = await getEvaluationCampaignsCollection().findOne(
        {
            startDate: { $lte: now } as any,
            endDate: { $gte: now } as any,
        } as any,
        { sort: { startDate: -1 } as any }
    );
    return campaign;
}

// Get team members for a manager
async function getTeamMembers(managerId: string): Promise<User[]> {
    const userCollection = getUsersCollection();
    const teamMembers = await userCollection.find({
        managerUserIds: new ObjectId(managerId)
    });
    return teamMembers;
}

export async function getTeamStats(managerId: string): Promise<TeamStatsResponse> {
    // Get manager info
    const manager = await getUsersCollection().findOneById(managerId);
    if (!manager) {
        throw new NotFoundException("Manager not found");
    }

    // Get team members
    const teamMembers = await getTeamMembers(managerId);
    const teamSize = teamMembers.length;

    // Get current campaign
    const currentCampaign = await getCurrentCampaign();

    // Calculate key skills mastery using UNIQUE skills
    // A skill is "mastered" if at least one team member has observed >= expected
    // We track unique skills by skillId

    // Map: skillId -> { expectedLevel, isMastered, isEvaluated }
    const uniqueSkillsMap = new Map<string, { expectedLevel: number; isMastered: boolean; isEvaluated: boolean }>();

    for (const member of teamMembers) {
        if (!member.jobId) continue;

        // Get skills (with expected levels) for this member's job
        const skills = await getSkillsCollection().find({
            jobId: member.jobId
        });

        // Get skill levels (observed levels) for this member
        const skillLevels = await getSkillLevelsCollection().find({
            userId: member._id
        });

        // Create a map of skillId -> observed level for this member
        const observedLevelMap = new Map<string, number>();
        for (const sl of skillLevels) {
            if (sl.level !== null) {
                observedLevelMap.set(sl.skillId.toString(), sl.level);
            }
        }

        // Process each skill for this job
        for (const skill of skills) {
            const skillId = skill._id.toString();
            const observedLevel = observedLevelMap.get(skillId);

            // Initialize the skill entry if not exists
            if (!uniqueSkillsMap.has(skillId)) {
                uniqueSkillsMap.set(skillId, {
                    expectedLevel: skill.expectedLevel,
                    isMastered: false,
                    isEvaluated: false
                });
            }

            const skillEntry = uniqueSkillsMap.get(skillId)!;

            // If this member has been evaluated on this skill
            if (observedLevel !== undefined) {
                skillEntry.isEvaluated = true;
                // If this member masters the skill, mark it as mastered
                if (observedLevel >= skill.expectedLevel) {
                    skillEntry.isMastered = true;
                }
            }
        }
    }

    // Count unique skills
    let masteredSkillsCount = 0;
    let totalEvaluatedSkillsCount = 0;

    for (const skillEntry of uniqueSkillsMap.values()) {
        if (skillEntry.isEvaluated) {
            totalEvaluatedSkillsCount++;
            if (skillEntry.isMastered) {
                masteredSkillsCount++;
            }
        }
    }

    const keySkillsMasteryPercentage = totalEvaluatedSkillsCount > 0
        ? Math.round((masteredSkillsCount / totalEvaluatedSkillsCount) * 100)
        : 0;

    // Calculate evaluation progress for current campaign
    let evaluatedMembersCount = 0;

    if (currentCampaign) {
        const teamMemberIds = teamMembers.map(m => m._id);

        // Get evaluations in current campaign for team members
        const evaluations = await getEvaluationsCollection().find({
            evaluationCampaignId: currentCampaign._id,
            userId: { $in: teamMemberIds } as any
        });

        // Count unique users who have been evaluated
        const evaluatedUserIds = new Set<string>();
        for (const evaluation of evaluations) {
            evaluatedUserIds.add(evaluation.userId.toString());
        }
        evaluatedMembersCount = evaluatedUserIds.size;
    }

    const evaluationProgressPercentage = teamSize > 0
        ? Math.round((evaluatedMembersCount / teamSize) * 100)
        : 0;

    return {
        managerId: manager._id.toString(),
        managerName: `${manager.firstName} ${manager.lastName}`,
        teamSize,
        currentCampaign: currentCampaign ? {
            _id: currentCampaign._id.toString(),
            startDate: currentCampaign.startDate,
            endDate: currentCampaign.endDate,
        } : null,
        keySkillsMastery: {
            masteredSkillsCount,
            totalEvaluatedSkillsCount,
            percentage: keySkillsMasteryPercentage,
        },
        evaluationProgress: {
            evaluatedMembersCount,
            totalMembersCount: teamSize,
            percentage: evaluationProgressPercentage,
        },
    };
}

// Collection access helpers
function getUsersCollection(): MongoCollection<User> {
    return new MongoCollection<User>("user");
}

function getSkillLevelsCollection(): MongoCollection<SkillLevel> {
    return new MongoCollection<SkillLevel>("skill_level");
}

function getSkillsCollection(): MongoCollection<Skill> {
    return new MongoCollection<Skill>("skill");
}

function getEvaluationsCollection(): MongoCollection<Evaluation> {
    return new MongoCollection<Evaluation>("evaluation");
}

function getEvaluationCampaignsCollection(): MongoCollection<EvaluationCampaign> {
    return new MongoCollection<EvaluationCampaign>("evaluation_campaign");
}

