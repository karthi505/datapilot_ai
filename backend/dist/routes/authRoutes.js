import express from "express";
import {
  getUserInfo,
  login,
  logout,
  registerAdmin,
  registerUser,
  resendOTP,
  verifyOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register/user", registerUser);
router.post("/register/admin", registerAdmin);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);


// Protected routes
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getUserInfo);

export default router;
