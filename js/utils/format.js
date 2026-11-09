/**
 * format.js — Pure formatting helpers.
 * No DOM access, no side effects. All functions are importable independently.
 */

/**
 * Format an ISO date string to a human-readable date.
 * @param {string} isoDate — e.g. "2026-11-01"
 * @param {object} [opts]  — Intl.DateTimeFormat options
 * @returns {string}       — e.g. "November 1, 2026"
 */
export function formatDate(isoDate, opts = { year: 'numeric', month: 'long', day: 'numeric' }) {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate + 'T00:00:00');
    return new Intl.DateTimeFormat('en-PH', opts).format(d);
  } catch {
    return isoDate;
  }
}

/**
 * Format a date to a short string.
 * @param {string} isoDate
 * @returns {string} — e.g. "Nov 1, 2026"
 */
export function formatDateShort(isoDate) {
  return formatDate(isoDate, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Return a reading-time label.
 * @param {number} minutes
 * @returns {string} — e.g. "4 min read"
 */
export function readingTime(minutes) {
  if (!minutes || minutes < 1) return '1 min read';
  return `${Math.round(minutes)} min read`;
}

/**
 * Get initials from an IGN or display name (up to 2 characters).
 * @param {string} name
 * @returns {string} — e.g. "XC"
 */
export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/[\s_\-]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Slugify a string to a URL-safe identifier.
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate a string to maxLen characters, appending "…".
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(str, maxLen = 120) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + '…';
}

/**
 * Return the URL slug for a blog post, falling back to the slugified title
 * so a post saved without an explicit slug still resolves.
 * @param {object} post
 * @returns {string}
 */
export function postSlug(post) {
  return post?.slug || slugify(post?.title || '');
}

/**
 * Escape HTML special characters to prevent XSS when using innerHTML.
 * @param {string} str
 * @returns {string}
 */
export function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Map a role string to its CSS tag modifier class.
 * @param {string} role
 * @returns {string}
 */
export function roleClass(role) {
  const map = {
    'Founder':    'tag--founder',
    'Head Admin': 'tag--head-admin',
    'Leader':     'tag--leader',
    'Co-Leader':  'tag--co-leader',
    'Officer':    'tag--officer',
    'Member':     'tag--member',
    'Recruit':    'tag--recruit',
  };
  return map[role] || 'tag--member';
}

/**
 * Return a role sort weight (lower = higher in list).
 * @param {string} role
 * @returns {number}
 */
export function roleWeight(role) {
  const weights = {
    'Founder':    0,
    'Head Admin': 1,
    'Leader':     2,
    'Co-Leader':  3,
    'Officer':    4,
    'Member':     5,
    'Recruit':    6,
  };
  return weights[role] ?? 7;
}
