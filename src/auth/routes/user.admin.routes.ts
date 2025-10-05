import express from "express";
import jwtMiddleware from "../../middleware/jwt.middleware";
import { deleteUser, getManagers, getAllUsers, updateUserById, searchUsersHandler } from "../controller/user.admin.controller";
import { createUserWithoutPasswordHandler } from "../controller/auth.controller";

const router = express.Router();
router.get("/users/", [jwtMiddleware(['ADMIN'])], getAllUsers);
router.get("/users/search", [jwtMiddleware(['ADMIN'])], searchUsersHandler);
router.post("/users", [jwtMiddleware(['ADMIN'])], createUserWithoutPasswordHandler);
router.put("/users/:id", [jwtMiddleware(['ADMIN'])], updateUserById);
router.delete("/users/:id", [jwtMiddleware(['ADMIN'])], deleteUser);
router.get("/users/managers", [jwtMiddleware(['ADMIN'])], getManagers);

export default router;
