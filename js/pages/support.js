/**
 * support.js — Page entry file for support.html.
 * Fetches FAQ from faq.json and renders the accordion.
 */

import { fetchJSON } from '../utils/fetch-json.js';
import { escapeHTML } from '../utils/format.js';
import { qs } from '../utils/dom.js';

async function initFAQ() {
  const container = qs('#faq-accordion');
  if (!container) return;

  container.innerHTML = '<p class="state-loading">Loading…</p>';

  try {
    const data = (await fetchJSON('/data/faq.json')).faq;

    if (!data.length) {
      container.innerHTML = '<p>No FAQ items yet.</p>';
      return;
    }

    container.innerHTML = data.map(item => `
      <details class="accordion__item">
        <summary>
          ${escapeHTML(item.question)}
          <svg class="accordion__icon" viewBox="0 0 20 20" fill="none"
               xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </summary>
        <div class="accordion__body">
          <p>${escapeHTML(item.answer)}</p>
        </div>
      </details>
    `).join('');

  } catch {
    container.innerHTML = '<p class="state-error">Could not load FAQ. Please try again.</p>';
  }
}

initFAQ();
