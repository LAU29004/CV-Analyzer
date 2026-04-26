import User from "../models/User.js";
import admin from "../config/firebase-admin.js";

// ─────────────────────────────────────────────
// Sync Firebase user → MongoDB
// ─────────────────────────────────────────────
export const syncUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    // Optional phone number passed from the frontend on first sync
    const { phoneNumber: bodyPhone } = req.body || {};

    let fb;
    try {
      fb = await admin.auth().verifyIdToken(token);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const provider = fb.firebase?.sign_in_provider || "password";
    const isEmailVerified = fb.email_verified || false;

    let user = await User.findOne({ firebaseUid: fb.uid });

    if (!user) {
      const cleanEmail = fb.email?.toLowerCase().trim() || null;
      const cleanName = fb.name?.trim() || cleanEmail?.split("@")[0] || "User";

      try {
        user = await User.create({
          firebaseUid: fb.uid,
          name: cleanName,
          email: cleanEmail,
          phoneNumber: bodyPhone?.trim() || null,
          provider: provider === "password" ? "email" : provider,
          emailVerified: isEmailVerified,
          role: "user",
          lastLogin: new Date(),
        });
        console.log(`✅ New user created: ${user.email}`);
      } catch (createError) {
        console.error("User creation failed:", createError);
        if (createError.code === 11000) {
          const duplicateField = Object.keys(createError.keyPattern)[0];
          return res.status(400).json({
            success: false,
            message: `A user with this ${duplicateField} already exists`,
          });
        }
        throw createError;
      }
    } else {
      const cleanEmail = fb.email?.toLowerCase().trim() || user.email;
      const firebaseName = fb.name?.trim();
      user.emailVerified = isEmailVerified;
      user.email = cleanEmail;
      if (firebaseName) {
        user.name = firebaseName;
      } else if (!user.name && cleanEmail) {
        user.name = cleanEmail.split("@")[0];
      }
      // Save phone if provided and not already stored
      if (bodyPhone?.trim() && !user.phoneNumber) {
        user.phoneNumber = bodyPhone.trim();
      }
      user.lastLogin = new Date();
      await user.save();
      console.log(`✅ User synced: ${user.email}`);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        displayName: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        emailVerified: user.emailVerified,
        resumesGenerated: user.resumesGenerated,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ User sync error:", error);
    return res.status(500).json({
      success: false,
      message: "User sync failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ─────────────────────────────────────────────
// Save phone number directly (no OTP/verification)
// ─────────────────────────────────────────────
export const savePhone = async (req, res) => {
  try {
    const { phoneNumber, firebaseUid } = req.body;

    if (!phoneNumber || !firebaseUid) {
      return res.status(400).json({ success: false, message: "phoneNumber and firebaseUid are required" });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { phoneNumber: phoneNumber.trim() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log(`✅ Phone saved for ${user.email}: ${phoneNumber}`);

    return res.status(200).json({
      success: true,
      message: "Phone number saved successfully",
      phoneNumber: user.phoneNumber,
    });
  } catch (error) {
    console.error("Save phone error:", error);
    return res.status(500).json({ success: false, message: "Failed to save phone number" });
  }
};

// ─────────────────────────────────────────────
// Get current user profile
// ─────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        emailVerified: user.emailVerified,
        resumesGenerated: user.resumesGenerated,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

// ─────────────────────────────────────────────
// Update user profile
// ─────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = req.user;
    if (name) user.name = name.trim();
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// ─────────────────────────────────────────────
// Increment resume count
// ─────────────────────────────────────────────
export const incrementResumeCount = async (req, res) => {
  try {
    const user = req.user;
    user.resumesGenerated += 1;
    await user.save();
    return res.status(200).json({ success: true, resumesGenerated: user.resumesGenerated });
  } catch (error) {
    console.error("Increment resume count error:", error);
    return res.status(500).json({ success: false, message: "Failed to update resume count" });
  }
};