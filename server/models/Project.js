import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: String,
  role: String,
  domain: String,
  requires: [String],
  bullets: [String]
});

export default mongoose.model("Project", projectSchema);
