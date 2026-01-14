import { Db, ObjectId } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';

/**
 * Migration to transform job_skill junction table into direct job links
 * - Adds jobId and expectedLevel to skills
 * - Adds jobId to macro_skills
 * - Duplicates skills/macro skills that are shared across multiple jobs
 * - Updates evaluation_skill references
 * - Drops job_skill collection
 */
export class RefactorSkillsToDirectJobLink1768299635000 implements MigrationInterface {
    public async up(db: Db): Promise<void | never> {
        console.log('Starting migration: RefactorSkillsToDirectJobLink');

        // Step 1: Create temporary indexes for performance
        await db.collection('skill').createIndex({ jobId: 1 });
        await db.collection('macro_skill').createIndex({ jobId: 1 });

        // Step 2: Build skill-to-jobs mapping from job_skill
        const jobSkills = await db.collection('job_skill').find({}).toArray();
        const skillJobMap = new Map<string, { jobId: ObjectId; expectedLevel: number }[]>();
        
        for (const js of jobSkills) {
            const skillId = js.skillId.toString();
            if (!skillJobMap.has(skillId)) {
                skillJobMap.set(skillId, []);
            }
            skillJobMap.get(skillId)!.push({
                jobId: js.jobId,
                expectedLevel: js.expectedLevel
            });
        }

        console.log(`Found ${skillJobMap.size} unique skills linked to jobs`);

        // Step 3: Process each skill
        const skillIdMapping = new Map<string, Map<string, ObjectId>>(); // oldSkillId -> jobId -> newSkillId
        
        for (const [skillId, jobLinks] of skillJobMap.entries()) {
            const skill = await db.collection('skill').findOne({ _id: new ObjectId(skillId) });
            if (!skill) {
                console.warn(`Skill ${skillId} not found, skipping`);
                continue;
            }

            skillIdMapping.set(skillId, new Map());

            if (jobLinks.length === 1) {
                // Single job: Update the existing skill
                const jobLink = jobLinks[0];
                await db.collection('skill').updateOne(
                    { _id: new ObjectId(skillId) },
                    {
                        $set: {
                            jobId: jobLink.jobId,
                            expectedLevel: jobLink.expectedLevel
                        }
                    }
                );
                skillIdMapping.get(skillId)!.set(jobLink.jobId.toString(), new ObjectId(skillId));
                console.log(`Updated skill ${skillId} with single job ${jobLink.jobId}`);
            } else {
                // Multiple jobs: Duplicate the skill for each job
                console.log(`Duplicating skill ${skillId} for ${jobLinks.length} jobs`);
                
                for (let i = 0; i < jobLinks.length; i++) {
                    const jobLink = jobLinks[i];
                    
                    if (i === 0) {
                        // Update the original skill for the first job
                        await db.collection('skill').updateOne(
                            { _id: new ObjectId(skillId) },
                            {
                                $set: {
                                    jobId: jobLink.jobId,
                                    expectedLevel: jobLink.expectedLevel
                                }
                            }
                        );
                        skillIdMapping.get(skillId)!.set(jobLink.jobId.toString(), new ObjectId(skillId));
                    } else {
                        // Create duplicates for other jobs
                        const newSkillId = new ObjectId();
                        await db.collection('skill').insertOne({
                            _id: newSkillId,
                            name: skill.name,
                            jobId: jobLink.jobId,
                            expectedLevel: jobLink.expectedLevel,
                            macroSkillId: skill.macroSkillId,
                            createdAt: new Date()
                        });
                        skillIdMapping.get(skillId)!.set(jobLink.jobId.toString(), newSkillId);
                    }
                }
            }
        }

        console.log('Skill duplication complete');

        // Step 4: Handle macro skills - group by jobs that use them
        const macroSkillJobMap = new Map<string, Set<string>>(); // macroSkillId -> Set<jobId>
        
        const updatedSkills = await db.collection('skill').find({}).toArray();
        for (const skill of updatedSkills) {
            if (skill.macroSkillId && skill.jobId) {
                const macroSkillId = skill.macroSkillId.toString();
                const jobId = skill.jobId.toString();
                
                if (!macroSkillJobMap.has(macroSkillId)) {
                    macroSkillJobMap.set(macroSkillId, new Set());
                }
                macroSkillJobMap.get(macroSkillId)!.add(jobId);
            }
        }

        console.log(`Processing ${macroSkillJobMap.size} macro skills`);

        const macroSkillIdMapping = new Map<string, Map<string, ObjectId>>(); // oldMacroSkillId -> jobId -> newMacroSkillId
        
        for (const [macroSkillId, jobIds] of macroSkillJobMap.entries()) {
            const macroSkill = await db.collection('macro_skill').findOne({ _id: new ObjectId(macroSkillId) });
            if (!macroSkill) {
                console.warn(`Macro skill ${macroSkillId} not found, skipping`);
                continue;
            }

            macroSkillIdMapping.set(macroSkillId, new Map());
            const jobIdArray = Array.from(jobIds);

            if (jobIdArray.length === 1) {
                // Single job: Update the existing macro skill
                await db.collection('macro_skill').updateOne(
                    { _id: new ObjectId(macroSkillId) },
                    { $set: { jobId: new ObjectId(jobIdArray[0]) } }
                );
                macroSkillIdMapping.get(macroSkillId)!.set(jobIdArray[0], new ObjectId(macroSkillId));
            } else {
                // Multiple jobs: Duplicate the macro skill
                for (let i = 0; i < jobIdArray.length; i++) {
                    const jobId = jobIdArray[i];
                    
                    if (i === 0) {
                        // Update the original
                        await db.collection('macro_skill').updateOne(
                            { _id: new ObjectId(macroSkillId) },
                            { $set: { jobId: new ObjectId(jobId) } }
                        );
                        macroSkillIdMapping.get(macroSkillId)!.set(jobId, new ObjectId(macroSkillId));
                    } else {
                        // Create duplicate
                        const newMacroSkillId = new ObjectId();
                        await db.collection('macro_skill').insertOne({
                            _id: newMacroSkillId,
                            name: macroSkill.name,
                            jobId: new ObjectId(jobId),
                            macroSkillTypeId: macroSkill.macroSkillTypeId,
                            createdAt: new Date()
                        });
                        macroSkillIdMapping.get(macroSkillId)!.set(jobId, newMacroSkillId);
                    }
                }

                // Update skills to point to the correct job-specific macro skill
                for (const skill of updatedSkills) {
                    if (skill.macroSkillId.toString() === macroSkillId && skill.jobId) {
                        const jobId = skill.jobId.toString();
                        const newMacroSkillId = macroSkillIdMapping.get(macroSkillId)?.get(jobId);
                        
                        if (newMacroSkillId) {
                            await db.collection('skill').updateOne(
                                { _id: skill._id },
                                { $set: { macroSkillId: newMacroSkillId } }
                            );
                        }
                    }
                }
            }
        }

        console.log('Macro skill processing complete');

        // Step 5: Update evaluation_skill references (if skills were duplicated)
        // This is complex: we need to infer which job context each evaluation belongs to
        const evaluations = await db.collection('evaluation').find({}).toArray();
        
        for (const evaluation of evaluations) {
            const userJobId = evaluation.userJobId;
            if (!userJobId) continue;

            const evalSkills = await db.collection('evaluation_skill').find({
                evaluationId: evaluation._id
            }).toArray();

            for (const evalSkill of evalSkills) {
                const oldSkillId = evalSkill.skillId.toString();
                const jobIdStr = userJobId.toString();
                
                // Check if this skill was duplicated
                if (skillIdMapping.has(oldSkillId)) {
                    const jobSkillMap = skillIdMapping.get(oldSkillId)!;
                    const newSkillId = jobSkillMap.get(jobIdStr);
                    
                    if (newSkillId && newSkillId.toString() !== oldSkillId) {
                        // Update the evaluation_skill to reference the correct skill
                        await db.collection('evaluation_skill').updateOne(
                            { _id: evalSkill._id },
                            { $set: { skillId: newSkillId } }
                        );
                        console.log(`Updated evaluation_skill ${evalSkill._id} from skill ${oldSkillId} to ${newSkillId}`);
                    }
                }
            }
        }

        console.log('Evaluation skill references updated');

        // Step 6: Drop the job_skill collection
        await db.collection('job_skill').drop();
        console.log('Dropped job_skill collection');

        console.log('Migration complete!');
    }

    public async down(db: Db): Promise<void | never> {
        console.log('Rolling back migration: RefactorSkillsToDirectJobLink');

        // Recreate job_skill collection
        await db.createCollection('job_skill');

        // Recreate job_skill records from skills
        const skills = await db.collection('skill').find({}).toArray();
        
        for (const skill of skills) {
            if (skill.jobId && skill.expectedLevel !== undefined) {
                await db.collection('job_skill').insertOne({
                    _id: new ObjectId(),
                    jobId: skill.jobId,
                    skillId: skill._id,
                    expectedLevel: skill.expectedLevel,
                    createdAt: skill.createdAt || new Date()
                });
            }
        }

        // Remove jobId and expectedLevel from skills
        await db.collection('skill').updateMany(
            {},
            {
                $unset: {
                    jobId: "",
                    expectedLevel: ""
                }
            }
        );

        // Remove jobId from macro_skills
        await db.collection('macro_skill').updateMany(
            {},
            { $unset: { jobId: "" } }
        );

        // Note: This down migration does NOT merge duplicate skills/macro skills back together
        // That would require complex logic to identify which were duplicates
        // In a real scenario, you'd want to backup before migration

        // Recreate indexes on job_skill
        await db.collection('job_skill').createIndex({ jobId: 1 });
        await db.collection('job_skill').createIndex({ skillId: 1 });
        await db.collection('job_skill').createIndex({ jobId: 1, skillId: 1 }, { unique: true });

        console.log('Rollback complete - Note: duplicate skills/macro skills were NOT merged');
    }
}
