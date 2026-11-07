/**
 * config.js — Single source of truth for site-wide settings.
 * Edit this file to update clan name, links, and stats.
 * All values are strings unless noted.
 */

const CONFIG = {
  /** Clan display name */
  CLAN_NAME: 'XIVCOMMUNITY',

  /** Short clan tag shown in the in-game clan list */
  CLAN_TAG: '[XIV]',

  /** Discord server invite link */
  DISCORD_URL: 'https://discord.gg/xivcommunity',

  /** Facebook group or page URL */
  FACEBOOK_URL: 'https://www.facebook.com/xivcommunity',

  /** Application form URL (Google Form, Discord, etc.) */
  APPLY_URL: 'https://discord.gg/xivcommunity',

  /** Player report form URL */
  REPORT_URL: 'https://discord.gg/xivcommunity',

  /** Kick/ban appeal form URL */
  APPEAL_URL: 'https://discord.gg/xivcommunity',

  /** Suggestion box form URL */
  SUGGEST_URL: 'https://discord.gg/xivcommunity',

  /** Support email address */
  SUPPORT_EMAIL: 'support@xivcommunity.gg',

  /** Primary timezone for all events (IANA format) */
  TIMEZONE: 'Asia/Manila',

  /** Site URL (no trailing slash) — used for OG tags and sitemap */
  SITE_URL: 'https://xivcommunity.gg',

  /**
   * Editable stat numbers shown on the home page.
   * Update these as the clan grows.
   */
  STATS: {
    memberCount: 20,
    clanWarsPlayed: 87,
    winRate: 74,   // percentage
    seasonFounded: 'S3 2021',
  },
};

export default CONFIG;
