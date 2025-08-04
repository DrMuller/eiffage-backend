import express from "express";
import {
  signin,
  signup,
  refreshAccessToken,
  postResetPasswordToken,
  postResetPassword,
  createUserWithoutPasswordHandler,
} from "../controller/auth.controller";
import jwtMiddleware from "../../middleware/jwt.middleware";

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/signin", signin); // Rate limiting only on login
router.post("/refresh", refreshAccessToken);
router.post("/reset-password-token", postResetPasswordToken);
router.post("/reset-password", postResetPassword);

// Admin only routes
router.post("/users", [jwtMiddleware(['ADMIN'])], createUserWithoutPasswordHandler);

export default router;
