/**
 * config.js — Developer constants + editor-managed link defaults.
 *
 * Developer-side values (rarely change):
 *   CLAN_NAME, CLAN_TAG, TIMEZONE, SITE_URL
 *
 * Editor-side values live in /data/config.json and can be changed from the
 * /admin panel without touching code. They are merged over DEFAULT_LINKS
 * at startup, with a fallback if the fetch fails or is slow.
 */

import { fetchJSON } from './utils/fetch-json.js';

const CONFIG = {
  /** Clan display name */
  CLAN_NAME: 'XIVCOMMUNITY',

  /** Short clan tag shown in the in-game clan list */
  CLAN_TAG: '[XIV]',

  /** Primary timezone for all events (IANA format) */
  TIMEZONE: 'Asia/Manila',

  /** Site URL (no trailing slash) — used for OG tags and sitemap */
  SITE_URL: 'https://xivcommunity.gg',
};

/** Fallback values, used if /data/config.json can't be loaded. */
const DEFAULT_LINKS = {
  applyUrl:     'https://discord.gg/xivcommunity',
  discordUrl:   'https://discord.gg/xivcommunity',
  facebookUrl:  'https://www.facebook.com/xivcommunity',
  reportUrl:    'https://discord.gg/xivcommunity',
  appealUrl:    'https://discord.gg/xivcommunity',
  suggestUrl:   'https://discord.gg/xivcommunity',
  supportEmail: 'support@xivcommunity.gg',
};

let runtimeLinks = null;

/**
 * Load the editor-managed links, merged over the defaults.
 * Safe to call multiple times — the result is cached.
 * @returns {Promise<object>}
 */
export async function loadConfig() {
  if (runtimeLinks) return runtimeLinks;

  try {
    const data = await Promise.race([
      fetchJSON('/data/config.json'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('config fetch timeout')), 1500)
      ),
    ]);
    runtimeLinks = { ...DEFAULT_LINKS, ...data };
  } catch {
    runtimeLinks = { ...DEFAULT_LINKS };
  }

  return runtimeLinks;
}

/**
 * Access the resolved links synchronously (defaults until loadConfig resolves).
 * @returns {object}
 */
export function getConfig() {
  return runtimeLinks ?? DEFAULT_LINKS;
}

export default CONFIG;
