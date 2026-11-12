/**
 * member-modal.js — Click-a-member profile popup.
 * One self-mounting dialog shared by the members page and the homepage
 * roster preview. Shows the big avatar, IGN with the verified tick,
 * the role tag, a copyable UID, the join date and the member's
 * description. Members with an ID card picture also get it under the
 * bio with a Download button (the UID row hides while the card shows,
 * since the UID is baked into the picture). Closes via the X, the
 * backdrop or Esc; on phones it
 * slides up as a bottom sheet and the Android back gesture closes it
 * instead of leaving the page.
 */

import { escapeHTML, initials, formatDateShort, memberTagClass } from '../utils/format.js';
import { initCopyButtons, avatarSrc, VERIFIED_HTML, COPY_ICON } from './member-card.js';

/** Close (X) icon for the corner button. */
const CLOSE_ICON = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;

/** Module-level refs, created once; filled with member data on open. */
let shell = null;
let refs = {};
let lastFocus = null;
let pushed = false; // history entry pushed so the Android back gesture closes

/** Build the dialog once and append it to <body> (idempotent). */
function ensureShell() {
  if (shell) return;
  shell = document.createElement('div');
  shell.className = 'member-modal';
  shell.id = 'member-modal';
  shell.hidden = true;
  shell.innerHTML = `
    <div class="member-modal__backdrop" data-close></div>
    <div class="member-modal__panel" role="dialog" aria-modal="true" aria-labelledby="member-modal-ign" data-ref="panel">
      <button class="member-modal__close" type="button" data-close data-ref="close" aria-label="Close profile">
        ${CLOSE_ICON}
      </button>
      <div class="member-modal__body" data-ref="body">
        <div class="member-modal__head">
          <div class="member-modal__avatar" data-ref="avatar"></div>
          <div class="member-modal__id">
            <p class="member-modal__ign" id="member-modal-ign" data-ref="ign"></p>
            <div class="member-modal__tags" data-ref="tags"></div>
          </div>
        </div>
        <p class="member-modal__bio" data-ref="bio"></p>
        <figure class="member-modal__idcard" data-ref="idcard" hidden>
          <img class="member-modal__idcard-img" data-ref="idcardImg" alt="" hidden>
          <button class="btn btn--dark btn--sm member-modal__idcard-btn" type="button" data-ref="idcardDl">
            Download ID card
          </button>
        </figure>
        <div class="member-modal__meta">
          <div class="member-modal__meta-row" data-ref="uidRow">
            <span class="member-modal__meta-label">UID</span>
            <span class="member-modal__meta-value" data-ref="uid"></span>
            <button class="member-card__copy" type="button" data-copy="" data-ref="copy">
              ${COPY_ICON}
              <span class="member-card__copy-label">Copy</span>
            </button>
          </div>
          <div class="member-modal__meta-row">
            <span class="member-modal__meta-label">Joined</span>
            <span class="member-modal__meta-value" data-ref="joined"></span>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(shell);

  refs = {};
  for (const node of shell.querySelectorAll('[data-ref]')) {
    refs[node.dataset.ref] = node;
  }

  initCopyButtons(shell);

  // Download the ID card picture as a real file (blob) named after the
  // member. Falls back to opening the full-size image in a new tab
  // where direct blob download is blocked (e.g. some iOS browsers).
  refs.idcardDl.addEventListener('click', async () => {
    const src = refs.idcardImg.currentSrc || refs.idcardImg.src;
    if (!src) return;
    const safe = (refs.idcardDl.dataset.member || 'member').replace(/[^\w.-]+/g, '-');
    try {
      const blob = await (await fetch(src)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      a.href = url;
      a.download = `X1V-ID-${safe}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, '_blank', 'noopener');
    }
  });

  // Swipe-down-to-close on the mobile bottom sheet. Only engages when
  // the sheet's content is scrolled to the top, so reading long bios
  // still scrolls normally.
  const isMobile = () => window.matchMedia('(max-width: 640px)').matches;
  let startY = 0;
  let dragging = false;
  let delta = 0;

  refs.panel.addEventListener('touchstart', (e) => {
    if (!isMobile() || refs.body.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    dragging = true;
    delta = 0;
    refs.panel.style.transition = 'none';
  }, { passive: true });

  refs.panel.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    delta = Math.max(0, e.touches[0].clientY - startY);
    refs.panel.style.transform = `translate(-50%, ${delta}px)`;
  }, { passive: true });

  refs.panel.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    refs.panel.style.transition = '';
    refs.panel.style.transform = '';
    if (delta > 80) closeMemberModal();
    delta = 0;
  });

  shell.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeMemberModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !shell.hidden) closeMemberModal();
  });
  window.addEventListener('popstate', () => {
    if (!shell.hidden) closeMemberModal(true);
  });
}

/**
 * Open the popup filled with one member.
 * @param {object} member
 */
export function openMemberModal(member) {
  ensureShell();

  const ign = escapeHTML(member.ign);
  const bio = (member.description || '').trim();

  refs.avatar.classList.toggle('member-modal__avatar--photo', Boolean(member.avatar));
  refs.avatar.innerHTML = member.avatar
    ? `<img src="${escapeHTML(avatarSrc(member.avatar))}" alt="${ign}"
            class="member-modal__avatar-img" width="80" height="80">`
    : `<span class="member-modal__avatar-initials" aria-hidden="true">${escapeHTML(initials(member.ign))}</span>`;

  refs.ign.innerHTML = `<span>${ign}</span>${member.verified ? VERIFIED_HTML : ''}`;
  refs.tags.innerHTML =
    `<span class="tag ${memberTagClass(member)}">${escapeHTML(member.role)}</span>`;

  refs.bio.textContent = bio || 'Bio coming soon.';
  refs.bio.classList.toggle('member-modal__bio--empty', !bio);

  // Optional ID card picture: shown under the bio, downloadable. The
  // UID row hides while the card shows because the UID is in the
  // picture; members without a card keep the copyable UID row.
  const idcard = (member.idCard || '').trim();
  refs.idcard.hidden = !idcard;
  refs.idcardDl.dataset.member = member.ign;
  if (idcard) {
    refs.idcardImg.src = avatarSrc(idcard);
    refs.idcardImg.alt = `${member.ign} ID card`;
  } else {
    refs.idcardImg.removeAttribute('src');
    refs.idcardImg.alt = '';
  }
  refs.uidRow.hidden = Boolean(idcard);

  refs.uid.textContent = member.uid || '—';
  refs.copy.dataset.copy = member.uid || member.ign;
  refs.joined.textContent = member.joinDate ? formatDateShort(member.joinDate) : '—';

  lastFocus = document.activeElement;
  shell.hidden = false;
  requestAnimationFrame(() => shell.classList.add('member-modal--open'));
  document.body.style.overflow = 'hidden';
  if (!pushed) { pushed = true; history.pushState({ memberModal: true }, ''); }
  refs.close.focus();
}

/**
 * Close the popup, restoring scroll and focus.
 * @param {boolean} [fromPop] — true when a browser/back-gesture pop already
 *                              consumed the history entry.
 */
export function closeMemberModal(fromPop = false) {
  if (!shell || shell.hidden) return;
  shell.classList.remove('member-modal--open');
  shell.hidden = true;
  document.body.style.overflow = '';
  if (pushed && !fromPop) history.back();
  pushed = false;
  if (lastFocus?.isConnected) lastFocus.focus();
  lastFocus = null;
}

/**
 * Wire clicks and Enter/Space on member cards and roster rows inside a
 * container to the popup. Uses a getter so re-rendered lists keep working.
 * @param {Element} container
 * @param {() => Array} getMembers
 */
export function wireProfilePopups(container, getMembers) {
  ensureShell();
  container.addEventListener('click', (e) => {
    if (e.target.closest('[data-copy]')) return;   // the copy chip copies, not opens
    const hit = e.target.closest('[data-ign]');
    if (!hit) return;
    const member = getMembers().find((m) => m.ign === hit.dataset.ign);
    if (member) openMemberModal(member);
  });
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const hit = e.target.closest('[data-ign]');
    if (!hit || e.target !== hit) return;          // let the copy button behave natively
    e.preventDefault();
    const member = getMembers().find((m) => m.ign === hit.dataset.ign);
    if (member) openMemberModal(member);
  });
}

/** Create the dialog shell once per page. */
export function initMemberModal() {
  ensureShell();
}
