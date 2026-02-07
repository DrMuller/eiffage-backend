import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/express/asyncHandler';
import { BadRequestException } from '../../utils/HttpException';
import { importSirhFromFile } from '../../scripts/sirhImporter';
import { importHabilitationFromFile } from '../../scripts/habilitationImporter';
import { isSupportedFile } from '../../utils/fileParser';

export const uploadSirhCsv = asyncHandler(async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
        throw new BadRequestException('No file provided (field name: file)');
    }
    if (!isSupportedFile(file.originalname)) {
        throw new BadRequestException('Unsupported file format. Please upload a CSV or Excel (.xlsx) file');
    }
    const result = await importSirhFromFile(file.buffer, file.originalname);
    res.status(200).json(result);
});

export const uploadHabilitationCsv = asyncHandler(async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
        throw new BadRequestException('No file provided (field name: file)');
    }
    if (!isSupportedFile(file.originalname)) {
        throw new BadRequestException('Unsupported file format. Please upload a CSV or Excel (.xlsx) file');
    }
    const result = await importHabilitationFromFile(file.buffer, file.originalname);
    res.status(200).json(result);
});


