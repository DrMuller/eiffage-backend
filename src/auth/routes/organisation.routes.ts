import express from "express";
import {
    getCurrentUserOrganisation,
    getOrganisation,
    getOrganisationUsers,
    updateExistingOrganisation,
} from "../controller/organisation.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";

const router = express.Router();

router.get("/", [jwtMiddleware(['USER'])], getCurrentUserOrganisation);
router.get("/:id", [jwtMiddleware(['USER'])], getOrganisation);
router.put("/:id", [jwtMiddleware(['USER'])], updateExistingOrganisation);

router.get("/:id/users", [jwtMiddleware(['ADMIN'])], getOrganisationUsers);


export default router; 