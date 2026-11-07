/**
 * member-card.js — Renders a single member card (grid or table row).
 * Pure component: returns HTML strings.
 */

import { formatDateShort, initials, escapeHTML, roleClass } from '../utils/format.js';

/**
 * Build a member card for the grid view.
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

  const avatarHTML = member.avatar
    ? `<img src="${escapeHTML(member.avatar)}" alt="${ign}"
            class="member-card__avatar-img"
            width="44" height="44" loading="lazy">`
    : `<div class="member-card__avatar-initials" aria-hidden="true">${init}</div>`;

  const verifiedHTML = member.verified
    ? `<span class="verified-mark" title="Verified member" aria-label="Verified">
         <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
           <path d="M2 5l2 2 4-4" stroke="white" stroke-width="1.5"
                 stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
       </span>`
    : '';

  return `
    <div class="card card--member" data-ign="${ign}">
      ${avatarHTML}
      <div class="card__info">
        <div class="card__ign">
          <span>${ign}</span>
          ${verifiedHTML}
        </div>
        <div class="card__role">
          <span class="tag ${tagClass}">${role}</span>
          ${cls ? `<span class="tag tag--member" style="margin-left:4px">${cls}</span>` : ''}
        </div>
        ${joined ? `<div style="font-size:var(--font-size-xs);color:var(--color-subtle);margin-top:4px">Joined ${joined}</div>` : ''}
      </div>
      <button class="card__copy-btn" data-copy="${ign}"
              aria-label="Copy IGN ${ign}" title="Copy IGN">
        Copy
      </button>
    </div>
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

  const verifiedHTML = member.verified
    ? `<span class="verified-mark" title="Verified" aria-label="Verified">
         <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
           <path d="M2 5l2 2 4-4" stroke="white" stroke-width="1.5"
                 stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
       </span>`
    : '';

  return `
    <tr>
      <td class="members-table__num">${index + 1}</td>
      <td>
        <div class="members-table__ign">
          <span>${ign}</span>
          ${verifiedHTML}
        </div>
      </td>
      <td><span class="tag ${tagClass}">${role}</span></td>
      <td>${cls}</td>
      <td class="members-table__uid">${uid}</td>
      <td class="members-table__date">${joined}</td>
      <td>
        <button class="card__copy-btn" data-copy="${ign}"
                aria-label="Copy IGN ${ign}" title="Copy IGN">
          Copy
        </button>
      </td>
    </tr>
  `;
}

/**
 * Wire up all copy-IGN buttons inside a container.
 * @param {Element} container
 */
export function initCopyButtons(container) {
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;

    const text = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1500);
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
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    }
  });
}
