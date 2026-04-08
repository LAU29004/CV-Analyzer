import { hasText, hasArray } from "./guards.js";

// ===== Visual constants =====
const COLORS = {
  primary: "#2563eb",
  text: "#111827",
  muted: "#4b5563",
};

const LEFT = 60;
const RIGHT = 535;
const TOP = 60;
const BOTTOM_PAD = 60;

const toText = (v) => {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
};

const toList = (v) => {
  if (Array.isArray(v)) return v.map(toText).filter(Boolean);
  const text = toText(v);
  if (!text) return [];
  return text
    .split(/\n|[;\u2022]/)
    .map(x => toText(x))
    .filter(Boolean);
};

export const renderMinimalTemplate = (doc, r) => {
  let y = TOP;
  const contentW = RIGHT - LEFT;

  const pageBottom = () => doc.page.height - BOTTOM_PAD;

  const ensureSpace = (neededHeight = 0) => {
    if (y + neededHeight <= pageBottom()) return;
    doc.addPage();
    y = TOP;
  };

  const write = (text, font, size, color, options = {}, gapAfter = 0) => {
    const t = toText(text);
    if (!t) return;
    doc.font(font).fontSize(size);
    const h = doc.heightOfString(t, { width: contentW, lineGap: 2, ...options });
    ensureSpace(h);
    doc.font(font).fontSize(size).fillColor(color).text(t, LEFT, y, {
      width: contentW,
      lineGap: 2,
      ...options,
    });
    y += h + gapAfter;
  };

  /* ───────── HEADER ───────── */
  write(r.header?.name, "Helvetica-Bold", 26, COLORS.primary, {}, 6);

  if (hasText(r.role)) {
    write(r.role, "Helvetica", 12, COLORS.muted, {}, 10);
  }

  doc.fillColor(COLORS.text);

  /* CONTACT (inline, right-aligned) */
  const contact = [r.header?.email, r.header?.phone, r.header?.location]
    .map(toText)
    .filter(Boolean)
    .join(" • ");

  if (hasText(contact)) {
    write(contact, "Helvetica", 10, COLORS.muted, { align: "right" }, 6);
  }

  /* SUMMARY */
  if (hasText(r.summary)) {
    write(r.summary, "Helvetica", 11, COLORS.text, { lineGap: 3 }, 14);
  }

  /* SECTION TITLE HELPER */
  const section = (title) => {
    write(title, "Helvetica-Bold", 14, COLORS.primary, {}, 4);
    ensureSpace(8);
    doc
      .lineWidth(0.7)
      .strokeColor(COLORS.primary)
      .moveTo(LEFT, y)
      .lineTo(RIGHT, y)
      .stroke();
    y += 10;
    doc.fillColor(COLORS.text);
  };

  /* ───────── EXPERIENCE ───────── */
  if (hasArray(r.experience)) {
    section("Professional Experience");

    r.experience.forEach((exp) => {
      const company = [toText(exp.company), toText(exp.location)].filter(Boolean).join(", ");
      const duration = toText(exp.duration) || toText(exp.dates) || toText(exp.period);
      const role = toText(exp.role);
      const bullets = toList(exp.bullets).length ? toList(exp.bullets) : toList(exp.description);

      if (!company && !duration && !role && !bullets.length) return;

      const dateWidth = 120;
      const companyWidth = duration ? contentW - dateWidth - 8 : contentW;
      doc.font("Helvetica-Bold").fontSize(11);
      const companyH = company ? doc.heightOfString(company, { width: companyWidth, lineGap: 2 }) : 0;
      doc.font("Helvetica").fontSize(10);
      const dateH = duration ? doc.heightOfString(duration, { width: dateWidth, align: "right", lineGap: 2 }) : 0;
      const headerH = Math.max(companyH, dateH, 12);
      ensureSpace(headerH + 2);

      if (company) {
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor(COLORS.primary)
          .text(company, LEFT, y, { width: companyWidth, lineGap: 2 });
      }

      if (duration) {
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(COLORS.muted)
          .text(duration, LEFT + contentW - dateWidth, y, {
            width: dateWidth,
            align: "right",
            lineGap: 2,
          });
      }

      y += headerH + 2;

      if (role) {
        write(role, "Helvetica", 11, COLORS.text, {}, 3);
      }

      bullets.forEach((b) => {
        const bt = `• ${b}`;
        doc.font("Helvetica").fontSize(10);
        const bH = doc.heightOfString(bt, { width: contentW - 14, lineGap: 2 });
        ensureSpace(bH);
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(COLORS.text)
          .text(bt, LEFT + 10, y, { width: contentW - 14, lineGap: 2 });
        y += bH + 2;
      });

      y += 10;
    });
  }

  /* ───────── EDUCATION ───────── */
  if (hasArray(r.education)) {
    section("Education");

    r.education.forEach((e) => {
      const degree = toText(e.degree) || toText(e.level);
      const meta = [toText(e.institution), toText(e.year)].filter(Boolean).join(", ");
      if (!degree && !meta) return;

      if (degree) write(degree, "Helvetica-Bold", 11, COLORS.text, {}, 2);
      if (meta) write(meta, "Helvetica", 10, COLORS.muted, {}, 10);
    });

    doc.fillColor(COLORS.text);
  }

  /* ───────── SKILLS (3 COLUMN GRID) ───────── */
  if (hasArray(r.skills?.technical)) {
    section("Areas of Expertise");

    const skills = toList(r.skills.technical);
    const colWidth = contentW / 3;
    let col = 0;
    let rowY = y;
    let rowH = 0;

    skills.forEach((skill, i) => {
      const x = LEFT + col * colWidth;
      const txt = `• ${skill}`;

      doc.font("Helvetica").fontSize(10);
      const h = doc.heightOfString(txt, { width: colWidth - 8, lineGap: 2 });

      if (col === 0) {
        ensureSpace(h + 2);
        rowH = h;
      } else {
        rowH = Math.max(rowH, h);
      }

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(COLORS.text)
        .text(txt, x, rowY, { width: colWidth - 8, lineGap: 2 });

      col = (col + 1) % 3;
      if (col === 0 || i === skills.length - 1) {
        rowY += rowH + 4;
      }
    });

    y = rowY + 8;
  }

  /* ───────── FOOTER (PAGE NUMBER) ───────── */
  const pageRange = doc.bufferedPageRange();
  const pageCount = pageRange.count;
  for (let i = 0; i < pageCount; i++) {
    const pageIndex = pageRange.start + i;
    doc.switchToPage(pageIndex);
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