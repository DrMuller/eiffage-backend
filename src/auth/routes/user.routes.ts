import express from "express";
import { me, team } from "../controller/user.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";

const router = express.Router();
router.get("/users/me", [jwtMiddleware(['USER'])], me);
router.get("/users/team", [jwtMiddleware(['MANAGER'])], team);

export default router;
