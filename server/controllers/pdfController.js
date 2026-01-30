import PDFDocument from "pdfkit";

export const exportStandardResume = async (req, res) => {
  try {
    if (!req.body?.optimizedResume) {
      return res.status(400).json({
        error: "optimizedResume is required"
      });
    }

    const { optimizedResume } = req.body;
    const { header = {} } = optimizedResume;

    const doc = new PDFDocument({
      size: "A4",
      margin: 72
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ATSFriendly_Resume.pdf"
    );

    doc.pipe(res);

    /* ---------- HEADER ---------- */
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(header.name?.toUpperCase() || "", { align: "center" });

    const contactLine = [
      header.email,
      header.phone,
      header.location,
      header.linkedin,
      header.github
    ]
      .filter(Boolean)
      .join(" | ");

    if (contactLine) {
      doc
        .moveDown(0.4)
        .font("Helvetica")
        .fontSize(10)
        .text(contactLine, { align: "center" });
    }

    doc.moveDown(1.5);

    const section = (title) => {
      doc.font("Helvetica-Bold").fontSize(12).text(title.toUpperCase());
      doc.moveTo(72, doc.y).lineTo(523, doc.y).stroke();
      doc.moveDown(0.6);
    };

    /* ---------- SUMMARY ---------- */
    if (optimizedResume.summary) {
      section("Professional Summary");
      doc.fontSize(10).font("Helvetica")
        .text(optimizedResume.summary, { align: "justify" });
      doc.moveDown(1);
    }

    /* ---------- SKILLS ---------- */
    if (
      optimizedResume.skills?.technical?.length ||
      optimizedResume.skills?.soft?.length
    ) {
      section("Skills");

      if (optimizedResume.skills.technical?.length) {
        doc.font("Helvetica-Bold").text("Technical Skills: ", { continued: true });
        doc.font("Helvetica")
          .text(optimizedResume.skills.technical.join(", "));
      }

      if (optimizedResume.skills.soft?.length) {
        doc.moveDown(0.3);
        doc.font("Helvetica-Bold").text("Soft Skills: ", { continued: true });
        doc.font("Helvetica")
          .text(optimizedResume.skills.soft.join(", "));
      }

      doc.moveDown(1);
    }

    /* ---------- EXPERIENCE ---------- */
    if (optimizedResume.experience?.length) {
      section("Work Experience");

      optimizedResume.experience.forEach((exp) => {
        doc.font("Helvetica-Bold").fontSize(11)
          .text(`${exp.role} | ${exp.company}`);
        doc.font("Helvetica-Oblique").fontSize(9)
          .text(`${exp.location || ""} ${exp.duration || ""}`);

        exp.bullets?.forEach((b) => {
          doc.font("Helvetica").fontSize(10)
            .text(`• ${b}`, { indent: 15 });
        });

        doc.moveDown(0.8);
      });
    }

    /* ---------- PROJECTS ---------- */
    if (optimizedResume.projects?.length) {
      section("Projects");

      optimizedResume.projects.forEach((p) => {
        doc.font("Helvetica-Bold").fontSize(11).text(p.title);
        doc.font("Helvetica-Oblique").fontSize(9)
          .text(`Technologies: ${p.technologies}`);

        p.bullets?.forEach((b) => {
          doc.font("Helvetica").fontSize(10)
            .text(`• ${b}`, { indent: 15 });
        });

        doc.moveDown(0.6);
      });
    }

    /* ---------- EDUCATION ---------- */
    if (optimizedResume.education?.length) {
      section("Education");

      optimizedResume.education.forEach((edu) => {
        doc.font("Helvetica-Bold").fontSize(11)
          .text(edu.institution);

        const eduLine = [
          edu.degree || edu.level,
          edu.board,
          edu.score,
          edu.duration
        ].filter(Boolean).join(" | ");

        doc.font("Helvetica").fontSize(10).text(eduLine);
        doc.moveDown(0.6);
      });
    }

    /* ---------- CERTIFICATIONS ---------- */
    if (optimizedResume.certifications_awards?.length) {
      section("Certifications & Awards");

      optimizedResume.certifications_awards.forEach((c) => {
        doc.font("Helvetica").fontSize(10).text(`• ${c}`);
      });
    }

    doc.end();
  } catch (err) {
    console.error("PDF Error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};
