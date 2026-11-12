/**
 * home.js — Page entry file for index.html.
 * Wires up: hero avatar rows, member preview, latest posts, schedule,
 * testimonials, achievements and supporters.
 * All page copy/blocks render in site-content.js / page-content.js (main.js).
 */

import { loadSiteContent, whenSlotsMounted } from '../features/site-content.js';
import { fetchJSON } from '../utils/fetch-json.js';
import { escapeHTML, roleWeight } from '../utils/format.js';
import { renderAvatarRow } from '../components/avatar-row.js';
import { renderMemberCard, initCopyButtons } from '../components/member-card.js';
import { initMemberModal, wireProfilePopups } from '../components/member-modal.js';
import { renderLatestPosts } from '../features/blog-list.js';
import { initSchedule } from '../features/schedule.js';
import { staggerReveal } from '../features/reveal.js';
import { qs } from '../utils/dom.js';

/** Render avatar row(s) from members data */
async function initAvatarRows(content) {
  const containers = document.querySelectorAll('[data-avatar-row]');
  if (!containers.length) return;

  try {
    const { members } = await fetchJSON('/data/members.json');
    const subLabel = content?.hero?.socialProofSub ?? 'already play with us';

    containers.forEach(container => {
      container.innerHTML = renderAvatarRow({ members, max: 5, subLabel });
    });
  } catch {
    containers.forEach(c => { c.hidden = true; });
  }
}

/** Render 6 leaders/officers preview on home */
async function initMemberPreview() {
  const container = qs('#member-preview');
  if (!container) return;

  try {
    const { members } = await fetchJSON('/data/members.json');
    const priority = members
      .filter(m => ['Founder', 'Head Admin', 'Leader', 'Co-Leader', 'Officer'].includes(m.role))
      .sort((a, b) => roleWeight(a.role) - roleWeight(b.role))
      .slice(0, 6);

    if (!priority.length) {
      container.hidden = true;
      return;
    }

    container.innerHTML = priority.map(renderMemberCard).join('');
    staggerReveal(container, 60);
    initCopyButtons(container);
    initMemberModal();
    wireProfilePopups(container, () => priority);
  } catch {
    container.hidden = true;
  }
}

/** Render testimonials wall */
async function initTestimonials() {
  const container = qs('#testimonials-grid');
  if (!container) return;

  try {
    const { testimonials } = await fetchJSON('/data/testimonials.json');
    if (!testimonials.length) { container.closest('section')?.remove(); return; }

    container.innerHTML = testimonials.map(t => `
      <blockquote class="testimonial" data-reveal>
        <p class="testimonial__quote">"${escapeHTML(t.quote)}"</p>
        <footer class="testimonial__author">
          <div>
            <p class="testimonial__author-name">${escapeHTML(t.name)}</p>
            <p class="testimonial__author-source">${escapeHTML(t.source)}</p>
          </div>
        </footer>
      </blockquote>
    `).join('');

    staggerReveal(container, 80);
  } catch {
    container.closest('section')?.remove();
  }
}

/** Render achievement badges */
async function initAchievements() {
  const container = qs('#achievements-grid');
  if (!container) return;

  try {
    const { achievements } = await fetchJSON('/data/achievements.json');
    if (!achievements.length) return;

    const laurelLeft = `<svg class="badge__laurel-left" viewBox="0 0 28 36" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20 4C16 8 12 10 8 12C6 16 6 20 8 24C10 28 14 30 18 32"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
            fill="none" opacity="0.5"/>
      <path d="M14 2C12 6 10 8 8 10" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" fill="none" opacity="0.3"/>
      <path d="M22 8C20 12 18 14 16 16" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" fill="none" opacity="0.3"/>
    </svg>`;

    const laurelRight = `<svg class="badge__laurel-right" viewBox="0 0 28 36" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="transform:scaleX(-1)">
      <path d="M20 4C16 8 12 10 8 12C6 16 6 20 8 24C10 28 14 30 18 32"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
            fill="none" opacity="0.5"/>
      <path d="M14 2C12 6 10 8 8 10" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" fill="none" opacity="0.3"/>
      <path d="M22 8C20 12 18 14 16 16" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" fill="none" opacity="0.3"/>
    </svg>`;

    container.innerHTML = achievements.map(a => `
      <div class="badge" data-reveal>
        <div class="badge__laurel">
          ${laurelLeft}
          <div>
            <div class="badge__stat">${escapeHTML(a.stat)}</div>
          </div>
          ${laurelRight}
        </div>
        <p class="badge__label">${escapeHTML(a.label)}</p>
        <p class="badge__detail">${escapeHTML(a.detail)}</p>
      </div>
    `).join('');

    staggerReveal(container, 100);
  } catch { /* silent */ }
}

/** Render partner/supporter row */
async function initSupporters() {
  const section   = qs('#partners-section');
  const container = qs('#partners-row');
  if (!section || !container) return;

  try {
    const { supporters } = await fetchJSON('/data/supporters.json');
    if (!supporters.length) {
      section.hidden = true;
      return;
    }

    container.innerHTML = supporters.map(s => `
      <a href="${escapeHTML(s.url)}" class="partners__item"
         target="_blank" rel="noopener noreferrer"
         title="${escapeHTML(s.description)}">
        ${escapeHTML(s.name)}
      </a>
    `).join('');
  } catch {
    section.hidden = true;
  }
}

/** Boot all home features after main.js has mounted the content slots. */
async function boot() {
  // Hero/CTA markup (with the avatar-row containers) is rendered by main.js
  await whenSlotsMounted();
  const content = await loadSiteContent();

  initAvatarRows(content);
  initMemberPreview();
  renderLatestPosts(qs('#posts-preview'));
  initSchedule();
  initTestimonials();
  initAchievements();
  initSupporters();
}

boot();
