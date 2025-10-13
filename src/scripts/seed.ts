import { connect, close } from "../utils/mongo/dbHelper";
import { MongoCollection, ObjectId } from "../utils/mongo/MongoCollection";
import { getAllSkills } from "../skills/service/skills.service";
import { createJob, addSkillToJob } from "../job/service/job.service";
import type { User } from "../auth/model/user";
import bcrypt from "bcrypt";

// Minimal Job type for direct inserts if needed
type CreateJobParams = {
    name: string;
    code: string;
    jobProfile: string;
    jobFamily?: string;
};

async function ensureJobsAndLinks() {
    const jobNames: string[] = [
        "Charge d'études mécanique",
        "Charge d'études",
        "Coordonnateur BIM",
        "Ingénieur études",
        "Ingénieur études techniques",
        "Dessinateur mécanique",
        "Projeteur mécanique",
        "CNDiste",
        "Inspecteurs soudeurs",
        "Contrôleur qualité Peinture",
        "Chauffard",
        "Technicien chauffard",
        "Soudeur",
        "Oxycoupeur",
        "Responsable qualité",
        "Responsable méthodes",
        "Charge d'études méthodes",
    ];

    // Only keep first 10 distinct names, preserve order
    const distinct: string[] = [];
    for (const n of jobNames) {
        if (!distinct.includes(n)) distinct.push(n);
        if (distinct.length === 10) break;
    }

    const skills = await getAllSkills();
    if (skills.length < 10) {
        throw new Error("Not enough skills in DB to link 10 per job. Seed skills first.");
    }

    // Helper to generate unique 10 random skill IDs per job
    function pickTenRandomSkillIds(): string[] {
        const indices = new Set<number>();
        while (indices.size < 10) {
            indices.add(Math.floor(Math.random() * skills.length));
        }
        return Array.from(indices).map((i) => skills[i]._id);
    }

    // Create 10 jobs with unique codes and default profile/family
    const createdJobIds: string[] = [];
    for (let i = 0; i < distinct.length; i++) {
        const name = distinct[i];
        const code = `JOB-${(i + 1).toString().padStart(3, "0")}`;
        const jobProfile = "Standard";
        const jobFamily = "Engineering";

        const job = await createJob({ name, code, jobProfile, jobFamily } as CreateJobParams);
        createdJobIds.push(job._id);
        // Link 10 distinct skills
        const skillIds = pickTenRandomSkillIds();
        for (const skillId of skillIds) {
            // Level expected left null for now
            await addSkillToJob(job._id, { skillId, expectedLevel: 3 });
        }
        // eslint-disable-next-line no-console
        console.log(`Seeded job ${name} with code ${code} and 10 skills.`);
    }

    return createdJobIds;
}

async function seedUsersAndManagers(jobIds: string[]) {
    if (jobIds.length === 0) {
        throw new Error("No jobs available to assign to users");
    }

    const usersCollection = new MongoCollection<User>("user");

    function pickRandomJobId(): ObjectId | null {
        const id = jobIds[Math.floor(Math.random() * jobIds.length)];
        return id ? new ObjectId(id) : null;
    }

    async function insertUser(params: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        code: string;
        roles: User["roles"];
        jobId: ObjectId | null;
    }): Promise<User> {
        const hashed = await bcrypt.hash(params.password, 10);
        const newUser: User = {
            _id: new ObjectId(),
            email: params.email.toLowerCase(),
            password: hashed,
            firstName: params.firstName,
            lastName: params.lastName,
            code: params.code,
            jobId: params.jobId,
            managerUserId: null,
            roles: params.roles,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const inserted = await usersCollection.insertOne(newUser);
        return inserted;
    }

    // 2 managers
    const managersData = [
        { email: "manager1@seed.local", firstName: "Alex", lastName: "Martin", code: "MNG-001" },
        { email: "manager2@seed.local", firstName: "Camille", lastName: "Dupont", code: "MNG-002" },
    ];
    for (const m of managersData) {
        const user = await insertUser({
            email: m.email,
            password: "Password1!",
            firstName: m.firstName,
            lastName: m.lastName,
            code: m.code,
            roles: ["MANAGER"],
            jobId: pickRandomJobId(),
        });
        // eslint-disable-next-line no-console
        console.log(`Seeded manager ${user.firstName} ${user.lastName} (${user.email}).`);
    }

    // 10 regular users
    const baseFirstNames = ["Jordan", "Taylor", "Morgan", "Quentin", "Sacha", "Noa", "Charlie", "Avery", "Eden", "Robin"];
    const baseLastNames = ["Lefevre", "Moreau", "Simon", "Laurent", "Michel", "Garcia", "David", "Bertrand", "Rousseau", "Vincent"];
    for (let i = 0; i < 10; i++) {
        const firstName = baseFirstNames[i % baseFirstNames.length];
        const lastName = baseLastNames[i % baseLastNames.length];
        const email = `user${(i + 1).toString().padStart(2, "0")}@seed.local`;
        const code = `EMP-${(i + 1).toString().padStart(3, "0")}`;
        const user = await insertUser({
            email,
            password: "Password1!",
            firstName,
            lastName,
            code,
            roles: ["USER"],
            jobId: pickRandomJobId(),
        });
        // eslint-disable-next-line no-console
        console.log(`Seeded user ${user.firstName} ${user.lastName} (${user.email}).`);
    }
}

async function main() {
    await connect();
    try {
        const inserted = await ensureJobsAndLinks();
        await seedUsersAndManagers(inserted);
        // eslint-disable-next-line no-console
        console.log(`Inserted ${inserted.length} jobs with linked skills, plus managers and users.`);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        process.exitCode = 1;
    } finally {
        await close();
    }
}

// Execute only if run directly
// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();


