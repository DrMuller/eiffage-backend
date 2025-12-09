import express from "express";
import jwtMiddleware from "../../middleware/jwt.middleware";
import { deleteUser, getManagers, getAllUsers, updateUserById, searchUsersHandler, inviteUser, getUserByIdHandler } from "../controller/user.admin.controller";
import { createUserWithoutPasswordHandler } from "../controller/auth.controller";

const router = express.Router();
router.get("/users/", [jwtMiddleware(['ADMIN'])], getAllUsers);
router.get("/users/search", [jwtMiddleware(['ADMIN'])], searchUsersHandler);
router.get("/users/managers", [jwtMiddleware(['ADMIN'])], getManagers);
router.get("/users/:id", [jwtMiddleware(['ADMIN'])], getUserByIdHandler);
router.post("/users", [jwtMiddleware(['ADMIN'])], createUserWithoutPasswordHandler);
router.post("/users/:id/invite", [jwtMiddleware(['ADMIN'])], inviteUser);
router.put("/users/:id", [jwtMiddleware(['ADMIN'])], updateUserById);
router.delete("/users/:id", [jwtMiddleware(['ADMIN'])], deleteUser);

export default router;
