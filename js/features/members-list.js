/**
 * members-list.js — Fetch, filter, sort and render the member roster.
 * Handles search, role filter, sort, grid/table toggle, group-by-role,
 * and numbered paging in both the table and the grid.
 */

import { fetchJSON } from '../utils/fetch-json.js';
import { escapeHTML, roleWeight, memberCategory, CATEGORIES } from '../utils/format.js';
import { renderMemberCard, renderMemberRow, initCopyButtons } from '../components/member-card.js';
import { initMemberModal, wireProfilePopups } from '../components/member-modal.js';
import { qs, qsa } from '../utils/dom.js';

/** @type {Array} */
let allMembers = [];
let currentFilter = 'All';
let currentSort = 'role';
let currentSearch = '';
let viewMode = 'grid'; // 'grid' | 'table'
let currentPage = 1;    // table view page
let gridPage = 1;       // flat grid page (A-Z, Z-A, Newest, search, filter)
const gridCategoryPages = new Map();  // category -> page in the grouped grid
const PAGE_SIZE = 20;   // cards or rows per page, shared by both views

/** Reset every pager to page 1 (used by search/sort/filter/view changes). */
function resetPages() {
  currentPage = 1;
  gridPage = 1;
  gridCategoryPages.clear();
}

/**
 * Normalize text for search. Many IGNs are written in decorative Unicode
 * letters (for example "𝐑𝐄𝐕𝐎 𝐗𝐈𝐕"), which never match normal keyboard
 * input. NFKD turns those into plain letters, combining accents are
 * dropped, and everything is lowercased, so typing "revo" finds the
 * styled name.
 * @param {string} value
 * @returns {string}
 */
function normalizeSearchText(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/**
 * Apply current filter, sort and search to allMembers.
 * @returns {Array}
 */
function getFiltered() {
  let list = [...allMembers];

  if (currentFilter !== 'All') {
    list = list.filter(m => memberCategory(m) === currentFilter);
  }

  if (currentSearch) {
    const q = normalizeSearchText(currentSearch);
    list = list.filter(m => normalizeSearchText(m.ign).includes(q));
  }

  list.sort((a, b) => {
    if (currentSort === 'role') {
      const diff = roleWeight(a.role) - roleWeight(b.role);
      return diff !== 0 ? diff : a.ign.localeCompare(b.ign);
    }
    if (currentSort === 'az')   return a.ign.localeCompare(b.ign);
    if (currentSort === 'za')   return b.ign.localeCompare(a.ign);
    if (currentSort === 'date') return new Date(a.joinDate) - new Date(b.joinDate);
    return 0;
  });

  return list;
}

/**
 * Group members by their own category for the grid view. The category
 * is picked per member in the CMS (a role-based fallback keeps old
 * data working — see memberCategory in format.js).
 * @param {Array} members
 * @returns {Map<string, Array>}
 */
function groupByCategory(members) {
  const map = new Map(CATEGORIES.map((c) => [c, []]));
  for (const m of members) {
    const cat = memberCategory(m);
    if (!map.has(cat)) map.set(cat, [m]);
    else map.get(cat).push(m);
  }
  // Remove empty groups
  for (const [key, val] of map) {
    if (val.length === 0) map.delete(key);
  }
  return map;
}

/**
 * Render the grid view. With the default role sort and no category
 * filter, each category is its own group with its own pager when it
 * grows past one page. Every other combination (A-Z, Newest, search or
 * a filter chip) is one flat list with a single pager.
 * @param {Array} members
 * @param {Element} container
 */
function renderGrid(members, container) {
  if (members.length === 0) {
    container.innerHTML = `
      <div class="members-empty">
        <p class="members-empty__title">No members found</p>
        <p>Try a different search or filter.</p>
      </div>`;
    return;
  }

  const grouped = currentSort === 'role' ? groupByCategory(members) : null;

  if (grouped && currentFilter === 'All') {
    let html = '';
    for (const [category, group] of grouped) {
      const pageCount = Math.max(1, Math.ceil(group.length / PAGE_SIZE));
      let page = gridCategoryPages.get(category) ?? 1;
      if (page > pageCount) page = pageCount;
      if (page < 1) page = 1;
      gridCategoryPages.set(category, page);

      const start = (page - 1) * PAGE_SIZE;
      const pageMembers = group.slice(start, start + PAGE_SIZE);
      const pager = pageCount > 1
        ? `
        <nav class="members-pagination members-pagination--group"
             aria-label="${escapeHTML(category)} pages"
             data-grid-category="${escapeHTML(category)}">
          ${pageButtonsHTML(page, pageCount, 'data-grid-page')}
        </nav>`
        : '';

      html += `<div class="member-group" data-category="${escapeHTML(category)}">
        <p class="member-group__heading">${escapeHTML(category)} <span style="color:var(--color-subtle)">(${group.length})</span></p>
        <div class="members-grid">${pageMembers.map((m) => renderMemberCard(m)).join('')}</div>${pager}
      </div>`;
    }
    container.innerHTML = html;
  } else {
    const pageCount = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
    if (gridPage > pageCount) gridPage = pageCount;
    if (gridPage < 1) gridPage = 1;
    const start = (gridPage - 1) * PAGE_SIZE;
    const pageMembers = members.slice(start, start + PAGE_SIZE);
    const pager = pageCount > 1
      ? `
      <nav class="members-pagination" aria-label="Member list pages">
        ${pageButtonsHTML(gridPage, pageCount, 'data-grid-page')}
      </nav>`
      : '';
    container.innerHTML = `<div class="members-grid">${pageMembers.map((m) => renderMemberCard(m)).join('')}</div>${pager}`;
  }
}

/**
 * Page numbers to show in the paging bar. Short lists show every page;
 * long lists collapse to first/last plus the pages around the current
 * one, with an ellipsis for the gaps.
 * @param {number} current
 * @param {number} total
 * @returns {Array<number|'…'>}
 */
function pageSequence(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const wanted = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => wanted.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => wanted.add(p));

  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

/**
 * Build the numbered page buttons for a paging bar. The current page is a
 * non-interactive dark pill; every other page is a button.
 * @param {number} current
 * @param {number} total
 * @param {string} pageAttr — data attribute carrying the page number
 * @returns {string}
 */
function pageButtonsHTML(current, total, pageAttr) {
  return pageSequence(current, total).map((p) => (
    p === '…'
      ? '<span class="members-pagination__gap" aria-hidden="true">…</span>'
      : p === current
        ? `<span class="btn btn--dark btn--sm members-pagination__page" aria-current="page">${p}</span>`
        : `<button class="btn btn--ghost btn--sm members-pagination__page" type="button"
                   ${pageAttr}="${p}" aria-label="Page ${p}">${p}</button>`
  )).join('');
}

/**
 * Scroll an element to the top of the viewport instantly, clear of the
 * sticky navbar. The site sets scroll-behavior: smooth globally, so it is
 * switched off for this one jump (also safe in older browsers that do not
 * know behavior: 'instant').
 * @param {Element|null} el
 */
function instantScrollTo(el) {
  if (!el) return;
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  el.scrollIntoView({ block: 'start' });
  root.style.scrollBehavior = previous;
}

/**
 * Render the table view: one page of rows (PAGE_SIZE) plus a numbered
 * paging bar when the list spans more than one page. Row numbers
 * continue across pages (#21 on page 2).
 * @param {Array} members
 * @param {Element} container
 */
function renderTable(members, container) {
  if (members.length === 0) {
    container.innerHTML = `
      <div class="members-empty">
        <p class="members-empty__title">No members found</p>
        <p>Try a different search or filter.</p>
      </div>`;
    return;
  }

  const pageCount = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  if (currentPage > pageCount) currentPage = pageCount;   // list shrank (search/filter)
  if (currentPage < 1) currentPage = 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = members.slice(start, start + PAGE_SIZE);

  const rows = pageRows.map((m, i) => renderMemberRow(m, start + i)).join('');
  const pagination = pageCount > 1
    ? `
    <nav class="members-pagination" aria-label="Member list pages">
      ${pageButtonsHTML(currentPage, pageCount, 'data-page')}
    </nav>`
    : '';

  container.innerHTML = `
    <div class="members-table-wrap">
      <table class="members-table">
        <thead>
          <tr>
            <th>#</th>
            <th>IGN</th>
            <th>Role</th>
            <th>UID</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>${pagination}`;
}

/**
 * Re-render whatever view is active.
 * @param {Element} container
 */
function rerender(container) {
  const filtered = getFiltered();
  if (viewMode === 'table') {
    renderTable(filtered, container);
  } else {
    renderGrid(filtered, container);
  }
}

/**
 * Main init: fetches data and wires all controls.
 */
export async function initMembersList() {
  const container  = qs('#members-list');
  const countEl    = qs('#members-count');
  const searchEl   = qs('#members-search');
  const sortEl     = qs('#members-sort');
  const viewToggle = qs('#members-view-toggle');
  const filterBtns = qsa('[data-filter]');

  if (!container) return;

  container.innerHTML = '<p class="state-loading">Loading members…</p>';

  try {
    allMembers = (await fetchJSON('/data/members.json')).members;
  } catch {
    container.innerHTML = '<p class="state-error">Could not load members. Please try again.</p>';
    return;
  }

  if (countEl) countEl.textContent = `${allMembers.length} members`;

  // Clicking a card or roster row opens the member's profile popup.
  initMemberModal();
  wireProfilePopups(container, () => allMembers);

  // Copy buttons are delegated from the container, so they only need to
  // be wired once even though the cards and rows are re-created.
  initCopyButtons(container);

  // Paging is delegated too: one listener serves the table pager, each
  // category pager and the flat grid pager after every re-render.
  container.addEventListener('click', (e) => {
    const tableBtn = e.target.closest('[data-page]');
    if (tableBtn) {
      currentPage = Number(tableBtn.dataset.page);
      rerender(container);
      instantScrollTo(container.querySelector('.members-table-wrap'));
      return;
    }

    const gridBtn = e.target.closest('[data-grid-page]');
    if (!gridBtn) return;

    const category = gridBtn.closest('.members-pagination')?.dataset.gridCategory;
    if (category) {
      gridCategoryPages.set(category, Number(gridBtn.dataset.gridPage));
    } else {
      gridPage = Number(gridBtn.dataset.gridPage);
    }
    rerender(container);

    if (category) {
      const groupEl = [...container.querySelectorAll('.member-group')]
        .find((group) => group.dataset.category === category);
      instantScrollTo(groupEl?.querySelector('.member-group__heading'));
    } else {
      instantScrollTo(container.querySelector('.members-grid'));
    }
  });

  // Initial render
  rerender(container);

  // Search
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      currentSearch = searchEl.value.trim();
      resetPages();
      rerender(container);
    });
  }

  // Sort
  if (sortEl) {
    sortEl.addEventListener('change', () => {
      currentSort = sortEl.value;
      resetPages();
      rerender(container);
    });
  }

  // Role filter chips
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('filter-chip--active'));
      btn.classList.add('filter-chip--active');
      currentFilter = btn.dataset.filter;
      resetPages();
      rerender(container);
    });
  });

  // Grid / Table toggle
  if (viewToggle) {
    viewToggle.addEventListener('click', () => {
      viewMode = viewMode === 'grid' ? 'table' : 'grid';
      viewToggle.textContent = viewMode === 'grid' ? 'Table view' : 'Grid view';
      resetPages();
      rerender(container);
    });
  }
}
