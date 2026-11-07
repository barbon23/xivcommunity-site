# XIVCOMMUNITY

Static website for the XIVCOMMUNITY Call of Duty: Mobile clan.  
Plain HTML, CSS, and vanilla JS — no build step, no frameworks.

---

## Local preview

ES modules and `fetch()` require a local server (browsers block them from `file://`).

```bash
# Option 1: npx serve (recommended)
npx serve .

# Option 2: Python
python -m http.server 8000

# Option 3: VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then open `http://localhost:3000` (or whichever port is shown).

---

## Folder structure

```
xivcommunity-site/
├── index.html          Home page
├── members.html        Member roster
├── blog.html           Blog list
├── post.html           Single post (reads ?slug=)
├── support.html        FAQ + contact
├── rules.html          Code of conduct
├── 404.html            Not found page
├── vercel.json         Vercel config (cleanUrls, cache headers)
├── robots.txt
├── sitemap.xml
│
├── assets/
│   ├── avatars/        Member avatar images (optional, .webp/.jpg)
│   ├── brand/          og.jpg (1200×630), logo.svg, wordmark.svg
│   ├── fonts/          inter-latin-var.woff2
│   └── screens/        shot-01.webp … shot-10.webp (gameplay screenshots)
│
├── css/
│   ├── tokens.css      All design tokens (colors, spacing, radii, type)
│   ├── base.css        Reset + font-face + global typography
│   ├── layout.css      Container, section, grid helpers
│   ├── components/     One file per component
│   └── pages/          Page-specific styles
│
├── data/               JSON content (edit these, not the HTML)
│   ├── members.json
│   ├── posts.json
│   ├── supporters.json
│   ├── achievements.json
│   ├── schedule.json
│   ├── testimonials.json
│   └── faq.json
│
└── js/
    ├── config.js       Site-wide settings (clan name, URLs, stats)
    ├── main.js         Shared bootstrap (navbar + footer + reveal)
    ├── components/     Navbar, footer, avatar-row, member-card
    ├── features/       Members list, blog list/post, schedule, reveal
    ├── pages/          Page entry files (import + wire up)
    └── utils/          dom.js, fetch-json.js, format.js
```

---

## How to edit config

Open `js/config.js` and update any value:

```js
const CONFIG = {
  CLAN_NAME:    'XIVCOMMUNITY',
  CLAN_TAG:     '[XIV]',
  DISCORD_URL:  'https://discord.gg/your-invite',
  FACEBOOK_URL: 'https://www.facebook.com/yourpage',
  APPLY_URL:    'https://your-apply-form-url',
  REPORT_URL:   'https://your-report-form-url',
  APPEAL_URL:   'https://your-appeal-form-url',
  SUGGEST_URL:  'https://your-suggest-form-url',
  SUPPORT_EMAIL:'support@yourdomain.gg',
  SITE_URL:     'https://yourdomain.gg',
  STATS: {
    memberCount: 20,
    clanWarsPlayed: 87,
    winRate: 74,
    seasonFounded: 'S3 2021',
  },
};
```

---

## How to add a member

Open `data/members.json` and append a new object to the array:

```json
{
  "id": 21,
  "ign": "YourIGN",
  "role": "Member",
  "uid": "1234567",
  "joinDate": "2026-12-01",
  "class": "Slayer",
  "verified": true,
  "avatar": ""
}
```

**Fields:**
- `role` — one of: `Leader`, `Co-Leader`, `Officer`, `Member`, `Recruit`
- `class` — one of: `Slayer`, `OBJ`, `Support`, `Sniper`
- `verified` — `true` shows a checkmark badge
- `avatar` — path to image in `/assets/avatars/` (leave empty for initials fallback)

---

## How to add a blog post

Open `data/posts.json` and add a new object. The newest post by date appears first:

```json
{
  "slug": "your-post-slug",
  "title": "Your Post Title",
  "date": "2026-12-15",
  "category": "Announcements",
  "author": "XIV_Cipher",
  "excerpt": "One or two sentences that appear on the blog card.",
  "cover": "/assets/screens/shot-05.webp",
  "readingTime": 3,
  "content": "<p>Your post HTML here.</p><h2>Section heading</h2><p>More content.</p>"
}
```

**Categories:** `Announcements`, `Clan Wars`, `Tournaments`, `Guides`, `Patch Notes`, `Recruitment`

The post is immediately accessible at `/post.html?slug=your-post-slug`.

---

## How to replace screenshots

Drop `.webp` files (recommended) or `.jpg` into `/assets/screens/`.  
The filenames used in `index.html` are `shot-01.webp` through `shot-10.webp`.  
Update `index.html` marquee `src` attributes if you add more or rename files.

For best performance:
- Resize to 1080px wide max
- Export as `.webp` at quality 80
- Add `width` and `height` attributes matching the actual dimensions

---

## How to add member avatars

1. Add a square image (at least 80×80px) to `/assets/avatars/` — e.g. `cipher.webp`
2. In `data/members.json`, set the member's `"avatar"` field to `/assets/avatars/cipher.webp`

If the avatar field is empty, an initials circle is shown automatically.

---

## Deploy to Vercel

### Option A — GitHub import (recommended)
1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Leave all settings as default (no build command needed)
4. Click Deploy

### Option B — Vercel CLI
```bash
npm install -g vercel
vercel
```
Follow the prompts. No build settings required.

### After deploying
- Update `SITE_URL` in `js/config.js` to your real domain
- Update all `https://xivcommunity.gg/` references in `sitemap.xml` to your domain
- If you have a custom domain, add it in the Vercel project settings

---

## Updating the sitemap

When you add new blog posts, add their slugs to `sitemap.xml`:

```xml
<url>
  <loc>https://yourdomain.gg/post?slug=your-post-slug</loc>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

---

## Design system quick reference

All tokens are in `css/tokens.css`. Never hardcode colors or spacing elsewhere.

| Token | Value |
|---|---|
| `--color-ink` | `#0A0A0A` (primary text / dark bg) |
| `--color-muted` | `#737373` (secondary text) |
| `--color-border` | `#E5E5E5` |
| `--color-surface` | `#F5F5F5` (alt section bg) |
| `--radius-card` | `16px` |
| `--radius-pill` | `999px` |
| `--space-1` | `8px` through `--space-12: 96px` |

---

## Browser support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge). ES modules and `IntersectionObserver` are used — IE is not supported.
