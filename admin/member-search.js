/**
 * member-search.js — Find a member inside the Sveltia Members roster editor.
 *
 * Sveltia has no search inside a complex List field, and its list items are
 * lazy rendered, so this script uses the saved roster as a search index and
 * jumps to the matching row by its position. It never hides rows or changes
 * the CMS data model, so drag-reorder and saving stay untouched.
 *
 * The script is deliberately self-contained and fails quietly if Sveltia's
 * markup changes: the editor keeps working, only the search bar is absent.
 */

(() => {
  'use strict';

  const DATA_URL = new URL('../data/members.json', document.baseURI);
  const CATEGORIES = ['XIV MANAGEMENT', 'X1V EXCLUSIVE', 'XIV MEMBER'];
  const BAR_ATTR = 'data-xiv-member-search';
  const HIT_CLASS = 'xiv-member-hit';
  const DEBOUNCE_MS = 90;
  const HIGHLIGHT_MS = 2600;

  /** @type {Array<{ ign: string, role: string, category: string, uid: string, haystack: string }>} */
  let index = [];
  let indexReady = false;
  let indexLoading = false;
  let dirty = false;
  let registeredSaveHook = false;
  let activeGroup = null;
  let observedList = null;
  /** @type {MutationObserver | null} */
  let listObserver = null;
  /** @type {HTMLElement | null} */
  let bar = null;
  /** @type {HTMLElement | null} */
  let highlighted = null;
  /** @type {number | null} */
  let highlightTimer = null;
  /** @type {number | null} */
  let ensureTimer = null;
  let suppressFocusOpen = false;
  let resultsIdCounter = 0;

  const state = {
    query: '',
    category: '',
    role: '',
    /** @type {Array<{ index: number, ign: string, role: string, category: string, uid: string }>} */
    results: [],
    active: -1,
    open: false,
  };

  /**
   * Tiny DOM builder. Static markup only; roster values are always added with
   * textContent so nothing from the data file is ever parsed as HTML.
   * @param {string} tag
   * @param {Record<string, string | boolean | number>} attrs
   * @param {Node[]} children
   * @returns {HTMLElement}
   */
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);

    Object.entries(attrs).forEach(([key, value]) => {
      if (value === false || value === null || value === undefined) return;
      if (key === 'class') node.className = String(value);
      else if (key === 'text') node.textContent = String(value);
      else node.setAttribute(key, value === true ? '' : String(value));
    });

    children.forEach((child) => {
      if (child) node.append(child);
    });

    return node;
  }

  /**
   * Match normal keyboard input against decorative Unicode IGNs. This is the
   * same normalization used by the public roster search.
   * @param {unknown} value
   * @returns {string}
   */
  function normalize(value) {
    return String(value === null || value === undefined ? '' : value)
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /** @param {string} query @returns {string[]} */
  function tokenize(query) {
    return normalize(query).split(' ').filter(Boolean);
  }

  /** @returns {boolean} */
  function hasFilters() {
    return Boolean(state.query.trim() || state.category || state.role);
  }

  /** @param {HTMLInputElement} input */
  function focusInputWithoutOpening(input) {
    suppressFocusOpen = true;
    input.focus({ preventScroll: true });
    suppressFocusOpen = false;
  }

  /**
   * @param {unknown} members
   * @returns {Array<{ ign: string, role: string, category: string, uid: string, haystack: string }>}
   */
  function buildIndex(members) {
    if (!Array.isArray(members)) return [];

    return members.map((raw) => {
      const member = raw && typeof raw === 'object' ? raw : {};
      const ign = String(member.ign || '');
      const uid = String(member.uid || '');

      return {
        ign,
        role: String(member.role || ''),
        category: String(member.category || ''),
        uid,
        haystack: normalize(`${ign} ${uid}`),
      };
    });
  }

  /** @param {HTMLElement | null} node @returns {boolean} */
  function isElement(node) {
    return Boolean(node && node.nodeType === 1);
  }

  /** @returns {HTMLElement | null} */
  function findMemberGroup() {
    const groups = Array.from(document.querySelectorAll('[data-field-type="list"]')).filter(
      (group) => group.querySelector('.item-list'),
    );

    const exact = groups.find((group) => {
      const path = group.getAttribute('data-key-path') || '';
      return path === 'members' || path.endsWith('.members');
    });
    if (exact) return /** @type {HTMLElement} */ (exact);

    const byLabel = groups.find((group) =>
      Array.from(group.querySelectorAll('h4')).some(
        (heading) => heading.textContent.trim() === 'Members',
      ),
    );
    if (byLabel) return /** @type {HTMLElement} */ (byLabel);

    const bySize = groups.find((group) => group.querySelectorAll('.item-wrapper').length >= 50);
    return bySize ? /** @type {HTMLElement} */ (bySize) : null;
  }

  /** @param {HTMLElement} group */
  function observeList(group) {
    const itemList = /** @type {HTMLElement | null} */ (group.querySelector('.item-list'));
    if (!itemList || observedList === itemList) return;

    if (listObserver) listObserver.disconnect();
    observedList = itemList;

    let firstPass = true;
    listObserver = new MutationObserver(() => {
      if (firstPass) {
        firstPass = false;
        return;
      }
      if (!indexReady) return;
      dirty = true;
      renderStatus();
    });
    listObserver.observe(itemList, { childList: true });
  }

  /** @param {unknown} entry */
  function setIndexFromEntry(entry) {
    try {
      const raw =
        entry && typeof entry.getIn === 'function'
          ? entry.getIn(['data', 'members'])
          : entry && entry.data && entry.data.members;
      const members = raw && typeof raw.toJS === 'function' ? raw.toJS() : raw;

      if (!Array.isArray(members)) return;

      index = buildIndex(members);
      indexReady = true;
      dirty = false;
      populateRoleOptions();
      refresh();
    } catch (error) {
      console.info('[xiv member search] Could not refresh from the saved entry.', error);
    }
  }

  function registerSaveHook() {
    if (registeredSaveHook) return;
    const cms = window.CMS;

    if (!cms || typeof cms.registerEventListener !== 'function') return;

    try {
      cms.registerEventListener({
        name: 'postSave',
        handler: ({ entry }) => setIndexFromEntry(entry),
      });
      registeredSaveHook = true;
    } catch (error) {
      console.info('[xiv member search] Could not register the save hook.', error);
    }
  }

  /** @param {{ force?: boolean }} options */
  async function loadIndex(options = {}) {
    if (indexLoading && !options.force) return;
    indexLoading = true;
    renderStatus();

    try {
      const response = await fetch(DATA_URL, {
        cache: options.force ? 'no-store' : 'default',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      index = buildIndex(data && data.members);
      indexReady = true;
      dirty = false;
      populateRoleOptions();
      refresh();
    } catch (error) {
      index = [];
      indexReady = false;
      console.info('[xiv member search] Roster index unavailable.', error);
      renderStatus();
    } finally {
      indexLoading = false;
      renderStatus();
    }
  }

  function populateRoleOptions() {
    const select = /** @type {HTMLSelectElement | null} */ (
      bar ? bar.querySelector('[data-xiv-role="role"]') : null
    );
    if (!select) return;

    const roles = Array.from(new Set(index.map((member) => member.role).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b),
    );

    const keep = select.value;
    select.textContent = '';

    const all = el('option', { value: '' });
    all.textContent = 'All roles';
    select.append(all);

    roles.forEach((role) => {
      const option = el('option', { value: role });
      option.textContent = role;
      select.append(option);
    });

    select.value = roles.includes(keep) ? keep : '';
    if (state.role && !roles.includes(state.role)) state.role = '';
  }

  function renderStatus() {
    const status = /** @type {HTMLElement | null} */ (
      bar ? bar.querySelector('[data-xiv-role="status"]') : null
    );
    const clear = /** @type {HTMLButtonElement | null} */ (
      bar ? bar.querySelector('[data-xiv-role="clear"]') : null
    );
    if (!status || !clear) return;

    clear.hidden = !hasFilters();

    let message;
    if (!indexReady) message = indexLoading ? 'Loading members...' : 'Search unavailable';
    else if (dirty) message = `${index.length} members - roster changed, save to refresh search`;
    else if (hasFilters()) message = `${state.results.length} of ${index.length} members found`;
    else message = `${index.length} members - search by IGN or UID`;

    status.textContent = message;
    status.setAttribute('data-dirty', String(indexReady && dirty));
  }

  function paintActive() {
    const panel = /** @type {HTMLElement | null} */ (
      bar ? bar.querySelector('[data-xiv-role="results"]') : null
    );
    const input = /** @type {HTMLInputElement | null} */ (
      bar ? bar.querySelector('[data-xiv-role="input"]') : null
    );
    if (!panel || !input) return;

    const options = Array.from(panel.querySelectorAll('[role="option"]'));
    options.forEach((option, optionIndex) => {
      const selected = optionIndex === state.active;
      option.classList.toggle('is-active', selected);
      option.setAttribute('aria-selected', String(selected));
    });

    const activeOption = state.active >= 0 ? options[state.active] : null;
    if (activeOption) {
      input.setAttribute('aria-activedescendant', activeOption.id);
      activeOption.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function renderResults() {
    const panel = /** @type {HTMLElement | null} */ (
      bar ? bar.querySelector('[data-xiv-role="results"]') : null
    );
    const input = /** @type {HTMLInputElement | null} */ (
      bar ? bar.querySelector('[data-xiv-role="input"]') : null
    );
    if (!panel || !input) return;

    panel.textContent = '';
    panel.hidden = !state.open || !hasFilters();
    input.setAttribute('aria-expanded', String(!panel.hidden));

    if (panel.hidden) {
      input.removeAttribute('aria-activedescendant');
      return;
    }

    if (!state.results.length) {
      panel.append(el('div', { class: 'xiv-member-search__empty', text: 'No members found' }));
      return;
    }

    const fragment = document.createDocumentFragment();

    state.results.forEach((member, resultIndex) => {
      const button = el('button', {
        class: 'xiv-member-search__result',
        type: 'button',
        role: 'option',
        id: `${panel.id}-option-${resultIndex}`,
        'aria-selected': 'false',
      });
      button.setAttribute('data-result-index', String(resultIndex));

      const position = el('span', {
        class: 'xiv-member-search__position',
        text: String(member.index + 1).padStart(2, '0'),
      });
      const name = el('span', {
        class: 'xiv-member-search__name',
        text: member.ign || '(no name)',
      });
      const meta = el('span', {
        class: 'xiv-member-search__meta',
        text: [member.role, member.category].filter(Boolean).join(' - '),
      });

      button.append(position, name, meta);
      button.addEventListener('click', () => jumpTo(resultIndex));
      fragment.append(button);
    });

    panel.append(fragment);
    paintActive();
  }

  /** @param {{ open?: boolean }} options */
  function refresh(options = {}) {
    if (!bar) return;
    if (typeof options.open === 'boolean') state.open = options.open;

    if (indexReady) {
      const tokens = tokenize(state.query);
      state.results = index
        .map((member, memberIndex) => ({ ...member, index: memberIndex }))
        .filter(
          (member) =>
            (!state.category || member.category === state.category) &&
            (!state.role || member.role === state.role) &&
            tokens.every((token) => member.haystack.includes(token)),
        );
      if (state.active >= state.results.length) state.active = state.results.length ? 0 : -1;
    } else {
      state.results = [];
      state.active = -1;
    }

    renderResults();
    renderStatus();
  }

  /** @param {KeyboardEvent} event */
  function handleInputKeydown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!state.open) refresh({ open: true });
      if (!state.results.length) return;

      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const current = state.active;
      state.active = current < 0 ? (direction > 0 ? 0 : state.results.length - 1) : (current + direction + state.results.length) % state.results.length;
      paintActive();
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      if (!state.open || !state.results.length) return;
      event.preventDefault();
      state.active = event.key === 'Home' ? 0 : state.results.length - 1;
      paintActive();
      return;
    }

    if (event.key === 'Enter') {
      if (!state.open || !state.results.length) return;
      event.preventDefault();
      jumpTo(state.active >= 0 ? state.active : 0);
      return;
    }

    if (event.key === 'Escape' && state.open) {
      event.preventDefault();
      refresh({ open: false });
    }
  }

  /** @param {number} resultIndex */
  function jumpTo(resultIndex) {
    const result = state.results[resultIndex];
    if (!result || !activeGroup) return;

    const itemList = /** @type {HTMLElement | null} */ (activeGroup.querySelector('.item-list'));
    if (!itemList) return;

    const wasCollapsed = itemList.classList.contains('collapsed');
    if (wasCollapsed) {
      const expander = /** @type {HTMLButtonElement | null} */ (
        activeGroup.querySelector(
          '.toolbar.top button[aria-controls$="-item-list"][aria-expanded="false"]',
        )
      );
      expander?.click();
    }

    const move = () => {
      const wrappers = Array.from(itemList.children).filter((child) =>
        child.classList.contains('item-wrapper'),
      );
      const wrapper = /** @type {HTMLElement | undefined} */ (wrappers[result.index]);
      if (!wrapper) return;

      if (highlighted) highlighted.classList.remove(HIT_CLASS);
      if (highlightTimer !== null) window.clearTimeout(highlightTimer);

      highlighted = wrapper;
      wrapper.classList.add(HIT_CLASS);
      wrapper.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
      });

      highlightTimer = window.setTimeout(() => {
        wrapper.classList.remove(HIT_CLASS);
        if (highlighted === wrapper) highlighted = null;
        highlightTimer = null;
      }, HIGHLIGHT_MS);
    };

    if (wasCollapsed) window.setTimeout(move, 80);
    else move();

    refresh({ open: false });

    const input = /** @type {HTMLInputElement | null} */ (
      bar ? bar.querySelector('[data-xiv-role="input"]') : null
    );
    if (input) focusInputWithoutOpening(input);
  }

  /** @returns {HTMLElement} */
  function createBar() {
    resultsIdCounter += 1;
    const resultsId = `xiv-member-search-results-${resultsIdCounter}`;

    const wrap = el('div', { class: 'xiv-member-search' });
    wrap.setAttribute(BAR_ATTR, '');

    const icon = el('span', {
      class: 'xiv-member-search__icon',
      'aria-hidden': 'true',
    });
    icon.innerHTML =
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="m16 16 5 5"></path></svg>';

    const input = el('input', {
      class: 'xiv-member-search__input',
      type: 'search',
      placeholder: 'Find a member by IGN or UID',
      autocomplete: 'off',
      spellcheck: 'false',
      role: 'combobox',
      'aria-label': 'Find a member by IGN or UID',
      'aria-controls': resultsId,
      'aria-expanded': 'false',
      'aria-autocomplete': 'list',
    });
    input.setAttribute('data-xiv-role', 'input');

    const searchLabel = el(
      'label',
      { class: 'xiv-member-search__field xiv-member-search__field--search' },
      [
        icon,
        el('span', { class: 'xiv-member-search__sr', text: 'Find a member' }),
        input,
      ],
    );

    const categorySelect = el('select', {
      class: 'xiv-member-search__select',
      'aria-label': 'Filter by category',
    });
    categorySelect.setAttribute('data-xiv-role', 'category');
    const allCategories = el('option', { value: '' });
    allCategories.textContent = 'All categories';
    categorySelect.append(allCategories);
    CATEGORIES.forEach((category) => {
      const option = el('option', { value: category });
      option.textContent = category;
      categorySelect.append(option);
    });

    const roleSelect = el('select', {
      class: 'xiv-member-search__select',
      'aria-label': 'Filter by role',
    });
    roleSelect.setAttribute('data-xiv-role', 'role');
    const allRoles = el('option', { value: '' });
    allRoles.textContent = 'All roles';
    roleSelect.append(allRoles);

    const categoryLabel = el('label', { class: 'xiv-member-search__field' }, [
      el('span', { class: 'xiv-member-search__sr', text: 'Category' }),
      categorySelect,
    ]);
    const roleLabel = el('label', { class: 'xiv-member-search__field' }, [
      el('span', { class: 'xiv-member-search__sr', text: 'Role' }),
      roleSelect,
    ]);

    const clear = el('button', {
      class: 'xiv-member-search__clear',
      type: 'button',
      text: 'Clear',
      hidden: true,
    });
    clear.setAttribute('data-xiv-role', 'clear');

    const status = el('div', {
      class: 'xiv-member-search__status',
      'aria-live': 'polite',
    });
    status.setAttribute('data-xiv-role', 'status');

    const results = el('div', {
      class: 'xiv-member-search__results',
      id: resultsId,
      role: 'listbox',
      'aria-label': 'Member search results',
      hidden: true,
    });
    results.setAttribute('data-xiv-role', 'results');

    const row = el('div', { class: 'xiv-member-search__row' }, [
      searchLabel,
      categoryLabel,
      roleLabel,
      clear,
    ]);

    wrap.append(row, status, results);

    let inputTimer = null;
    input.addEventListener('input', () => {
      const value = input.value;
      if (inputTimer !== null) window.clearTimeout(inputTimer);
      inputTimer = window.setTimeout(() => {
        state.query = value;
        state.active = -1;
        refresh({ open: hasFilters() });
        inputTimer = null;
      }, DEBOUNCE_MS);
    });

    input.addEventListener('focus', () => {
      if (suppressFocusOpen) return;
      if (hasFilters()) refresh({ open: true });
    });
    input.addEventListener('keydown', handleInputKeydown);

    categorySelect.addEventListener('change', () => {
      state.category = categorySelect.value;
      state.active = 0;
      refresh({ open: hasFilters() });
    });

    roleSelect.addEventListener('change', () => {
      state.role = roleSelect.value;
      state.active = 0;
      refresh({ open: hasFilters() });
    });

    clear.addEventListener('click', () => {
      input.value = '';
      categorySelect.value = '';
      roleSelect.value = '';
      state.query = '';
      state.category = '';
      state.role = '';
      state.active = -1;
      refresh({ open: false });
      focusInputWithoutOpening(input);
    });

    populateRoleOptions();
    return wrap;
  }

  function ensureBar() {
    registerSaveHook();

    const group = findMemberGroup();
    if (!group) return;
    if (activeGroup !== group) activeGroup = group;
    observeList(group);

    const toolbar = /** @type {HTMLElement | null} */ (group.querySelector('.toolbar.top'));
    if (!toolbar) return;

    const existing = /** @type {HTMLElement | null} */ (toolbar.querySelector(`[${BAR_ATTR}]`));
    if (existing) {
      if (bar !== existing) bar = existing;
      populateRoleOptions();
      refresh({ open: state.open && hasFilters() });
      return;
    }

    if (!bar || !bar.isConnected) bar = createBar();
    toolbar.append(bar);

    if (!indexReady && !indexLoading) loadIndex();
    refresh({ open: state.open && hasFilters() });
  }

  /** @param {PointerEvent} event */
  function handleDocumentPointerDown(event) {
    if (!state.open || !bar) return;
    if (isElement(event.target) && bar.contains(event.target)) return;
    refresh({ open: false });
  }

  function init() {
    registerSaveHook();

    const observer = new MutationObserver((mutations) => {
      const relevant = mutations.some((mutation) =>
        [...mutation.addedNodes, ...mutation.removedNodes].some(
          (node) =>
            isElement(/** @type {Node} */ (node)) &&
            (node.matches(
              `[data-field-type="list"], .toolbar.top, .item-list, [${BAR_ATTR}]`,
            ) || Boolean(node.querySelector?.('.item-list'))),
        ),
      );
      if (!relevant) return;

      if (ensureTimer !== null) window.clearTimeout(ensureTimer);
      ensureTimer = window.setTimeout(ensureBar, 80);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener('pointerdown', handleDocumentPointerDown, true);
    ensureBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
