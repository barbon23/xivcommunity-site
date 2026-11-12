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
 * Map a role to its category group (the members page groups by these).
 * Category names are stored in CAPS exactly as they display.
 * Roles outside the official list fall back to XIV MEMBER.
 * @param {string} role
 * @returns {"XIV MANAGEMENT"|"XIV EXCLUSIVE"|"XIV MEMBER"}
 */
export function roleCategory(role) {
  const map = {
    // XIV MANAGEMENT (staff)
    'Founder':              'XIV MANAGEMENT',
    'Community Master':     'XIV MANAGEMENT',
    'Head Admin':           'XIV MANAGEMENT',
    'Event Organizer':      'XIV MANAGEMENT',
    'Moderator':            'XIV MANAGEMENT',
    'Internal Affair':      'XIV MANAGEMENT',
    'Tag Checker':          'XIV MANAGEMENT',
    'Discipline & Warning': 'XIV MANAGEMENT',
    'Recruiter':            'XIV MANAGEMENT',
    'Graphics & Content':   'XIV MANAGEMENT',
    'Leaderboard':          'XIV MANAGEMENT',
    // XIV EXCLUSIVE
    'Sponsor':              'XIV EXCLUSIVE',
    'Streamer':             'XIV EXCLUSIVE',
    'Content Creator':      'XIV EXCLUSIVE',
    // XIV MEMBER
    'Compe':                'XIV MEMBER',
    'Casual':               'XIV MEMBER',
  };
  return map[role] || 'XIV MEMBER';
}

/**
 * Map a role to its CSS tag modifier class. Tags are coloured by the
 * role's category group so the 16 roles stay visually calm.
 * @param {string} role
 * @returns {string}
 */
export function roleClass(role) {
  const category = roleCategory(role);
  if (category === 'XIV MANAGEMENT') return 'tag--xiv-management';
  if (category === 'XIV EXCLUSIVE')  return 'tag--xiv-exclusive';
  return 'tag--xiv-member';
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
