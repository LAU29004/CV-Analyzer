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
      index: true,
      sparse: true,
      lowercase: true,
      trim: true,
      // ✅ REMOVED: No inline index definition
    },
    phoneNumber: {
      type: String,
      index: true,
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

userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model("User", userSchema);