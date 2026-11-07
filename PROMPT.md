# PROMPT.md — Original build specification

This file preserves the original prompt used to generate this site,
so any future AI session can understand the intent and constraints.

---

## Project

**XIVCOMMUNITY** — Multi-page static website for a competitive  
Call of Duty: Mobile clan based in the Philippines.

**Goal:** Recruit new members, display the official roster (IGNs),  
publish clan news/blogs, and provide support.

---

## Design reference

Recreate the layout, pacing and restraint of https://www.tarsi.cloud/  
in strict black and white.

### What to copy from Tarsi
- Plain, confident copy: one H1, one supporting paragraph. No buzzwords.
- Navbar: logo + wordmark left, 4–5 plain text links, one button right.
- Hero: H1, short paragraph, primary buttons, social-proof avatar row, phone mockup.
- Three feature blurbs: title + one sentence + screenshot. NOT icon cards.
- Slow horizontal screenshot marquee, two rows.
- Achievements section: laurel-style badges with real results.
- "As featured in" row for partner clans / sponsors.
- Wall of member quotes with name and source tag.
- Final CTA with avatar row.
- Calm multi-column footer.
- Lots of whitespace, large type, rounded corners, thin soft borders.

### Palette
`#000`, `#0A0A0A`, `#141414`, `#262626`, `#737373`, `#A3A3A3`, `#E5E5E5`, `#F5F5F5`, `#FFF`

### Anti-slop rules (do NOT do any of these)
- No gradients, glow, blur/glassmorphism, neon, heavy shadows.
- No emoji, no icon-in-a-circle cards.
- No gimmick motion: no typing effects, particles, parallax, cursor effects.
- No gamer clichés: no camo, crosshairs, ELITE / DOMINATE / UNLEASH / LEVEL UP.
- No centered-everything layout.
- No lorem ipsum, no invented stats.
- One typeface (Inter), max 2 weights, generous line-height.
- One spacing scale (8px base), one radius system (16px cards / 999px pills).

---

## Tech constraints

- Plain static site: HTML, CSS, vanilla JS (ES modules).
- No frameworks, no build step, no npm dependencies, no backend.
- `vercel.json` with `cleanUrls: true`. Works without it too.
- Lighthouse 90+ across all four categories.

---

## Folder structure (exact)

```
index.html, members.html, blog.html, post.html,
support.html, rules.html, 404.html,
vercel.json, robots.txt, sitemap.xml, README.md, PROMPT.md

css/
  tokens.css, base.css, layout.css
  components/ button, navbar, footer, card, avatar-row,
              phone-frame, marquee, badge, accordion, form-controls
  pages/ home, members, blog, support

js/
  main.js, config.js
  components/ navbar, footer, avatar-row, member-card
  features/ members-list, blog-list, blog-post, schedule, reveal
  pages/ home, members, blog, post, support
  utils/ dom, fetch-json, format

data/
  members.json, posts.json, supporters.json,
  achievements.json, schedule.json, testimonials.json, faq.json

assets/
  icons/, avatars/, screens/, brand/, fonts/
```

---

## Pages

- **Home** — Hero, feature blurbs, marquee, achievements (black section),
  partners, members preview, latest posts, schedule, testimonials, CTA.
- **Members** — Roster grid/table, search, filter by role, sort, copy IGN.
- **Blog** — Card grid, search, category filter.
- **Post** — Single post from `?slug=`, dynamic `<title>`, prev/next nav.
- **Support** — FAQ accordion from `faq.json`, contact cards, quick links.
- **Rules** — Code of conduct with consequences.
- **404** — Simple not-found page.

---

## Data files

All content lives in `/data/*.json`. No hardcoded content in HTML or JS.

---

## config.js fields

`CLAN_NAME`, `CLAN_TAG`, `DISCORD_URL`, `FACEBOOK_URL`, `APPLY_URL`,
`REPORT_URL`, `APPEAL_URL`, `SUGGEST_URL`, `SUPPORT_EMAIL`, `TIMEZONE`,
`SITE_URL`, `STATS`
