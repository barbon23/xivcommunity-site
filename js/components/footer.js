/**
 * footer.js — Renders the site footer into <footer id="site-footer">.
 */

import { qs } from '../utils/dom.js';
import CONFIG from '../config.js';

const YEAR = new Date().getFullYear();

const FOOTER_COLS = [
  {
    heading: 'Clan',
    links: [
      { label: 'Members',   href: '/members.html' },
      { label: 'Blog',      href: '/blog.html' },
      { label: 'Rules',     href: '/rules.html' },
      { label: 'Apply',     href: CONFIG.APPLY_URL, external: true },
    ],
  },
  {
    heading: 'Community',
    links: [
      { label: 'Discord',   href: CONFIG.DISCORD_URL, external: true },
      { label: 'Facebook',  href: CONFIG.FACEBOOK_URL, external: true },
      { label: 'Schedule',  href: '/index.html#schedule' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help & FAQ',         href: '/support.html' },
      { label: 'Report a Player',    href: CONFIG.REPORT_URL, external: true },
      { label: 'Appeal a Decision',  href: CONFIG.APPEAL_URL, external: true },
      { label: 'Suggest a Feature',  href: CONFIG.SUGGEST_URL, external: true },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy',   href: '#' },
      { label: 'Terms',     href: '#' },
    ],
  },
];

/**
 * Build one footer column.
 * @param {{ heading: string, links: Array }} col
 * @returns {string}
 */
function buildCol(col) {
  const items = col.links.map(({ label, href, external }) => `
    <a href="${href}" class="footer__col-link"
       ${external ? 'target="_blank" rel="noopener noreferrer"' : ''}>
      ${label}
    </a>`).join('');

  return `
    <div class="footer__col">
      <p class="footer__col-heading">${col.heading}</p>
      <nav class="footer__col-links" aria-label="${col.heading}">
        ${items}
      </nav>
    </div>`;
}

/**
 * Build footer HTML.
 * @returns {string}
 */
function buildFooterHTML() {
  const cols = FOOTER_COLS.map(buildCol).join('');

  return `
    <footer class="footer" role="contentinfo">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand">
            <a href="/index.html" class="footer__brand-name" aria-label="${CONFIG.CLAN_NAME} home">
              <img src="/assets/brand/logo.png"
                   class="footer__brand-logo"
                   alt="${CONFIG.CLAN_NAME} logo"
                   width="28" height="28"
                   loading="lazy">
              <span>${CONFIG.CLAN_NAME}</span>
            </a>
            <p class="footer__brand-desc">
              A competitive Call of Duty: Mobile clan based in the Philippines.
              Active since 2021.
            </p>
          </div>
          ${cols}
        </div>

        <div class="footer__bottom">
          <p class="footer__credit">
            &copy; ${YEAR} ${CONFIG.CLAN_NAME} &middot; ${CONFIG.CLAN_TAG}
          </p>
          <p class="footer__disclaimer">
            XIVCOMMUNITY is a fan-made community and is not affiliated with
            or endorsed by Activision or Call of Duty: Mobile.
          </p>
        </div>
      </div>
    </footer>
  `;
}

/**
 * Mount the footer into #site-footer.
 * Uses insertAdjacentHTML to avoid outerHTML reference loss.
 */
export function initFooter() {
  const container = qs('#site-footer');
  if (!container) return;
  container.insertAdjacentHTML('afterend', buildFooterHTML());
  container.remove();
}
