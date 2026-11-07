/**
 * blog-post.js — Load and render a single blog post from ?slug= query param.
 * Sets dynamic <title>, meta description, og tags, and prev/next navigation.
 */

import { fetchJSON } from '../utils/fetch-json.js';
import { formatDate, readingTime, escapeHTML } from '../utils/format.js';
import { qs } from '../utils/dom.js';

/**
 * Update a <meta> tag by name or property.
 * @param {string} attr     — attribute name to match ('name' or 'property')
 * @param {string} value    — attribute value to match
 * @param {string} content  — new content value
 */
function setMeta(attr, value, content) {
  let el = document.querySelector(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Render the post header area.
 * @param {object} post
 * @param {string} siteUrl
 */
function renderHeader(post, siteUrl) {
  const el = qs('#post-header');
  if (!el) return;

  const date     = formatDate(post.date);
  const rt       = readingTime(post.readingTime);
  const title    = escapeHTML(post.title);
  const cat      = escapeHTML(post.category);
  const author   = escapeHTML(post.author);

  el.innerHTML = `
    <a href="/blog.html" class="post-header__back" aria-label="Back to Blog">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
           xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Blog
    </a>
    <div class="post-header__meta">
      <span class="tag">${cat}</span>
    </div>
    <h1 class="post-header__title">${title}</h1>
    <div class="post-header__byline">
      <span class="post-header__author">${author}</span>
      <span class="post-header__dot" aria-hidden="true" style="color:var(--color-border)">·</span>
      <time class="post-header__date" datetime="${escapeHTML(post.date)}">${date}</time>
      <span class="post-header__dot" aria-hidden="true" style="color:var(--color-border)">·</span>
      <span class="post-header__reading-time">${rt}</span>
    </div>
  `;
}

/**
 * Render the cover image or placeholder.
 * @param {object} post
 */
function renderCover(post) {
  const el = qs('#post-cover');
  if (!el) return;

  if (post.cover) {
    el.innerHTML = `
      <img class="post-cover" src="${escapeHTML(post.cover)}"
           alt="${escapeHTML(post.title)}"
           width="1200" height="514" loading="lazy">`;
  } else {
    el.innerHTML = `
      <div class="post-cover card__cover--placeholder"
           style="border-radius:var(--radius-card);border:var(--border);margin-block:var(--space-6);aspect-ratio:21/9">
        [Add screenshot]
      </div>`;
  }
}

/**
 * Render the post body HTML.
 * @param {object} post
 */
function renderBody(post) {
  const el = qs('#post-body');
  if (!el) return;
  // Content is trusted HTML from our own JSON
  el.innerHTML = post.content || '<p>No content yet.</p>';
}

/**
 * Render prev / next navigation.
 * @param {object[]} posts  — full sorted list
 * @param {number} index    — current post index
 */
function renderPostNav(posts, index) {
  const el = qs('#post-nav');
  if (!el) return;

  const prev = index < posts.length - 1 ? posts[index + 1] : null;
  const next = index > 0 ? posts[index - 1] : null;

  const prevHTML = prev
    ? `<a href="/post.html?slug=${encodeURIComponent(prev.slug)}" class="post-nav__item">
         <span class="post-nav__dir">← Previous</span>
         <span class="post-nav__title">${escapeHTML(prev.title)}</span>
       </a>`
    : '<div></div>';

  const nextHTML = next
    ? `<a href="/post.html?slug=${encodeURIComponent(next.slug)}" class="post-nav__item post-nav__item--next">
         <span class="post-nav__dir">Next →</span>
         <span class="post-nav__title">${escapeHTML(next.title)}</span>
       </a>`
    : '<div></div>';

  el.innerHTML = prevHTML + nextHTML;
}

/**
 * Wire up the copy-link button.
 */
function initCopyLink() {
  const btn = qs('#copy-link-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy link'; }, 1800);
    } catch {
      btn.textContent = 'Copy link';
    }
  });
}

/**
 * Main init: read ?slug=, fetch posts, render everything.
 */
export async function initBlogPost() {
  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('slug');

  const errorEl = qs('#post-error');
  const bodyEl  = qs('#post-body');

  if (!slug) {
    if (errorEl) errorEl.hidden = false;
    return;
  }

  let posts;
  try {
    posts = await fetchJSON('/data/posts.json');
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch {
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = 'Could not load post. Please try again.';
    }
    return;
  }

  const index = posts.findIndex(p => p.slug === slug);
  if (index === -1) {
    if (errorEl) errorEl.hidden = false;
    return;
  }

  const post = posts[index];
  const siteUrl = window.location.origin;

  // Update document head
  document.title = `${post.title} — XIVCOMMUNITY`;
  setMeta('name', 'description', post.excerpt);
  setMeta('property', 'og:title', post.title);
  setMeta('property', 'og:description', post.excerpt);
  setMeta('property', 'og:url', `${siteUrl}/post.html?slug=${slug}`);
  if (post.cover) setMeta('property', 'og:image', post.cover);
  setMeta('name', 'twitter:title', post.title);
  setMeta('name', 'twitter:description', post.excerpt);

  // Set canonical link
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', `${siteUrl}/post.html?slug=${encodeURIComponent(slug)}`);

  renderHeader(post, siteUrl);
  renderCover(post);
  renderBody(post);
  renderPostNav(posts, index);
  initCopyLink();
}
