import express from "express";
import {
  signin,
  signup,
  refreshAccessToken,
  postResetPasswordToken,
  postResetPassword,
} from "../controller/auth.controller";

const router = express.Router();

// Public routes
router.post("/auth/signup", signup);
router.post("/auth/signin", signin); // Rate limiting only on login
router.post("/auth/refresh", refreshAccessToken);
router.post("/auth/reset-password-token", postResetPasswordToken);
router.post("/auth/reset-password", postResetPassword);

export default router;
