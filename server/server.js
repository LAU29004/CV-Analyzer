import express from "express";
import cors from "cors";
import "dotenv/config";
import publicRoutes from "./routes/publicRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.use("/api/public", publicRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
