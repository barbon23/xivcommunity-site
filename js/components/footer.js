/**
 * footer.js — Renders the site footer into <footer id="site-footer">.
 * Link URLs come from data/config.json; the brand blurb comes from
 * data/content.json (editable in the /admin panel).
 * The Activision disclaimer is intentionally fixed legal text.
 */

import { qs } from '../utils/dom.js';
import CONFIG, { getConfig } from '../config.js';

const YEAR = new Date().getFullYear();

/** Fallback brand blurb, used when content.json is unavailable. */
const DEFAULT_BRAND_DESC =
  'A competitive Call of Duty: Mobile clan based in the Philippines. Active since 2021.';

/** Fixed legal disclaimer — never edited through the CMS. */
const DISCLAIMER =
  'XIVCOMMUNITY is a fan-made community and is not affiliated with or endorsed by Activision or Call of Duty: Mobile.';

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
 * @param {object|null} content — loaded data/content.json
 * @returns {string}
 */
function buildFooterHTML(content) {
  const links = getConfig();

  const cols = [
    {
      heading: 'Clan',
      links: [
        { label: 'Members', href: '/members.html' },
        { label: 'Blog',    href: '/blog.html' },
        { label: 'Rules',   href: '/rules.html' },
        { label: 'Apply',   href: links.applyUrl, external: true },
      ],
    },
    {
      heading: 'Community',
      links: [
        { label: 'Discord',  href: links.discordUrl,  external: true },
        { label: 'Facebook', href: links.facebookUrl, external: true },
        { label: 'Schedule', href: '/index.html#schedule' },
      ],
    },
    {
      heading: 'Support',
      links: [
        { label: 'Help & FAQ', href: '/support.html' },
        { label: 'Report a Player',   href: links.reportUrl,  external: true },
        { label: 'Appeal a Decision', href: links.appealUrl,  external: true },
        { label: 'Suggest a Feature', href: links.suggestUrl, external: true },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy', href: '#' },
        { label: 'Terms',   href: '#' },
      ],
    },
  ].map(buildCol).join('');

  const brandDesc = content?.footer?.brandDesc ?? DEFAULT_BRAND_DESC;

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
              ${brandDesc}
            </p>
          </div>
          ${cols}
        </div>

        <div class="footer__bottom">
          <p class="footer__credit">
            &copy; ${YEAR} ${CONFIG.CLAN_NAME} &middot; ${CONFIG.CLAN_TAG}
          </p>
          <p class="footer__disclaimer">
            ${DISCLAIMER}
          </p>
        </div>
      </div>
    </footer>
  `;
}

/**
 * Mount the footer into #site-footer.
 * @param {object|null} content — loaded data/content.json
 */
export function initFooter(content) {
  const container = qs('#site-footer');
  if (!container) return;
  container.insertAdjacentHTML('afterend', buildFooterHTML(content));
  container.remove();
}
