import { hasText, hasArray } from "./guards.js";

// ===== Visual constants =====
const COLORS = {
  primary: "#2563eb",
  text:    "#111827",
  muted:   "#4b5563",
  accent:  "#1d4ed8",
  light:   "#6b7280",
};

const LEFT       = 60;
const RIGHT      = 535;
const TOP        = 60;
const BOTTOM_PAD = 60;

// ─── Universal field extractors ──────────────────────────────────────────────

/** Safely convert any value to a trimmed string, or null. */
const toText = (v) => {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
};

/**
 * Convert value to an array of non-empty strings.
 * Handles: Array, newline-delimited string, semicolon / bullet-delimited string.
 */
const toList = (v) => {
  if (Array.isArray(v)) return v.map(toText).filter(Boolean);
  const text = toText(v);
  if (!text) return [];
  return text
    .split(/\n|[;\u2022]/)
    .map((x) => toText(x))
    .filter(Boolean);
};

/**
 * Retrieve the professional summary / objective from any common field name.
 * Rushikesh uses  → r.summary
 * Om uses         → r.objective
 */
const getSummary = (r) =>
  toText(r.summary) || toText(r.objective) || toText(r.profile) || null;

/**
 * Retrieve all skills as a flat list, regardless of how they are structured.
 * Handles:
 *   r.skills.technical   (array or comma string)
 *   r.skills             (plain array or string)
 *   r.highlights         (Rushikesh: plain string/array)
 *   r.technicalSkills    (alternative key)
 */
const getAllSkills = (r) => {
  const sets = [];

  // Standard nested object
  if (r.skills && typeof r.skills === "object" && !Array.isArray(r.skills)) {
    if (r.skills.technical) sets.push(...toList(r.skills.technical));
    if (r.skills.soft)      sets.push(...toList(r.skills.soft));
    if (r.skills.languages) sets.push(...toList(r.skills.languages));
    if (r.skills.tools)     sets.push(...toList(r.skills.tools));
    if (r.skills.concepts)  sets.push(...toList(r.skills.concepts));
    if (r.skills.frameworks || r.skills.libraries) {
      sets.push(...toList(r.skills.frameworks || r.skills.libraries));
    }
  } else if (r.skills) {
    sets.push(...toList(r.skills));
  }

  // Rushikesh "HIGHLIGHTS" field
  if (r.highlights) sets.push(...toList(r.highlights));

  // Direct keys
  if (r.technicalSkills)  sets.push(...toList(r.technicalSkills));
  if (r.softSkills)       sets.push(...toList(r.softSkills));

  // Deduplicate
  return [...new Set(sets.filter(Boolean))];
};

/**
 * Get a structured skills breakdown for labelled sections.
 * Returns an array of { label, items[] }.
 */
const getSkillSections = (r) => {
  const sections = [];

  const push = (label, src) => {
    const items = toList(src);
    if (items.length) sections.push({ label, items });
  };

  if (r.skills && typeof r.skills === "object" && !Array.isArray(r.skills)) {
    push("Languages",             r.skills.languages);
    push("Libraries & Frameworks", r.skills.frameworks || r.skills.libraries);
    push("Tools",                 r.skills.tools);
    push("Concepts",              r.skills.concepts);
    push("Technical Skills",      r.skills.technical);
    push("Soft Skills",           r.skills.soft);
  }

  if (!sections.length) {
    // Flat fallback — group everything under one heading
    const all = getAllSkills(r);
    if (all.length) sections.push({ label: "Areas of Expertise", items: all });
  }

  return sections;
};

/**
 * Get education entries, resolving multiple possible keys.
 */
const getEducation = (r) => {
  if (hasArray(r.education))          return r.education;
  if (hasArray(r.education_details))  return r.education_details;
  if (hasArray(r.educationHistory))   return r.educationHistory;
  return [];
};

/**
 * Get bullet points from an experience / project entry.
 * Tries .bullets, .description, .responsibilities.
 */
const getBullets = (entry) => {
  const b = toList(entry.bullets);
  if (b.length) return b;
  const d = toList(entry.description);
  if (d.length) return d;
  return toList(entry.responsibilities);
};

/**
 * Get all projects, handling different key names.
 */
const getProjects = (r) => {
  if (hasArray(r.projects)) return r.projects;
  if (hasArray(r.project))  return r.project;
  return [];
};

/**
 * Get certifications / awards.
 */
const getCerts = (r) => {
  const entries = [
    ...(hasArray(r.certifications_awards) ? r.certifications_awards : []),
    ...(hasArray(r.certifications)        ? r.certifications        : []),
    ...(hasArray(r.awards)               ? r.awards               : []),
  ];
  return [...new Set(entries.map(toText).filter(Boolean))];
};

/**
 * Resolve a human-readable degree / level from education entry.
 * Handles level codes like "10th", "12th", "Diploma", or real degree names.
 */
const resolveDegree = (e) =>
  toText(e.degree) || toText(e.qualification) || toText(e.level) || null;

/**
 * Resolve institution name from multiple possible keys.
 */
const resolveInstitution = (e) =>
  toText(e.institution) || toText(e.institute) || toText(e.school) ||
  toText(e.college) || toText(e.university) || null;

/**
 * Build a grade string from percentage / GPA / CGPA.
 */
const resolveGrade = (e) => {
  const parts = [];
  if (toText(e.percentage)) parts.push(`${e.percentage}%`);
  if (toText(e.gpa))        parts.push(`CGPA: ${e.gpa}`);
  // Om's resume has per-year CGPA as plain text in description-like arrays
  if (toText(e.cgpa))       parts.push(`CGPA: ${e.cgpa}`);
  return parts.join(" | ") || null;
};

// ─── Renderer ────────────────────────────────────────────────────────────────

export const renderMinimalTemplate = (doc, r) => {
  let y = TOP;
  const contentW = RIGHT - LEFT;

  const pageBottom = () => doc.page.height - BOTTOM_PAD;

  const ensureSpace = (needed = 0) => {
    if (y + needed <= pageBottom()) return;
    doc.addPage();
    y = TOP;
  };

  const write = (text, font, size, color, opts = {}, gap = 0) => {
    const t = toText(text);
    if (!t) return;
    doc.font(font).fontSize(size);
    const h = doc.heightOfString(t, { width: contentW, lineGap: 2, ...opts });
    ensureSpace(h);
    doc.font(font).fontSize(size).fillColor(color)
      .text(t, LEFT, y, { width: contentW, lineGap: 2, ...opts });
    y += h + gap;
  };

  // ── HEADER ──────────────────────────────────────────────────────────────
  const name = toText(r.header?.name) || toText(r.name) || "";
  write(name, "Helvetica-Bold", 26, COLORS.primary, {}, 4);

  // Role — from header or top-level r.role
  const role = toText(r.header?.role) || toText(r.role);
  if (role) write(role, "Helvetica", 12, COLORS.muted, {}, 8);

  // Contact line
  const contactParts = [
    toText(r.header?.email)    || toText(r.email),
    toText(r.header?.phone)    || toText(r.phone),
    toText(r.header?.location) || toText(r.location),
    toText(r.header?.linkedin) || toText(r.linkedin),
    toText(r.header?.github)   || toText(r.github),
  ].filter(Boolean);
  if (contactParts.length) {
    write(contactParts.join("  •  "), "Helvetica", 9.5, COLORS.muted, { align: "right" }, 10);
  }

  // Divider
  doc.lineWidth(0.5).strokeColor(COLORS.primary)
    .moveTo(LEFT, y).lineTo(RIGHT, y).stroke();
  y += 10;

  // ── SECTION HELPER ───────────────────────────────────────────────────────
  const section = (title) => {
    ensureSpace(28);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(COLORS.primary)
      .text(title.toUpperCase(), LEFT, y, { width: contentW, lineGap: 2, characterSpacing: 0.5 });
    y += doc.heightOfString(title, { width: contentW, lineGap: 2 }) + 4;
    doc.lineWidth(0.7).strokeColor(COLORS.primary)
      .moveTo(LEFT, y).lineTo(RIGHT, y).stroke();
    y += 8;
    doc.fillColor(COLORS.text);
  };

  // ── SUMMARY / OBJECTIVE ──────────────────────────────────────────────────
  const summary = getSummary(r);
  if (summary) {
    section("Summary");
    write(summary, "Helvetica", 10.5, COLORS.text, { lineGap: 3 }, 14);
  }

  // ── EXPERIENCE ───────────────────────────────────────────────────────────
  const experience = r.experience || [];
  if (experience.length) {
    section("Professional Experience");

    experience.forEach((exp) => {
      const company  = toText(exp.company);
      const location = toText(exp.location);
      const companyLine = [company, location].filter(Boolean).join(", ");
      const duration = toText(exp.duration) || toText(exp.dates) || toText(exp.period);
      const expRole  = toText(exp.role) || toText(exp.title) || toText(exp.position);
      const bullets  = getBullets(exp);

      if (!companyLine && !duration && !expRole && !bullets.length) return;

      ensureSpace(30);

      // Company + date on same row
      const dateW = 130;
      const compW = duration ? contentW - dateW - 8 : contentW;

      if (companyLine) {
        doc.font("Helvetica-Bold").fontSize(11)
          .fillColor(COLORS.primary)
          .text(companyLine, LEFT, y, { width: compW, lineGap: 2 });
      }
      if (duration) {
        doc.font("Helvetica").fontSize(9.5)
          .fillColor(COLORS.muted)
          .text(duration, LEFT + contentW - dateW, y, { width: dateW, align: "right", lineGap: 2 });
      }

      const rowH = companyLine
        ? doc.font("Helvetica-Bold").fontSize(11).heightOfString(companyLine, { width: compW, lineGap: 2 })
        : 12;
      y += rowH + 3;

      // Role / title
      if (expRole) write(expRole, "Helvetica-Oblique", 10.5, COLORS.text, {}, 3);

      // Bullets
      bullets.forEach((b) => {
        const bt = `• ${b}`;
        doc.font("Helvetica").fontSize(10);
        const bh = doc.heightOfString(bt, { width: contentW - 14, lineGap: 2 });
        ensureSpace(bh);
        doc.font("Helvetica").fontSize(10).fillColor(COLORS.text)
          .text(bt, LEFT + 10, y, { width: contentW - 14, lineGap: 2 });
        y += bh + 2;
      });

      y += 10;
    });
  }

  // ── PROJECTS ─────────────────────────────────────────────────────────────
  const projects = getProjects(r);
  if (projects.length) {
    section("Projects");

    projects.forEach((p, idx) => {
      const title = toText(p.title) || toText(p.name);
      const techArr = toList(p.technologies) || toList(p.tools) || toList(p.stack);
      const bullets = getBullets(p);

      if (!title && !techArr.length && !bullets.length) return;

      ensureSpace(22);

      // Title + tech stack inline
      if (title) {
        const techStr = techArr.length ? ` — ${techArr.join(", ")}` : "";
        doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.text)
          .text(title, LEFT, y, { continued: !!techStr, lineGap: 2, width: contentW });
        if (techStr) {
          doc.font("Helvetica").fontSize(9.5).fillColor(COLORS.muted)
            .text(techStr, { lineGap: 2 });
        }
        y += doc.font("Helvetica-Bold").fontSize(11).heightOfString(title, { width: contentW, lineGap: 2 }) + 3;
      }

      // If there is NO structured bullets, but technologies field acts as description
      if (!bullets.length && !techArr.length && toText(p.description)) {
        write(toText(p.description), "Helvetica", 10, COLORS.muted, { lineGap: 2 }, 4);
      }

      bullets.forEach((b) => {
        const bt = `• ${b}`;
        doc.font("Helvetica").fontSize(10);
        const bh = doc.heightOfString(bt, { width: contentW - 14, lineGap: 2 });
        ensureSpace(bh);
        doc.font("Helvetica").fontSize(10).fillColor(COLORS.text)
          .text(bt, LEFT + 10, y, { width: contentW - 14, lineGap: 2 });
        y += bh + 2;
      });

      if (idx < projects.length - 1) y += 8;
    });

    y += 6;
  }

  // ── SKILLS ───────────────────────────────────────────────────────────────
  const skillSections = getSkillSections(r);
  if (skillSections.length) {
    section("Skills");

    skillSections.forEach(({ label, items }) => {
      // Sub-label (e.g. "Languages", "Frameworks")
      ensureSpace(16);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.muted)
        .text(label + ":", LEFT, y, { lineGap: 2 });
      y += doc.heightOfString(label + ":", { width: contentW, lineGap: 2 }) + 2;

      // 3-column grid for the items
      const colWidth = contentW / 3;
      let col = 0;
      let rowY = y;
      let rowH = 0;

      items.forEach((skill, i) => {
        const x   = LEFT + col * colWidth;
        const txt = `• ${skill}`;
        doc.font("Helvetica").fontSize(10);
        const h = doc.heightOfString(txt, { width: colWidth - 8, lineGap: 2 });

        if (col === 0) {
          ensureSpace(h + 2);
          rowY = y;
          rowH = h;
        } else {
          rowH = Math.max(rowH, h);
        }

        doc.font("Helvetica").fontSize(10).fillColor(COLORS.text)
          .text(txt, x, rowY, { width: colWidth - 8, lineGap: 2 });

        col = (col + 1) % 3;
        if (col === 0 || i === items.length - 1) {
          y = rowY + rowH + 4;
          rowH = 0;
        }
      });

      y += 6;
    });
  }

  // ── EDUCATION ────────────────────────────────────────────────────────────
  const education = getEducation(r);
  if (education.length) {
    section("Education");

    education.forEach((e) => {
      const degree      = resolveDegree(e);
      const institution = resolveInstitution(e);
      const board       = toText(e.board);
      const year        = toText(e.year) || toText(e.period) || toText(e.duration);
      const grade       = resolveGrade(e);

      // Extra per-year CGPA strings (Om's resume style)
      const extraLines  = toList(e.cgpaPerYear || e.grades || e.yearwiseGrades);

      if (!degree && !institution) return;

      ensureSpace(18);

      // Degree + year on same row
      const yearW = 90;
      if (degree) {
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(COLORS.text)
          .text(degree, LEFT, y, { width: contentW - yearW - 4, lineGap: 2 });
      }
      if (year) {
        doc.font("Helvetica").fontSize(9.5).fillColor(COLORS.muted)
          .text(year, LEFT + contentW - yearW, y, { width: yearW, align: "right", lineGap: 2 });
      }
      y += doc.font("Helvetica-Bold").fontSize(10.5)
             .heightOfString(degree || " ", { width: contentW - yearW - 4, lineGap: 2 }) + 2;

      // Institution + board
      const metaParts = [institution, board].filter(Boolean).join(" — ");
      if (metaParts) write(metaParts, "Helvetica", 10, COLORS.muted, {}, 1);

      // Grade
      if (grade) write(grade, "Helvetica", 9.5, COLORS.light, {}, 1);

      // Extra lines (per-year CGPA etc.)
      extraLines.forEach((line) => write(line, "Helvetica", 9.5, COLORS.light, {}, 1));

      y += 10;
    });
  }

  // ── CERTIFICATIONS / AWARDS ──────────────────────────────────────────────
  const certs = getCerts(r);
  if (certs.length) {
    section("Certifications & Awards");

    certs.forEach((c) => {
      // c may be a plain string or an object with .name / .title
      const label = typeof c === "object"
        ? (toText(c.name) || toText(c.title) || toText(c.award))
        : toText(c);
      if (!label) return;

      const txt = `• ${label}`;
      doc.font("Helvetica").fontSize(10);
      const bh = doc.heightOfString(txt, { width: contentW - 14, lineGap: 2 });
      ensureSpace(bh);
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.text)
        .text(txt, LEFT + 10, y, { width: contentW - 14, lineGap: 2 });
      y += bh + 3;
    });

    y += 4;
  }

  // ── AWARDS (separate key — Om's resume) ─────────────────────────────────
  // Only render if not already merged into certs above
  if (hasArray(r.awards) && !hasArray(r.certifications_awards)) {
    section("Awards & Achievements");

    r.awards.forEach((award, idx) => {
      const awardName = typeof award === "object"
        ? (toText(award.name) || toText(award.title) || toText(Object.values(award)[0]))
        : toText(award);

      if (!awardName) return;
      ensureSpace(16);

      doc.font("Helvetica-Bold").fontSize(10.5).fillColor(COLORS.text)
        .text(`${idx + 1}. ${awardName}`, LEFT, y, { width: contentW, lineGap: 2 });
      y += doc.heightOfString(`${idx + 1}. ${awardName}`, { width: contentW, lineGap: 2 }) + 2;

      // Sub-bullets (e.g. position secured)
      const sub = typeof award === "object" ? toList(award.bullets || award.details || award.description) : [];
      sub.forEach((s) => {
        const bt = `   • ${s}`;
        doc.font("Helvetica").fontSize(10);
        const bh = doc.heightOfString(bt, { width: contentW - 14, lineGap: 2 });
        ensureSpace(bh);
        doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted)
          .text(bt, LEFT + 10, y, { width: contentW - 14, lineGap: 2 });
        y += bh + 2;
      });

      y += 5;
    });
  }

  // ── PAGE NUMBERS ─────────────────────────────────────────────────────────
  const pageRange = doc.bufferedPageRange();
  const pageCount = pageRange.count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(pageRange.start + i);
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted)
      .text(`Page ${i + 1} | ${pageCount}`, LEFT, doc.page.height - 40,
        { align: "right", width: RIGHT - LEFT });
  }
};