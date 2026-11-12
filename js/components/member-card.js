/**
 * member-card.js — Officer profile card (grid) and roster table row.
 * Photo-first card: large round avatar (photo or initials fallback),
 * full IGN (wraps instead of ellipsizing), role/class tags, join date,
 * compact copy-IGN button in the corner. Cards and rows are clickable
 * and open the member profile popup (member-modal.js). Pure component.
 */

import { formatDateShort, initials, escapeHTML, roleClass } from '../utils/format.js';

/** Double-sheet clipboard icon for the copy button. */
export const COPY_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="2" width="8" height="9" rx="1" stroke="currentColor" stroke-width="1.2"/>
      <rect x="5.5" y="4.5" width="8" height="10" rx="1" fill="white" stroke="currentColor" stroke-width="1.2"/>
    </svg>`;

/** Avatar paths from older CMS config may lack the leading slash;
    normalise so they resolve to site-root URLs on every page. */
export function avatarSrc(src) {
  return src.startsWith('/') ? src : `/${src}`;
}

/** Verified tick (circle badge rendered by CSS). */
export const VERIFIED_HTML = `<span class="verified-mark" title="Verified member" aria-label="Verified">
     <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
       <path d="M2 5l2 2 4-4" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round"/>
     </svg>
   </span>`;

/** The copy button copies the UID when there is one, else the IGN,
    matching what EDITING.md promises the admin. */
function copyTarget(member) {
  return member.uid ? escapeHTML(member.uid) : escapeHTML(member.ign);
}

/**
 * Build a member profile card for the grid view.
 * @param {object} member
 * @returns {string} HTML string
 */
export function renderMemberCard(member) {
  const ign = escapeHTML(member.ign);
  const role = escapeHTML(member.role);
  const cls = escapeHTML(member.class || '');
  const init = escapeHTML(initials(member.ign));
  const joined = member.joinDate ? formatDateShort(member.joinDate) : '';
  const tagClass = roleClass(member.role);
  const copy = copyTarget(member);

  const avatarInner = member.avatar
    ? `<img src="${escapeHTML(avatarSrc(member.avatar))}" alt="${ign}"
            class="member-card__avatar-img"
            width="72" height="72" loading="lazy">`
    : `<span class="member-card__avatar-initials" aria-hidden="true">${init}</span>`;

  return `
    <article class="member-card" data-ign="${ign}" tabindex="0" role="button"
             aria-haspopup="dialog" aria-label="Open profile: ${ign}">
      <button class="member-card__copy" data-copy="${copy}"
              aria-label="Copy ${member.uid ? 'UID' : 'IGN'} ${ign}" title="Copy">
        ${COPY_ICON}
        <span class="member-card__copy-label">Copy</span>
      </button>
      <div class="member-card__avatar${member.avatar ? ' member-card__avatar--photo' : ''}">
        ${avatarInner}
      </div>
      <p class="member-card__ign"><span>${ign}</span>${member.verified ? VERIFIED_HTML : ''}</p>
      <div class="member-card__tags">
        <span class="tag ${tagClass}">${role}</span>
        ${cls ? `<span class="tag tag--member">${cls}</span>` : ''}
      </div>
      ${joined ? `<p class="member-card__joined">Joined ${joined}</p>` : ''}
    </article>
  `;
}

/**
 * Build a member table row.
 * @param {object} member
 * @param {number} index
 * @returns {string} HTML string
 */
export function renderMemberRow(member, index) {
  const ign = escapeHTML(member.ign);
  const role = escapeHTML(member.role);
  const cls = escapeHTML(member.class || '—');
  const uid = member.uid ? escapeHTML(member.uid) : '—';
  const joined = member.joinDate ? formatDateShort(member.joinDate) : '—';
  const tagClass = roleClass(member.role);
  const copy = copyTarget(member);

  return `
    <tr data-ign="${ign}" tabindex="0" title="Open profile">
      <td class="members-table__num">${index + 1}</td>
      <td>
        <div class="members-table__ign">
          <span>${ign}</span>
          ${member.verified ? VERIFIED_HTML : ''}
        </div>
      </td>
      <td><span class="tag ${tagClass}">${role}</span></td>
      <td>${cls}</td>
      <td class="members-table__uid">${uid}</td>
      <td class="members-table__date">${joined}</td>
      <td>
        <button class="member-card__copy" data-copy="${copy}"
                aria-label="Copy ${member.uid ? 'UID' : 'IGN'} ${ign}" title="Copy">
          <span class="member-card__copy-label">Copy</span>
        </button>
      </td>
    </tr>
  `;
}

/**
 * Wire up all copy buttons inside a container (cards and table).
 * Swaps only the label text so the icon keeps working.
 * @param {Element} container
 */
export function initCopyButtons(container) {
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;

    const text = btn.dataset.copy;
    const label = btn.querySelector('.member-card__copy-label') ?? btn;
    try {
      await navigator.clipboard.writeText(text);
      label.textContent = 'Copied!';
      setTimeout(() => { label.textContent = 'Copy'; }, 1500);
    } catch {
      // Fallback: select text manually
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      label.textContent = 'Copied!';
      setTimeout(() => { label.textContent = 'Copy'; }, 1500);
    }
  });
}
