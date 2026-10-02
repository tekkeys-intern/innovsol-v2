# Security layer (task 9)

Security is treated as its own layer: review → fix → verify → checklist.

## 1. Review of the Version 1 application

| # | Finding (before) | Risk | Status |
|---|---|---|---|
| 1 | `/api/contact` put user input into the email HTML **unescaped** | HTML/link injection into staff mailbox (phishing content) | **Fixed** – all fields escaped |
| 2 | No length limits, no email/phone validation | Abuse, oversized payloads, header injection | **Fixed** – per-field limits, control chars stripped, regex validation, 32 KB body cap |
| 3 | No spam protection or rate limit | Mail-bombing the inbox / SMTP quota | **Fixed** – honeypot field + 5 requests / 10 min / IP (best-effort, per instance) |
| 4 | No same-origin check | Cross-site form posts | **Fixed** – `Origin` must match host |
| 5 | Subject built from raw names | Header injection | **Fixed** – newlines removed, length capped |
| 6 | No security headers | Clickjacking, MIME sniffing, weak transport | **Fixed** – CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP (see `vite.config.ts`) |
| 7 | Error text leaked internals (`alert(res.error)`) | Info disclosure / poor UX | **Fixed** – generic messages, inline status |
| 8 | Placeholder "Lovable" metadata, external error hook | Branding / unintended telemetry | **Fixed** metadata; error hook is a no-op unless the Lovable runtime injects it |
| 9 | Third-party resources (Google Fonts, Unsplash) | Privacy, availability | **Disclosed** in Privacy/Cookie pages; CSP allow-lists only these hosts |
| 10 | Inline scripts required by the current page shell | Weaker CSP (`'unsafe-inline'`) | **Accepted for V1**; see roadmap |

Secrets: SMTP credentials are read only from environment variables (`.env.example` lists them). No secrets are in the repo or the client bundle.

## 2. Headers now sent on every response (production)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://images.unsplash.com; media-src 'self'; connect-src 'self';
  object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff        X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
```

Verified on the Vercel build output (`npm run test:vercel`) for both static pages and server-rendered routes. HSTS is deliberately 1 year without `includeSubDomains`/`preload`; add those only when every subdomain is HTTPS-only. The Supabase project URL is added to `connect-src` automatically from `VITE_SUPABASE_URL` at build time; no manual edit is needed.

## 3. Version 2 controls (portal)

* Authorization is enforced by **row-level security in Postgres**, not by the UI (see `ARCHITECTURE-V2.md`).
* Anon key only in the browser; service-role key never exposed.
* Roles cannot be self-assigned; internal notes are column-protected; resumes are in a private bucket with signed URLs; uploads limited to PDF/DOC/DOCX ≤ 5 MB (bucket-level + client-side).
* `/portal` is `noindex`.
* Passwords: Supabase Auth (bcrypt, breach checks available). Enable **email confirmation**, **CAPTCHA** and **MFA for staff** in the Supabase dashboard.

## 4. Pre-production checklist

- [ ] `npm audit --omit=dev` reviewed; dependencies updated
- [ ] SMTP env vars set in Vercel; test the contact form end-to-end
- [ ] Domain on HTTPS; HSTS preload only after you are sure all subdomains support HTTPS
- [ ] Supabase: RLS enabled on all tables (`select tablename, rowsecurity from pg_tables where schemaname='public'` → all `true`)
- [ ] Supabase: email confirmation ON, redirect URLs restricted to your domains, CAPTCHA ON
- [ ] First admin created; no shared accounts
- [ ] CSP `connect-src` updated for Supabase
- [ ] Legal pages reviewed by counsel (`/privacy.html`, `/terms.html`, `/cookies.html` are sensible templates)
- [ ] Try the abuse cases below

### Abuse cases to test before launch
1. Contact form: submit `<script>alert(1)</script>` in every field → arrives as harmless text.
2. Submit 6 times in a minute → 6th returns 429.
3. Fill the hidden `website` field → silently ignored.
4. POST from another origin → 403.
5. Portal: as a candidate, try `update profiles set role='admin'` via the API → denied. Try reading another user's application or `internal_notes` → denied/empty.

## 5. Roadmap
* Remove `'unsafe-inline'` from `script-src` by moving the page shell scripts to external files and using nonces.
* Persist rate-limit counters in Redis/Upstash (the in-memory limiter is per serverless instance).
* Add Cloudflare Turnstile to the public contact form.
* Dependency scanning (Dependabot) and secret scanning in CI.

## 6. Update — second hardening pass (2026-10-01)

| Finding | Risk | Status |
|---|---|---|
| `/api/test-smtp` was **public**: revealed SMTP host and username and let anyone trigger emails | Information disclosure, mail abuse, quota burn | **Fixed.** Disabled unless `ADMIN_TOKEN` is set; requires `x-admin-token`; no longer echoes the SMTP host/user. Verified: 404 when unset |
| Production dependencies: 5 high-severity advisories (incl. nodemailer) | Known vulnerabilities | **Fixed.** `npm audit --omit=dev`: 0 high/critical |
| Rate limit was per instance only | Bypass by hitting different instances | Upstash Redis shared limiter supported (`UPSTASH_REDIS_REST_*`) |
| No bot challenge | Spam | Cloudflare Turnstile verified server-side when configured |
| Auto-reply could be abused to mail third parties | Backscatter | Auto-reply echoes **no** user text, is rate-limited, behind the same CAPTCHA; `AUTO_REPLY=0` disables it |
| Portal: no MFA, no reset, no deletion | Account takeover, privacy | TOTP MFA, password reset, self-service deletion added |
| `/api/notify` webhook | Unauthenticated trigger | Constant-time secret check; 503 if unconfigured; service-role key stays server-side |
| CSP | Needed for optional integrations | Narrow allow-list for Turnstile / GA4 / Plausible only |

Still open (see GAPS.md): remove `unsafe-inline` from `script-src` (E7), independent penetration test, live exercise of portal rules with test accounts (`npm run test:rls`).
