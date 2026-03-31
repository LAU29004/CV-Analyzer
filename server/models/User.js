import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      // ✅ REMOVED: index: true (it's already unique, which creates an index)
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
      // ✅ REMOVED: No inline index definition
    },
    phoneNumber: {
      type: String,
      sparse: true,
      trim: true,
      // ✅ REMOVED: No inline index definition
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    provider: {
      type: String,
      enum: ["password", "phone", "google.com", "facebook.com", "email"],
      default: "password",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    resumesGenerated: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Define all indexes here (NOT in the field definitions above)
userSchema.index({ firebaseUid: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phoneNumber: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model("User", userSchema);