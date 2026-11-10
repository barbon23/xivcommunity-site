/**
 * navbar.js — Renders the site navbar (desktop top bar) and the
 * app-style mobile bottom toolbar (four tabs + dark center Join pill).
 * Injects into <header id="site-header">. Marks the active link based
 * on the current pathname. Join URL comes from data/config.json.
 */

import { qs } from '../utils/dom.js';
import CONFIG, { getConfig } from '../config.js';

const NAV_LINKS = [
  { href: '/index.html',   label: 'Home',    match: ['/', '/index.html'] },
  { href: '/members.html', label: 'Members', match: ['/members.html'] },
  { href: '/blog.html',    label: 'Blog',    match: ['/blog.html', '/post.html'] },
  { href: '/support.html', label: 'Support', match: ['/support.html'] },
  { href: '/rules.html',   label: 'Rules',   match: ['/rules.html'] },
];

/** Minimal inline monochrome icons for the bottom bar tabs. */
const TAB_ICONS = {
  '/index.html': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10.5V20h11V10.5"/></svg>`,
  '/members.html': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5c0-3.1 2.4-5 5.5-5s5.5 1.9 5.5 5"/>
      <path d="M15.5 5.8a3 3 0 0 1 0 5.4"/><path d="M17 14.7c2 .5 3.5 1.9 3.5 4.3"/></svg>`,
  '/blog.html': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="4.5" y="4.5" width="15" height="15" rx="1.5"/>
      <path d="M8 9h8M8 12.5h8M8 16h5"/></svg>`,
  '/support.html': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4.5 13.5a7.5 7.5 0 0 1 15 0"/>
      <rect x="3.5" y="13" width="4" height="5.5" rx="1.5"/>
      <rect x="16.5" y="13" width="4" height="5.5" rx="1.5"/>
      <path d="M19 18.5c0 1.5-1.6 2.5-4 2.5"/></svg>`,
};

/**
 * Determine if a nav link is active for the current path.
 * Handles both /members.html and /members (Vercel cleanUrls).
 * @param {string[]} match
 * @returns {boolean}
 */
function isActive(match) {
  const path = window.location.pathname;
  // Normalise: strip trailing slash, strip .html
  const clean = path.replace(/\/$/, '').replace(/\.html$/, '') || '/';
  return match.some(m => {
    const norm = m.replace(/\.html$/, '') || '/';
    return clean === norm || clean === norm.replace(/^\/index$/, '/');
  });
}

/**
 * Build a top-bar desktop link.
 * @param {object} link — one of NAV_LINKS
 * @returns {string} HTML string
 */
function buildDesktopLink({ href, label, match }) {
  const active = isActive(match);
  return `<li>
      <a href="${href}"
         class="navbar__link${active ? ' navbar__link--active' : ''}"
         ${active ? 'aria-current="page"' : ''}>
        ${label}
      </a>
    </li>`;
}

/**
 * Build a bottom-bar tab (four tabs flank the center Join pill; Rules
 * stays reachable via the desktop nav and every page footer).
 * @param {object} link — one of NAV_LINKS
 * @returns {string} HTML string
 */
function buildBottomTab({ href, label, match }) {
  const active = isActive(match);
  return `<a href="${href}"
       class="bottom-nav__tab${active ? ' bottom-nav__tab--active' : ''}"
       ${active ? 'aria-current="page"' : ''}>
      ${TAB_ICONS[href] ?? ''}
      <span>${label}</span>
    </a>`;
}

/**
 * Build the navbar HTML string (top bar + fixed mobile bottom bar).
 * @returns {string}
 */
function buildNavHTML() {
  const { applyUrl } = getConfig();

  // Bottom bar: Home · Members on the left, Join pill center,
  // Blog · Support right (Rules stays on desktop nav + footers).
  const bottomTabs = NAV_LINKS.filter(l => l.href !== '/rules.html');
  const bottomLeft = bottomTabs.slice(0, 2).map(buildBottomTab).join('');
  const bottomRight = bottomTabs.slice(2).map(buildBottomTab).join('');

  return `
    <nav class="navbar" role="navigation" aria-label="Main navigation">
      <div class="navbar__inner">
        <a href="/index.html" class="navbar__brand" aria-label="${CONFIG.CLAN_NAME} home">
          <img src="/assets/brand/logo.png"
               class="navbar__logo"
               alt="${CONFIG.CLAN_NAME} logo"
               width="48" height="48"
               loading="eager">
          <span>${CONFIG.CLAN_NAME}</span>
        </a>

        <ul class="navbar__links" role="list">
          ${NAV_LINKS.map(buildDesktopLink).join('')}
        </ul>

        <a href="${applyUrl}" class="btn btn--dark btn--sm navbar__cta"
           target="_blank" rel="noopener noreferrer">
          Join ${CONFIG.CLAN_NAME}
        </a>
      </div>
    </nav>

    <nav class="bottom-nav" role="navigation" aria-label="Primary">
      ${bottomLeft}
      <a href="${applyUrl}" class="bottom-nav__join"
         target="_blank" rel="noopener noreferrer"
         aria-label="Join ${CONFIG.CLAN_NAME} on Discord">
        Join
      </a>
      ${bottomRight}
    </nav>
  `;
}

/**
 * Mount the navbar and bottom bar into #site-header.
 */
export function initNavbar() {
  const header = qs('#site-header');
  if (!header) return;

  header.innerHTML = buildNavHTML();

  const noscript = header.querySelector('noscript');
  if (noscript) noscript.remove();
}
