// models/AppSettings.js
import mongoose from "mongoose";

const appSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "global",
      unique: true,
    },
    activeModel: {
      type: String,
      enum: ["Gemini", "ChatGPT"],
      default: "Gemini",
    },
    updatedBy: {
      type: String, // firebaseUid of the admin who last changed it
    },
  },
  { timestamps: true }
);

export default mongoose.model("AppSettings", appSettingsSchema);