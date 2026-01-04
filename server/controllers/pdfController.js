import PDFDocument from "pdfkit";

export const exportResumePDF = async (req, res) => {
  try {
    const { optimizedResume } = req.body;

    if (!optimizedResume) {
      return res.status(400).json({ error: "optimizedResume is required" });
    }

    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ATS_Resume.pdf"
    );

    doc.pipe(res);

    /* ---------- HEADER ---------- */
    doc
      .fontSize(20)
      .text(optimizedResume.header.name || "Your Name", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text(
        `${optimizedResume.header.email || ""} | ${
          optimizedResume.header.phone || ""
        } | ${optimizedResume.header.linkedin || ""}`,
        { align: "center" }
      );

    doc.moveDown(1.5);

    /* ---------- SUMMARY ---------- */
    sectionTitle(doc, "PROFESSIONAL SUMMARY");
    doc.fontSize(10).text(optimizedResume.summary || "").moveDown();

    /* ---------- SKILLS ---------- */
    sectionTitle(doc, "SKILLS");

    if (optimizedResume.skills?.technical?.length) {
      doc
        .fontSize(10)
        .text(
          "Technical: " + optimizedResume.skills.technical.join(", ")
        )
        .moveDown(0.5);
    }

    if (optimizedResume.skills?.soft?.length) {
      doc
        .fontSize(10)
        .text("Soft: " + optimizedResume.skills.soft.join(", "))
        .moveDown();
    }

    /* ---------- EXPERIENCE ---------- */
    sectionTitle(doc, "EXPERIENCE");

    optimizedResume.experience?.forEach((exp) => {
      doc
        .fontSize(11)
        .text(`${exp.role} — ${exp.company}`, { bold: true });
      doc.fontSize(9).text(exp.duration || "").moveDown(0.3);

      exp.bullets?.forEach((bullet) => {
        doc.fontSize(10).text(`• ${bullet}`, { indent: 15 });
      });

      doc.moveDown();
    });

    /* ---------- EDUCATION ---------- */
    if (optimizedResume.education?.length) {
      sectionTitle(doc, "EDUCATION");

      optimizedResume.education.forEach((edu) => {
        doc
          .fontSize(10)
          .text(edu)
          .moveDown(0.3);
      });
    }

    /* ---------- PROJECTS ---------- */
    if (optimizedResume.projects?.length) {
      sectionTitle(doc, "PROJECTS");

      optimizedResume.projects.forEach((proj) => {
        doc.fontSize(10).text(`• ${proj}`);
      });
    }

    doc.end();

  } catch (error) {
    console.error("PDF Export Error:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      details: error.message,
    });
  }
};

/* ---------- HELPER ---------- */
function sectionTitle(doc, title) {
  doc
    .fontSize(12)
    .text(title)
    .moveDown(0.3);

  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();

  doc.moveDown(0.8);
}
