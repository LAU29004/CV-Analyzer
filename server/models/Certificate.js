import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      // e.g., "Meta Front-End Developer Professional Certificate"
    },
    organization: {
      type: String,
      required: true,
      trim: true,
      // e.g., "Meta", "IBM", "Google", "AWS"
    },
    description: {
      type: String,
      required: true,
      trim: true,
      // e.g., "Directly equips a fresher with essential skills..."
    },
    domain: {
      type: String,
      enum: [
        "frontend", "backend", "fullstack",
        "data-science", "cloud", "ai-ml",
        "devops", "uiux",
        // Engineering / non-IT domains
        "mechanical", "civil", "electrical",
        "project-management", "cybersecurity",
        "mobile", "embedded", "other",
      ],
      required: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    skills: {
      type: [String],
      default: [],
      // e.g., ["React", "HTML", "CSS"]
    },
    link: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast queries
certificateSchema.index({ domain: 1 });
certificateSchema.index({ domain: 1, level: 1 });
certificateSchema.index({ name: 1 });
certificateSchema.index({ organization: 1 });

export default mongoose.model("Certificate", certificateSchema);
