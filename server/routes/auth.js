import express from "express";
import {
  syncUser,
  sendPhoneOTP,
  verifyPhoneOTP,
  //getProfile,
  //updateProfile,
  //incrementResumeCount,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/sync", syncUser);
router.post("/send-otp", sendPhoneOTP);
router.post("/verify-otp", verifyPhoneOTP);

// Protected routes (require authentication)
// router.get("/profile", authenticate, getProfile);
// router.put("/profile", authenticate, updateProfile);
// router.post("/increment-resume", authenticate, incrementResumeCount);

export default router;