/**
 * members-list.js — Fetch, filter, sort and render the member roster.
 * Handles search, role filter, sort, grid/table toggle, and group-by-role.
 */

import { fetchJSON } from '../utils/fetch-json.js';
import { escapeHTML, roleWeight } from '../utils/format.js';
import { renderMemberCard, renderMemberRow, initCopyButtons } from '../components/member-card.js';
import { initMemberModal, wireProfilePopups } from '../components/member-modal.js';
import { qs, qsa } from '../utils/dom.js';

/** @type {Array} */
let allMembers = [];
let currentFilter = 'All';
let currentSort = 'role';
let currentSearch = '';
let viewMode = 'grid'; // 'grid' | 'table'

/**
 * Apply current filter, sort and search to allMembers.
 * @returns {Array}
 */
function getFiltered() {
  let list = [...allMembers];

  if (currentFilter !== 'All') {
    list = list.filter(m => m.role === currentFilter);
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
 * Group members by role for the grid view.
 * @param {Array} members
 * @returns {Map<string, Array>}
 */
function groupByRole(members) {
  const order = ['Founder', 'Head Admin', 'Leader', 'Co-Leader', 'Officer', 'Member', 'Recruit'];
  const map = new Map(order.map(r => [r, []]));
  for (const m of members) {
    if (map.has(m.role)) map.get(m.role).push(m);
    else map.set(m.role, [m]);
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

  const grouped = currentSort === 'role' ? groupByRole(members) : null;

  if (grouped && currentFilter === 'All') {
    let html = '';
    for (const [role, group] of grouped) {
      html += `<div class="role-group">
        <p class="role-group__heading">${escapeHTML(role)} <span style="color:var(--color-subtle)">(${group.length})</span></p>
        <div class="members-grid">${group.map((m) => renderMemberCard(m, { hideRole: true })).join('')}</div>
      </div>`;
    }
    container.innerHTML = html;
  } else {
    container.innerHTML = `<div class="members-grid">${members.map((m) => renderMemberCard(m)).join('')}</div>`;
  }

  initCopyButtons(container);
}

/**
 * Render the table view.
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

  const rows = members.map((m, i) => renderMemberRow(m, i)).join('');
  container.innerHTML = `
    <div class="members-table-wrap">
      <table class="members-table">
        <thead>
          <tr>
            <th>#</th>
            <th>IGN</th>
            <th>Role</th>
            <th>Class</th>
            <th>UID</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  initCopyButtons(container);
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
      rerender(container);
    });
  }

  // Sort
  if (sortEl) {
    sortEl.addEventListener('change', () => {
      currentSort = sortEl.value;
      rerender(container);
    });
  }

  // Role filter chips
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('filter-chip--active'));
      btn.classList.add('filter-chip--active');
      currentFilter = btn.dataset.filter;
      rerender(container);
    });
  });

  // Grid / Table toggle
  if (viewToggle) {
    viewToggle.addEventListener('click', () => {
      viewMode = viewMode === 'grid' ? 'table' : 'grid';
      viewToggle.textContent = viewMode === 'grid' ? 'Table view' : 'Grid view';
      rerender(container);
    });
  }
}
