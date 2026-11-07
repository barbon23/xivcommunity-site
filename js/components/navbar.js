/**
 * navbar.js — Renders the site navbar and wires up mobile hamburger.
 * Injects into <header id="site-header">.
 * Marks the active link based on current pathname.
 */

import { qs } from '../utils/dom.js';
import CONFIG from '../config.js';

const NAV_LINKS = [
  { href: '/index.html',   label: 'Home',    match: ['/', '/index.html'] },
  { href: '/members.html', label: 'Members', match: ['/members.html'] },
  { href: '/blog.html',    label: 'Blog',    match: ['/blog.html', '/post.html'] },
  { href: '/support.html', label: 'Support', match: ['/support.html'] },
  { href: '/rules.html',   label: 'Rules',   match: ['/rules.html'] },
];

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
 * Build the navbar HTML string.
 * @returns {string}
 */
function buildNavHTML() {
  const links = NAV_LINKS.map(({ href, label, match }) => {
    const active = isActive(match);
    return `<li>
      <a href="${href}"
         class="navbar__link${active ? ' navbar__link--active' : ''}"
         ${active ? 'aria-current="page"' : ''}>
        ${label}
      </a>
    </li>`;
  }).join('');

  const mobileLinks = NAV_LINKS.map(({ href, label, match }) => {
    const active = isActive(match);
    return `<a href="${href}"
         class="navbar__mobile-link${active ? ' navbar__mobile-link--active' : ''}"
         ${active ? 'aria-current="page"' : ''}>
        ${label}
      </a>`;
  }).join('');

  return `
    <nav class="navbar" role="navigation" aria-label="Main navigation">
      <div class="navbar__inner">
        <a href="/index.html" class="navbar__brand" aria-label="${CONFIG.CLAN_NAME} home">
          <svg class="navbar__logo" viewBox="0 0 32 32" fill="none"
               xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#0A0A0A"/>
            <text x="16" y="22" font-family="system-ui,sans-serif" font-size="13"
                  font-weight="600" fill="white" text-anchor="middle">XIV</text>
          </svg>
          <span>${CONFIG.CLAN_NAME}</span>
        </a>

        <ul class="navbar__links" role="list">${links}</ul>

        <a href="${CONFIG.APPLY_URL}" class="btn btn--dark btn--sm navbar__cta"
           target="_blank" rel="noopener noreferrer">
          Join ${CONFIG.CLAN_NAME}
        </a>

        <button class="navbar__hamburger" aria-expanded="false"
                aria-controls="navbar-mobile" aria-label="Open menu">
          <span class="navbar__hamburger-line"></span>
          <span class="navbar__hamburger-line"></span>
          <span class="navbar__hamburger-line"></span>
        </button>
      </div>

      <div id="navbar-mobile" class="navbar__mobile" role="dialog"
           aria-label="Mobile navigation" aria-modal="false">
        ${mobileLinks}
        <a href="${CONFIG.APPLY_URL}" class="btn btn--dark navbar__mobile-cta"
           target="_blank" rel="noopener noreferrer">
          Join ${CONFIG.CLAN_NAME}
        </a>
      </div>
    </nav>
  `;
}

/**
 * Wire up hamburger toggle.
 * @param {Element} nav
 */
function initHamburger(nav) {
  const btn = qs('.navbar__hamburger', nav);
  const drawer = qs('.navbar__mobile', nav);
  if (!btn || !drawer) return;

  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));
    drawer.classList.toggle('is-open', !isOpen);
    document.body.style.overflow = !isOpen ? 'hidden' : '';
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      btn.setAttribute('aria-expanded', 'false');
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      btn.setAttribute('aria-expanded', 'false');
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });
}

/**
 * Mount the navbar into #site-header.
 */
export function initNavbar() {
  const header = qs('#site-header');
  if (!header) return;

  header.innerHTML = buildNavHTML();

  const noscript = header.querySelector('noscript');
  if (noscript) noscript.remove();

  initHamburger(header);
}
