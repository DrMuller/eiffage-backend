import bcrypt from 'bcrypt';
import { MongoCollection, ObjectId } from '../utils/mongo/MongoCollection';
import type { User } from '../auth/model/user';
import type { Job } from '../job/model/job';
import { parseFileContent } from '../utils/fileParser';

type CsvRow = Record<string, string>;

function normalizeString(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim();
}

function parseNumberOrUndefined(value: unknown): number | undefined {
    const v = normalizeString(value);
    if (!v) return undefined;
    // Common French numeric formats: "12,34"
    const normalized = v.replace(/\s/g, '').replace(',', '.');
    const n = Number.parseFloat(normalized);
    if (Number.isNaN(n)) return undefined;
    return n;
}

function toTitleCase(value: string): string {
    const lower = value.toLowerCase();
    // Handle separators like spaces, hyphens, and apostrophes
    return lower
        .split(' ')
        .map((token) =>
            token
                .split("'")
                .map((sub) =>
                    sub
                        .split('-')
                        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
                        .join('-')
                )
                .join("'")
        )
        .join(' ');
}

function toSentenceCaseJobWithBracketCaps(value: string): string {
    // Lowercase entire string first
    const lower = value.toLowerCase();
    // Uppercase content inside brackets
    const withBracketCaps = lower.replace(/\[([^\]]+)\]/g, (_m, p1) => `[${p1.toUpperCase()}]`);
    // Capitalize the first alphabetical character that is not inside brackets
    let result = '';
    let inBracket = false;
    let capitalized = false;
    for (let i = 0; i < withBracketCaps.length; i++) {
        const ch = withBracketCaps[i];
        if (ch === '[') {
            inBracket = true;
            result += ch;
            continue;
        }
        if (ch === ']') {
            inBracket = false;
            result += ch;
            continue;
        }
        if (!capitalized && !inBracket && ch >= 'a' && ch <= 'z') {
            result += ch.toUpperCase();
            capitalized = true;
            continue;
        }
        result += ch;
    }
    return result;
}

function mapGender(g: string | undefined): User['gender'] {
    const v = (g || '').toUpperCase().trim();
    if (v === 'H') return 'MALE';
    if (v === 'F') return 'FEMALE';
    return 'MALE';
}

function parseDateOrDefault(value: string | undefined): Date {
    const v = normalizeString(value);
    if (!v) return new Date('1970-01-01T00:00:00.000Z');
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
    const d2 = new Date(v.replaceAll('/', '-'));
    if (!isNaN(d2.getTime())) return d2;
    return new Date('1970-01-01T00:00:00.000Z');
}

async function upsertJobs(rows: CsvRow[], jobsCollection: MongoCollection<Job>): Promise<Map<string, ObjectId>> {
    const codeToId = new Map<string, ObjectId>();
    const seen = new Set<string>();
    for (const row of rows) {
        const code = normalizeString(row["Code de l'emploi"]);
        if (!code || seen.has(code)) continue;
        seen.add(code);
        const rawName = normalizeString(row['Poste']) || normalizeString(row['Emploi bulletin']);
        const name = rawName ? toSentenceCaseJobWithBracketCaps(rawName) : rawName;
        const jobProfile = normalizeString(row["Profil d'emploi"]);
        const jobFamily = normalizeString(row["Famille d'emploi"]) || undefined;
        const existing = await jobsCollection.findOne({ code } as any);
        if (existing) {
            const updated: Job = {
                ...existing,
                name: name || existing.name,
                jobProfile: jobProfile || existing.jobProfile,
                jobFamily: jobFamily ?? existing.jobFamily,
            };
            const doc = await jobsCollection.update(updated);
            codeToId.set(code, doc._id);
        } else {
            const inserted = await jobsCollection.insertOne({
                _id: new ObjectId(),
                name: name || code,
                code,
                jobProfile: jobProfile || '',
                jobFamily,
                createdAt: new Date(),
            } as Job);
            codeToId.set(code, inserted._id);
        }
    }
    return codeToId;
}

async function upsertUsersFirstPass(
    rows: CsvRow[],
    usersCollection: MongoCollection<User>,
    jobCodeToId: Map<string, ObjectId>
): Promise<Map<string, ObjectId>> {
    const matriculeToId = new Map<string, ObjectId>();
    const byMatricule = new Map<string, CsvRow>();
    for (const row of rows) {
        const matricule = normalizeString(row['Matricule du salarié']);
        if (!matricule) continue;
        byMatricule.set(matricule, row);
    }
    for (const [matricule, row] of byMatricule) {
        const emailRaw = normalizeString(row['Email']);
        const email = emailRaw || `${matricule}@noemail.local`;
        const firstNameRaw = normalizeString(row['Prénom']);
        const lastNameRaw = normalizeString(row['Nom de famille']);
        const firstName = firstNameRaw ? toTitleCase(firstNameRaw) : firstNameRaw;
        const lastName = lastNameRaw ? toTitleCase(lastNameRaw) : lastNameRaw;
        // SIRH extra fields (header mapping requested)
        const companyCode = normalizeString(row['Code Société']);
        const companyName = normalizeString(row['Libellé Société']);
        const establishmentCode = normalizeString(row['Code Etablissement']);
        const establishmentName = normalizeString(row['Libellé Etablissement']);
        const age = parseNumberOrUndefined(row["Age à date d'effet"]);
        const seniority = parseNumberOrUndefined(row['Ancienneté calculée']);
        const gender = mapGender(normalizeString(row['Sexe']));
        const birthDate = parseDateOrDefault(row['Date de naissance']);
        const jobCode = normalizeString(row["Code de l'emploi"]);
        const jobId = jobCode ? jobCodeToId.get(jobCode) ?? null : null;
        const existing = await usersCollection.findOne({ code: matricule } as any);
        if (existing) {
            const updated: User = {
                ...existing,
                email: email.toLowerCase(),
                firstName: firstName || existing.firstName,
                lastName: lastName || existing.lastName,
                jobId: jobId ?? existing.jobId,
                companyCode: companyCode || existing.companyCode,
                companyName: companyName || existing.companyName,
                establishmentCode: establishmentCode || existing.establishmentCode,
                establishmentName: establishmentName || existing.establishmentName,
                age: age ?? existing.age,
                seniority: seniority ?? existing.seniority,
                gender: existing.gender ?? gender,
                birthDate: existing.birthDate ?? birthDate,
                updatedAt: new Date(),
            };
            const doc = await usersCollection.update(updated);
            matriculeToId.set(matricule, doc._id);
        } else {
            const randomPassword = Math.random().toString(36).slice(-12) + 'A!1';
            const hashed = await bcrypt.hash(randomPassword, 10);
            const inserted = await usersCollection.insertOne({
                _id: new ObjectId(),
                email: email.toLowerCase(),
                password: hashed,
                firstName: firstName || 'N/A',
                lastName: lastName || 'N/A',
                code: matricule,
                jobId: jobId ?? null,
                managerUserIds: [],
                companyCode: companyCode || undefined,
                companyName: companyName || undefined,
                establishmentCode: establishmentCode || undefined,
                establishmentName: establishmentName || undefined,
                age,
                seniority,
                gender,
                birthDate,
                roles: ['USER'],
                createdAt: new Date(),
                updatedAt: new Date(),
            } as User);
            matriculeToId.set(matricule, inserted._id);
        }
    }
    return matriculeToId;
}

async function updateManagers(
    rows: CsvRow[],
    usersCollection: MongoCollection<User>,
    matriculeToId: Map<string, ObjectId>
) {
    const byMatricule = new Map<string, CsvRow>();
    for (const row of rows) {
        const matricule = normalizeString(row['Matricule du salarié']);
        if (!matricule) continue;
        byMatricule.set(matricule, row);
    }
    for (const [matricule, row] of byMatricule) {
        const userId = matriculeToId.get(matricule);
        if (!userId) continue;
        const managerCodes = [
            normalizeString(row['Matricule du Manager hiérarchique']),
            normalizeString(row['Matricule du Manager opérationnel']),
        ].filter(Boolean) as string[];
        const managerIds = Array.from(new Set(managerCodes))
            .map((mc) => matriculeToId.get(mc))
            .filter((v): v is ObjectId => !!v);
        if (managerIds.length === 0) continue;
        // Ensure each referenced manager has the MANAGER role
        for (const managerId of managerIds) {
            const mgr = await usersCollection.findOne({ _id: managerId } as any);
            if (!mgr) continue;
            const currentRoles = Array.isArray(mgr.roles) ? mgr.roles : ['USER'];
            if (!currentRoles.includes('MANAGER')) {
                await usersCollection.update({
                    ...mgr,
                    roles: Array.from(new Set([...currentRoles, 'MANAGER'])),
                    updatedAt: new Date(),
                } as User);
            }
        }

        const existing = await usersCollection.findOne({ _id: userId } as any);
        if (!existing) continue;
        const updated: User = {
            ...existing,
            managerUserIds: managerIds,
            updatedAt: new Date(),
        };
        await usersCollection.update(updated);
    }
}

export async function importSirhCsvFromString(csvContent: string): Promise<{ jobsProcessed: number; usersProcessed: number }> {
    // For backward compatibility, parse as CSV string
    const buffer = Buffer.from(csvContent, 'utf8');
    const requiredColumns = ['Matricule du salarié', 'Nom de famille', 'Prénom', 'Email', "Code de l'emploi"];
    const rows = parseFileContent(buffer, 'data.csv', requiredColumns);
    const jobsCollection = new MongoCollection<Job>('job');
    const usersCollection = new MongoCollection<User>('user');
    const jobCodeToId = await upsertJobs(rows, jobsCollection);
    const matriculeToId = await upsertUsersFirstPass(rows, usersCollection, jobCodeToId);
    await updateManagers(rows, usersCollection, matriculeToId);
    return { jobsProcessed: jobCodeToId.size, usersProcessed: matriculeToId.size };
}

export async function importSirhFromFile(buffer: Buffer, filename: string): Promise<{ jobsProcessed: number; usersProcessed: number }> {
    const requiredColumns = ['Matricule du salarié', 'Nom de famille', 'Prénom', 'Email', "Code de l'emploi"];
    const rows = parseFileContent(buffer, filename, requiredColumns);
    const jobsCollection = new MongoCollection<Job>('job');
    const usersCollection = new MongoCollection<User>('user');
    const jobCodeToId = await upsertJobs(rows, jobsCollection);
    const matriculeToId = await upsertUsersFirstPass(rows, usersCollection, jobCodeToId);
    await updateManagers(rows, usersCollection, matriculeToId);
    return { jobsProcessed: jobCodeToId.size, usersProcessed: matriculeToId.size };
}


