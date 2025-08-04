import express from "express";
import { me } from "../controller/user.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";

const router = express.Router();
router.get("/me", [jwtMiddleware(['USER'])], me);

export default router;
