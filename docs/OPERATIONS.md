# Operations runbook

Everything you need to run the site after launch. Companion to `DEPLOYMENT.md` (how to ship) and `SECURITY.md` (controls).

## 1. Environment variables

Set in Vercel → Project → Settings → Environment Variables (Production **and** Preview). Never commit values.

| Variable | Needed for | Required? |
|---|---|---|
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO` (`SMTP_PORT` optional) | Contact form + playbook emails + notifications | **Yes** |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Portal; stores enquiries | Yes for portal |
| `TURNSTILE_SECRET_KEY` + site key in `content/site.json` | CAPTCHA on contact + playbook forms | Recommended |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting shared across instances | Recommended |
| `CRM_WEBHOOK_URL` (+ `CRM_WEBHOOK_TOKEN`) | Forward each enquiry to a CRM / Zapier / Make | Optional |
| `AUTO_REPLY=0` | Turn off the acknowledgement email to enquirers | Optional |
| `NOTIFY_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Portal email notifications (`/api/notify`) | Optional. **Service key is server-only** |
| `ADMIN_TOKEN` | Enables `/api/test-smtp` for diagnostics. Leave **unset** in production when not testing | Optional |
| `BOOKING_URL`, `GA4_ID`, `PLAUSIBLE_DOMAIN`, `TURNSTILE_SITE_KEY`, `SHOW_TESTIMONIALS=1` | Override `content/site.json` at build time | Optional |

## 2. Email: make sure it reaches inboxes (do this before launch)
The contact form sends *from* `SMTP_FROM` (default `noreply@innovsol.ai`). Without DNS records, mail from your own domain is often marked as spam or rejected.
1. **SPF** – TXT record on `innovsol.ai` including your mail provider (the provider gives you the exact value).
2. **DKIM** – add the CNAME/TXT records your provider generates; enable signing.
3. **DMARC** – start with `v=DMARC1; p=none; rua=mailto:dmarc@innovsol.ai`, review reports for 2–4 weeks, then move to `p=quarantine`.
4. Send a test: `curl -H "x-admin-token: $ADMIN_TOKEN" https://YOURSITE/api/test-smtp` (set `ADMIN_TOKEN` temporarily, then remove it). Check the inbox **and** spam. Tools such as mail-tester.com give a score.
5. Submit the real contact form once and confirm both the team email and the auto-reply arrive.

## 3. Portal notifications (Supabase → email)
1. Vercel env: `NOTIFY_SECRET` (random 32+ chars), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Supabase → **Database → Webhooks → Create**: table `applications`, events **Insert** and **Update**, type *HTTP Request*, method POST, URL `https://YOUR-DOMAIN/api/notify`, header `x-webhook-secret: <NOTIFY_SECRET>`.
3. Test: apply for a role → recruiters (`SMTP_TO`) get an email; change its status → the candidate gets one.

## 4. Analytics & consent
Set `analytics.ga4Id` (GA4 `G-…`) and/or `analytics.plausibleDomain` in `content/site.json`, then `npm run gen` and deploy. A consent banner appears and **nothing loads until a visitor accepts**; the footer "Cookie settings" link reopens the choice. If you add analytics, update `/cookies.html` to name the provider.

## 5. Monitoring
| What | How |
|---|---|
| Front-end errors | `monitor.js` posts to `/api/log` → Vercel **Logs** (search `[client-error]`) |
| Server errors | Vercel Logs (`[contact]`, `[notify]`) |
| Uptime | Add a free monitor (UptimeRobot / Better Stack) on `/`, `/api/log`-free pages, and `/careers`; alert to email/Slack |
| Optional Sentry | `npm i @sentry/browser`, init in `scripts/site/monitor.js` with your DSN, add `https://*.sentry.io` to `connect-src` in `vite.config.ts` |
| Performance | Run Lighthouse / PageSpeed Insights monthly; `npm run test:a11y` for accessibility |

## 6. Backups & recovery
* **Site**: the Git repository is the backup. Vercel keeps every deployment; *Promote to Production* on a previous one is the rollback.
* **Database (Supabase)**: free plan = daily backups with short retention; **Pro** adds point-in-time recovery. For applicant data, enable PITR before real candidates apply.
* **Monthly export** (cheap insurance): Supabase → Database → Backups → download, or `pg_dump` with the connection string; store encrypted off-platform.
* **Restore drill** twice a year: restore the latest backup into a scratch project and confirm `select count(*) from applications;`.
* **Resumes**: stored in the private `resumes` bucket; include in your export plan (Storage → download, or `supabase storage cp`).
* **Candidate deletion requests**: use the in-portal "Delete my account & data". For email applicants, delete the thread and note it in your log. Keep applicant data ≤ 12 months unless the person asks otherwise (matches the privacy page).

## 7. Staging
Every pull request gets a Vercel **Preview deployment** (separate URL, Preview env vars). Point Preview at a **separate Supabase project** so tests never touch production data. Merge to `main` → Production. CI (`.github/workflows/ci.yml`) must pass first.

## 8. Dependencies
* Dependabot opens weekly PRs (`.github/dependabot.yml`); CI blocks merges when `npm audit --audit-level=high` fails.
* Current status: 0 high / critical production vulnerabilities (`npm audit --omit=dev`); one *low* advisory in a dev-server dependency (not shipped).

## 9. Search & domain (after DNS)
1. Vercel → Domains: add `innovsol.ai` + `www`, set the canonical host, HTTPS is automatic.
2. Google Search Console → add the domain property (DNS TXT), submit `https://innovsol.ai/sitemap.xml`. Repeat in Bing Webmaster Tools.
3. Check **Pages → Indexing** after a week; the insight drafts and `/thank-you.html` are `noindex` on purpose.

## 10. Incident basics
| Symptom | First checks |
|---|---|
| Contact form errors | Vercel Logs for `[contact]`; `/api/test-smtp`; SMTP credentials/quota; DNS |
| Portal "not configured" | `VITE_SUPABASE_*` set in the Vercel environment **and redeployed** (they are baked in at build time) |
| Sign-in emails not arriving | Supabase → Authentication → URL configuration (Site URL + redirect URLs for your real domain), email rate limits, custom SMTP |
| Spike of spam | Enable Turnstile; check rate-limit (Upstash) is configured; review `enquiries` for patterns |
