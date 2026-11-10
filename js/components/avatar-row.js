/**
 * avatar-row.js — Renders overlapping avatar stack + member count label.
 * Pure component: takes data, returns an HTML string.
 */

import { initials, escapeHTML } from '../utils/format.js';

/** Avatar paths from older CMS config may lack the leading slash;
    normalise so they resolve to site-root URLs on every page. */
function avatarSrc(src) {
  return src.startsWith('/') ? src : `/${src}`;
}

/**
 * Build one avatar circle.
 * @param {{ ign: string, avatar: string }} member
 * @returns {string} HTML string
 */
function buildAvatar(member) {
  const ign = escapeHTML(member.ign);
  const init = escapeHTML(initials(member.ign));

  if (member.avatar) {
    return `
      <div class="avatar-row__item" title="${ign}">
        <img src="${escapeHTML(avatarSrc(member.avatar))}"
             alt="${ign}"
             width="36" height="36"
             loading="lazy">
      </div>`;
  }

  return `
    <div class="avatar-row__item" title="${ign}" aria-label="${ign}">
      <span class="avatar-row__initials" aria-hidden="true">${init}</span>
    </div>`;
}

/**
 * Render a full avatar row component.
 *
 * @param {object} options
 * @param {Array}   options.members     — Full members array
 * @param {number}  [options.max=5]     — Max avatars to show
 * @param {string}  [options.countLabel]— Override count label (e.g. "20+ members")
 * @param {string}  [options.subLabel]  — Sub label below count
 * @returns {string} HTML string
 */
export function renderAvatarRow({
  members = [],
  max = 5,
  countLabel,
  subLabel = 'already play with us',
}) {
  const shown = members.slice(0, max);
  const total = members.length;
  const avatars = shown.map(buildAvatar).join('');
  const count = countLabel ?? `${total}+ members`;

  return `
    <div class="avatar-row">
      <div class="avatar-row__stack" aria-hidden="true">
        ${avatars}
      </div>
      <div class="avatar-row__label">
        <span class="avatar-row__count">${escapeHTML(count)}</span>
        <span class="avatar-row__sub">${escapeHTML(subLabel)}</span>
      </div>
    </div>
  `;
}
