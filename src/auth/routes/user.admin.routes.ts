import express from "express";
import jwtMiddleware from "../../middleware/jwt.middleware";
import { deleteUser, getManagers, getAllUsers, updateUserById, searchUsersHandler, inviteUser, getUserByIdHandler, getTeamStatsHandler } from "../controller/user.admin.controller";
import { createUserWithoutPasswordHandler } from "../controller/auth.controller";

const router = express.Router();
router.get("/users/", [jwtMiddleware(['ADMIN', 'MANAGER'])], getAllUsers);
router.get("/users/search", [jwtMiddleware(['ADMIN', 'MANAGER'])], searchUsersHandler);
router.get("/users/managers", [jwtMiddleware(['ADMIN', 'MANAGER'])], getManagers);
router.get("/users/:managerId/team-stats", [jwtMiddleware(['ADMIN', 'MANAGER'])], getTeamStatsHandler);
router.get("/users/:id", [jwtMiddleware(['ADMIN', 'MANAGER'])], getUserByIdHandler);
router.post("/users", [jwtMiddleware(['ADMIN'])], createUserWithoutPasswordHandler);
router.post("/users/:id/invite", [jwtMiddleware(['ADMIN'])], inviteUser);
router.put("/users/:id", [jwtMiddleware(['ADMIN'])], updateUserById);
router.delete("/users/:id", [jwtMiddleware(['ADMIN'])], deleteUser);

export default router;
