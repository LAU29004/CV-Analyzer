import mongoose from "mongoose"

const jobCacheSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    unique: true
  },
  jobs: {
    type: Array,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto delete after 12 hours (optional but recommended)
jobCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 43200 });


export default mongoose.model("JobCache", jobCacheSchema);
