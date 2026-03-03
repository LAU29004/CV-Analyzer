import { sectionTitle, renderBullets } from "./helpers.js";
import {
  hasText, hasArray, hasSkills,
  hasExperience, hasProjects, hasEducation
} from "./guards.js";

export const renderStandardTemplate = (doc, r) => {
  /* HEADER */
  doc.font("Helvetica-Bold").fontSize(20)
    .text(r.header.name, { align: "center" });

  const contact = [
    r.header.email,
    r.header.phone,
    r.header.location,
    r.header.linkedin,
    r.header.github,
  ].filter(Boolean).join(" | ");

  if (hasText(contact)) {
    doc.font("Helvetica").fontSize(10)
      .fillColor("#444")
      .text(contact, { align: "center" });
  }

  doc.moveDown(1).fillColor("#000");

  /* SUMMARY */
  if (hasText(r.summary)) {
    sectionTitle(doc, "Professional Summary");
    doc.fontSize(10).text(r.summary, { lineGap: 2 });
    doc.moveDown();
  }

  /* SKILLS */
  if (hasSkills(r.skills)) {
    sectionTitle(doc, "Skills");

    if (hasArray(r.skills.technical)) {
      doc.font("Helvetica-Bold").text("Technical: ", { continued: true });
      doc.font("Helvetica").text(r.skills.technical.join(", "));
    }

    if (hasArray(r.skills.soft)) {
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").text("Soft: ", { continued: true });
      doc.font("Helvetica").text(r.skills.soft.join(", "));
    }

    doc.moveDown();
  }

  /* EXPERIENCE */
  if (hasExperience(r.experience)) {
    sectionTitle(doc, "Experience");

    r.experience.forEach(e => {
      doc.font("Helvetica-Bold").fontSize(11)
        .text(`${e.role} — ${e.company}`);

      doc.font("Helvetica-Oblique").fontSize(9)
        .fillColor("#555")
        .text([e.location, e.duration].filter(Boolean).join(" | "));

      doc.fillColor("#000").moveDown(0.4);

      // description is a string fallback; bullets is the array
      if (hasText(e.description) && !hasArray(e.bullets)) {
        doc.font("Helvetica").fontSize(10).text(e.description, { lineGap: 2 });
      } else {
        renderBullets(doc, Array.isArray(e.bullets) ? e.bullets : []);
      }

      doc.moveDown(0.8);
    });
  }

  /* PROJECTS */
  if (hasProjects(r.projects)) {
    sectionTitle(doc, "Projects");

    r.projects.forEach(p => {
      doc.font("Helvetica-Bold").fontSize(11).text(p.title);

      // description is a string — render as italic overview paragraph
      if (hasText(p.description) && typeof p.description === "string") {
        doc.font("Helvetica-Oblique").fontSize(9)
          .fillColor("#555")
          .text(p.description, { lineGap: 2 });
        doc.fillColor("#000");
      }

      if (hasArray(p.technologies)) {
        doc.font("Helvetica").fontSize(9).fillColor("#555")
          .text(`Technologies: ${p.technologies.join(", ")}`);
        doc.fillColor("#000");
      }

      doc.moveDown(0.4);

      // bullets is the achievement list — always an array
      renderBullets(doc, Array.isArray(p.bullets) ? p.bullets : []);

      doc.moveDown(0.6);
    });
  }

  /* EDUCATION */
  if (hasEducation(r.education)) {
    sectionTitle(doc, "Education");

    r.education.forEach(e => {
      doc.font("Helvetica-Bold").fontSize(11)
        .text(e.institution);

      const meta = [
        e.degree || e.level,
        e.board,
        e.percentage && `Percentage: ${e.percentage}%`,
        e.gpa && `CGPA: ${e.gpa}`,
        e.year,
      ].filter(Boolean).join(" | ");

      if (hasText(meta)) {
        doc.font("Helvetica").fontSize(10).text(meta);
      }

      doc.moveDown(0.6);
    });
  }

  /* CERTIFICATIONS */
  if (hasArray(r.certifications_awards)) {
    sectionTitle(doc, "Certifications");

    // Each cert may be a string or an object { name, provider, ... }
    const certLines = r.certifications_awards.map(c =>
      typeof c === "string" ? c : [c.name, c.provider].filter(Boolean).join(" — ")
    );
    renderBullets(doc, certLines);
  }
};