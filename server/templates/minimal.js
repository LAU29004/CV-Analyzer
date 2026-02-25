import { hasText, hasArray } from "./guards.js";
import { renderBullets } from "./helpers.js";

// ===== Visual constants =====
const COLORS = {
  primary: "#2563eb",
  text: "#111827",
  muted: "#4b5563",
};

const LEFT = 60;
const RIGHT = 535;

export const renderMinimalTemplate = (doc, r) => {
  let y = 60;

  /* ───────── HEADER ───────── */
  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor(COLORS.primary)
    .text(r.header.name, LEFT, y);

  y += 32;

  if (hasText(r.role)) {
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor(COLORS.muted)
      .text(r.role, LEFT, y);
    y += 24;
  }

  doc.fillColor(COLORS.text);

  /* CONTACT (inline, right-aligned) */
  const contact = [
    r.header.email,
    r.header.phone,
    r.header.location,
  ].filter(Boolean).join(" • ");

  if (hasText(contact)) {
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(contact, LEFT, 70, {
        width: RIGHT - LEFT,
        align: "right",
      });
  }

  y += 10;

  /* SUMMARY */
  if (hasText(r.summary)) {
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(COLORS.text)
      .text(r.summary, LEFT, y, {
        width: RIGHT - LEFT,
        lineGap: 3,
      });

    y = doc.y + 24;
  }

  /* SECTION TITLE HELPER */
  const section = (title) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(COLORS.primary)
      .text(title, LEFT, y);
    y += 20;
    doc.fillColor(COLORS.text);
  };

  /* ───────── EXPERIENCE ───────── */
  if (hasArray(r.experience)) {
    section("Professional Experience");

    r.experience.forEach(exp => {
      // Company + Date
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLORS.primary)
        .text(
          `${exp.company}${exp.location ? ", " + exp.location : ""}`,
          LEFT,
          y
        );

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text(exp.duration || "", LEFT, y, {
          width: RIGHT - LEFT,
          align: "right",
        });

      y += 14;

      // Role
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(COLORS.text)
        .text(exp.role, LEFT, y);

      y += 12;

      // Bullets
      renderBullets(doc, exp.bullets || []);
      y = doc.y + 20;
    });
  }

  /* ───────── EDUCATION ───────── */
  if (hasArray(r.education)) {
    section("Education");

    r.education.forEach(e => {
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(e.degree || e.level, LEFT, y);

      y += 14;

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text(
          `${e.institution}${e.year ? ", " + e.year : ""}`,
          LEFT,
          y
        );

      y += 20;
    });

    doc.fillColor(COLORS.text);
  }

  /* ───────── SKILLS (3 COLUMN GRID) ───────── */
  if (hasArray(r.skills?.technical)) {
    section("Areas of Expertise");

    const colWidth = (RIGHT - LEFT) / 3;
    let col = 0;
    let startY = y;

    r.skills.technical.forEach((skill, i) => {
      const x = LEFT + col * colWidth;
      const yy = startY + Math.floor(i / 3) * 14;

      doc
        .font("Helvetica")
        .fontSize(10)
        .text(`• ${skill}`, x, yy);

      col = (col + 1) % 3;
    });

    y = startY + Math.ceil(r.skills.technical.length / 3) * 16 + 20;
  }

  /* ───────── FOOTER (PAGE NUMBER) ───────── */
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(
        `Page ${i + 1} | ${pageCount}`,
        LEFT,
        doc.page.height - 40,
        { align: "right", width: RIGHT - LEFT }
      );
  }
};