# Deployment: Vercel + Supabase

Verified 2026-10-02: a clean install (`npm ci`) and build from a fresh copy succeed, the Vercel build output passes 36 routing/header/API smoke tests, the browser flows pass, and accessibility is clean. A live deployment has **not** been run (no Vercel account access): do the first deploy as a Preview and run the smoke test against it (step 7).

## 1. How it fits together

```
GitHub repo ──push──▶ Vercel build: npm ci → npm run build
                         ├─ prebuild : npm run gen   (industry, job and content pages, sitemap, legal pages)
                         ├─ vite build  (nitro "vercel" preset → .vercel/output)
                         └─ postbuild: scripts/fix-vercel-output.cjs  (header routes, region, sanity checks)
                      Vercel serves:  static files (/public)  +  ONE Node 22 serverless function (React pages + /api/*)

Browser ──HTTPS──▶ Vercel (site, /api/contact, /api/log, /api/notify)
        └─HTTPS──▶ Supabase (auth, database, resume storage) using the PUBLIC anon key
```

Supabase is **not** hosted on Vercel and does not need to be: it is its own managed service. The site just needs its URL and public key (see §6).

## 2. One-time setup

1. **Commit and push** the working changes (`git status` shows what changed; `.env` is ignored and must stay out of Git).
2. Vercel dashboard → **Add New → Project → Import** the GitHub repository (the repository root is the project root).
3. Settings are read from `vercel.json` (Framework: *Other*, install `npm ci`, build `npm run build`). Leave **Output Directory** empty. Node version is pinned to 22.x by `package.json`.
4. Add the **environment variables** (§3) for **Production** and **Preview**, then **Deploy**.

> **Plan:** Vercel *Hobby* is for personal, non-commercial use. A company website should be on **Pro**.

## 3. Environment variables (Project → Settings → Environment Variables)

| Variable | Value | Needed for | Notes |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Portal, CSP | **Compiled into the site at build time.** Changing it needs a redeploy |
| `VITE_SUPABASE_ANON_KEY` | Supabase *anon / public* key | Portal | Public by design. Never use the `service_role` key here |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO` | your mail provider | Contact form, playbook, notifications | Required for email. Runtime secrets (not baked in) |
| `SITE_URL` | `https://innovsol.ai` | Canonical tags, sitemap, origin check | Set to your real production domain |
| `TURNSTILE_SECRET_KEY` | Cloudflare secret | CAPTCHA | Optional. Public site key goes in `content/site.json` |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Upstash | Shared rate limit | Optional but recommended |
| `NOTIFY_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | | Portal email notifications | Optional. Service key is **server-only**, never `VITE_` |
| `CRM_WEBHOOK_URL` (+ `_TOKEN`) | | Forward enquiries to a CRM | Optional |
| `ADMIN_TOKEN` | random string | Enables `/api/test-smtp` | Leave **unset** in production unless diagnosing |
| `VERCEL_FUNCTION_REGION` | e.g. `bom1` | Function region | Default `sin1` (next to a Singapore Supabase). `none` = Vercel default |

Full list with explanations: `docs/OPERATIONS.md` §1.

## 4. Custom domain
Project → **Domains** → add `innovsol.ai` and `www.innovsol.ai`, pick the canonical one, follow the DNS instructions (HTTPS certificates are automatic). Then set `SITE_URL` to match and redeploy.

## 5. Everyday workflow
| Command | Purpose |
|---|---|
| `npm run dev` | Local development |
| `npm run gen` | Regenerate pages from `content/*.json` (also runs automatically before every build) |
| `npm run check` | Link / CTA / image / SEO check **and** case-sensitivity check (Vercel is Linux) |
| `npm run build && npm run test:vercel` | Build exactly as Vercel does, then run 36 routing / header / API checks on the output |
| `npm run test:unit` · `test:a11y` · `test:rls` | Unit, accessibility and database-rule tests |

Pull requests get a **Preview deployment** automatically; merging to `main` deploys to Production. CI (`.github/workflows/ci.yml`) runs all of the above on Linux.

## 6. Can I host the Supabase-linked version on Vercel? **Yes.**

Vercel hosts the website and its small API; Supabase hosts the database, logins and file storage; they talk over HTTPS. This is a very common pairing and needs no special setup beyond these points:

1. **Set the two `VITE_SUPABASE_*` variables in Vercel before the build** (they are baked in). Set them for *Production* and *Preview*.
2. **Tell Supabase your Vercel addresses** (Authentication → URL Configuration), or sign-in, sign-up, magic-link and password-reset emails will redirect to the wrong place:
   * Site URL: `https://innovsol.ai`
   * Redirect URLs: `https://innovsol.ai/**`, `https://www.innovsol.ai/**`, `https://*-<your-vercel-team>.vercel.app/**` (previews), `http://localhost:8081/**` and `http://localhost:5173/**` (local)
3. **Use custom SMTP in Supabase for production.** Supabase's built-in email sender is for testing and is heavily rate-limited (a few emails per hour). Configure your mail provider under Authentication → SMTP, otherwise real candidates will not receive confirmation or reset emails.
4. **Free Supabase projects pause after about a week of inactivity** and have no point-in-time recovery. Use the Pro plan before real applicants use the portal.
5. **Keep previews away from production data:** point Vercel's *Preview* environment variables at a separate Supabase project.
6. Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, SMTP, `NOTIFY_SECRET`) go in Vercel as normal (non-`VITE_`) variables and never reach the browser.
7. The Supabase database webhook that sends notification emails must point at your **production** domain: `https://innovsol.ai/api/notify` (see `docs/OPERATIONS.md` §3).
8. Optional: Vercel's *Supabase integration* (Marketplace) can create a project and sync the variables automatically.
9. The function runs in Singapore (`sin1`) to sit next to a Singapore Supabase project; change `VERCEL_FUNCTION_REGION` if your database lives elsewhere.

## 7. First deploy checklist
1. Deploy a **Preview** first (push a branch). Open the Preview URL.
2. `BASE=https://<preview-url> node tests/vercel/smoke.mjs` — all checks should pass (set `EXPECT_SUPABASE=<project-ref>.supabase.co` to also verify the CSP).
3. Submit the contact form once (check both emails) and sign up / sign in at `/portal/login`.
4. Run the migrations `0001_init.sql`, `0002_features.sql` (paste file **contents** in Supabase's SQL editor) if not already done.
5. Merge to `main`; confirm Production; add the domain; submit `sitemap.xml` to Google Search Console.

## 8. Troubleshooting
| Symptom | Cause / fix |
|---|---|
| Build fails with `"makeSerovalPlugin" is not exported by "@tanstack/router-core"` | TanStack packages out of step: the direct dependency `@tanstack/router-plugin` must be recent enough to use the same `@tanstack/router-core` as `@tanstack/react-start`. Run `npm ls @tanstack/router-core` (should show a single version) and `npm i @tanstack/router-plugin@latest`. Fixed in this repo; keep Dependabot's TanStack updates together |
| Portal says "not configured" on the live site | `VITE_SUPABASE_*` missing in Vercel **at build time**. Add them and redeploy |
| Sign-in email links go to `localhost` or a wrong host | Supabase Site URL / Redirect URLs (§6.2) |
| Browser console: *Refused to connect … Content Security Policy* | `VITE_SUPABASE_URL` was not set during the build (the CSP is generated from it), or a new third-party service needs adding to `vite.config.ts` |
| Contact form returns 403 | Origin check: set `SITE_URL` to your production domain (previews work automatically) |
| Contact form returns "Email service not configured" | `SMTP_*` not set for that environment |
| A page works locally but 404s on Vercel | File-name capitalisation (Linux is case-sensitive). `npm run check` reports these |
| Build fails: `fix-vercel-output FAILED` | The output is missing something Vercel needs; the message names it |
| Old CSS/JS after an edit | Generated assets are cached for an hour (`stale-while-revalidate`); hard refresh or wait |

## 9. Rollback
Vercel keeps every deployment: Deployments → pick the last good one → **Promote to Production**.

## 10. Notes on this repository
* `bun.lock` / `bunfig.toml` are leftovers from the project template. Vercel is forced to use npm by `installCommand`, and `package-lock.json` is the source of truth. Delete the bun files if nobody uses bun.
* `.vercelignore` keeps docs, tests, archive and SQL out of CLI uploads (Git-based deploys are unaffected).
* `archive/` and `docs/design-reference/` are not needed for the site and can be removed from the repository to shrink clones.
