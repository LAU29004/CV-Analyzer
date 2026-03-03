import express from "express";
import cors from "cors";
import "dotenv/config";
import publicRoutes from "./routes/publicRoutes.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import connectDB from "./config/db.js";
import { initializeFirebasePhoneAuth } from "./services/smsService.js";
import { seedCertificates } from "./services/certificateDataService.js";
import certificateRoutes from "./routes/certificate.routes.js";
import roadmapRoutes from "./routes/roadmap.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import jobSuggestionRoutes from "./routes/jobsuggestionRoute.js";

const app = express();

// Initialize Firebase Phone Authentication
initializeFirebasePhoneAuth();

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
connectDB();

// Seed certificates to database on startup
seedCertificates();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/jobSuggestions", jobSuggestionRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
