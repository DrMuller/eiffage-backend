import express from "express";
import jwtMiddleware from "../../middleware/jwt.middleware";
import { createUser, deleteUser, getManagers, getAllUsers, updateUserById } from "../controller/user.admin.controller";

const router = express.Router();
router.get("/", [jwtMiddleware(['ADMIN'])], getAllUsers);
router.post("/", [jwtMiddleware(['ADMIN'])], createUser);
router.put("/:id", [jwtMiddleware(['ADMIN'])], updateUserById);
router.delete("/:id", [jwtMiddleware(['ADMIN'])], deleteUser);
router.get("/managers", [jwtMiddleware(['ADMIN'])], getManagers);

export default router;
