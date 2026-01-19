import PDFDocument from "pdfkit";

export const exportStandardResume = async (req, res) => {
  try {
    const { optimizedResume } = req.body;
    const doc = new PDFDocument({ 
      size: "A4", 
      margin: 72, // Standard 1-inch margin for ATS
      bufferPages: true 
    });

    const { header } = optimizedResume;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=ATSFriendly_Resume.pdf");
    doc.pipe(res);

    /* ---------- 1. HEADER ---------- */
    
    doc.fontSize(20).font("Helvetica-Bold").text(header.name.toUpperCase(), { align: "center" });
    doc.fontSize(10).font("Helvetica").text(
      `${header.email} | ${header.phone} | ${header.location}\n${header.linkedin}`,
      { align: "center" }
    );
    doc.moveDown(1.5);

    /* ---------- HELPER: SECTION TITLE ---------- */
    const addSectionTitle = (title) => {
      doc.fontSize(12).font("Helvetica-Bold").text(title.toUpperCase());
      doc.moveTo(72, doc.y).lineTo(523, doc.y).stroke();
      doc.moveDown(0.5);
    };

    /* ---------- 2. SUMMARY ---------- */
    addSectionTitle("Professional Summary");
    doc.fontSize(10).font("Helvetica").text(optimizedResume.summary, { align: "justify", lineGap: 2 });
    doc.moveDown(1.2);

    /* ---------- 3. SKILLS ---------- */
    addSectionTitle("Technical Skills");
    optimizedResume.skills.technical.forEach(skillSet => {
      doc.fontSize(10).font("Helvetica").text(`• ${skillSet}`, { lineGap: 1 });
    });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica-Bold").text("Soft Skills: ", { continued: true })
       .font("Helvetica").text(optimizedResume.skills.soft.join(", "));
    doc.moveDown(1.2);

    /* ---------- 4. EXPERIENCE ---------- */
    addSectionTitle("Work Experience");
    optimizedResume.experience.forEach(exp => {
      doc.fontSize(11).font("Helvetica-Bold").text(exp.role, { continued: true })
         .font("Helvetica").text(` | ${exp.company}`, { align: "left" });
      doc.fontSize(9).font("Helvetica-Oblique").text(`${exp.location} | ${exp.duration}`).moveDown(0.3);
      
      exp.bullets.forEach(bullet => {
        doc.fontSize(10).font("Helvetica").text(`• ${bullet}`, { indent: 15, lineGap: 1 });
      });
      doc.moveDown(0.8);
    });

    /* ---------- 5. PROJECTS ---------- */
    addSectionTitle("Projects");
    optimizedResume.projects.forEach((proj, index) => {
    // 1. Render Title and Tech on the same line or tightly packed
    doc.fontSize(11).font("Helvetica-Bold").text(proj.title, { lineGap: 0 });
    doc.fontSize(9).font("Helvetica-Oblique").text(`Technologies: ${proj.technologies}`, { lineGap: 0 });
    
    // Minimal gap before bullets
    doc.moveDown(0.2);

    // 2. Only render bullets if they actually contain text
    proj.bullets.forEach(bullet => {
      if (bullet && bullet.trim().length > 0) {
        doc.fontSize(10).font("Helvetica").text(`• ${bullet}`, { 
          indent: 15, 
          lineGap: 0,      // Remove compounded line gaps
          paragraphGap: 2  // Use paragraphGap for small space between bullets only
        });
      }
    });

    // 3. Conditional moveDown: Don't add extra space after the last project
    if (index < optimizedResume.projects.length - 1) {
      doc.moveDown(0.6); // Controlled space between projects
    }
  });

    /* ---------- 6. EDUCATION ---------- */
    addSectionTitle("Education");
    optimizedResume.education.forEach(edu => {
      doc.fontSize(11).font("Helvetica-Bold").text(edu.institution);
      doc.fontSize(10).font("Helvetica").text(`${edu.degree} | GPA: ${edu.gpa}`);
      doc.fontSize(9).font("Helvetica-Oblique").text(edu.duration).moveDown(0.5);
    });
    doc.moveDown(0.8);

    /* ---------- 7. CERTIFICATIONS & AWARDS ---------- */
    if (optimizedResume.certifications_awards?.length) {
      addSectionTitle("Certifications & Awards");
      optimizedResume.certifications_awards.forEach(award => {
        doc.fontSize(10).font("Helvetica").text(`• ${award}`, { lineGap: 2 });
      });
    }

    doc.end();
  } catch (error) {
    console.error("Standard PDF Generation Error:", error);
    res.status(500).json({ error: "Failed to generate standard resume" });
  }
};