import fs from 'fs';
import path from 'path';
import { connect, close } from '../utils/mongo/dbHelper';
import { importSirhFromFile } from './sirhImporter';
import logger from '../utils/logger';

async function main() {
    const fileArgIndex = process.argv.findIndex((a) => a === '--file');
    const filePath = fileArgIndex !== -1 ? process.argv[fileArgIndex + 1] : undefined;
    if (!filePath) {
        logger.error('Usage: ts-node src/scripts/importFromSirhCsv.ts --file /absolute/path/to/file');
        logger.error('Supported formats: CSV, XLSX, XLS');
        process.exit(1);
    }
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) {
        logger.error(`File not found: ${absPath}`);
        process.exit(1);
    }

    await connect();
    try {
        const buffer = fs.readFileSync(absPath);
        const filename = path.basename(absPath);
        const res = await importSirhFromFile(buffer, filename);
        logger.debug('Import completed:', res);
    } catch (err) {
        logger.error('Error:', err);
        process.exitCode = 1;
    } finally {
        await close();
    }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();


