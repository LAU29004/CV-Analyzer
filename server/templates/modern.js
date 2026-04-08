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
  sbSectionGap  : 5,
  sbItemGap     : 1,
  sbEntryGap    : 3,
  sbRowH        : 9,
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

const toText = (v) => {
  if (typeof v === "string") return s(v);
  if (typeof v === "number") return String(v);
  return null;
};

const toList = (v) => {
  if (Array.isArray(v)) return v.map(toText).filter(Boolean);
  const asText = toText(v);
  if (!asText) return [];
  return asText
    .split(/\n|[;\u2022]/)
    .map(x => s(x))
    .filter(Boolean);
};

const ensureMainSpace = (doc, absY, neededHeight = 0) => {
  let y = addPageTopPad(absY);
  const pageIdx = Math.floor(y / PAGE_H);
  if (pageIdx >= MAX_PAGES) return y;
  const pageBottom = (pageIdx + 1) * PAGE_H - 24;
  if (y + neededHeight <= pageBottom) return y;
  const nextPage = pageIdx + 1;
  if (nextPage >= MAX_PAGES) return y;
  ensurePage2(doc);
  return nextPage * PAGE_H + 40;
};

const ensureSidebarSpace = (doc, absY, neededHeight = 0) => {
  const pageIdx = Math.floor(absY / PAGE_H);
  if (pageIdx >= MAX_PAGES) return absY;
  const pageBottom = (pageIdx + 1) * PAGE_H - 24;
  if (absY + neededHeight <= pageBottom) return absY;
  const nextPage = pageIdx + 1;
  if (nextPage >= MAX_PAGES) return absY;
  ensurePage2(doc);
  return nextPage * PAGE_H + 24;
};

// Get bullets from a project/exp object — handles both .bullets and .description
const getBullets = (obj) => {
  const bullets = toList(obj.bullets);
  if (bullets.length) return bullets;
  const desc = toList(obj.description);
  if (desc.length) return desc;
  return [];
};

const getEducationEntries = (r) => {
  if (hasArray(r.education)) return r.education;
  if (hasArray(r.education_details)) return r.education_details;
  if (hasArray(r.educationHistory)) return r.educationHistory;
  return [];
};

const getCertificationEntries = (r) => {
  if (hasArray(r.certifications_awards)) return r.certifications_awards;
  if (hasArray(r.certifications)) return r.certifications;
  if (hasArray(r.awards)) return r.awards;
  return [];
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const sbLabel = (doc, label, sy) => {
  sy += SP.sbSectionGap;
  sy = ensureSidebarSpace(doc, sy, 16);
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
  const t = toText(text);
  if (!t || sy > FLOOR) return sy;
  doc.font(font).fontSize(size);
  const h = textH(doc, t, SB_W, opts || {});
  sy = ensureSidebarSpace(doc, sy, h + SP.sbItemGap);
  checkPage(doc, sy);
  const ct = t;
  at(doc, sy, (y) => {
    doc.font(font).fontSize(size).fillColor(color)
      .text(ct, SB_L, y, Object.assign({ width: SB_W, lineGap: SP.lineGap }, opts || {}));
  });
  return sy + h + SP.sbItemGap;
};

const renderSkills2Col = (doc, items, sy) => {
  const list = toList(items);
  const colW = Math.floor((SB_W - 8) / 2);
  const gap = 5;
  const rows = [];

  for (let i = 0; i < list.length; i += 2) {
    rows.push({ a: list[i], b: list[i + 1] || null });
  }

  rows.forEach((row) => {
    if (sy > FLOOR) return;

    doc.font("Helvetica").fontSize(7.5);

    const leftW = row.b ? colW : (SB_W - 8);
    const leftH = row.a
      ? textH(doc, row.a, leftW, { lineGap: SP.lineGap })
      : 0;
    const rightH = row.b
      ? textH(doc, row.b, colW, { lineGap: SP.lineGap })
      : 0;
    const rowH = Math.max(leftH, rightH, SP.sbRowH);

    sy = ensureSidebarSpace(doc, sy, rowH + 1);
    checkPage(doc, sy);

    const csy = sy;
    at(doc, csy, (y) => {
      if (row.a) {
        doc.rect(SB_L, y + 3.5, 3, 3).fill(COLORS.accent);
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.white)
          .text(row.a, SB_L + gap, y, { width: leftW, lineGap: SP.lineGap });
      }

      if (row.b) {
        const rightX = SB_L + colW + gap;
        doc.rect(rightX, y + 3.5, 3, 3).fill(COLORS.accent);
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.white)
          .text(row.b, rightX + gap, y, { width: colW, lineGap: SP.lineGap });
      }
    });

    sy += rowH + 1;
  });
  return sy + 1;
};

// ─── Main column ─────────────────────────────────────────────────────────────

const mainSection = (doc, label, my) => {
  my = ensureMainSpace(doc, my, 20);
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
  const t = toText(text);
  if (!t || my > FLOOR) return my;
  doc.font(font).fontSize(size);
  const h = textH(doc, t, MAIN_W, opts || {});
  my = ensureMainSpace(doc, my, h + 2);
  my = addPageTopPad(my);
  checkPage(doc, my);
  const ct = t;
  at(doc, my, (y) => {
    doc.font(font).fontSize(size).fillColor(color)
      .text(ct, MAIN_X, y, Object.assign({ width: MAIN_W, lineGap: SP.lineGap }, opts || {}));
  });
  return my + h;
};

const mainBullet = (doc, text, my) => {
  const t = toText(text);
  if (!t || my > FLOOR) return my;
  const txt = `• ${t}`;
  const w   = MAIN_W - 10;
  doc.font("Helvetica").fontSize(8);
  const h = textH(doc, txt, w);
  my = ensureMainSpace(doc, my, h + SP.bulletGap);
  my = addPageTopPad(my);
  checkPage(doc, my);
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

  const initials = (toText(hdr.name) || "")
    .split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
  const cx = SIDEBAR_WIDTH / 2, R = 28;
  doc.switchToPage(0);
  doc.circle(cx, sy + R, R).fill(COLORS.accent);
  doc.font("Helvetica-Bold").fontSize(17).fillColor(COLORS.white)
    .text(initials, cx - 13, sy + R - 10, { width: 26, align: "center", lineBreak: false });
  sy += R * 2 + 10;

  const educationEntries = getEducationEntries(r);
  if (hasEducation(educationEntries)) {
    sy = sbLabel(doc, "Education", sy);
    educationEntries.forEach((e) => {
      if (sy > FLOOR) return;
      const institution = toText(e.institution) || toText(e.institute) || toText(e.school) || toText(e.college) || toText(e.university);
      const year = toText(e.year) || toText(e.period) || toText(e.duration);
      if (year)        sy = sbWrite(doc, year,        sy, "Helvetica",      7, COLORS.accent);
      if (institution) sy = sbWrite(doc, institution, sy, "Helvetica-Bold", 8, COLORS.white);
      const meta = [toText(e.degree) || toText(e.level), toText(e.board)].filter(Boolean).join(", ");
      if (meta)             sy = sbWrite(doc, meta,          sy, "Helvetica",      7, COLORS.lightMuted);
      const grade = [e.percentage && `${e.percentage}%`, e.gpa && `CGPA: ${e.gpa}`]
        .filter(Boolean).join(" | ");
      if (grade)            sy = sbWrite(doc, grade,         sy, "Helvetica",      7, COLORS.lightMuted);
      sy += SP.sbEntryGap;
    });
  }

  if (hasArray(r.skills?.technical)) {
    sy = sbLabel(doc, "Technical Skills", sy);
    sy = renderSkills2Col(doc, toList(r.skills.technical), sy);
  }

  if (hasArray(r.skills?.soft)) {
    sy = sbLabel(doc, "Soft Skills", sy);
    sy = renderSkills2Col(doc, toList(r.skills.soft), sy);
  }

  const certificationEntries = getCertificationEntries(r);
  if (hasArray(certificationEntries)) {
    sy = sbLabel(doc, "Certifications", sy);
    toList(certificationEntries).forEach((cert) => {
      const t = toText(cert);
      if (!t || sy > FLOOR) return;
      doc.font("Helvetica").fontSize(7.5);
      const txt = `• ${t}`;
      const h = textH(doc, txt, SB_W - 4);
      sy = ensureSidebarSpace(doc, sy, h + 3);
      checkPage(doc, sy);
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
  const safeName = toText(hdr.name) || "";
  const nameH = textH(doc, safeName, MAIN_W);
  at(doc, my, (y) => {
    doc.font("Helvetica-Bold").fontSize(22).fillColor(COLORS.text)
      .text(safeName, MAIN_X, y, { width: MAIN_W, lineGap: SP.lineGap });
  });
  my += nameH + 3;

  // ROLE — try r.role first, fallback to first exp role
  const role = toText(r.role) ||
    toText((r.experience || []).find(e => toText(e.role))?.role);
  if (role) {
    doc.font("Helvetica-Bold").fontSize(10);
    const rH = textH(doc, role, MAIN_W);
    my = ensureMainSpace(doc, my, rH + 6);
    const cr = role;
    at(doc, my, (y) => {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.accent)
        .text(cr.toUpperCase(), MAIN_X, y,
          { width: MAIN_W, characterSpacing: 0.7, lineGap: SP.lineGap });
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
    .map(toText).filter(Boolean);
  if (contactFields.length) {
    my = mainWrite(doc, contactFields.join("  ·  "), my, "Helvetica", 7.5, COLORS.muted);
    my += 7;
  }

  // SUMMARY
  if (toText(r.summary)) {
    my = mainSection(doc, "Professional Summary", my);
    my = mainWrite(doc, r.summary, my, "Helvetica", 8.5, COLORS.muted);
    my += 2;
  }

  // EXPERIENCE
  const expEntries = (r.experience || []).filter(e =>
    toText(e.role) || toText(e.company) ||
    getBullets(e).some(b => toText(b))
  );
  if (expEntries.length) {
    my = mainSection(doc, "Professional Experience", my);

    expEntries.forEach((exp, idx) => {
      if (my > FLOOR) return;
      my = addPageTopPad(my);
      checkPage(doc, my);

      const expRole = toText(exp.role);
      const expDur  = toText(exp.duration) || toText(exp.dates) || toText(exp.period);
      const DUR_W   = 92;

      if (expRole || expDur) {
        const roleW = expDur ? MAIN_W - DUR_W - 6 : MAIN_W;
        doc.font("Helvetica-Bold").fontSize(9.5);
        const roleH = expRole ? textH(doc, expRole, roleW) : 0;
        doc.font("Helvetica").fontSize(7.5);
        const durH = expDur ? textH(doc, expDur, DUR_W, { align: "right" }) : 0;
        const rowH = Math.max(roleH, durH, 10);
        my = ensureMainSpace(doc, my, rowH + 2);
        const cr = expRole, cd = expDur;
        at(doc, my, (y) => {
          if (cr) {
            doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.text)
              .text(cr, MAIN_X, y, { width: roleW, lineGap: SP.lineGap });
          }
          if (cd) {
            doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.lightMuted)
              .text(cd, MAIN_X + (MAIN_W - DUR_W), y,
                { width: DUR_W, align: "right", lineGap: SP.lineGap });
          }
        });
        my += rowH + 2;
      }

      const co = [toText(exp.company), toText(exp.location)].filter(Boolean).join("  ·  ");
      if (co) {
        doc.font("Helvetica-Oblique").fontSize(8.5);
        const coH = textH(doc, co, MAIN_W);
        my = ensureMainSpace(doc, my, coH + 3);
        const cco = co;
        at(doc, my, (y) => {
          doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(COLORS.accent)
            .text(cco, MAIN_X, y, { width: MAIN_W, lineGap: SP.lineGap });
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
    toText(p.title) || getBullets(p).some(b => toText(b))
  );
  if (projEntries.length) {
    my = mainSection(doc, "Projects", my);

    projEntries.forEach((p, idx) => {
      if (my > FLOOR) return;
      my = addPageTopPad(my);
      checkPage(doc, my);

      const title = toText(p.title);
      if (title) {
        doc.font("Helvetica-Bold").fontSize(9.5);
        const tH = textH(doc, title, MAIN_W);
        my = ensureMainSpace(doc, my, tH + 2);
        const ct = title;
        at(doc, my, (y) => {
          doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.text)
            .text(ct, MAIN_X, y, { width: MAIN_W, lineGap: SP.lineGap });
        });
        my += tH + 2;
      }

      if (hasArray(p.technologies)) {
        const techTxt = `Technologies: ${toList(p.technologies).join(", ")}`;
        doc.font("Helvetica").fontSize(7.5);
        const techH = textH(doc, techTxt, MAIN_W);
        my = ensureMainSpace(doc, my, techH + 3);
        const ctxt = techTxt;
        at(doc, my, (y) => {
          doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.accent)
            .text(ctxt, MAIN_X, y, { width: MAIN_W, lineGap: SP.lineGap });
        });
        my += techH + 3;
      }

      // Handles both .bullets and .description from AI
      getBullets(p).forEach(b => { my = mainBullet(doc, b, my); });

      if (idx < projEntries.length - 1) my += SP.entryGap;
    });
  }
};