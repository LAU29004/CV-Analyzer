/**
 * guards.js
 * Utility helpers for validating and safely handling resume data.
 */

/**
 * Returns true if value is a non-empty Array.
 * @param {*} v
 * @returns {boolean}
 */
export const hasArray = (v) => Array.isArray(v) && v.length > 0;

/**
 * Returns true if value is a non-empty string OR a number.
 * @param {*} v
 * @returns {boolean}
 */
export const hasText = (v) =>
  (typeof v === "string" && v.trim().length > 0) ||
  typeof v === "number";

/**
 * Checks if skills object has at least one valid section.
 * @param {*} s
 * @returns {boolean}
 */
export const hasSkills = (s) =>
  hasArray(s?.technical) || hasArray(s?.soft);

/**
 * Checks if experience array contains at least one valid entry.
 * @param {*} e
 * @returns {boolean}
 */
export const hasExperience = (e) =>
  hasArray(e) &&
  e.some((x) => hasText(x?.role) || hasText(x?.company));

/**
 * Checks if projects array contains at least one valid entry.
 * @param {*} p
 * @returns {boolean}
 */
export const hasProjects = (p) =>
  hasArray(p) &&
  p.some((x) => hasText(x?.title));

/**
 * Checks if education entries are valid across multiple formats.
 * Handles:
 * - institution / degree
 * - school / level
 * - university / gpa
 * - college / board
 * - plain string fallback
 *
 * @param {Array} entries
 * @returns {boolean}
 */
export const hasEducation = (entries) => {
  if (!Array.isArray(entries) || !entries.length) return false;

  return entries.some((e) => {
    if (!e || typeof e !== "object") {
      return typeof e === "string" && e.trim().length > 0;
    }

    return !!(
      e.institution ||
      e.institute ||
      e.school ||
      e.college ||
      e.university ||
      e.degree ||
      e.qualification ||
      e.level ||
      e.board
    );
  });
};

/**
 * Safely converts value to trimmed string or null.
 * @param {*} v
 * @returns {string|null}
 */
export const safeText = (v) => {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
};

/**
 * Converts any value into a clean string array.
 * Handles:
 * - Arrays
 * - newline-separated text
 * - semicolon-separated text
 * - bullet-separated text
 *
 * @param {*} v
 * @returns {string[]}
 */
export const safeList = (v) => {
  if (Array.isArray(v)) {
    return v.map(safeText).filter(Boolean);
  }

  const t = safeText(v);
  if (!t) return [];

  return t
    .split(/\n|[;\u2022]/)
    .map((x) => (typeof x === "string" && x.trim() ? x.trim() : null))
    .filter(Boolean);
};