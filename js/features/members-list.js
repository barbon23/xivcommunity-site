/**
 * members-list.js — Fetch, filter, sort and render the member roster.
 * Handles search, role filter, sort, grid/table toggle, and group-by-role.
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
let currentPage = 1;   // table view page, reset by search/sort/filter/toggle
const TABLE_PAGE_SIZE = 20;  // rows per page in the table view

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
    const q = currentSearch.toLowerCase();
    list = list.filter(m => m.ign.toLowerCase().includes(q));
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
 * Render the grid view, grouped by role.
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
      html += `<div class="member-group">
        <p class="member-group__heading">${escapeHTML(category)} <span style="color:var(--color-subtle)">(${group.length})</span></p>
        <div class="members-grid">${group.map((m) => renderMemberCard(m)).join('')}</div>
      </div>`;
    }
    container.innerHTML = html;
  } else {
    container.innerHTML = `<div class="members-grid">${members.map((m) => renderMemberCard(m)).join('')}</div>`;
  }

  initCopyButtons(container);
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
 * Render the table view: one page of rows (TABLE_PAGE_SIZE) plus a
 * numbered paging bar when the list spans more than one page. Row
 * numbers continue across pages (#21 on page 2).
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

  const pageCount = Math.max(1, Math.ceil(members.length / TABLE_PAGE_SIZE));
  if (currentPage > pageCount) currentPage = pageCount;   // list shrank (search/filter)
  if (currentPage < 1) currentPage = 1;
  const start = (currentPage - 1) * TABLE_PAGE_SIZE;
  const pageRows = members.slice(start, start + TABLE_PAGE_SIZE);

  const rows = pageRows.map((m, i) => renderMemberRow(m, start + i)).join('');
  const pagination = pageCount > 1
    ? `
    <nav class="members-pagination" aria-label="Member list pages">
      ${pageSequence(currentPage, pageCount).map((p) => (
        p === '…'
          ? '<span class="members-pagination__gap" aria-hidden="true">…</span>'
          : p === currentPage
            ? `<span class="btn btn--dark btn--sm members-pagination__page" aria-current="page">${p}</span>`
            : `<button class="btn btn--ghost btn--sm members-pagination__page" type="button"
                       data-page="${p}" aria-label="Page ${p}">${p}</button>`
      )).join('')}
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
  initCopyButtons(container);

  const bar = container.querySelector('.members-pagination');
  if (bar) {
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (!btn) return;
      currentPage = Number(btn.dataset.page);
      rerender(container);
      // Land on the top of the new page, clear of the sticky navbar.
      // The site sets scroll-behavior: smooth globally; switch it off for
      // this one jump so paging is instant (and older browsers that do
      // not know behavior: 'instant' are safe too).
      const wrap = container.querySelector('.members-table-wrap');
      if (wrap) {
        const root = document.documentElement;
        const previous = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        wrap.scrollIntoView({ block: 'start' });
        root.style.scrollBehavior = previous;
      }
    });
  }
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

  // Initial render
  rerender(container);

  // Search
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      currentSearch = searchEl.value.trim();
      currentPage = 1;
      rerender(container);
    });
  }

  // Sort
  if (sortEl) {
    sortEl.addEventListener('change', () => {
      currentSort = sortEl.value;
      currentPage = 1;
      rerender(container);
    });
  }

  // Role filter chips
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('filter-chip--active'));
      btn.classList.add('filter-chip--active');
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      rerender(container);
    });
  });

  // Grid / Table toggle
  if (viewToggle) {
    viewToggle.addEventListener('click', () => {
      viewMode = viewMode === 'grid' ? 'table' : 'grid';
      viewToggle.textContent = viewMode === 'grid' ? 'Table view' : 'Grid view';
      currentPage = 1;
      rerender(container);
    });
  }
}
