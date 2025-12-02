import { connect, close } from "../utils/mongo/dbHelper";
import { MongoCollection, ObjectId } from "../utils/mongo/MongoCollection";
import type { Job } from "../job/model/job";
import type { Skill } from "../skills/model/skill";
import type { JobSkill } from "../job/model/jobSkill";

type TargetItem = {
    category: "Comportementales" | "QPSE" | "Techniques";
    name: string;
    expectedLevel: number;
};

// Extracted from the screenshot provided by the user
const targets: TargetItem[] = [
    { category: "Comportementales", name: "Avoir le sens de l'écoute et du relationnel", expectedLevel: 3 },
    { category: "Comportementales", name: "Communiquer efficacement à l'oral", expectedLevel: 2 },
    { category: "Comportementales", name: "Travailler en autonomie", expectedLevel: 3 },
    { category: "Comportementales", name: "Faire preuve de rigueur", expectedLevel: 3 },
    { category: "Comportementales", name: "Travailler en équipe et collaborer efficacement", expectedLevel: 3 },

    { category: "QPSE", name: "Nettoyer et ranger le poste de travail", expectedLevel: 3 },
    { category: "QPSE", name: "Respecter le port des EPI adaptés", expectedLevel: 3 },
    { category: "QPSE", name: "Respecter les règles environnementales", expectedLevel: 3 },
    { category: "QPSE", name: "S'assurer de la qualité des tâches réalisées", expectedLevel: 3 },

    { category: "Techniques", name: "Utiliser les matériels, outils mis à disposition", expectedLevel: 3 },
    { category: "Techniques", name: "Appliquer les règles de sécurité en signalant les situations à risques", expectedLevel: 3 },
    { category: "Techniques", name: "Assurer l'entretien courant et la maintenance de premier niveau", expectedLevel: 3 },
    { category: "Techniques", name: "Implanter et installer la zone de travail", expectedLevel: 3 },
    { category: "Techniques", name: "Mettre en œuvre les spécificités techniques de l'activité (soudage)", expectedLevel: 4 },
    { category: "Techniques", name: "Réaliser les activités professionnelles de soudure", expectedLevel: 3 },
    { category: "Techniques", name: "Réaliser les activités professionnelles de chaudronnerie", expectedLevel: 3 },
    { category: "Techniques", name: "Renseigner et transmettre une fiche de suivi d'auto-contrôle", expectedLevel: 3 }
];

// Category mapping to macro skill type labels present in seeds
const categoryToMacroSkillTypeName: Record<TargetItem["category"], string> = {
    Comportementales: "Macro-compétences comportementales",
    QPSE: "Macro-compétences QPSE",
    Techniques: "Macro-compétences techniques",
};

function normalize(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function tokenScore(target: string, candidate: string): number {
    const t = normalize(target).split(" ").filter(Boolean);
    const c = normalize(candidate);
    let score = 0;
    for (const token of t) {
        if (c.includes(token)) score++;
    }
    return score / Math.max(1, t.length);
}

async function findOrCreateSoudeurJob(): Promise<ObjectId> {
    const jobs = new MongoCollection<Job>("job");
    const existingByName = await jobs.findOne({ name: { $regex: /soudeur/i } as unknown as any });
    if (existingByName) return existingByName._id;

    const codeCandidate = "SOUDEUR";
    const newJob: Job = {
        _id: new ObjectId(),
        name: "SOUDEUR",
        code: codeCandidate,
        jobProfile: "Standard",
        jobFamily: "Production",
        createdAt: new Date(),
    };
    await jobs.insertOne(newJob);
    return newJob._id;
}

async function loadSkillsWithTypes(): Promise<Array<Skill & { macroSkillTypeName?: string }>> {
    const skillsCollection = new MongoCollection<Skill>("skill");
    const macroSkillsCollection = new MongoCollection<any>("macro_skill");
    const macroSkillTypesCollection = new MongoCollection<any>("macro_skill_type");

    const [skills, macroSkills, macroSkillTypes] = await Promise.all([
        skillsCollection.find({}),
        macroSkillsCollection.find({}),
        macroSkillTypesCollection.find({}),
    ]);

    const macroSkillIdToTypeName = new Map<string, string>();
    for (const m of macroSkills) {
        const type = macroSkillTypes.find((t) => t._id.toString() === m.macroSkillTypeId.toString());
        if (type) macroSkillIdToTypeName.set(m._id.toString(), type.name as string);
    }

    // Attach macro skill type name to each skill for filtering
    const enriched = skills.map((s) => ({
        ...s,
        macroSkillTypeName: macroSkillIdToTypeName.get(s.macroSkillId.toString()),
    }));

    return enriched;
}

async function linkSkillsToSoudeur() {
    const jobId = await findOrCreateSoudeurJob();

    const skills = await loadSkillsWithTypes();
    const jobSkills = new MongoCollection<JobSkill>("job_skill");

    let added = 0;
    let skipped = 0;
    const notFound: TargetItem[] = [];

    for (const target of targets) {
        const desiredTypeName = categoryToMacroSkillTypeName[target.category];
        const candidates = skills.filter((s) => s.macroSkillTypeName === desiredTypeName);

        let best: Skill | undefined;
        let bestScore = 0;
        for (const s of candidates) {
            const score = tokenScore(target.name, s.name);
            if (score > bestScore) {
                best = s;
                bestScore = score;
            }
        }

        // Require a minimum score to avoid false positives
        if (!best || bestScore < 0.35) {
            notFound.push(target);
            // eslint-disable-next-line no-console
            console.log(`✗ NOT FOUND: ${target.category} • ${target.name}`);
            continue;
        }

        const exists = await jobSkills.findOne({ jobId, skillId: best._id } as any);
        if (exists) {
            // eslint-disable-next-line no-console
            console.log(`⚠️  Already linked: ${best.name.substring(0, 80)}...`);
            skipped++;
            continue;
        }

        const link: JobSkill = {
            _id: new ObjectId(),
            jobId,
            skillId: best._id,
            expectedLevel: target.expectedLevel,
            createdAt: new Date(),
        };
        await jobSkills.insertOne(link);
        // eslint-disable-next-line no-console
        console.log(`✓ Linked: [${target.expectedLevel}] ${best.name.substring(0, 80)}...`);
        added++;
    }

    // eslint-disable-next-line no-console
    console.log("\n=== Summary ===");
    // eslint-disable-next-line no-console
    console.log(`Added: ${added}`);
    // eslint-disable-next-line no-console
    console.log(`Skipped (already linked): ${skipped}`);
    if (notFound.length) {
        // eslint-disable-next-line no-console
        console.log(`Not matched (${notFound.length}):`);
        for (const nf of notFound) {
            // eslint-disable-next-line no-console
            console.log(` - ${nf.category} • ${nf.name} [${nf.expectedLevel}]`);
        }
    }
}

async function main() {
    await connect();
    try {
        await linkSkillsToSoudeur();
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        process.exitCode = 1;
    } finally {
        await close();
    }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();








