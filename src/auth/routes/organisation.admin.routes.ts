import express from "express";
import {
    getOrganisation,
    updateExistingOrganisation,
} from "../controller/organisation.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";
import { createNewOrganisation, getAllOrganisations } from "../controller/organisation.admin.controller";

const router = express.Router();

router.post("/", [jwtMiddleware(['ADMIN'])], createNewOrganisation);
router.get("/", [jwtMiddleware(['ADMIN'])], getAllOrganisations);
router.get("/:id", [jwtMiddleware(['ADMIN'])], getOrganisation);
router.put("/:id", [jwtMiddleware(['ADMIN'])], updateExistingOrganisation);



export default router; 