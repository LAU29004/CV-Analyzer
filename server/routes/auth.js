import express from "express";
import { syncUser, savePhone } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/sync", syncUser);

// Protected: save phone directly (no OTP)
router.post("/save-phone", authenticate, savePhone);

export default router;