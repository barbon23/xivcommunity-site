# XIVCOMMUNITY

Static website for the XIVCOMMUNITY Call of Duty: Mobile clan.
Plain HTML, CSS, and vanilla JS — no build step, no frameworks, no CMS dependency.

All editable content lives in `/data/*.json` and is managed through a friendly
editor at **`/admin`** (Sveltia CMS) — see [EDITING.md](./EDITING.md) for the
non-technical editor guide. This README covers setup and architecture.

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

The `/admin` panel works locally too (create → preview), but sign-in only
works on the deployed site, where GitHub OAuth is configured.

---

## Folder structure

```
xivcommunity-site/
├── index.html          Home page (content rendered from data/content.json)
├── members.html        Member roster
├── blog.html           Blog list
├── post.html           Single post (reads ?slug=)
├── support.html        FAQ + contact
├── rules.html          Code of conduct (not editable in the CMS)
├── 404.html            Not found page
├── vercel.json         Vercel config (cleanUrls, cache headers)
├── robots.txt          /admin and /api are noindex/nofollow
├── sitemap.xml
│
├── admin/
│   ├── index.html      Sveltia CMS entry (CDN script, no build step)
│   └── config.yml      CMS configuration (collections, fields)
│
├── api/
│   ├── auth.js         OAuth step 1: redirect to GitHub with CSRF state
│   ├── callback.js     OAuth step 2: exchange code for token, post to CMS
│   └── _shared.js      Shared helpers (site-markdown: adapted sveltia-cms-auth)
│
├── assets/
│   ├── avatars/        Member avatar images (optional, .webp/.jpg)
│   ├── brand/          og.jpg (1200×630), logo.png
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
├── data/               JSON content — the editor's single source of truth
│   ├── config.json     Links (apply/discord/facebook/report/appeal/suggest) + email
│   ├── pages.json      Members/Blog/Support page titles & sub-titles
│   ├── content.json    Homepage: hero, blurbs, marquee, section labels, CTA, footer
│   ├── members.json
│   ├── posts.json      Blog posts (content is Markdown)
│   ├── testimonials.json
│   ├── achievements.json
│   ├── supporters.json
│   ├── faq.json
│   └── schedule.json
│
└── js/
    ├── config.js       Developer constants + link defaults (fallbacks)
    ├── main.js         Shared bootstrap (loads config/content, mounts navbar,
    │                   footer, page slots, homepage blocks, reveal)
    ├── components/     Navbar, footer, avatar-row, member-card
    ├── features/       site-content, page-content, members list, blog list/post,
    │                   schedule, reveal
    ├── pages/          Page entry files (import + wire up)
    └── utils/          dom.js, fetch-json.js, format.js, markdown.js
```

---

## First-time setup — make `/admin` work

The editor needs three things, all free:

### 1. A shared "editor" GitHub account

1. Create a new GitHub account, e.g. `xivcommunity-editor` (free).
2. Invite it to the repository (Settings → Collaborators → add the account).
3. The editor will sign in at `/admin` with this account only — they never see
   the GitHub website or any code.

### 2. A GitHub OAuth App

Do this while signed in to the **owner** account (the one that owns the repo):

1. Go to <https://github.com/settings/developers> → **New OAuth App**.
2. Fill in:
   - **Application name:** `XIVCOMMUNITY editor`
   - **Homepage URL:** `https://xivcommunity.gg` (your real domain)
   - **Authorization callback URL:** `https://xivcommunity.gg/api/callback` ← must match exactly
3. After creating, click **Generate a new client secret**, then copy both the
   **Client ID** and the **Client secret**.

### 3. Vercel environment variables

Vercel Dashboard → your project → **Settings → Environment Variables**, and add
two variables (available for Production):

| Name | Value |
|---|---|
| `GITHUB_CLIENT_ID` | the Client ID from step 2 |
| `GITHUB_CLIENT_SECRET` | the Client secret from step 2 |

Then **redeploy** (Deployments → latest → ⋯ → Redeploy). Optional extra
variables, only if you want them:

| Name | Purpose |
|---|---|
| `ALLOWED_DOMAINS` | lock sign-in popups to your domain, e.g. `xivcommunity.gg` |
| `GITHUB_ALLOW_WORKFLOW_SCOPE` | leave unset — the editor never needs it |

### 4. Check the CMS config

`admin/config.yml` already points at `barbon23/xivcommunity-site`. If your
production domain is NOT `xivcommunity.gg`, update the two marked lines:

```yaml
backend:
  base_url: https://yourdomain.tld/api    # ← your real domain + /api
site_url: https://yourdomain.tld          # ← your real domain
```

### 5. First sign-in

On the **editor's** device, go to `https://xivcommunity-site.vercel.app/admin`, choose
**Log in with GitHub**, and complete the flow once (GitHub may ask you to
authorize the OAuth app). Done — from then on, a refresh re-signs in.

---

## How sites render content

- `js/main.js` runs on every page: it loads `/data/config.json` (links) and
  `/data/content.json`, renders navbar/footer, fills every `[data-text-slot]`
  section header and every page-title slot from `/data/pages.json`, and points
  every `[data-href]` element at its configured link.
- On the homepage, `js/features/site-content.js` renders the hero, phone
  mockup, blurbs, marquee and final CTA into `#hero-content`, `#hero-media`,
  `#feature-blurbs`, `#marquee` and `#cta-block`.
- The HTML itself therefore contains **no editable copy** — page titles and
  OG/meta tags stay static (SEO), while everything an editor needs is in data.

### Data shapes

Every data file is an object whose single top-level key holds the array —
this is required so the CMS can manage it:

```json
{ "members": [ { "ign": "REVO", "role": "Founder", "uid": "8841023",
                "joinDate": "2021-03-15", "class": "Slayer",
                "verified": true, "avatar": "" } ] }
```

- `role` — one of 16 roles: `Founder`, `Community Master`, `Head Admin`, `Event Organizer`, `Moderator`, `Internal Affair`, `Tag Checker`, `Discipline & Warning`, `Recruiter`, `Graphics & Content`, `Leaderboard`, `Sponsor`, `Streamer`, `Content Creator`, `Compe`, `Casual`
- `category` — `X1V MANAGEMENT`, `X1V EXCLUSIVE` or `X1V MEMBER`, chosen per member in the CMS; the roster groups by it. When a member lacks the field, the site falls back to the role's default category (`roleCategory()` in `format.js`)
- `class` — one of `Slayer`, `OBJ`, `Support`, `Sniper`
- `verified` — `true` shows a checkmark badge
- `avatar` — `/assets/...` path (empty = initials fallback)
- `idCard` — `/assets/idcards/...` picture of the member's ID card (optional). The pop-up shows it under the bio — tap it to view full size, with a Download button — and hides its UID row while a card is shown, because the UID is in the picture

### Blog posts are Markdown

`posts.json` entries store `content` as **Markdown**, not HTML. It is rendered
client-side by `js/utils/markdown.js` (a small hand-written, XSS-safe
converter). Supported syntax: paragraphs, `##`/`###` headings, `**bold**`,
`*italic*`, `[links](https://…)`, unordered lists (`- `), ordered lists (`1. `).

Categories: `Announcements`, `Clan Wars`, `Tournaments`, `Guides`, `Patch Notes`, `Recruitment`.
A post without a `slug` still resolves — the URL falls back to the slugified title.

### Editing without the CMS

You can also edit the JSON files directly and push — the CMS panel is just a
friendly layer over the same files. Keep the top-level object shape when you
do, otherwise the CMS paths stop matching.

---

## Images

Screenshots and avatars are uploaded through the CMS and stored under
`/assets/`. Recommended: landscape ~1200–1400px wide `.webp`, avatars square
≥ 200×200. Cache headers for `/assets/screens` and `/assets/fonts` are set in
`vercel.json`.

---

## Deploy

The repo is already connected to Vercel — every push to `main` redeploys
automatically. No build command, no dependencies (`package.json` is only a
marker). Changes made in `/admin` commit to `main` and redeploy the same way;
data responses are served with `max-age=0, must-revalidate` so edits appear
within ~1 minute of saving.

## Updating the sitemap

`sitemap.xml` lists page-level URLs. Blog post slugs change as editors write
new posts; add them if you care about post-level sitemap entries. Page
references use `https://xivcommunity.gg/...`.

---

## Design system quick reference

All tokens are in `css/tokens.css`. Never hardcode colors or spacing elsewhere.

| Token | Value |
|---|---|
| `--color-ink` | `#0A0A0A` (primary text / dark bg) |
| `--color-muted` | `#737373` (secondary text) |
| `--color-subtle` | `#A3A3A3` (muted on dark backgrounds) |
| `--color-border` | `#E5E5E5` |
| `--color-surface` | `#F5F5F5` (alt section bg) |
| `--radius-card` | `16px` |
| `--radius-pill` | `999px` |
| `--space-1` | `8px` through `--space-12: 96px` |

Architecture rules: relative ES module imports, kebab-case filenames, BEM
classes, one small file per component, no build step.

---

## Browser support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge). ES modules,
`IntersectionObserver` and top-level fetch are used — IE is not supported.
