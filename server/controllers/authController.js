import User from "../models/User.js";
import admin from "../config/firebase-admin.js";
import { 
  initializeFirebasePhoneAuth, 
  verifyPhoneOnServer 
} from "../services/smsService.js";

export const syncUser = async (req, res) => {
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
    let fb;
    try {
      fb = await admin.auth().verifyIdToken(token);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Get provider info
    const provider = fb.firebase?.sign_in_provider || "password";
    const isPhoneProvider = provider === "phone";
    const isEmailVerified = fb.email_verified || false;
    const isPhoneVerified = !!fb.phone_number;

    // Check if user exists in MongoDB
    let user = await User.findOne({ firebaseUid: fb.uid });

    // Check if phone was verified during signup
    const verifiedPhoneData = verifiedPhones.get(fb.uid);

    if (!user) {
      // ✅ Clean and validate data before creating
      const cleanEmail = fb.email?.toLowerCase().trim() || null;
      const cleanPhoneNumber = verifiedPhoneData?.phoneNumber || fb.phone_number?.trim() || null;
      const cleanName = fb.name?.trim() || cleanEmail?.split("@")[0] || "User";

      console.log("Creating new user:", {
        firebaseUid: fb.uid,
        email: cleanEmail,
        phoneNumber: cleanPhoneNumber,
        provider,
        phoneVerified: !!verifiedPhoneData,
      });

      try {
        user = await User.create({
          firebaseUid: fb.uid,
          name: cleanName,
          email: cleanEmail,
          phoneNumber: cleanPhoneNumber,
          provider: provider === "password" ? "email" : provider,
          emailVerified: isEmailVerified,
          phoneVerified: !!verifiedPhoneData || isPhoneProvider, // Set to true if phone was verified
          role: "user",
          lastLogin: new Date(),
        });

        console.log(`✅ New user created: ${user.email || user.phoneNumber}`);
      } catch (createError) {
        console.error("User creation failed:", createError);

        // Check if it's a duplicate key error
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
      // Update existing user
      const cleanEmail = fb.email?.toLowerCase().trim() || user.email;
      const cleanPhoneNumber = verifiedPhoneData?.phoneNumber || fb.phone_number?.trim() || user.phoneNumber;

      user.emailVerified = isEmailVerified;
      // If phone was verified during signup, set it to true; otherwise preserve existing status
      user.phoneVerified = verifiedPhoneData ? true : (isPhoneVerified || user.phoneVerified);
      user.phoneNumber = cleanPhoneNumber;
      user.email = cleanEmail;
      user.lastLogin = new Date();

      await user.save();

      console.log(`✅ User synced: ${user.email || user.phoneNumber}`);
    }

    // Clear verified phone data after use (no longer needed)
    if (verifiedPhoneData) {
      verifiedPhones.delete(fb.uid);
      console.log(`🗑️ Cleared temporary phone verification data for ${fb.uid}`);
    }

    // Return user data
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
        phoneVerified: user.phoneVerified,
        resumesGenerated: user.resumesGenerated,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ User sync error:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "User sync failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get current user profile
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
        phoneVerified: user.phoneVerified,
        resumesGenerated: user.resumesGenerated,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = req.user;

    if (name) user.name = name.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// Increment resume count
export const incrementResumeCount = async (req, res) => {
  try {
    const user = req.user;

    user.resumesGenerated += 1;
    await user.save();

    return res.status(200).json({
      success: true,
      resumesGenerated: user.resumesGenerated,
    });
  } catch (error) {
    console.error("Increment resume count error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update resume count",
    });
  }
};

// ═════════════════════════════════════════════
// PHONE VERIFICATION - FIREBASE PHONE AUTH
// ═════════════════════════════════════════════

// In-memory store for verified phone (for demo - in production use Redis or DB)
const verifiedPhones = new Map(); // Store verified phones temporarily

// Send OTP to phone number using Firebase Phone Auth
export const sendPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber, firebaseUid } = req.body;

    if (!phoneNumber || !firebaseUid) {
      return res.status(400).json({
        success: false,
        message: "Phone number and Firebase UID are required",
      });
    }

    // Validate phone number format (E.164 format required by Firebase)
    // Supports: +919876543210 (India), +12025551234 (US), etc.
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format. Use E.164 format like +919876543210 for India",
      });
    }

    // Verify Firebase UID exists
    try {
      await admin.auth().getUser(firebaseUid);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid Firebase UID",
      });
    }

    // Firebase Phone Auth setup explanation
    // OTP will be sent by Firebase on the client side using:
    // signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    // This is more secure than server-side OTP generation

    console.log(`✅ Phone OTP requested for: ${phoneNumber} (Firebase will handle delivery)`);

    return res.status(200).json({
      success: true,
      message: "Phone verification initialized. Firebase will send OTP to your phone.",
      phoneNumber: phoneNumber,
      instructions: "Check your phone for OTP from Firebase. OTP expires in 60 minutes.",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initialize phone verification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Verify OTP and phone number using Firebase Auth
export const verifyPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber, firebaseUid } = req.body;

    if (!phoneNumber || !firebaseUid) {
      return res.status(400).json({
        success: false,
        message: "Phone number and Firebase UID are required",
      });
    }

    // Verify Firebase UID exists
    try {
      const user = await admin.auth().getUser(firebaseUid);
      
      // Check if phone is already linked to this user
      if (user.phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "Phone number already linked to this account",
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid Firebase UID",
      });
    }

    // Firebase Auth handles OTP verification on the client side
    // We verify the phone number is now linked to the user
    const isPhoneVerified = await verifyPhoneOnServer(firebaseUid, phoneNumber);

    if (!isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: "Phone verification failed. Please try again.",
      });
    }

    // Store verified phone temporarily
    verifiedPhones.set(firebaseUid, {
      phoneNumber: phoneNumber.trim(),
      verifiedAt: new Date(),
    });

    console.log(`✅ Phone verified via Firebase: ${phoneNumber}`);

    return res.status(200).json({
      success: true,
      message: "Phone number verified successfully!",
      phoneNumber: phoneNumber,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify phone",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};