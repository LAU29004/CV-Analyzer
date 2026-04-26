import { hasArray, hasEducation } from "./guards.js";

// ===== Layout constants =====
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
const PAGE2_TOP = PAGE_H + 40;

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

// ─── Universal field helpers ─────────────────────────────────────────────────

const toText = (v) => {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
};

const toList = (v) => {
  if (Array.isArray(v)) return v.map(toText).filter(Boolean);
  const t = toText(v);
  if (!t) return [];
  return t.split(/\n|[;\u2022]/).map(x => toText(x)).filter(Boolean);
};

/** Get professional summary or objective — handles both field names. */
const getSummary = (r) =>
  toText(r.summary) || toText(r.objective) || toText(r.profile) || null;

/**
 * Build a structured skill breakdown for sidebar display.
 * Returns an array of { label, items[] }.
 * Handles both Om's named sub-keys and Rushikesh's flat highlights.
 */
const getSkillSections = (r) => {
  const sections = [];
  const push = (label, src) => {
    const items = toList(src);
    if (items.length) sections.push({ label, items });
  };

  if (r.skills && typeof r.skills === "object" && !Array.isArray(r.skills)) {
    push("Languages",               r.skills.languages);
    push("Libraries & Frameworks",  r.skills.frameworks || r.skills.libraries);
    push("Tools",                   r.skills.tools);
    push("Concepts",                r.skills.concepts);
    push("Technical Skills",        r.skills.technical);
    push("Soft Skills",             r.skills.soft);
  } else if (r.skills) {
    push("Skills", r.skills);
  }

  // Rushikesh "highlights" field (plain skill list)
  if (r.highlights && !sections.length) {
    push("Areas of Expertise", r.highlights);
  }

  if (!sections.length) {
    // Last resort: flatten everything we can find
    const flat = [
      ...(toList(r.technicalSkills)),
      ...(toList(r.softSkills)),
    ].filter(Boolean);
    if (flat.length) sections.push({ label: "Skills", items: flat });
  }

  return sections;
};

/** Get education entries from any common key. */
const getEducation = (r) => {
  if (hasArray(r.education))          return r.education;
  if (hasArray(r.education_details))  return r.education_details;
  if (hasArray(r.educationHistory))   return r.educationHistory;
  return [];
};

/** Get projects from any common key. */
const getProjects = (r) => {
  if (hasArray(r.projects)) return r.projects;
  if (hasArray(r.project))  return r.project;
  return [];
};

/** Get bullet points from an experience/project entry. */
const getBullets = (obj) => {
  const b = toList(obj.bullets);
  if (b.length) return b;
  const d = toList(obj.description);
  if (d.length) return d;
  return toList(obj.responsibilities);
};

/** Resolve degree / level string from an education entry. */
const resolveDegree = (e) =>
  toText(e.degree) || toText(e.qualification) || toText(e.level) || null;

/** Resolve institution from any common key. */
const resolveInstitution = (e) =>
  toText(e.institution) || toText(e.institute) || toText(e.school) ||
  toText(e.college) || toText(e.university) || null;

/** Build grade string from percentage / GPA / CGPA fields. */
const resolveGrade = (e) => {
  const parts = [];
  if (toText(e.percentage)) parts.push(`${e.percentage}%`);
  if (toText(e.gpa))        parts.push(`CGPA: ${e.gpa}`);
  if (toText(e.cgpa))       parts.push(`CGPA: ${e.cgpa}`);
  return parts.join(" | ") || null;
};

/** Get certifications + awards as a flat string list. */
const getCerts = (r) => {
  const entries = [
    ...(hasArray(r.certifications_awards) ? r.certifications_awards : []),
    ...(hasArray(r.certifications)        ? r.certifications        : []),
  ];
  return [...new Set(entries.map(toText).filter(Boolean))];
};

/**
 * Get awards entries as objects/strings.
 * Om's resume has them under r.awards as an array of objects with .name and .bullets.
 */
const getAwards = (r) => {
  if (hasArray(r.awards)) return r.awards;
  return [];
};

// ─── Page / drawing helpers ──────────────────────────────────────────────────

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

const addPageTopPad = (absY) =>
  (absY >= PAGE_H && absY < PAGE_H + 4) ? PAGE2_TOP : absY;

const textH = (doc, text, width, extra) =>
  doc.heightOfString(text || "", Object.assign({ width, lineGap: SP.lineGap }, extra || {}));

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

// ─── Sidebar drawing helpers ─────────────────────────────────────────────────

const sbLabel = (doc, label, sy) => {
  sy += SP.sbSectionGap;
  sy = ensureSidebarSpace(doc, sy, 16);
  checkPage(doc, sy);
  at(doc, sy, (y) => {
    doc.rect(SB_L, y + 2, 3, 8).fill(COLORS.accent);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.accent)
      .text(label.toUpperCase(), SB_L + 8, y + 2,
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
  at(doc, sy, (y) => {
    doc.font(font).fontSize(size).fillColor(color)
      .text(t, SB_L, y, Object.assign({ width: SB_W, lineGap: SP.lineGap }, opts || {}));
  });
  return sy + h + SP.sbItemGap;
};

/**
 * Render skills in a 2-column grid in the sidebar.
 * Works for both simple string arrays and comma-delimited strings.
 */
const renderSkills2Col = (doc, items, sy) => {
  const list = toList(items);
  const colW = Math.floor((SB_W - 8) / 2);
  const gap = 5;
  const rows = [];
  for (let i = 0; i < list.length; i += 2) rows.push({ a: list[i], b: list[i + 1] || null });

  rows.forEach((row) => {
    if (sy > FLOOR) return;
    doc.font("Helvetica").fontSize(7.5);
    const leftW  = row.b ? colW : (SB_W - 8);
    const leftH  = row.a ? textH(doc, row.a, leftW, { lineGap: SP.lineGap }) : 0;
    const rightH = row.b ? textH(doc, row.b, colW,  { lineGap: SP.lineGap }) : 0;
    const rowH   = Math.max(leftH, rightH, SP.sbRowH);
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

// ─── Main column drawing helpers ─────────────────────────────────────────────

const mainSection = (doc, label, my) => {
  my = ensureMainSpace(doc, my, 20);
  my = addPageTopPad(my);
  my += SP.sectionBefore;
  checkPage(doc, my);
  at(doc, my, (y) => {
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.text)
      .text(label.toUpperCase(), MAIN_X, y,
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
  at(doc, my, (y) => {
    doc.font(font).fontSize(size).fillColor(color)
      .text(t, MAIN_X, y, Object.assign({ width: MAIN_W, lineGap: SP.lineGap }, opts || {}));
  });
  return my + h;
};

const mainBullet = (doc, text, my, indentExtra = 0) => {
  const t = toText(text);
  if (!t || my > FLOOR) return my;
  const txt = `• ${t}`;
  const w   = MAIN_W - 10 - indentExtra;
  doc.font("Helvetica").fontSize(8);
  const h = textH(doc, txt, w);
  my = ensureMainSpace(doc, my, h + SP.bulletGap);
  my = addPageTopPad(my);
  checkPage(doc, my);
  at(doc, my, (y) => {
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.text)
      .text(txt, MAIN_X + 8 + indentExtra, y, { width: w, lineGap: SP.lineGap });
  });
  return my + h + SP.bulletGap;
};

// ════════════════════════════════════════════════════════════════════════════

export const renderModernTemplate = (doc, r) => {
  drawSidebar(doc, 0);

  const hdr = r.header || {};
  // Fallback: header fields may live at top-level too
  const getName     = () => toText(hdr.name)     || toText(r.name)     || "";
  const getEmail    = () => toText(hdr.email)    || toText(r.email)    || null;
  const getPhone    = () => toText(hdr.phone)    || toText(r.phone)    || null;
  const getLocation = () => toText(hdr.location) || toText(r.location) || null;
  const getLinkedin = () => toText(hdr.linkedin) || toText(r.linkedin) || null;
  const getGithub   = () => toText(hdr.github)   || toText(r.github)   || null;

  /* ══════════════════════════════════
     SIDEBAR
  ══════════════════════════════════ */
  let sy = 40;

  // Initials avatar
  const initials = getName().split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
  const cx = SIDEBAR_WIDTH / 2, R = 28;
  doc.switchToPage(0);
  doc.circle(cx, sy + R, R).fill(COLORS.accent);
  doc.font("Helvetica-Bold").fontSize(17).fillColor(COLORS.white)
    .text(initials, cx - 13, sy + R - 10, { width: 26, align: "center", lineBreak: false });
  sy += R * 2 + 12;

  // ── Sidebar: Education ──────────────────────────────────────────────────
  const educationEntries = getEducation(r);
  if (hasEducation(educationEntries)) {
    sy = sbLabel(doc, "Education", sy);
    educationEntries.forEach((e) => {
      if (sy > FLOOR) return;
      const institution = resolveInstitution(e);
      const year  = toText(e.year) || toText(e.period) || toText(e.duration);
      const board = toText(e.board);
      const deg   = resolveDegree(e);
      const grade = resolveGrade(e);

      if (year)        sy = sbWrite(doc, year,        sy, "Helvetica",      7, COLORS.accent);
      if (institution) sy = sbWrite(doc, institution, sy, "Helvetica-Bold", 8, COLORS.white);

      const meta = [deg, board].filter(Boolean).join(", ");
      if (meta) sy = sbWrite(doc, meta, sy, "Helvetica", 7, COLORS.lightMuted);

      // Per-year CGPAs (Om's style: e.g "1st year CGPA: 10")
      const extraGrades = toList(e.cgpaPerYear || e.grades || e.yearwiseGrades);
      extraGrades.forEach((g) => {
        sy = sbWrite(doc, g, sy, "Helvetica", 7, COLORS.lightMuted);
      });

      if (grade) sy = sbWrite(doc, grade, sy, "Helvetica", 7, COLORS.lightMuted);

      sy += SP.sbEntryGap;
    });
  }

  // ── Sidebar: Skills (one sub-section per category) ─────────────────────
  const skillSections = getSkillSections(r);
  skillSections.forEach(({ label, items }) => {
    if (!items.length) return;
    sy = sbLabel(doc, label, sy);
    sy = renderSkills2Col(doc, items, sy);
  });

  // ── Sidebar: Certifications ─────────────────────────────────────────────
  const certs = getCerts(r);
  if (certs.length) {
    sy = sbLabel(doc, "Certifications", sy);
    certs.forEach((cert) => {
      if (!cert || sy > FLOOR) return;
      doc.font("Helvetica").fontSize(7.5);
      const txt = `• ${cert}`;
      const h   = textH(doc, txt, SB_W - 4);
      sy = ensureSidebarSpace(doc, sy, h + 3);
      checkPage(doc, sy);
      at(doc, sy, (y) => {
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.white)
          .text(txt, SB_L + 2, y, { width: SB_W - 4, lineGap: SP.lineGap });
      });
      sy += h + 3;
    });
  }

  /* ══════════════════════════════════
     MAIN COLUMN
  ══════════════════════════════════ */
  let my = 40;

  // ── Name ────────────────────────────────────────────────────────────────
  const fullName = getName();
  doc.font("Helvetica-Bold").fontSize(22);
  const nameH = textH(doc, fullName, MAIN_W);
  at(doc, my, (y) => {
    doc.font("Helvetica-Bold").fontSize(22).fillColor(COLORS.text)
      .text(fullName, MAIN_X, y, { width: MAIN_W, lineGap: SP.lineGap });
  });
  my += nameH + 3;

  // ── Role / Job Title ────────────────────────────────────────────────────
  const role = toText(r.role) || toText(hdr.role) ||
    toText((r.experience || []).find(e => toText(e.role))?.role);
  if (role) {
    doc.font("Helvetica-Bold").fontSize(10);
    const rH = textH(doc, role, MAIN_W);
    my = ensureMainSpace(doc, my, rH + 6);
    at(doc, my, (y) => {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.accent)
        .text(role.toUpperCase(), MAIN_X, y,
          { width: MAIN_W, characterSpacing: 0.7, lineGap: SP.lineGap });
    });
    my += rH + 4;
  }

  // Accent rule
  at(doc, my, (y) => {
    doc.moveTo(MAIN_X, y).lineTo(PAGE_W - PAGE_PADDING, y)
      .lineWidth(1.2).strokeColor(COLORS.accent).stroke();
  });
  my += 7;

  // ── Contact line ────────────────────────────────────────────────────────
  const contactFields = [getPhone(), getLocation(), getEmail(), getLinkedin(), getGithub()]
    .filter(Boolean);
  if (contactFields.length) {
    my = mainWrite(doc, contactFields.join("  ·  "), my, "Helvetica", 7.5, COLORS.muted);
    my += 7;
  }

  // ── Summary / Objective ─────────────────────────────────────────────────
  const summary = getSummary(r);
  if (summary) {
    const label = toText(r.objective) ? "Objective" : "Professional Summary";
    my = mainSection(doc, label, my);
    my = mainWrite(doc, summary, my, "Helvetica", 8.5, COLORS.muted);
    my += 2;
  }

  // ── Experience ──────────────────────────────────────────────────────────
  const experience = (r.experience || []).filter(e =>
    toText(e.role) || toText(e.company) || getBullets(e).length
  );
  if (experience.length) {
    my = mainSection(doc, "Professional Experience", my);

    experience.forEach((exp, idx) => {
      if (my > FLOOR) return;
      my = addPageTopPad(my);
      checkPage(doc, my);

      const expRole = toText(exp.role) || toText(exp.title) || toText(exp.position);
      const expDur  = toText(exp.duration) || toText(exp.dates) || toText(exp.period);
      const DUR_W   = 92;

      // Role + duration row
      if (expRole || expDur) {
        const roleW = expDur ? MAIN_W - DUR_W - 6 : MAIN_W;
        doc.font("Helvetica-Bold").fontSize(9.5);
        const roleH = expRole ? textH(doc, expRole, roleW) : 0;
        doc.font("Helvetica").fontSize(7.5);
        const durH  = expDur  ? textH(doc, expDur,  DUR_W, { align: "right" }) : 0;
        const rowH  = Math.max(roleH, durH, 10);
        my = ensureMainSpace(doc, my, rowH + 2);
        at(doc, my, (y) => {
          if (expRole) {
            doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.text)
              .text(expRole, MAIN_X, y, { width: roleW, lineGap: SP.lineGap });
          }
          if (expDur) {
            doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.lightMuted)
              .text(expDur, MAIN_X + (MAIN_W - DUR_W), y,
                { width: DUR_W, align: "right", lineGap: SP.lineGap });
          }
        });
        my += rowH + 2;
      }

      // Company + location
      const companyLine = [toText(exp.company), toText(exp.location)].filter(Boolean).join("  ·  ");
      if (companyLine) {
        doc.font("Helvetica-Oblique").fontSize(8.5);
        const coH = textH(doc, companyLine, MAIN_W);
        my = ensureMainSpace(doc, my, coH + 3);
        at(doc, my, (y) => {
          doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(COLORS.accent)
            .text(companyLine, MAIN_X, y, { width: MAIN_W, lineGap: SP.lineGap });
        });
        my += coH + 3;
      }

      getBullets(exp).forEach(b => { my = mainBullet(doc, b, my); });

      if (idx < experience.length - 1) my += SP.entryGap;
    });
    my += 2;
  }

  // ── Projects ────────────────────────────────────────────────────────────
  const projects = getProjects(r);
  if (projects.length) {
    my = mainSection(doc, "Projects", my);

    projects.forEach((p, idx) => {
      if (my > FLOOR) return;
      my = addPageTopPad(my);
      checkPage(doc, my);

      const title = toText(p.title) || toText(p.name);

      if (title) {
        doc.font("Helvetica-Bold").fontSize(9.5);
        const tH = textH(doc, title, MAIN_W);
        my = ensureMainSpace(doc, my, tH + 2);
        at(doc, my, (y) => {
          doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.text)
            .text(title, MAIN_X, y, { width: MAIN_W, lineGap: SP.lineGap });
        });
        my += tH + 2;
      }

      // Technologies / tools — handles both Array and string (e.g. "Tools: X, Y, Z")
      const techSrc = p.technologies || p.tools || p.stack;
      const techArr = toList(techSrc);
      if (techArr.length) {
        const techTxt = `Technologies: ${techArr.join(", ")}`;
        doc.font("Helvetica").fontSize(7.5);
        const techH = textH(doc, techTxt, MAIN_W);
        my = ensureMainSpace(doc, my, techH + 3);
        at(doc, my, (y) => {
          doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.accent)
            .text(techTxt, MAIN_X, y, { width: MAIN_W, lineGap: SP.lineGap });
        });
        my += techH + 3;
      }

      getBullets(p).forEach(b => { my = mainBullet(doc, b, my); });

      if (idx < projects.length - 1) my += SP.entryGap;
    });
    my += 2;
  }

  // ── Awards / Achievements (Om's resume) ─────────────────────────────────
  const awards = getAwards(r);
  if (awards.length) {
    my = mainSection(doc, "Awards & Achievements", my);

    awards.forEach((award, idx) => {
      if (my > FLOOR) return;
      my = addPageTopPad(my);
      checkPage(doc, my);

      // Award may be a plain string or an object { name, bullets/details }
      const awardName = typeof award === "object"
        ? (toText(award.name) || toText(award.title) || toText(award.award) || "")
        : toText(award) || "";

      if (!awardName) return;

      const label = `${idx + 1}. ${awardName}`;
      doc.font("Helvetica-Bold").fontSize(9.5);
      const lH = textH(doc, label, MAIN_W);
      my = ensureMainSpace(doc, my, lH + 2);
      at(doc, my, (y) => {
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.text)
          .text(label, MAIN_X, y, { width: MAIN_W, lineGap: SP.lineGap });
      });
      my += lH + 2;

      // Sub-details (e.g. "Secured 1st Position")
      const sub = typeof award === "object"
        ? toList(award.bullets || award.details || award.description)
        : [];
      sub.forEach((s) => { my = mainBullet(doc, s, my, 4); });

      if (idx < awards.length - 1) my += SP.entryGap;
    });
    my += 2;
  }
};