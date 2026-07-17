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

  /* PROJECTS ================================================
     Hardened: the AI-extraction step (atsController.js) has been
     inconsistent about which key it puts tech stack under
     ("technologies" as array vs "tech"/"techStack" as string), and
     it's not guaranteed every project comes back with bullets. This
     block normalizes those variants instead of silently dropping
     content when a shape doesn't match exactly.
     ============================================================ */
  const projectList = Array.isArray(r.projects) ? r.projects : [];

  if (projectList.length > 0) {
    sectionTitle(doc, "Projects");

    projectList.forEach(p => {
      if (!p) return; // skip null/undefined entries defensively

      const title = p.title || p.name || "Untitled Project";
      doc.font("Helvetica-Bold").fontSize(11).text(title);

      // description is a string — render as italic overview paragraph
      if (hasText(p.description) && typeof p.description === "string") {
        doc.font("Helvetica-Oblique").fontSize(9)
          .fillColor("#555")
          .text(p.description, { lineGap: 2 });
        doc.fillColor("#000");
      }

      // Normalize tech stack: could be `technologies` (array),
      // `tech` or `techStack` (string or array).
      let techList = [];
      if (hasArray(p.technologies)) techList = p.technologies;
      else if (hasArray(p.tech)) techList = p.tech;
      else if (hasArray(p.techStack)) techList = p.techStack;
      else if (hasText(p.technologies)) techList = p.technologies.split(",").map(s => s.trim());
      else if (hasText(p.tech)) techList = p.tech.split(",").map(s => s.trim());
      else if (hasText(p.techStack)) techList = p.techStack.split(",").map(s => s.trim());

      if (techList.length > 0) {
        doc.font("Helvetica").fontSize(9).fillColor("#555")
          .text(`Technologies: ${techList.join(", ")}`);
        doc.fillColor("#000");
      }

      doc.moveDown(0.4);

      // bullets is the achievement list — accept `bullets` or
      // `points`/`highlights` as fallbacks, and fall back to
      // description-as-single-bullet if nothing else is present.
      const bullets = Array.isArray(p.bullets) ? p.bullets
        : Array.isArray(p.points) ? p.points
        : Array.isArray(p.highlights) ? p.highlights
        : [];

      if (bullets.length > 0) {
        renderBullets(doc, bullets);
      } else if (hasText(p.description)) {
        renderBullets(doc, [p.description]);
      }

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

  /* FOOTER DECLARATION — bottom of the last page only */
  const range = doc.bufferedPageRange(); // { start, count }
  const lastPageIndex = range.start + range.count - 1;
  doc.switchToPage(lastPageIndex);

  const footerY = doc.page.height - doc.page.margins.bottom - 20;
  doc.font("Helvetica-Oblique").fontSize(8).fillColor("#666")
    .text(
      "This resume has been professionally prepared by M CAD Solutions based on the information provided by the candidate.",
      doc.page.margins.left,
      footerY,
      { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: "center" }
    );
  doc.fillColor("#000");
};