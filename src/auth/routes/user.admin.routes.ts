import express from "express";
import jwtMiddleware from "../../middleware/jwt.middleware";
import { createUser, getAllUsers } from "../controller/user.admin.controller";

const router = express.Router();
router.get("/", [jwtMiddleware(['ADMIN'])], getAllUsers);
router.post("/", [jwtMiddleware(['ADMIN'])], createUser);

export default router;
