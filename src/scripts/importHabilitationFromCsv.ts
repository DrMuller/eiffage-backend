import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { connect } from '../utils/mongo/dbHelper';
import { importHabilitationFromFile } from './habilitationImporter';
import logger from '../utils/logger';

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: ts-node importHabilitationFromCsv.ts <path-to-file>');
        console.error('Supported formats: CSV, XLSX, XLS');
        process.exit(1);
    }

    const filePath = args[0];
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
        console.error(`File not found: ${absolutePath}`);
        process.exit(1);
    }

    const filename = path.basename(absolutePath);
    logger.info(`Reading file: ${absolutePath}`);
    const buffer = fs.readFileSync(absolutePath);

    logger.info('Connecting to database...');
    await connect();

    logger.info('Starting habilitation import...');
    const result = await importHabilitationFromFile(buffer, filename);

    logger.info('Import completed!');
    logger.info(`Created/Updated: ${result.created}`);
    logger.info(`Skipped: ${result.skipped}`);
    
    if (result.errors.length > 0) {
        logger.warn(`Errors (${result.errors.length}):`);
        result.errors.forEach((error: string, index: number) => {
            logger.warn(`  ${index + 1}. ${error}`);
        });
    }

    process.exit(0);
}

main().catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
});

