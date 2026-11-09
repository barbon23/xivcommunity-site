/**
 * blog-list.js — Fetch, filter and render the blog post grid.
 * Handles search and category filter.
 */

import { fetchJSON } from '../utils/fetch-json.js';
import { formatDateShort, readingTime, escapeHTML, truncate, postSlug } from '../utils/format.js';
import { qs, qsa } from '../utils/dom.js';

/** @type {Array} */
let allPosts = [];
let currentCategory = 'All';
let currentSearch = '';

const CATEGORIES = [
  'All', 'Announcements', 'Clan Wars', 'Tournaments',
  'Guides', 'Patch Notes', 'Recruitment',
];

/**
 * Build a single blog card HTML string.
 * @param {object} post
 * @returns {string}
 */
function renderPostCard(post) {
  const title   = escapeHTML(post.title);
  const excerpt = escapeHTML(truncate(post.excerpt, 160));
  const date    = formatDateShort(post.date);
  const rt      = readingTime(post.readingTime);
  const cat     = escapeHTML(post.category);
  const slug    = encodeURIComponent(postSlug(post));

  const coverHTML = post.cover
    ? `<img class="card__cover" src="${escapeHTML(post.cover)}"
            alt="${title}" width="800" height="450" loading="lazy">`
    : `<div class="card__cover card__cover--placeholder" aria-hidden="true">
         Add screenshot
       </div>`;

  return `
    <article class="card">
      <a href="/post.html?slug=${slug}" aria-label="Read: ${title}">
        ${coverHTML}
      </a>
      <div class="card__body">
        <div class="card__meta">
          <span class="card__category">${cat}</span>
          <span class="card__dot" aria-hidden="true"></span>
          <time class="card__date" datetime="${escapeHTML(post.date)}">${date}</time>
        </div>
        <h2 class="card__title">
          <a href="/post.html?slug=${slug}">${title}</a>
        </h2>
        <p class="card__excerpt">${excerpt}</p>
      </div>
      <div class="card__footer">
        <span class="card__read-time">${rt}</span>
        <a href="/post.html?slug=${slug}" class="btn btn--ghost btn--sm">Read</a>
      </div>
    </article>
  `;
}

/**
 * Filter posts by current category and search query.
 * @returns {Array}
 */
function getFiltered() {
  let list = [...allPosts];

  if (currentCategory !== 'All') {
    list = list.filter(p => p.category === currentCategory);
  }

  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q)
    );
  }

  return list;
}

/**
 * Re-render the blog grid.
 * @param {Element} container
 */
function rerender(container) {
  const filtered = getFiltered();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="blog-empty">
        <p>No posts found. Try a different filter or search.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(renderPostCard).join('');
}

/**
 * Build category filter chips HTML.
 * @returns {string}
 */
function buildCategoryFilter() {
  return CATEGORIES.map(cat => `
    <button class="filter-chip${cat === 'All' ? ' filter-chip--active' : ''}"
            data-category="${escapeHTML(cat)}">
      ${escapeHTML(cat)}
    </button>`).join('');
}

/**
 * Main init: fetches posts, renders grid and wires controls.
 */
export async function initBlogList() {
  const container   = qs('#blog-grid');
  const filterWrap  = qs('#blog-filters');
  const searchEl    = qs('#blog-search');

  if (!container) return;

  // Render filter chips
  if (filterWrap) filterWrap.innerHTML = buildCategoryFilter();

  container.innerHTML = '<p class="state-loading">Loading posts…</p>';

  try {
    allPosts = (await fetchJSON('/data/posts.json')).posts;
    // Newest first
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch {
    container.innerHTML = '<p class="state-error">Could not load posts. Please try again.</p>';
    return;
  }

  rerender(container);

  // Search
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      currentSearch = searchEl.value.trim();
      rerender(container);
    });
  }

  // Category filter
  if (filterWrap) {
    filterWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-category]');
      if (!btn) return;
      qsa('[data-category]', filterWrap).forEach(b => b.classList.remove('filter-chip--active'));
      btn.classList.add('filter-chip--active');
      currentCategory = btn.dataset.category;
      rerender(container);
    });
  }
}

/**
 * Render the 3 latest posts for the home page preview.
 * @param {Element} container
 * @param {number} [limit=3]
 */
export async function renderLatestPosts(container, limit = 3) {
  if (!container) return;
  container.innerHTML = '<p class="state-loading">Loading…</p>';

  try {
    const posts = (await fetchJSON('/data/posts.json')).posts;
    const latest = posts
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    if (latest.length === 0) {
      container.innerHTML = '<p>No posts yet.</p>';
      return;
    }

    container.innerHTML = latest.map(renderPostCard).join('');
  } catch {
    container.innerHTML = '<p class="state-error">Could not load posts.</p>';
  }
}
