import express from 'express';
import multer from 'multer';
import jwtMiddleware from '../../middleware/jwt.middleware';
import { uploadSirhCsv, uploadHabilitationCsv } from '../service/import.service';

const upload = multer();
export const router = express.Router();

router.post('/sirh-csv', [jwtMiddleware(['ADMIN'])], upload.single('file'), uploadSirhCsv);
router.post('/habilitation-csv', [jwtMiddleware(['ADMIN'])], upload.single('file'), uploadHabilitationCsv);


