import express from "express";
import cors from "cors";
import "dotenv/config";

import publicRoutes from "./routes/publicRoutes.js";
import roadmapRoutes from "./routes/roadmap.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import connectDB from "./config/db.js";

const app = express();

/* ================== CORS CONFIG ================== */
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite
      "http://localhost:3000"  // CRA / Next
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);
/* ================================================ */

app.use(express.json());

/* ================== DATABASE ================== */
connectDB();

/* ================== ROUTES ================== */
app.use("/api/public", publicRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/interview", interviewRoutes);   // ✅ ADD THIS

/* ================== HEALTH CHECK ================== */
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

/* ================== ERROR HANDLER (Optional but Recommended) ================== */
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

/* ================== START SERVER ================== */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});