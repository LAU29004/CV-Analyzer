import admin from "../config/firebase-admin.js";
import User from "../models/User.js";

// Verify Firebase token and attach user to request
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get user from MongoDB
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please sync your account.",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Attach user and firebase data to request
    req.user = user;
    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    if (error.code === "auth/argument-error") {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// Check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authorization",
    });
  }
};