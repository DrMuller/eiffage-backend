import express from "express";
import { me, linkUserToOrganisationHandler } from "../controller/user.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";

const router = express.Router();
router.get("/me", [jwtMiddleware(['USER'])], me);
router.post("/:userId/organisation", [jwtMiddleware(['ADMIN'])], linkUserToOrganisationHandler);

export default router;
