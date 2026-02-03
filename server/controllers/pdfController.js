import PDFDocument from "pdfkit";

export const exportStandardResume = async (req, res) => {
  try {
    const { optimizedResume } = req.body;

    if (!optimizedResume || !optimizedResume.header) {
      return res.status(400).json({ error: "Invalid resume data" });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 72,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline; filename=ATSFriendly_Resume.pdf",
    );

    doc.pipe(res);

    const { header } = optimizedResume;

    /* ================= HEADER ================= */

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .text((header.name || "").toUpperCase(), { align: "center" });

    const contactLine = [
      header.email,
      header.phone,
      header.location,
      header.linkedin,
      header.github,
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

    doc.moveDown(1.2);

    /* ================= HELPERS ================= */

    const sectionTitle = (title) => {
      doc.font("Helvetica-Bold").fontSize(12).text(title.toUpperCase());
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();
      doc.moveDown(0.6);
    };

    function renderBullets(doc, bullets = []) {
      if (!Array.isArray(bullets)) return;

      bullets.forEach((b) => {
        // Normalize bullet to string
        let text = "";

        if (typeof b === "string") {
          text = b;
        } else if (typeof b === "object" && b !== null) {
          // Handle AI objects safely
          text = b.text || b.content || JSON.stringify(b);
        } else {
          text = String(b);
        }

        if (!text.trim()) return;

        doc.text(`• ${text.trim()}`);
      });
    }

    /* ================= SUMMARY ================= */

    if (optimizedResume.summary) {
      sectionTitle("Professional Summary");
      doc.font("Helvetica").fontSize(10).text(optimizedResume.summary, {
        align: "justify",
        lineGap: 2,
      });
      doc.moveDown(1);
    }

    /* ================= SKILLS ================= */

    if (
      optimizedResume.skills?.technical?.length ||
      optimizedResume.skills?.soft?.length
    ) {
      sectionTitle("Skills");

      if (optimizedResume.skills?.technical?.length) {
        const techSkills = optimizedResume.skills.technical
          .map((skill) => {
            if (typeof skill === "string") return skill;
            if (typeof skill === "object" && skill.name) {
              return skill.level
                ? `${skill.name} (${skill.level})`
                : skill.name;
            }
            return "";
          })
          .filter(Boolean)
          .join(", ");

        if (techSkills) {
          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("Technical Skills: ", { continued: true });
          doc.font("Helvetica").text(techSkills);
          doc.moveDown(0.4);
        }
      }

      if (optimizedResume.skills?.soft?.length) {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .text("Soft Skills: ", { continued: true });
        doc.font("Helvetica").text(optimizedResume.skills.soft.join(", "));
        doc.moveDown(1);
      }
    }

    /* ================= EXPERIENCE ================= */

    if (optimizedResume.experience?.length) {
      sectionTitle("Work Experience");

      optimizedResume.experience.forEach((exp) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(exp.title || exp.role || "");

        doc
          .font("Helvetica-Oblique")
          .fontSize(9)
          .text(
            [exp.company, exp.location, exp.date || exp.duration]
              .filter(Boolean)
              .join(" | "),
          );

        doc.moveDown(0.3);

        renderBullets(exp.description || exp.bullets || []);
        doc.moveDown(0.8);
      });
    }

    /* ================= PROJECTS ================= */

    if (optimizedResume.projects?.length) {
      sectionTitle("Projects");

      optimizedResume.projects.forEach((proj, idx) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(proj.title || proj.name || "");
        if (proj.technologies) {
          const tech = Array.isArray(proj.technologies)
            ? proj.technologies.join(", ")
            : proj.technologies;

          doc.fontSize(10).text(`Technologies: ${tech}`);
        }

        doc.moveDown(0.3);
        renderBullets(proj.description || proj.bullets || []);

        if (idx < optimizedResume.projects.length - 1) {
          doc.moveDown(0.6);
        }
      });
    }

    /* ================= EDUCATION ================= */

    if (optimizedResume.education?.length) {
      sectionTitle("Education");

      optimizedResume.education.forEach((edu) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(edu.institution || "");
        const meta = [
          edu.degree,
          edu.board,
          edu.percentage
            ? `Percentage: ${edu.percentage}%`
            : edu.gpa
              ? `CGPA: ${edu.gpa}`
              : null,
          edu.year,
        ]
          .filter(Boolean)
          .join(" | ");

        if (meta) {
          doc.font("Helvetica").fontSize(10).text(meta);
        }

        doc.moveDown(0.6);
      });
    }

    /* ================= CERTIFICATIONS ================= */

    if (optimizedResume.certifications_awards?.length) {
      sectionTitle("Certifications");

      renderBullets(optimizedResume.certifications_awards);
    }

    doc.end();
  } catch (err) {
    console.error("Standard PDF Generation Error:", err);
    res.status(500).json({ error: "Failed to generate resume PDF" });
  }
};
