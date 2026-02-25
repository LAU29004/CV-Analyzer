import PDFDocument from "pdfkit";
import { renderResumeByTemplate } from "../templates/index.js";

export const exportResumePDF = async (req, res) => {
  try {
    const { optimizedResume, template = "standard" } = req.body;

    if (!optimizedResume?.header?.name) {
      return res.status(400).json({ error: "Invalid resume data" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${template}_resume.pdf`
    );

    doc.pipe(res);

    // 🔥 KEY LINE — template-based rendering
    renderResumeByTemplate(doc, optimizedResume, template);

    doc.end();
  } catch (err) {
    console.error("PDF Generation Error:", err);
    res.status(500).json({ error: "Failed to generate resume PDF" });
  }
};
