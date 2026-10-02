# Task status — Version 2

Legend: ✔ done and verified here · ◐ built, needs an external account/decision to go live · ✎ documented, content from you needed

| # | Task | Status | Where / evidence |
|---|---|:-:|---|
| 1 | CTA & button functionality | ✔ | `npm run check`: 19 pages, 1,121 links, 129 CTAs, 0 dead. All `href="#"` removed; CTAs go to the Contact form (with the topic/industry pre-filled) or the right page. Browser-tested: `tests/e2e/ctas.cjs` |
| 2 | Folder & module segregation | ✔ | `src/modules/{layout,home,careers,contact,shared}`, `src/pages/`, `content/*.json`, generators in `scripts/` — `src/modules/README.md` |
| 3 | Clickable & reusable elements | ✔ | `shared/clickable.js` + `components.css`: any element with `data-href` / `data-topic` becomes a keyboard/touch link with hover/focus/active states. Applied to service, why-us, metric, case-study, insight and FDE cards; industry module/use-case cards use the same pattern |
| 4 | Apply Now & Playbook workflow | ✔ | **Apply Now → portal** (`/portal?job=<role>`): sign in / create account, role preselected, upload resume, track status. **Apply by email** stays as the alternative (pre-filled `mailto:` that says to attach a resume, plus a web-mail fallback dialog). Playbook = pre-filled request email. Templates: `scripts/mailto.cjs`
| 5 | V2 backend & portal | ✔ | Supabase project connected (`.env`), schema + seed run, `/portal` live: sign-in / sign-up, candidate apply + track, staff review, admin roles. Access rules verified against the real database with anonymous requests; sign-in rejection verified in a browser. Still to do by you: create your account, make yourself admin, restrict Supabase redirect URLs, turn on email confirmation/CAPTCHA for production
| 6 | Multi-tech-stack package | ✔ | `docs/STACKS.md`, `stacks/catalog.json`, `stacks/STACK-TEMPLATE.md` — covers the stacks in this repo only (React site, Supabase portal, static export) |
| 7 | Animations & information presentation | ✔ | Explanatory scroll animations (industry Before/After, counters, ecosystem flow; home engagement progress track; page progress bar). **"Deploy" click lag fixed** (3–4 ms, no card flashing) — `PERFORMANCE.md` |
| 8 | Authentication & authorization | ◐ | Auth (password + magic link), 3 roles, RLS policies, protected `/portal`. Needs a Supabase project to run; policies written but **not yet exercised against a live database** |
| 9 | Security layer | ✔ (V1) ◐ (V2) | `docs/SECURITY.md`: contact API hardened (escaping, validation, honeypot, rate limit, origin check), CSP/HSTS/etc. headers verified on a production build; abuse cases tested with curl |
| 10 | Optimization layer | ✔ | Hero videos 45 MB → 5 MB, `public/` 68 MB → 10 MB, industry page ≈ 110 KB, no icon library, lazy images, cache headers — `PERFORMANCE.md` |
| 11 | Marketing & SEO | ✔ | Unique titles/descriptions, canonical, OG/Twitter, JSON-LD (Organization, Breadcrumb, Service, JobPosting), sitemap, robots, single h1, alt text, internal links — `SEO.md` |
| — | Fix industry imagery (healthcare, retail, telecom, insurance, GCC, startups) | ✔ | Rebuilt from one template in the Banking style, each with its own isometric hero, before/after art and module tiles (`scripts/industries/`). See note below |

## Also fixed along the way
* Stray literal "`n" text at the top of pages; the 27 px white strip above the careers navbar.
* Industry & job pages were fixed-width canvases scaled with `zoom` (unreadable on phones) → fully responsive.
* Job pages had two stacked headers and an overflowing nav → one shared site navbar/footer.
* Footer now links to real industry pages, Careers and real Privacy / Cookie / Terms pages.
* "Lovable" placeholder title/author/Twitter metadata replaced.
* Missing `<h1>` hygiene: home has exactly one.

## Things you should know
1. **Imagery.** Banking and Manufacturing keep their original raster art. The other six industries use **generated vector illustrations** in a matching style (crisp, tiny, recolourable). They are not AI-generated photos — to use your own artwork, drop files in `public/industries/assets/<slug>/` and change the `<img>`/inline hero in `scripts/industries/build.cjs`.
2. **Unsplash photos** on the home page's Services / Why / Industries sections are still hot-linked (allowed by CSP). Host your own copies before launch (`PERFORMANCE.md`).
3. **Legal pages** are sensible templates. Have counsel review them.
4. **Apply Now cannot attach a file automatically** — email links can't. The email, the page and the button tooltip all tell applicants to attach their resume; the V2 portal supports a real upload.
5. **Not verified here:** the Supabase portal against a live project; mailto behaviour on real phones/desktops with real mail clients (matrix provided); SMTP delivery (no credentials).
6. **Dev-server note:** in this sandbox the un-bundled Vite dev server hydrates the home page very slowly; all browser tests were run against a production build, where everything behaves normally.
