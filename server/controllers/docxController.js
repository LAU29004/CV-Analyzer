import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  ThematicBreak 
} from "docx";

export const exportResumeDOCX = async (req, res) => {
  try {
    const { optimizedResume } = req.body;
    if (!optimizedResume) return res.status(400).json({ error: "Data required" });

    const doc = new Document({
      sections: [{
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } // 0.5-inch margins
        },
        children: buildStandardResume(optimizedResume),
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader("Content-Disposition", "attachment; filename=Standard_Resume.docx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate DOCX" });
  }
};

function buildStandardResume(resume) {
  const elements = [];

  /* ---------- 1. HEADER ---------- */
  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: resume.header.name.toUpperCase(), bold: true, size: 36 }), // 18pt
    ],
  }));

  elements.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ 
        text: `${resume.header.email} | ${resume.header.phone} | ${resume.header.location} | ${resume.header.github}`, 
        size: 20 
      }),
    ],
    spacing: { after: 200 },
  }));

  /* ---------- HELPER: SECTION TITLE ---------- */
  const addSection = (title) => {
    elements.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      thematicBreak: true, // Adds the horizontal line
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 24 })], // 12pt
    }));
  };

  /* ---------- 2. SUMMARY ---------- */
  addSection("Professional Summary");
  elements.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text: resume.summary, size: 20 })],
  }));

  /* ---------- 3. SKILLS ---------- */
  addSection("Technical Skills");
  resume.skills.technical.forEach(skillSet => {
    elements.push(new Paragraph({
      text: skillSet,
      bullet: { level: 0 },
      spacing: { before: 50 }
    }));
  });

  /* ---------- 4. EXPERIENCE ---------- */
  addSection("Work Experience");
  resume.experience.forEach(exp => {
    elements.push(new Paragraph({
      children: [
        new TextRun({ text: exp.role, bold: true, size: 22 }),
        new TextRun({ text: ` | ${exp.company}`, size: 22 }),
      ],
    }));
    elements.push(new Paragraph({
      children: [new TextRun({ text: `${exp.location} | ${exp.duration}`, italics: true, size: 18 })],
      spacing: { after: 100 }
    }));
    exp.bullets.forEach(b => {
      elements.push(new Paragraph({ text: b, bullet: { level: 0 } }));
    });
  });

  /* ---------- 5. PROJECTS ---------- */
  addSection("Projects");
  resume.projects.forEach(proj => {
    elements.push(new Paragraph({
      children: [new TextRun({ text: proj.title, bold: true, size: 22 })]
    }));
    elements.push(new Paragraph({
      children: [new TextRun({ text: `Technologies: ${proj.technologies}`, italics: true, size: 18 })]
    }));
    proj.bullets.forEach(b => {
      elements.push(new Paragraph({ text: b, bullet: { level: 0 } }));
    });
  });

  /* ---------- 6. EDUCATION ---------- */
  addSection("Education");
  resume.education.forEach(edu => {
    elements.push(new Paragraph({
      children: [new TextRun({ text: edu.institution, bold: true, size: 22 })]
    }));
    elements.push(new Paragraph({
      children: [new TextRun({ text: `${edu.degree} | GPA: ${edu.gpa}`, size: 20 })]
    }));
    elements.push(new Paragraph({
      children: [new TextRun({ text: edu.duration, italics: true, size: 18 })],
      spacing: { after: 150 }
    }));
  });

  /* ---------- 7. AWARDS ---------- */
  if (resume.certifications_awards?.length) {
    addSection("Certifications & Awards");
    resume.certifications_awards.forEach(award => {
      elements.push(new Paragraph({ text: award, bullet: { level: 0 } }));
    });
  }

  return elements;
}