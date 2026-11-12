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
 * Map a role to its default category group. Used as the fallback when a
 * member has no category of their own in the data.
 * @param {string} role
 * @returns {"X1V MANAGEMENT"|"X1V EXCLUSIVE"|"X1V MEMBER"}
 */
export function roleCategory(role) {
  const map = {
    // X1V MANAGEMENT (staff)
    'Founder':              'X1V MANAGEMENT',
    'Community Master':     'X1V MANAGEMENT',
    'Head Admin':           'X1V MANAGEMENT',
    'Event Organizer':      'X1V MANAGEMENT',
    'Moderator':            'X1V MANAGEMENT',
    'Internal Affair':      'X1V MANAGEMENT',
    'Tag Checker':          'X1V MANAGEMENT',
    'Discipline & Warning': 'X1V MANAGEMENT',
    'Recruiter':            'X1V MANAGEMENT',
    'Graphics & Content':   'X1V MANAGEMENT',
    'Leaderboard':          'X1V MANAGEMENT',
    // X1V EXCLUSIVE
    'Sponsor':              'X1V EXCLUSIVE',
    'Streamer':             'X1V EXCLUSIVE',
    'Content Creator':      'X1V EXCLUSIVE',
    // X1V MEMBER
    'Compe':                'X1V MEMBER',
    'Casual':               'X1V MEMBER',
  };
  return map[role] || 'X1V MEMBER';
}

/** The three category groups, in display order. */
export const CATEGORIES = ['X1V MANAGEMENT', 'X1V EXCLUSIVE', 'X1V MEMBER'];

/**
 * A member's category: their own choice from the CMS editor, falling
 * back to the role's default category when the field is missing.
 * @param {object} member
 * @returns {"X1V MANAGEMENT"|"X1V EXCLUSIVE"|"X1V MEMBER"}
 */
export function memberCategory(member) {
  if (member && CATEGORIES.includes(member.category)) return member.category;
  return roleCategory(member?.role);
}

/**
 * Map a category to its CSS tag modifier class.
 * @param {string} category
 * @returns {string}
 */
export function categoryClass(category) {
  if (category === 'X1V MANAGEMENT') return 'tag--x1v-management';
  if (category === 'X1V EXCLUSIVE')  return 'tag--x1v-exclusive';
  return 'tag--x1v-member';
}

/**
 * Tag class for a member — coloured by their own category.
 * @param {object} member
 * @returns {string}
 */
export function memberTagClass(member) {
  return categoryClass(memberCategory(member));
}

/**
 * Return a role sort weight (lower = higher in list). Unknown roles sort last.
 * @param {string} role
 * @returns {number}
 */
export function roleWeight(role) {
  const weights = {
    'Founder':              0,
    'Community Master':     1,
    'Head Admin':           2,
    'Event Organizer':      3,
    'Moderator':            4,
    'Internal Affair':      5,
    'Discipline & Warning': 6,
    'Tag Checker':          7,
    'Recruiter':            8,
    'Graphics & Content':   9,
    'Leaderboard':          10,
    'Sponsor':              11,
    'Streamer':             12,
    'Content Creator':      13,
    'Compe':                14,
    'Casual':               15,
  };
  return weights[role] ?? 99;
}
