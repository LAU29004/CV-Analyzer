import express from "express";
import {
  getAllUsers,
  getUserStats,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getRecentActivity,
} from "../controllers/adminController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(authenticate, isAdmin);

// User management
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.put("/users/:userId/role", updateUserRole);
router.put("/users/:userId/status", toggleUserStatus);
router.delete("/users/:userId", deleteUser);

// Statistics
router.get("/stats", getUserStats);
router.get("/recent-activity", getRecentActivity);

export default router;