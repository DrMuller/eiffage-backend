import { connect, close } from "../utils/mongo/dbHelper";
import { MongoCollection, ObjectId } from "../utils/mongo/MongoCollection";
import type { Skill } from "../skills/model/skill";
import logger from "../utils/logger";

const JOB_ID = "68f5ee2f730a07b29ece5ce7";

const expectedSkillPatterns = [
    "Respecter les cordons de soudure",
    "Nettoyer parfaitement les soudures et tôles",
    "Prendre connaissance et suivre les instructions de soudage sur les DMOS",
    "Contrôler la température d'entre-passes",
    "Assembler des profils métalliques",
    "Transmettre des indications précises aux dessinateurs",
    "Contrôler des ancrages et fixations en utilisant PROFIS",
];

async function verifyJobSkills() {
    const skillsCollection = new MongoCollection<Skill>("skill");
    const jobId = new ObjectId(JOB_ID);

    // Get all skills for this job directly
    const jobSkills = await skillsCollection.find({ jobId: jobId });

    logger.debug(`\n=== Job Skills for Job ID: ${JOB_ID} ===`);
    logger.debug(`Total skills for this job: ${jobSkills.length}\n`);

    if (jobSkills.length === 0) {
        logger.debug("No skills found for this job.");
        return;
    }

    logger.debug("Skills for this job:");
    jobSkills.forEach((skill: Skill, index: number) => {
        logger.debug(`${index + 1}. [Level ${skill.expectedLevel}] ${skill.name}`);
    });

    logger.debug("\n=== Verification ===");
    let foundCount = 0;
    for (const pattern of expectedSkillPatterns) {
        const found = jobSkills.some((s: Skill) => s.name.includes(pattern));
        if (found) {
            logger.debug(`✓ ${pattern}`);
            foundCount++;
        } else {
            logger.debug(`✗ ${pattern}`);
        }
    }

    logger.debug(`\n${foundCount}/${expectedSkillPatterns.length} expected skills are found for the job.`);
}

async function main() {
    await connect();
    try {
        await verifyJobSkills();
    } catch (err) {
        logger.error("Error:", err);
        process.exitCode = 1;
    } finally {
        await close();
    }
}

main();




