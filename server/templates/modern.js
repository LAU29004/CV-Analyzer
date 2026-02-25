import { hasArray, hasEducation } from "./guards.js";

// ===== Layout constants (DO NOT REMOVE) =====
const SIDEBAR_WIDTH = 200;
const PAGE_PADDING  = 32;

const COLORS = {
  sidebar:    "#1e3d44",
  accent:     "#4eb3c0",
  white:      "#ffffff",
  text:       "#1a1a2e",
  muted:      "#5c6b73",
  lightMuted: "#8fa3ab",
};

const PAGE_H    = 841.89;
const PAGE_W    = 595.28;
const MAIN_X    = SIDEBAR_WIDTH + PAGE_PADDING;
const MAIN_W    = PAGE_W - MAIN_X - PAGE_PADDING;
const SB_L      = 14;
const SB_W      = SIDEBAR_WIDTH - SB_L - 10;
const MAX_PAGES = 2;
const FLOOR     = PAGE_H * MAX_PAGES - 24;
const PAGE2_TOP = PAGE_H + 40; // extra top padding when content starts on page 2

const SP = {
  sectionBefore : 8,
  sectionAfter  : 5,
  entryGap      : 7,
  bulletGap     : 2,
  lineGap       : 1.2,
  sbSectionGap  : 7,
  sbItemGap     : 2,
  sbEntryGap    : 5,
  sbRowH        : 11,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const drawSidebar = (doc, idx) => {
  doc.switchToPage(idx);
  doc.rect(0, 0, SIDEBAR_WIDTH, PAGE_H).fill(COLORS.sidebar);
};

const ensurePage2 = (doc) => {
  if (doc.bufferedPageRange().count < 2) {
    doc.addPage();
    drawSidebar(doc, 1);
  }
};

const at = (doc, absY, fn) => {
  if (absY > FLOOR) return;
  const pageIdx = Math.floor(absY / PAGE_H);
  if (pageIdx >= MAX_PAGES) return;
  const range = doc.bufferedPageRange();
  if (pageIdx > range.start + range.count - 1) return;
  doc.switchToPage(pageIdx);
  fn(absY - pageIdx * PAGE_H);
};

const checkPage = (doc, absY) => {
  if (absY >= PAGE_H) ensurePage2(doc);
};

// If absY just crossed into page 2, add top padding
const addPageTopPad = (absY) =>
  (absY >= PAGE_H && absY < PAGE_H + 4) ? PAGE2_TOP : absY;

const textH = (doc, text, width, extra) =>
  doc.heightOfString(text || "", Object.assign({ width, lineGap: SP.lineGap }, extra || {}));

const s = (v) => (v && typeof v === "string" && v.trim()) ? v.trim() : null;

// Get bullets from a project/exp object — handles both .bullets and .description
const getBullets = (obj) => {
  if (Array.isArray(obj.bullets) && obj.bullets.length) return obj.bullets;
  if (Array.isArray(obj.description) && obj.description.length) return obj.description;
  return [];
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const sbLabel = (doc, label, sy) => {
  sy += SP.sbSectionGap;
  checkPage(doc, sy);
  const cl = label;
  at(doc, sy, (y) => {
    doc.rect(SB_L, y + 2, 3, 8).fill(COLORS.accent);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.accent)
      .text(cl.toUpperCase(), SB_L + 8, y + 2,
        { width: SB_W - 8, lineBreak: false, characterSpacing: 0.8 });
  });
  return sy + 14;
};

const sbWrite = (doc, text, sy, font, size, color, opts) => {
  const t = s(text);
  if (!t || sy > FLOOR) return sy;
  checkPage(doc, sy);
  doc.font(font).fontSize(size);
  const h = textH(doc, t, SB_W, opts || {});
  const ct = t;
  at(doc, sy, (y) => {
    doc.font(font).fontSize(size).fillColor(color)
      .text(ct, SB_L, y, Object.assign({ width: SB_W, lineGap: SP.lineGap }, opts || {}));
  });
  return sy + h + SP.sbItemGap;
};

const renderSkills2Col = (doc, items, sy) => {
  const colW = Math.floor((SB_W - 8) / 2);
  const fits = (t) => { doc.font("Helvetica").fontSize(7.5); return doc.widthOfString(t) <= colW - 1; };
  const rows = [];
  let i = 0;
  while (i < items.length) {
    const a = s(items[i]);
    if (!a) { i++; continue; }
    if (!fits(a)) { rows.push({ a, b: null, wide: true }); i++; }
    else {
      const b = (i + 1 < items.length) ? s(items[i + 1]) : null;
      if (b && fits(b)) { rows.push({ a, b, wide: false }); i += 2; }
      else { rows.push({ a, b: null, wide: false }); i++; }
    }
  }
  rows.forEach((row) => {
    if (sy > FLOOR) return;
    checkPage(doc, sy);
    const { a, b, wide } = row;
    const csy = sy;
    at(doc, csy, (y) => {
      if (a) {
        doc.rect(SB_L, y + 3.5, 3, 3).fill(COLORS.accent);
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.white)
          .text(a, SB_L + 6, y, { width: wide ? SB_W - 8 : colW, lineBreak: false });
      }
      if (b) {
        doc.rect(SB_L + colW + 6, y + 3.5, 3, 3).fill(COLORS.accent);
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.white)
          .text(b, SB_L + colW + 12, y, { width: colW, lineBreak: false });
      }
    });
    sy += SP.sbRowH;
  });
  return sy + 3;
};

// ─── Main column ─────────────────────────────────────────────────────────────

const mainSection = (doc, label, my) => {
  my = addPageTopPad(my);
  my += SP.sectionBefore;
  checkPage(doc, my);
  const cl = label;
  at(doc, my, (y) => {
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.text)
      .text(cl.toUpperCase(), MAIN_X, y,
        { width: MAIN_W, lineBreak: false, characterSpacing: 1.2 });
  });
  const ruleY = my + 12;
  at(doc, ruleY, (y) => {
    doc.moveTo(MAIN_X, y).lineTo(PAGE_W - PAGE_PADDING, y)
      .lineWidth(0.5).strokeColor(COLORS.accent).stroke();
  });
  return ruleY + SP.sectionAfter;
};

const mainWrite = (doc, text, my, font, size, color, opts) => {
  const t = s(text);
  if (!t || my > FLOOR) return my;
  my = addPageTopPad(my);
  checkPage(doc, my);
  doc.font(font).fontSize(size);
  const h = textH(doc, t, MAIN_W, opts || {});
  const ct = t;
  at(doc, my, (y) => {
    doc.font(font).fontSize(size).fillColor(color)
      .text(ct, MAIN_X, y, Object.assign({ width: MAIN_W, lineGap: SP.lineGap }, opts || {}));
  });
  return my + h;
};

const mainBullet = (doc, text, my) => {
  const t = s(text);
  if (!t || my > FLOOR) return my;
  my = addPageTopPad(my);
  checkPage(doc, my);
  const txt = `• ${t}`;
  const w   = MAIN_W - 10;
  doc.font("Helvetica").fontSize(8);
  const h = textH(doc, txt, w);
  const ctxt = txt;
  at(doc, my, (y) => {
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.text)
      .text(ctxt, MAIN_X + 8, y, { width: w, lineGap: SP.lineGap });
  });
  return my + h + SP.bulletGap;
};

// ════════════════════════════════════════════════════════════════════════════════
export const renderModernTemplate = (doc, r) => {
  drawSidebar(doc, 0);
  const hdr = r.header || {};

  /* ══════ SIDEBAR ══════ */
  let sy = 40;

  const initials = (hdr.name || "")
    .split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
  const cx = SIDEBAR_WIDTH / 2, R = 28;
  doc.switchToPage(0);
  doc.circle(cx, sy + R, R).fill(COLORS.accent);
  doc.font("Helvetica-Bold").fontSize(17).fillColor(COLORS.white)
    .text(initials, cx - 13, sy + R - 10, { width: 26, align: "center", lineBreak: false });
  sy += R * 2 + 10;

  if (hasEducation(r.education)) {
    sy = sbLabel(doc, "Education", sy);
    r.education.forEach((e) => {
      if (sy > FLOOR) return;
      if (s(e.year))        sy = sbWrite(doc, e.year,        sy, "Helvetica",      7, COLORS.accent,    { lineBreak: false });
      if (s(e.institution)) sy = sbWrite(doc, e.institution, sy, "Helvetica-Bold", 8, COLORS.white);
      const meta = [s(e.degree) || s(e.level), s(e.board)].filter(Boolean).join(", ");
      if (meta)             sy = sbWrite(doc, meta,          sy, "Helvetica",      7, COLORS.lightMuted);
      const grade = [e.percentage && `${e.percentage}%`, e.gpa && `CGPA: ${e.gpa}`]
        .filter(Boolean).join(" | ");
      if (grade)            sy = sbWrite(doc, grade,         sy, "Helvetica",      7, COLORS.lightMuted, { lineBreak: false });
      sy += SP.sbEntryGap;
    });
  }

  if (hasArray(r.skills?.technical)) {
    sy = sbLabel(doc, "Technical Skills", sy);
    sy = renderSkills2Col(doc, r.skills.technical, sy);
  }

  if (hasArray(r.skills?.soft)) {
    sy = sbLabel(doc, "Soft Skills", sy);
    sy = renderSkills2Col(doc, r.skills.soft, sy);
  }

  if (hasArray(r.certifications_awards)) {
    sy = sbLabel(doc, "Certifications", sy);
    r.certifications_awards.forEach((cert) => {
      const t = s(cert);
      if (!t || sy > FLOOR) return;
      checkPage(doc, sy);
      const txt = `• ${t}`;
      doc.font("Helvetica").fontSize(7.5);
      const h = textH(doc, txt, SB_W - 4);
      const ctxt = txt;
      at(doc, sy, (y) => {
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.white)
          .text(ctxt, SB_L + 2, y, { width: SB_W - 4, lineGap: SP.lineGap });
      });
      sy += h + 3;
    });
  }

  /* ══════ MAIN COLUMN ══════ */
  let my = 40;

  // NAME
  doc.font("Helvetica-Bold").fontSize(22);
  const nameH = textH(doc, hdr.name || "", MAIN_W, { lineBreak: false });
  at(doc, my, (y) => {
    doc.font("Helvetica-Bold").fontSize(22).fillColor(COLORS.text)
      .text(hdr.name || "", MAIN_X, y, { width: MAIN_W, lineBreak: false });
  });
  my += nameH + 3;

  // ROLE — try r.role first, fallback to first exp role
  const role = s(r.role) ||
    s((r.experience || []).find(e => s(e.role))?.role);
  if (role) {
    doc.font("Helvetica-Bold").fontSize(10);
    const rH = textH(doc, role, MAIN_W, { lineBreak: false });
    const cr = role;
    at(doc, my, (y) => {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.accent)
        .text(cr.toUpperCase(), MAIN_X, y,
          { width: MAIN_W, lineBreak: false, characterSpacing: 0.7 });
    });
    my += rH + 4;
  }

  at(doc, my, (y) => {
    doc.moveTo(MAIN_X, y).lineTo(PAGE_W - PAGE_PADDING, y)
      .lineWidth(1.2).strokeColor(COLORS.accent).stroke();
  });
  my += 7;

  // CONTACT
  const contactFields = [hdr.phone, hdr.location, hdr.email, hdr.linkedin, hdr.github]
    .map(s).filter(Boolean);
  if (contactFields.length) {
    my = mainWrite(doc, contactFields.join("  ·  "), my, "Helvetica", 7.5, COLORS.muted);
    my += 7;
  }

  // SUMMARY
  if (s(r.summary)) {
    my = mainSection(doc, "Professional Summary", my);
    my = mainWrite(doc, r.summary, my, "Helvetica", 8.5, COLORS.muted);
    my += 2;
  }

  // EXPERIENCE
  const expEntries = (r.experience || []).filter(e =>
    s(e.role) || s(e.company) ||
    getBullets(e).some(b => s(b))
  );
  if (expEntries.length) {
    my = mainSection(doc, "Professional Experience", my);

    expEntries.forEach((exp, idx) => {
      if (my > FLOOR) return;
      my = addPageTopPad(my);
      checkPage(doc, my);

      const expRole = s(exp.role);
      const expDur  = s(exp.duration) || s(exp.dates) || s(exp.period);
      const DUR_W   = 92;

      if (expRole || expDur) {
        const cr = expRole, cd = expDur;
        at(doc, my, (y) => {
          if (cr) {
            doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.text)
              .text(cr, MAIN_X, y, { width: cd ? MAIN_W - DUR_W - 6 : MAIN_W, lineBreak: false });
          }
          if (cd) {
            doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.lightMuted)
              .text(cd, MAIN_X + (MAIN_W - DUR_W), y,
                { width: DUR_W, align: "right", lineBreak: false });
          }
        });
        my += 12;
      }

      const co = [s(exp.company), s(exp.location)].filter(Boolean).join("  ·  ");
      if (co) {
        doc.font("Helvetica-Oblique").fontSize(8.5);
        const coH = textH(doc, co, MAIN_W, { lineBreak: false });
        const cco = co;
        at(doc, my, (y) => {
          doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(COLORS.accent)
            .text(cco, MAIN_X, y, { width: MAIN_W, lineBreak: false });
        });
        my += coH + 3;
      }

      getBullets(exp).forEach(b => { my = mainBullet(doc, b, my); });

      if (idx < expEntries.length - 1) my += SP.entryGap;
    });
    my += 2;
  }

  // PROJECTS
  const projEntries = (r.projects || []).filter(p =>
    s(p.title) || getBullets(p).some(b => s(b))
  );
  if (projEntries.length) {
    my = mainSection(doc, "Projects", my);

    projEntries.forEach((p, idx) => {
      if (my > FLOOR) return;
      my = addPageTopPad(my);
      checkPage(doc, my);

      const title = s(p.title);
      if (title) {
        doc.font("Helvetica-Bold").fontSize(9.5);
        const tH = textH(doc, title, MAIN_W, { lineBreak: false });
        const ct = title;
        at(doc, my, (y) => {
          doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.text)
            .text(ct, MAIN_X, y, { width: MAIN_W, lineBreak: false });
        });
        my += tH + 2;
      }

      if (hasArray(p.technologies)) {
        const techTxt = `Technologies: ${p.technologies.join(", ")}`;
        doc.font("Helvetica").fontSize(7.5);
        const techH = textH(doc, techTxt, MAIN_W, { lineBreak: false });
        const ctxt = techTxt;
        at(doc, my, (y) => {
          doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.accent)
            .text(ctxt, MAIN_X, y, { width: MAIN_W, lineBreak: false });
        });
        my += techH + 3;
      }

      // Handles both .bullets and .description from AI
      getBullets(p).forEach(b => { my = mainBullet(doc, b, my); });

      if (idx < projEntries.length - 1) my += SP.entryGap;
    });
  }
};