/**
 * fetch-json.js — Fetch JSON data with error and empty-state handling.
 * All data fetches in the app go through this module.
 */

/**
 * Fetch a JSON file and return its parsed content.
 * Throws a typed error on network failure or bad status.
 *
 * @param {string} url  — Path to JSON file, e.g. '/data/members.json'
 * @returns {Promise<any>}
 */
export async function fetchJSON(url) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new FetchError(`Network error fetching ${url}`, 'network');
  }

  if (!response.ok) {
    throw new FetchError(
      `Failed to load ${url} (${response.status})`,
      'http',
      response.status
    );
  }

  try {
    return await response.json();
  } catch {
    throw new FetchError(`Invalid JSON in ${url}`, 'parse');
  }
}

/**
 * Fetch JSON and render into a container element.
 * Handles loading, error, and empty states automatically.
 *
 * @param {object} options
 * @param {string}   options.url           — JSON file path
 * @param {Element}  options.container     — DOM element to render into
 * @param {Function} options.render        — (data) => HTML string or Node
 * @param {string}   [options.emptyHTML]   — HTML shown when array is empty
 * @param {string}   [options.errorHTML]   — HTML shown on fetch failure
 * @param {string}   [options.loadingHTML] — HTML shown while loading
 */
export async function fetchAndRender({
  url,
  container,
  render,
  emptyHTML = '<p class="state-empty">Nothing here yet.</p>',
  errorHTML = '<p class="state-error">Could not load data. Please try again later.</p>',
  loadingHTML = '<p class="state-loading">Loading…</p>',
}) {
  if (!container) return;

  container.innerHTML = loadingHTML;

  try {
    const data = await fetchJSON(url);

    const isEmpty = Array.isArray(data) && data.length === 0;
    if (isEmpty) {
      container.innerHTML = emptyHTML;
      return;
    }

    const result = render(data);
    if (typeof result === 'string') {
      container.innerHTML = result;
    } else if (result instanceof Node) {
      container.innerHTML = '';
      container.appendChild(result);
    }
  } catch (err) {
    console.error('[fetchAndRender]', err.message);
    container.innerHTML = errorHTML;
  }
}

/** Typed fetch error */
export class FetchError extends Error {
  constructor(message, type, status) {
    super(message);
    this.name = 'FetchError';
    this.type = type;    // 'network' | 'http' | 'parse'
    this.status = status;
  }
}
