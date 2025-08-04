import express from "express";
import { linkUserToOrganisationHandler } from "../controller/user.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";
import { createUser, getAllUsers } from "../controller/user.admin.controller";

const router = express.Router();
router.post("/:userId/organisation", [jwtMiddleware(['ADMIN'])], linkUserToOrganisationHandler);
router.get("/", [jwtMiddleware(['ADMIN'])], getAllUsers);
router.post("/", [jwtMiddleware(['ADMIN'])], createUser);

export default router;
