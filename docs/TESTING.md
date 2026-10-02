# Testing

## 1. Static checks (no browser) — `npm run check`
Scans the home + careers modules and every page in `public/`:
broken internal links · dead `#` CTAs · missing anchors · mailto validity · missing images/alt · duplicate ids · title / description / canonical / viewport / single `<h1>` · sitemap coverage.
Last run: **49 pages, 2,803 links (343 CTAs, 171 mailto/tel), 363 images — 0 problems.**

## 1b. Unit tests — `npm run test:unit`
17 tests (Node built-in runner): HTML escaping and header-injection safety, enquiry validation (emails, phones, honeypot, truncation), the Apply / Playbook email builders (resume instruction, CRLF, length) and content-data integrity.

## 1c. Accessibility — `npm run test:a11y`
axe-core (WCAG 2.1 A + AA) over every static page plus `/`, `/careers`, `/portal/login`. Latest: **50 pages, 0 serious/critical**. Automated rules catch roughly a third of real-world issues, so also do a manual keyboard and screen-reader pass before launch.

## 1d. Database rules — `npm run test:rls`
Runs against your real Supabase project: 8 anonymous-visitor checks always; candidate-isolation, no-self-promotion, notes-protection and status-limit checks when you provide two test accounts (and optionally a staff account) — see the header of `tests/rls.cjs`.

## 2. Browser tests — `tests/e2e/` (needs Chrome/Edge + `puppeteer-core`, already a devDependency)
Run against a **production build** (dev mode loads hundreds of unbundled modules and hydrates slowly):

```bash
# build a plain Node server (the deploy build targets Vercel) and start it
sed 's/preset: "vercel"/preset: "node-server"/' vite.config.ts > vite.config.node.ts
npx vite build -c vite.config.node.ts
PORT=4300 HOST=127.0.0.1 node .output/server/index.mjs &

BASE=http://127.0.0.1:4300 node tests/e2e/engagement.cjs   # "Deploy" click: latency + no card flashing
BASE=http://127.0.0.1:4300 node tests/e2e/ctas.cjs         # card clicks, keyboard use, prefilled contact form, Apply mailto
BASE=http://127.0.0.1:4300 node tests/e2e/page-weight.cjs  # KB, requests, DCL/load/LCP per page
node tests/e2e/screenshot.cjs http://127.0.0.1:4300/ out.png 390 844   # mobile screenshot
```
Set `CHROME=/path/to/chrome` on macOS/Linux.

## 3. What `ctas.cjs` proves
* Clicking a service card → contact form scrolls into view and the message is pre-filled.
* `Enter` on a focused card activates it (keyboard access, `role=link`, `tabindex=0`).
* A case-study card opens the matching industry page.
* An industry "Explore" module opens the home contact form with **industry + topic pre-filled**.
* The honeypot and status region exist; all job "Apply Now" links are `mailto:` and mention attaching a resume.

## 4. Security abuse cases (curl)
```bash
curl -X POST localhost:4300/api/contact -H 'Content-Type: application/json' -d '{"firstName":"<script>","lastName":"x","email":"a@b.co","company":"c"}'   # escaped, 500 only because SMTP is unset
# 6th request within 10 min → 429 · bad email → 400 · Origin: https://evil.example → 403 · honeypot "website" filled → {"success":true} but nothing sent · GET → 405
```

## 5. mailto (Apply / Playbook) across devices
The links are standard `mailto:` URLs (≈ 700 characters, CRLF line breaks). Manual matrix to tick off before launch:

| Environment | Expected |
|---|---|
| Windows + Outlook / Mail app | New message, subject + body filled |
| macOS Mail | same |
| iOS Mail / Gmail app | same |
| Android Gmail | same |
| Desktop with **no** mail client (web-Gmail users) | after 1.5 s the fallback dialog appears: Open in Gmail / Outlook / Copy details |

## 6. Manual pass (10 minutes)
Nav on mobile (drawer) · every industry page at 375 px and 1280 px · a job page: Share dialog, Save toggle, Apply · contact form success + error states · `/privacy.html` `/terms.html` `/cookies.html` · a 404 URL.
