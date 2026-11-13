/**
 * site-content.js — Renders the editable homepage blocks from
 * data/content.json: hero, hero phone mockup, feature blurbs, the
 * screenshot marquee and the final CTA.
 * Every slot is optional — a missing slot simply stays empty.
 */

import { fetchJSON } from '../utils/fetch-json.js';
import { escapeHTML } from '../utils/format.js';
import { qs } from '../utils/dom.js';

let cachePromise = null;

/**
 * Load content.json once; resolve to null when unavailable.
 * The promise itself is memoized so parallel callers share one fetch.
 * @returns {Promise<object|null>}
 */
export function loadSiteContent() {
  if (!cachePromise) {
    cachePromise = fetchJSON('/data/content.json').catch(() => null);
  }
  return cachePromise;
}

/** Resolves once homepage slots are mounted (even when content is missing). */
let slotsMounted;
const slotsReady = new Promise((resolve) => { slotsMounted = resolve; });

/**
 * Await this before touching elements rendered by initSiteContent
 * (#hero-content, #feature-blurbs, #marquee, #cta-block…).
 * @returns {Promise<void>}
 */
export function whenSlotsMounted() {
  return slotsReady;
}

/**
 * Render pill buttons. First button is solid, the rest are ghost.
 * @param {Array<{label: string, url: string}>} [buttons]
 * @returns {string}
 */
function renderButtons(buttons = []) {
  return buttons.map((btn, i) => `
    <a href="${escapeHTML(btn.url)}" class="btn ${i === 0 ? 'btn--light' : 'btn--ghost'}"
       target="_blank" rel="noopener noreferrer">
      ${escapeHTML(btn.label)}
    </a>
  `).join('');
}

/**
 * Render the hero text column into #hero-content.
 * @param {object} content
 */
function renderHero(content) {
  const el = qs('#hero-content');
  if (!el) return;

  el.innerHTML = `
    <p class="hero__eyebrow">${escapeHTML(content.hero.eyebrow ?? '')}</p>
    <h1 class="hero__heading" id="hero-heading">
      ${escapeHTML(content.hero.heading ?? '')}
    </h1>
    <div class="hero__story" id="hero-story">
      <p class="hero__sub" id="hero-sub">${escapeHTML(content.hero.sub ?? '')}</p>
      <button class="hero__more" id="hero-more" type="button"
              aria-controls="hero-sub" aria-expanded="false" hidden>Read more</button>
    </div>
    <div class="hero__actions btn-group">
      ${renderButtons(content.hero.buttons)}
    </div>
    <div class="hero__social-proof" data-avatar-row aria-live="polite"></div>
  `;
}

/**
 * Collapse the long hero story on phones and small tablets with a
 * Read more / Show less toggle. No-ops when the story already fits.
 */
function initHeroStory() {
  const story = qs('#hero-story');
  const sub = qs('#hero-sub');
  const btn = qs('#hero-more');
  if (!story || !sub || !btn) return;

  const mq = window.matchMedia('(max-width: 899px)');

  const sync = () => {
    if (!mq.matches) {
      story.classList.remove('is-open');
      btn.textContent = 'Read more';
      btn.setAttribute('aria-expanded', 'false');
      btn.hidden = true;
      return;
    }
    if (story.classList.contains('is-open')) {
      btn.hidden = false;
      return;
    }
    const overflows = sub.scrollHeight > sub.clientHeight + 1;
    btn.hidden = !overflows;
  };

  btn.addEventListener('click', () => {
    const open = story.classList.toggle('is-open');
    btn.textContent = open ? 'Show less' : 'Read more';
    btn.setAttribute('aria-expanded', String(open));
    sync();
  });

  mq.addEventListener('change', sync);

  let frame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(sync);
  });

  // Web fonts can change line wrapping after the first paint.
  document.fonts?.ready.then(sync).catch(() => {});

  sync();
}

/**
 * Render the phone mockup into #hero-media.
 * @param {object} content
 */
function renderHeroMedia(content) {
  const el = qs('#hero-media');
  if (!el) return;

  el.innerHTML = `
    <div class="phone-frame phone-frame--hero">
      <div class="phone-frame__shell">
        <div class="phone-frame__notch"></div>
        <img class="phone-frame__screen"
             src="${escapeHTML(content.hero.phoneImage ?? '')}"
             alt="${escapeHTML(content.hero.phoneAlt ?? '')}"
             width="380" height="760" loading="eager">
      </div>
    </div>
  `;
}

/**
 * Render the optional hero character (mascot) at the hero's left edge.
 * The <img> is decorative; an empty field keeps it hidden. The file is
 * only requested on screens wide enough to show her, so phones and
 * tablets never download it.
 * @param {object} content
 */
function renderHeroMascot(content) {
  const el = qs('#hero-mascot');
  if (!el) return;
  const src = (content.hero.mascot || '').trim();
  if (!src) {
    el.hidden = true;
    el.removeAttribute('src');
    return;
  }

  const wide = window.matchMedia('(min-width: 1280px)');

  const sync = () => {
    if (!wide.matches) {
      el.hidden = true;
      el.removeAttribute('src');
      return;
    }
    if (el.getAttribute('src') !== src) {
      el.src = src.startsWith('/') ? src : `/${src}`;
    }
    el.hidden = false;
  };

  wide.addEventListener('change', sync);
  sync();
}

/**
 * Render one marquee row (images + duplicated set for a seamless loop).
 * @param {string[]} images
 * @param {boolean} reverse
 * @returns {string}
 */
function renderMarqueeRow(images = [], reverse = false) {
  const items = images.map((src) =>
    `<div class="marquee__item"><img src="${escapeHTML(src)}" alt="" width="280" height="178" loading="lazy"></div>`
  ).join('');

  const duplicate = images.map((src) =>
    `<div class="marquee__item" aria-hidden="true"><img src="${escapeHTML(src)}" alt="" width="280" height="178" loading="lazy"></div>`
  ).join('');

  return `
    <div class="marquee__row${reverse ? ' marquee__row--reverse' : ''}">
      <div class="marquee__track">${items}${duplicate}</div>
    </div>
  `;
}

/**
 * Render both marquee rows into #marquee.
 * @param {object} content
 */
function renderMarquee(content) {
  const el = qs('#marquee');
  if (!el) return;

  el.innerHTML =
    renderMarqueeRow(content.marquee.row1, false) +
    renderMarqueeRow(content.marquee.row2, true);
}

/**
 * Render the final CTA into #cta-block.
 * @param {object} content
 */
function renderCTA(content) {
  const el = qs('#cta-block');
  if (!el) return;

  el.innerHTML = `
    <div data-avatar-row aria-live="polite"></div>
    <h2 class="cta-block__heading" id="cta-heading">
      ${escapeHTML(content.cta.heading ?? '')}
    </h2>
    <p class="cta-block__sub">${escapeHTML(content.cta.sub ?? '')}</p>
    <div class="cta-block__actions">
      ${renderButtons(content.cta.buttons)}
    </div>
  `;
}

/**
 * Mount all homepage content. No-ops on other pages.
 * Always resolves the slots-mounted handshake so dependent modules never hang.
 * @param {object|null} content
 */
export function initSiteContent(content) {
  if (content) {
    renderHero(content);
    initHeroStory();
    renderHeroMedia(content);
    renderHeroMascot(content);
    renderBlurbs(content);
    renderMarquee(content);
    renderCTA(content);
  }
  slotsMounted();
}

/**
 * Render the feature blurbs into #feature-blurbs.
 * @param {object} content
 */
function renderBlurbs(content) {
  const el = qs('#feature-blurbs');
  if (!el || !Array.isArray(content.blurbs.items)) return;

  el.innerHTML = content.blurbs.items.map((item) => `
    <div class="feature-blurb" data-reveal>
      <div class="feature-blurb__content">
        <span class="feature-blurb__num">${escapeHTML(item.num ?? '')}</span>
        <h3 class="feature-blurb__title">${escapeHTML(item.title ?? '')}</h3>
        <p class="feature-blurb__desc">${escapeHTML(item.desc ?? '')}</p>
      </div>
      <div class="feature-blurb__media">
        <img src="${escapeHTML(item.image ?? '')}"
             alt="${escapeHTML(item.alt ?? '')}"
             width="600" height="450" loading="lazy">
      </div>
    </div>
  `).join('');
}
