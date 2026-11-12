# How to edit the XIVCOMMUNITY website

**Use this guide every time you want to change something. You never need to touch code.**

---

## 1. Opening the editor

1. Go to **https://xivcommunity-site.vercel.app/admin** (the same address, plus `/admin`).
2. Click **Log in with GitHub**.
3. Sign in with the shared editor account (the one saved on your device).
4. You will see a list of sections on the left:
   **Homepage · Page headings · Important links · Members · Blog Posts · Testimonials · FAQ · Weekly Schedule · Achievements · Partners**

> Didn't save it? Bookmark this page. You only need the website address and the
> editor account — nothing else.

---

## 2. Changing something on the homepage

1. Click **Homepage** → **Homepage text & images**.
2. Everything is organised in blocks, top-to-bottom, in the same order the
   page shows them:
   - **Hero** — the big black area at the very top (heading, description,
     buttons, phone screenshot).
   - **Feature blurbs** — the three numbered "why join" blocks.
   - **Screenshot marquee** — the two scrolling rows of gameplay screenshots.
   - **Section labels & headings** — the small labels and big headings above
     every section (achievements, roster, blog preview, schedule…).
   - **Final call to action** — the black box near the bottom.
   - **Footer** — the little blurb at the very bottom of every page.
3. Type your changes, then click **Save** (top right).

**Uploading a screenshot:** click the image field, then **Upload** and pick the
file from your computer (or drag it in). Keep screenshots in **landscape
orientation** and roughly 1400×900 or larger, so they look sharp.

**How the moving pictures map to the panel:** Row 1 is the **top** scrolling
row, Row 2 the **bottom** row, and each row's five slots fill the website
**left to right**. The dark tiles that read "Add screenshot 03" (and so on)
are placeholder pictures still sitting in those slots — replace them one by
one by putting a new image in the matching slot and saving. Editing other
homepage blocks (hero, labels, buttons) does not touch the marquee, and the
marquee does not update automatically from new uploads elsewhere.

**After changing any picture:** click **Save**, wait about a minute for the
site to rebuild, then **refresh the page** (on a computer: Ctrl + Shift + R).
If a changed picture still looks old, refresh once more before assuming it
failed — browsers can briefly hold the previous image.

---

## 3. Adding or editing a member

1. Click **Members** → **Member roster**.
2. To add someone, click **Add members →** at the top of the list and fill in:
   - **In-game name (IGN)** — exactly as it looks in-game; this is required.
   - **Role** — Founder, Head Admin, Leader, Co-Leader, Officer, Member or
     Recruit. The card colour changes automatically.
   - **Main class** — Slayer, OBJ, Sniper or Support.
   - **UID** — optional, but the "Copy" button on the website copies this.
   - **Join date** — click the field and pick the date.
   - **Verified** — switch on when you've confirmed the player is real.
   - **Avatar image** — optional profile photo. **png, jpeg or webp all
     work** — square, at least 200×200. Compress big photos first (free:
     squoosh.app) and aim for under ~200 KB so pages stay fast.
      **Pick a file whose preview you can actually see** - if a thumbnail is a grey checkerboard/blank square, the file has no visible pixels (a common result of background-removal sites or an interrupted download), it will never display anywhere: delete that upload and use the original image instead. Files
     save to the website's `assets/members` folder automatically. After
     saving, check the site — if the photo doesn't appear within a
     minute, re-upload it once more; the tidy initials circle shows
     until a photo sticks, so the roster looks fine either way.
3. To edit someone, click **Edit** next to their name.
4. To remove someone, click the **trash/delete** icon next to their entry.
5. Click **Save** when done. Members are listed alphabetically inside their
   role group automatically.

---

## 4. Writing a blog post

1. Click **Blog Posts** → **Blog posts** → click **Add posts →**.
2. Fill in:
   - **Title**
   - **Date** — usually today.
   - **Category** — Announcements, Clan Wars, Tournaments, Guides, Patch
     Notes or Recruitment (this powers the blog page filters).
   - **Author** — e.g. `XIV_Cipher`.
   - **Excerpt** — one or two sentences shown on the blog list page.
   - **Reading time** — a rough guess in minutes.
   - **URL slug** — optional. Leave it empty and the site figures it out from
     the title. If you type one, use small letters and dashes only,
     e.g. `clan-war-recap-october`.
   - **Cover image** — optional (landscape, at least 1200×500).
3. Write the post in the big **Content** editor:
   - The editor already handles formatting — select text and use the toolbar
     (bold, italic, lists, links) just like a normal text editor.
   - Start a new section with a **Heading 2** (`##` in the editor).
   - You can paste screenshots straight into the text.
4. Click **Save**.

**Editing an old post:** open **Blog Posts**, click **Edit** on the entry, and
change what you need. Deleting a post is the trash icon on that entry.

---

## 5. Changing the links (Discord, Facebook, forms…)

1. Click **Important links** → **Links & contact email**.
2. There are seven boxes: the apply button, Discord invite, Facebook page,
   report/appeal/suggestion forms and the support email.
3. Paste the new URL, click **Save**.

Every place on the site that uses that link updates automatically — the navbar
button, the footer, the support page, etc.

---

## 6. Everything else

| Section | What it controls |
|---|---|
| **Page headings** | Titles and sub-titles at the top of the Members, Blog and Support pages, plus the members-page buttons/text |
| **Testimonials** | The "what our members say" quotes on the homepage |
| **FAQ** | Questions and answers on the Support page |
| **Weekly Schedule** | The schedule table on the homepage (days, times, event names) |
| **Achievements** | The four stat badges in the black "Our record" band |
| **Partners** | The small partner-clan pills on the homepage |
| **Homepage → Section labels & headings** | Also the schedule note under "When we play" |

---

## 7. How long can my text be?

There's no technical limit — long text can't break the site. At worst something
looks crowded, and retyping it shorter fixes it. Comfort zones:

| Type of field | Comfy length | If much longer… |
|---|---|---|
| Headings & section titles | one short line (about 50–70 characters) | the heading wraps or looks squeezed |
| Buttons & small labels | 2–4 words | the button gets very wide |
| Descriptions & FAQ answers | 2–4 sentences | fine — the block just gets taller |
| Member names, roles, UIDs | short, exactly as they appear in-game | — |
| Blog post content | as long as you like | fine — long posts are normal |

Good habits:

- Keep headings short — they're labels, not paragraphs.
- Compress large screenshots before uploading; huge images make slow pages.
- Treat a post's **URL slug** as set-once: changing it changes that post's web
  address, so old links would stop working.
- Every save is recorded, so an accidental paste can always be undone — nothing
  is ever lost.

---

## 8. After you save — WAIT ~1 MINUTE

1. When you click **Save**, the change is sent to GitHub, and GitHub sends it
   to the live site. This takes about **60 seconds**.
2. Then **refresh the website page** (Ctrl+R or pull down to refresh on your
   phone). Your change is live.

If you don't see it after a minute or two, refresh once more — don't save the
same change again and again.

---

## 9. Things you can't change (intentionally)

- The **Activision disclaimer** in the footer (legal text — fixed).
- The **clan name, tag, timezone and site address**.
- The **Rules page** content.
- If something on those truly must change, ask the site owner.

---

## 10. If something looks broken

- First: hard-refresh (Ctrl+Shift+R) — old cached files are the usual cause.
- If the whole site looks wrong right after a save, the editor will see the
  change in the **homepage editor** — undo what you changed, save again.
- Still stuck? Message the site owner with a screenshot of what you see.
