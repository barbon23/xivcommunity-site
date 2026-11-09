/**
 * page-content.js — Fills the shared "text slot" placeholders that exist on
 * every page: page titles and subtitles (data/pages.json), homepage section
 * labels and headings (data/content.json → sections), and the centrally
 * managed link URLs and support email (data/config.json).
 */

import { fetchJSON } from '../utils/fetch-json.js';
import { escapeHTML } from '../utils/format.js';

/** Map a data-href value to the matching config field. */
const LINK_FIELDS = {
  apply:    'applyUrl',
  discord:  'discordUrl',
  facebook: 'facebookUrl',
  report:   'reportUrl',
  appeal:   'appealUrl',
  suggest:  'suggestUrl',
};

/** Section slots that end with an extra button, and where each points. */
const SLOT_BUTTONS = {
  roster: { href: '/members.html', labelKey: 'rosterButtonLabel' },
  posts:  { href: '/blog.html',    labelKey: 'postsButtonLabel' },
};

let pagesCache = null;

/**
 * Load pages.json once; resolve to null when unavailable.
 * The promise itself is memoized so parallel callers share one fetch.
 * @returns {Promise<object|null>}
 */
export function loadPages() {
  if (!pagesCache) {
    pagesCache = fetchJSON('/data/pages.json').catch(() => null);
  }
  return pagesCache;
}

/**
 * Fill simple text slots by element id.
 * @param {object|null} pages
 */
function fillPageTitles(pages) {
  if (!pages) return;
  for (const [pageName, fields] of Object.entries({
    members: ['title', 'applyButtonLabel', 'ctaText', 'ctaSub', 'ctaButtonLabel'],
    blog: ['title', 'sub'],
    support: ['title', 'sub'],
  })) {
    const data = pages[pageName] ?? {};
    for (const field of fields) {
      const el = document.getElementById(`${pageName}-${kebab(field)}`);
      if (el && data[field]) el.textContent = data[field];
    }
  }
}

/**
 * camelCase → kebab-case helper for slot id lookup.
 * @param {string} str
 * @returns {string}
 */
function kebab(str) {
  return str.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

/**
 * Fill the homepage section header slots from content.sections.
 * @param {object|null} content
 */
function fillSectionSlots(content) {
  if (!content || !content.sections) return;
  const sections = content.sections;

  document.querySelectorAll('[data-text-slot]').forEach((el) => {
    const slot = el.dataset.textSlot;

    let html = `<span class="section-label" id="${slot}-label">${escapeHTML(sections[`${slot}Label`] ?? '')}</span>`;

    const heading = sections[`${slot}Heading`];
    if (heading) {
      html += `<h2 id="${slot}-heading">${escapeHTML(heading)}</h2>`;
    }

    if (slot === 'schedule' && sections.scheduleNote) {
      html += `<p class="section-note">${escapeHTML(sections.scheduleNote)}</p>`;
    }

    const button = SLOT_BUTTONS[slot];
    if (button && sections[button.labelKey]) {
      html += `<a href="${button.href}" class="btn btn--ghost">${escapeHTML(sections[button.labelKey])}</a>`;
    }

    el.innerHTML = html;
  });
}

/**
 * Point every [data-href] element at its configured URL, and fill the
 * visible support email text.
 * @param {object} config — resolved links
 */
function applyConfigLinks(config) {
  document.querySelectorAll('[data-href]').forEach((el) => {
    const key = el.dataset.href;

    if (key === 'email') {
      if (!config.supportEmail) return;
      el.setAttribute('href', `mailto:${config.supportEmail}`);
      el.textContent = config.supportEmail;
      return;
    }

    const url = config[LINK_FIELDS[key]];
    if (url) el.setAttribute('href', url);
  });
}

/**
 * Initialise everything page-content is responsible for.
 * @param {object} config — resolved links
 * @param {object|null} content — loaded data/content.json
 * @returns {Promise<void>}
 */
export async function initPageContent(config, content) {
  fillSectionSlots(content);
  fillPageTitles(await loadPages());
  applyConfigLinks(config);
}
