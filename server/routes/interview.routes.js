import express from "express";
import { generateInterview } from "../controllers/interview.controller.js";

const router = express.Router();

router.post("/generate", generateInterview);

export default router;