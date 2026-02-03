import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../models/Project.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

console.log("MongoDB connected");

// insert project
await Project.create({
  title: "Smart Energy Meter",
  role: "Electrical Engineer",
  domain: "electrical",
  requires: ["power systems", "iot", "embedded systems"],
  bullets: [
    "Monitor real-time energy usage",
    "Reduce power wastage",
    "Enable remote data access"
  ]
});

console.log("Project inserted");

await mongoose.disconnect();
