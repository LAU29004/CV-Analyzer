import express from "express";
import {
  getRecommendedCertificatesForRole,
  getCertificatesByDomain,
  getAllCertificates,
} from "../services/certificateDataService.js";

const router = express.Router();

/**
 * GET /api/certificates
 * Get all certificates
 */
router.get("/", async (req, res) => {
  try {
    const certs = await getAllCertificates();
    return res.json({
      success: true,
      data: { certificates: certs },
    });
  } catch (err) {
    console.error("[certificateRoutes] Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch certificates",
    });
  }
});

/**
 * GET /api/certificates/domain/:domain
 * Get certificates by domain
 * Query: ?level=Beginner|Intermediate|Advanced
 */
router.get("/domain/:domain", async (req, res) => {
  try {
    const { domain } = req.params;
    const { level } = req.query;

    const certs = await getCertificatesByDomain(domain, level || null);

    return res.json({
      success: true,
      data: { domain, certificates: certs },
    });
  } catch (err) {
    console.error("[certificateRoutes] Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch certificates",
    });
  }
});

/**
 * GET /api/certificates/recommend
 * Get recommended certificates for a specific role and experience level
 * Query: ?role=Frontend+Developer&experienceLevel=fresher
 */
router.get("/recommend", async (req, res) => {
  try {
    const { role = "Frontend Developer", experienceLevel = "fresher" } = req.query;

    const certs = await getRecommendedCertificatesForRole(role, experienceLevel);

    return res.json({
      success: true,
      data: {
        role,
        experienceLevel,
        certificates: certs,
      },
    });
  } catch (err) {
    console.error("[certificateRoutes] Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommended certificates",
    });
  }
});

export default router;
