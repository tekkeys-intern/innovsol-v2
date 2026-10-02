# Gaps to a full enterprise website — tracker

Source: audit of Version 2 on 2026-10-01. Final status after the work done the same day.

**Legend:** ✅ done and verified here · 🟡 built; needs your credentials / input / a live test to be fully working · 👤 needs you (content, legal, accounts) — cannot be done in code · ⏭ deliberately deferred (reason given)

Priority: **M**ust before launch · **S**hould soon after · **L**ater

## 1. Content & pages

| ID | Gap | Pri | Status | What was done / what is left |
|---|---|:-:|:-:|---|
| C1 | Logo strip implied named clients | M | 🟡 | Reworded to "Delivering AI for enterprises across 10+ industries". Add real logos only with written permission |
| C2 | Case-study / hero numbers unsourced | M | 🟡 | Disclosure notes added everywhere. **You must confirm each figure** → `docs/CLAIMS-TO-VERIFY.md` |
| C3 | Compliance claims unverified | M | 🟡 | "compliant" → "built to support / designed for" site-wide; evidence checklist written. Remove anything you cannot back |
| C4 | Testimonials / team photos unverified | M | 🟡 | Testimonials hidden by default (`showTestimonials` in `content/site.json`) |
| C5 | No About page | S | ✅ | `/about.html` (leadership section needs your names/bios → C12) |
| C6 | No per-service pages | S | ✅ | `/services.html` + 6 pages; home cards and footer link to them |
| C7 | No case-study pages | S | ✅ | `/case-studies.html` + 3 pages (anonymised, no new figures) |
| C8 | No insight articles | S | 🟡 | 3 draft articles written, marked **DRAFT** and `noindex` until you review/approve |
| C9 | No FAQ / engagement / security / accessibility / thank-you | S | ✅ | All five pages; FAQ has FAQPage structured data; `security.txt` added |
| C10 | Generic 404 | S | ✅ | Branded 404 with helpful links |
| C11 | Playbook lead capture | S | ✅/👤 | A landing page per industry (8): form → stored + emailed; offers the PDF when `public/playbooks/<slug>.pdf` exists. **You supply the PDFs** |
| C12 | Leadership / team page | S | 👤 | Needs names, bios, photos |
| C13 | Partners page | L | 👤 | Needs partner list and permission |
| C14 | Stock photos hot-linked | S | ⏭ | Needs your photography; CSP allows Unsplash meanwhile |

## 2. Functionality & integrations

| ID | Gap | Pri | Status | What was done / what is left |
|---|---|:-:|:-:|---|
| F1 | Contact form not stored / no auto-reply / no CRM | M | ✅/🟡 | **Verified:** each enquiry is stored in Supabase `enquiries` before email is attempted. Auto-reply and CRM webhook are coded; they run once SMTP / `CRM_WEBHOOK_URL` are set |
| F2 | SMTP not configured | M | 👤 | Set `SMTP_*`; test with `/api/test-smtp` (`docs/OPERATIONS.md` §2) |
| F3 | SPF / DKIM / DMARC | M | 👤 | Step-by-step in `docs/OPERATIONS.md` §2 |
| F4 | CAPTCHA | S | 🟡 | Cloudflare Turnstile on contact + playbook forms; activates when you add the two keys |
| F5 | Calendar booking | S | 🟡 | "Book a Strategy Call" opens `bookingUrl` (Calendly/Cal.com) when set; otherwise the form |
| F6 | Analytics + consent banner | M | ✅/🟡 | **Verified** with a test ID: banner shows, nothing loads before consent, decline persists, footer link reopens, accept loads GA4. Add your real ID |
| F7 | Portal jobs management | S | 🟡 | Create / edit / publish / unpublish screen built, type-checked; needs a live staff login to exercise |
| F8 | Portal email notifications | S | 🟡 | `/api/notify` built (locked by secret); needs the Supabase webhook — steps in `docs/OPERATIONS.md` §3 |
| F9 | Forgot password | S | 🟡 | Request + reset screens built |
| F10 | Internal notes UI | S | 🟡 | Staff notes per application via protected RPCs |
| F11 | MFA for staff | S | 🟡 | Authenticator-app enrolment, sign-in challenge. Optional hard enforcement SQL in migration 0002 |
| F12 | Candidate data deletion | S | 🟡 | In-portal "Delete my account & data" (removes resumes, then account). **Run `0002_features.sql`** |
| F13 | Portal tested with real accounts | M | 🟡 | `npm run test:rls`: the 8 anonymous checks **pass against your project**. Candidate/staff checks run when you add test accounts |
| F14 | Search / languages / live chat | L | ⏭ | Decide need first |

## 3. Engineering & operations

| ID | Gap | Pri | Status | What was done / what is left |
|---|---|:-:|:-:|---|
| E1 | `/api/test-smtp` was public (leaked SMTP host/user, sent mail) | M | ✅ | Off unless `ADMIN_TOKEN` set + header; **verified** returns 404 when unset |
| E2 | 5 high-severity dependency vulnerabilities | M | ✅ | Updated (incl. nodemailer 8 → 10). `npm audit --omit=dev`: 0 high/critical; 1 low in a dev-server tool (not shipped) |
| E3 | No CI/CD | M | 🟡 | `.github/workflows/ci.yml` + Dependabot written; they run once the repo is on GitHub (not run there yet) |
| E4 | No unit tests | S | ✅ | 17 tests pass (`npm run test:unit`): validation, escaping, mailto, content integrity |
| E5 | No error monitoring | M | ✅ | Browser errors → `/api/log` → server logs (**verified**); Sentry drop-in documented |
| E6 | Per-instance rate limit | S | 🟡 | Upstash Redis shared limiter in code; add the two env vars |
| E7 | CSP allows inline scripts | S | ⏭ | Needs nonce-based loading of the React shell scripts; a larger change |
| E8 | No accessibility audit | S | ✅ | axe-core WCAG 2.1 A/AA over **50 pages: 0 serious/critical** (`npm run test:a11y`). Automated only: a manual screen-reader audit is still advisable |
| E9 | No backup / recovery plan | S | 👤 | Runbook in `docs/OPERATIONS.md` §6 (Supabase PITR needs a paid plan) |
| E10 | No CMS | S | ⏭ | Decision needed (Decap / Sanity / Payload). Copy is already isolated in `content/*.json` |
| E11 | Home/careers not static pages | S | ⏭ | Server-rendered HTML is crawlable; static export is a larger refactor |
| E12 | No staging | S | 🟡 | Vercel preview-per-PR documented (use a separate Supabase project) |

## 4. Legal, brand & governance

| ID | Gap | Pri | Status | What was done / what is left |
|---|---|:-:|:-:|---|
| L1 | Legal pages are templates | M | 👤 | Expanded (applicant data, processors, consent, DPDP/GDPR basics, retention). **Counsel must review** |
| L2 | Company details in footer | S | 🟡 | Add `legalName` / `registration` to `content/site.json` |
| L3 | Placeholder brand assets | S | ✅ | PNG favicons + apple-touch icon + manifest; `/brand.html` with logos and colour tokens |
| L4 | Domain + Search Console | M | 👤 | `docs/OPERATIONS.md` §9 |
| L5 | Accessibility statement | S | ✅ | `/accessibility.html` |

## 5. Deployment readiness (2026-10-02)

| ID | Item | Status | Notes |
|---|---|:-:|---|
| D1 | Build from a clean install | ✅ | Was **broken**: the lockfile paired `@tanstack/router-plugin` (router-core 1.171.9) with react-start (needs 1.171.34) → `makeSerovalPlugin is not exported`. Fixed by updating `@tanstack/router-plugin`; verified with `npm ci` + build in a fresh copy |
| D2 | Vercel Build Output valid | ✅ | `config.json` v3, Node 22 function, 17 routes, region `sin1`; post-build step marks header rules `continue` and fails the build if anything essential is missing |
| D3 | Routing / headers / API on the output | ✅ | 36 emulated-router checks (`npm run test:vercel`), plus browser flows |
| D4 | Linux case-sensitivity | ✅ | `scripts/check-case.cjs` (in `npm run check`) |
| D5 | Real Vercel deployment | 👤 | Needs your Vercel account: follow `docs/DEPLOYMENT.md`, deploy a Preview first |
| D6 | Production Supabase: custom SMTP, Pro plan, redirect URLs | 👤 | `docs/DEPLOYMENT.md` §6 |

## Needs you
Real client logos & approvals · evidence for compliance and results claims · SMTP credentials + DNS records · Turnstile, Calendly, GA4/Plausible IDs · playbook PDFs · leadership bios · own photography · legal review · domain + hosting plan · portal test accounts · run `0002_features.sql` and create the Supabase webhook.

## Honest limits of what was verified
* New portal screens (jobs manager, notes, MFA, reset, delete) are **type-checked and linted but not exercised with a logged-in session** — that needs real accounts and migration 0002.
* Email delivery was **not** tested (no SMTP credentials).
* CI has **not** run on GitHub.
* Accessibility result is automated (axe) only.
