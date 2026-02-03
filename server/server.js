import express from "express";
import cors from "cors";
import "dotenv/config";
import publicRoutes from "./routes/publicRoutes.js";
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
connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.use("/api/public", publicRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
