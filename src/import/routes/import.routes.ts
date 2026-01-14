import express from 'express';
import multer from 'multer';
import jwtMiddleware from '../../middleware/jwt.middleware';
import { uploadSirhCsv, uploadHabilitationCsv, uploadSkillsCsv } from '../service/import.service';

const upload = multer({ storage: multer.memoryStorage() });
export const router = express.Router();

router.post('/sirh-csv', [jwtMiddleware(['ADMIN'])], upload.single('file'), uploadSirhCsv);
router.post('/habilitation-csv', [jwtMiddleware(['ADMIN'])], upload.single('file'), uploadHabilitationCsv);
router.post('/skills-csv', [jwtMiddleware(['USER', 'ADMIN'])], upload.single('file'), uploadSkillsCsv);


