/**
 * schedule.js — Fetch and render the weekly event schedule.
 * Times are stored in Asia/Manila and displayed in local time with a note.
 */

import { fetchJSON } from '../utils/fetch-json.js';
import { escapeHTML } from '../utils/format.js';
import { qs } from '../utils/dom.js';

const TYPE_LABELS = {
  'scrim':     'Scrim',
  'clan-war':  'Clan War',
  'casual':    'Casual',
  'training':  'Training',
};

/**
 * Convert a weekday + time string to a display time in local timezone.
 * We synthesize a Date for the next occurrence of that day.
 * @param {string} day   — e.g. "Monday"
 * @param {string} time  — e.g. "20:00"
 * @param {string} tz    — IANA timezone, e.g. "Asia/Manila"
 * @returns {string}     — formatted local time string
 */
function localTime(day, time, tz) {
  try {
    // Build a reference date string in the source timezone
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dayIdx = days.indexOf(day);
    if (dayIdx === -1) return time;

    const [h, m] = time.split(':').map(Number);
    const now = new Date();
    const diff = (dayIdx - now.getDay() + 7) % 7;
    const target = new Date(now);
    target.setDate(target.getDate() + diff);
    target.setHours(h, m, 0, 0);

    // Reinterpret as Manila time by adjusting for timezone offset difference
    const manilaStr = target.toLocaleString('en-US', { timeZone: tz });
    const manilaDate = new Date(manilaStr);
    const offsetMs = target.getTime() - manilaDate.getTime();
    const adjusted = new Date(target.getTime() + offsetMs);

    return adjusted.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return time + ' PHT';
  }
}

/**
 * Build a single schedule row.
 * @param {object} item
 * @returns {string}
 */
function renderRow(item) {
  const typeLabel = TYPE_LABELS[item.type] || item.type;
  const local     = localTime(item.day, item.time, item.timezone);

  return `
    <tr>
      <td class="schedule__day">${escapeHTML(item.day)}</td>
      <td class="schedule__time">${escapeHTML(item.time)} PHT</td>
      <td>${escapeHTML(item.event)}</td>
      <td><span class="tag">${escapeHTML(typeLabel)}</span></td>
      <td style="color:var(--color-muted)">${escapeHTML(item.description)}</td>
    </tr>
  `;
}

/**
 * Main init: fetches schedule.json and renders into #schedule-table.
 */
export async function initSchedule() {
  const container = qs('#schedule-table');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="5" class="schedule__empty">Loading…</td></tr>';

  try {
    const data = (await fetchJSON('/data/schedule.json')).schedule;

    if (!data.length) {
      container.innerHTML = '<tr><td colspan="5" class="schedule__empty">No events scheduled yet.</td></tr>';
      return;
    }

    const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    data.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

    container.innerHTML = data.map(renderRow).join('');
  } catch {
    container.innerHTML = '<tr><td colspan="5" class="schedule__empty">Could not load schedule.</td></tr>';
  }
}
