import { connect, close } from "../utils/mongo/dbHelper";
import { MongoCollection, ObjectId } from "../utils/mongo/MongoCollection";
import type { Skill } from "../skills/model/skill";
import type { MacroSkill } from "../skills/model/macroSkill";
import logger from "../utils/logger";

const targetSkillNames = [
    "Respecter les cordons de soudure (mono, multi passes et angles) et les tolérances des soudures pour garantir la qualité et la conformité des assemblages.",
    "Nettoyer parfaitement les soudures et tôles en enlevant les défauts surfaciques visibles et les projections pour obtenir une surface propre et prête pour l'inspection.",
    "Prendre connaissance et suivre les instructions de soudage sur les DMOS, cahiers ou notices et plans, y compris le respect du temps alloué, pour assurer une exécution précise et conforme des opérations de soudage.",
    "Effectuer les soudures d'ensembles, sous-ensembles et goujons en utilisant les machines de soudage ou outillages prévus, notamment le métal d'apport, pour assembler des composants de manière efficace et sûre.",
    "Contrôler la température d'entre-passes selon le DMOS pour respecter les spécifications techniques et éviter les défauts de soudure.",
    "Assembler des profils métalliques (type HEB) et les accessoires entre eux en respectant les indications du plan pour créer des structures conformes aux exigences de conception.",
    "Réaliser des petits travaux de chaudronnerie (RAK, suspentes) pour effectuer des ajustements et des prestations de précision.",
    "Scier les matériaux à l'aide de scie ou meule pour découper les pièces nécessaires aux assemblages.",
    "Réaliser les finitions de meulage ou les reprises sur les pièces non acceptables pour atteindre les standards de qualité.",
    "Lire une procédure de fabrication pour comprendre et exécuter correctement les opérations.",
    "Lire des plans pour interpréter les directives de production",
    "Lire des DMOS pour suivre les spécifications de soudage et assurer la conformité des soudures.",
    "Préparer les pièces pour les opérations d'assemblage ou de soudage en suivant les plans et les procédures.",
    "Ranger le matériel du chantier pour maintenir un environnement de travail ordonné et sécurisé.",
    "Nettoyer la zone de travail pour garantir des conditions de travail sûres et efficaces.",
    "Entretenir le matériel pour prolonger sa durée de vie et maintenir son bon fonctionnement.",
    "Réaliser un auto-contrôle pour vérifier la qualité de son propre travail et garantir la conformité.",
    "Préchauffer les pièces selon les DMOS pour assurer une soudabilité optimale et prévenir les fissures.",
    "Mettre en place des dispositifs de signalisation et de sécurité pour prévenir les accidents et assurer un environnement de travail sûr.",
    "Contrôler les pièces usinées (visuel, dimensionnel) avant assemblage pour s'assurer qu'elles respectent les spécifications requises.",
    "Contrôler visuellement la qualité du travail, tracer son travail et remplir les documents demandés pour documenter les opérations et garantir la traçabilité.",
    "Réaliser une soudure sur un matériau en inox en utilisant le procédé de soudage à l'électrode enrobée pour garantir des soudures robustes et conformes aux standards.",
    "Réaliser une soudure sur un matériau en inox en utilisant le procédé de soudage Inox TIG 141 pour obtenir des soudures de haute qualité.",
    "Réaliser une soudure sur un matériau en inox en utilisant le procédé de soudage Inox SEMI 136 (fil fourré) pour des assemblages résistants.",
    "Réaliser une soudure sur un matériau en inox en utilisant le procédé de soudage Inox SEMI 138 (fil fourré) pour des applications spécifiques.",
    "Réaliser une soudure sur un matériau en acier en utilisant le procédé de soudage à l’électrode enrobée pour assembler des pièces d'acier de manière fiable.",
    "Utiliser un chariot de soudage semi-auto pour faciliter le processus de soudage et améliorer l'efficacité.",
    "Utiliser la potence ESAB pour manipuler les équipements de soudage lourds et complexes.",
    "Conduire une machine PRS pour effectuer des tâches spécifiques de soudage ou d'assemblage.",
    "Conduire une machine CMS pour automatiser certaines étapes du processus de production.",
    "Utiliser la potence NARROWGAP pour le soudage dans des espaces restreints.",
    "Faire un rechargement INOX pour maintenir ou restaurer l'intégrité des pièces.",
    "Conduire une machine à 4 têtes pour des opérations de soudage sous flux multiples.",
    "Conduire un chariot à double tête sous flux pour augmenter la productivité du soudage.",
    "Piloter un robot YASKAWA pour automatiser les tâches de soudage répétitives.",
    "Utiliser un système de soudage Orbital TIG pour des soudures circulaires de haute précision.",
    "Avoir le sens de l’écoute et du relationnel pour communiquer efficacement et travailler harmonieusement avec les autres.",
    "Communiquer à l’écrit pour documenter les opérations et les résultats de manière claire et précise.",
    "Communiquer à l’oral pour échanger des informations et des instructions de manière efficace.",
    "Être autonome pour accomplir les tâches de manière indépendante et fiable.",
    "Faire preuve de rigueur pour maintenir des standards élevés de qualité et de conformité.",
    "Travailler en hauteur pour effectuer des opérations sur des structures élevées de manière sécurisée.",
    "Travailler en équipe pour collaborer avec les collègues et atteindre les objectifs communs.",
    "Maintenir la propreté et l'ordre du poste de travail en effectuant un nettoyage régulier et en rangeant les outils et matériaux utilisés afin de garantir un environnement de travail sécuritaire et productif.",
    "Porter systématiquement les Équipements de Protection Individuelle adaptés à chaque tâche pour prévenir les risques d'accidents et de blessures.",
    "Respecter strictement les règles de sécurité et les protocoles établis par l'entreprise pour minimiser les risques d'accidents et favoriser un environnement de travail sécurisé.",
    "Respecter les règles environnementales en suivant les protocoles écologiques et légaux pour minimiser l'impact environnemental et garantir une conformité réglementaire.",
];

const JOB_ID = "68f5ee2f730a07b29ece5ce7";
const DEFAULT_EXPECTED_LEVEL = 3;

// Normalize spaces (replace non-breaking spaces with regular spaces)
function normalizeSpaces(str: string): string {
    return str.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

async function addSkillsWithNormalization() {
    const skillsCollection = new MongoCollection<Skill>("skill");
    const macroSkillsCollection = new MongoCollection<MacroSkill>("macro_skill");
    const jobId = new ObjectId(JOB_ID);

    const allSkills = await skillsCollection.find({});
    logger.debug(`Total skills in database: ${allSkills.length}\n`);

    const foundSkills: Skill[] = [];
    const notFound: string[] = [];

    for (const targetName of targetSkillNames) {
        const normalizedTarget = normalizeSpaces(targetName);

        const match = allSkills.find((s: Skill) =>
            normalizeSpaces(s.name) === normalizedTarget
        );

        if (match) {
            foundSkills.push(match);
            logger.debug(`✓ FOUND: ${match.name.substring(0, 70)}...`);
        } else {
            notFound.push(targetName);
            logger.debug(`✗ NOT FOUND: ${targetName.substring(0, 70)}...`);
        }
    }

    logger.debug(`\n=== Found ${foundSkills.length} skills ===\n`);

    if (notFound.length > 0) {
        logger.debug(`⚠️  Could not find ${notFound.length} skills\n`);
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const sourceSkill of foundSkills) {
        // Check if a skill with this name already exists for this job
        const existing = await skillsCollection.findOne({
            name: sourceSkill.name,
            jobId: jobId
        });

        if (existing) {
            logger.debug(`⚠️  Already exists: ${sourceSkill.name.substring(0, 60)}...`);
            skippedCount++;
            continue;
        }

        // Get or create the macro skill for this job
        const sourceMacroSkill = await macroSkillsCollection.findOne({ 
            _id: sourceSkill.macroSkillId 
        } as any);
        
        if (!sourceMacroSkill) {
            logger.debug(`✗ Macro skill not found for: ${sourceSkill.name}`);
            continue;
        }

        // Check if macro skill exists for this job
        let macroSkillForJob = await macroSkillsCollection.findOne({ 
            name: sourceMacroSkill.name, 
            jobId 
        } as any);

        if (!macroSkillForJob) {
            // Create a new macro skill for this job
            macroSkillForJob = {
                _id: new ObjectId(),
                name: sourceMacroSkill.name,
                macroSkillTypeId: sourceMacroSkill.macroSkillTypeId,
                jobId,
                createdAt: new Date(),
            } as MacroSkill;
            await macroSkillsCollection.insertOne(macroSkillForJob);
        }

        // Create a new skill record for this job
        const newSkill: Skill = {
            _id: new ObjectId(),
            name: sourceSkill.name,
            macroSkillId: macroSkillForJob._id,
            jobId: jobId,
            expectedLevel: DEFAULT_EXPECTED_LEVEL,
            createdAt: new Date(),
        };

        await skillsCollection.insertOne(newSkill);
        logger.debug(`✓ Created: ${sourceSkill.name.substring(0, 60)}...`);
        addedCount++;
    }

    logger.debug("\n=== Summary ===");
    logger.debug(`Skills found: ${foundSkills.length}`);
    logger.debug(`Skills created: ${addedCount}`);
    logger.debug(`Skills skipped (already exist): ${skippedCount}`);
}

async function main() {
    await connect();
    try {
        await addSkillsWithNormalization();
    } catch (err) {
        logger.error("Error:", err);
        process.exitCode = 1;
    } finally {
        await close();
    }
}

main();




