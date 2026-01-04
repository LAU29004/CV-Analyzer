import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";

export const exportResumeDOCX = async (req, res) => {
  try {
    const { optimizedResume } = req.body;

    if (!optimizedResume) {
      return res.status(400).json({
        error: "optimizedResume is required",
      });
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: buildResume(optimizedResume),
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ATS_Resume.docx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.send(buffer);

  } catch (error) {
    console.error("DOCX Export Error:", error);
    res.status(500).json({
      error: "Failed to generate DOCX",
      details: error.message,
    });
  }
};

/* ---------- HELPERS ---------- */

function buildResume(resume) {
  const elements = [];

  /* ---------- HEADER ---------- */
  elements.push(
    new Paragraph({
      text: resume.header?.name || "Your Name",
      heading: HeadingLevel.HEADING_1,
      alignment: "center",
    })
  );

  elements.push(
    new Paragraph({
      text: `${resume.header?.email || ""} | ${
        resume.header?.phone || ""
      } | ${resume.header?.linkedin || ""}`,
      alignment: "center",
    })
  );

  elements.push(new Paragraph(""));

  /* ---------- SUMMARY ---------- */
  elements.push(sectionTitle("PROFESSIONAL SUMMARY"));
  elements.push(new Paragraph(resume.summary || ""));

  /* ---------- SKILLS ---------- */
  elements.push(sectionTitle("SKILLS"));

  if (resume.skills?.technical?.length) {
    elements.push(
      new Paragraph(
        "Technical: " + resume.skills.technical.join(", ")
      )
    );
  }

  if (resume.skills?.soft?.length) {
    elements.push(
      new Paragraph("Soft: " + resume.skills.soft.join(", "))
    );
  }

  /* ---------- EXPERIENCE ---------- */
  elements.push(sectionTitle("EXPERIENCE"));

  resume.experience?.forEach((exp) => {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${exp.role} — ${exp.company}`,
            bold: true,
          }),
        ],
      })
    );

    if (exp.duration) {
      elements.push(new Paragraph(exp.duration));
    }

    exp.bullets?.forEach((b) => {
      elements.push(
        new Paragraph({
          text: b,
          bullet: { level: 0 },
        })
      );
    });

    elements.push(new Paragraph(""));
  });

  /* ---------- EDUCATION ---------- */
  if (resume.education?.length) {
    elements.push(sectionTitle("EDUCATION"));
    resume.education.forEach((edu) =>
      elements.push(new Paragraph(edu))
    );
  }

  /* ---------- PROJECTS ---------- */
  if (resume.projects?.length) {
    elements.push(sectionTitle("PROJECTS"));
    resume.projects.forEach((p) =>
      elements.push(
        new Paragraph({
          text: p,
          bullet: { level: 0 },
        })
      )
    );
  }

  return elements;
}

function sectionTitle(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
      }),
    ],
    spacing: { before: 300, after: 150 },
  });
}
