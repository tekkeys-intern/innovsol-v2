# Version 2 — Backend & Portal Architecture

Covers tasks **5 (backend & portal)** and **8 (authentication & authorization)**.
Status: **foundation built and type-checked** (schema, RLS, auth, role-based portal shell). It stays switched off until you add two environment variables.

## 1. Where Version 1 ends and Version 2 begins

| | Version 1 (this site, live-ready today) | Version 2 (portal) |
|---|---|---|
| Nature | Marketing site + email workflows | Marketing site + logged-in portal |
| Data | None stored. Contact form → email | Applications, enquiries, jobs, users in a database |
| Users | Anonymous visitors | Candidates, recruiters, admins |
| Backend | One serverless route (`/api/contact`) | Supabase (Postgres, Auth, Storage) + the same site |

Nothing in V1 depends on V2. The `/portal` routes render a "not configured" notice until Supabase keys exist, so V1 can be deployed on its own.

## 2. Backend evaluation

Criteria (from the brief): easy to maintain, deploy and manage; open-source friendly; supports auth + roles + file uploads.

| Option | Auth | DB | Files | Row-level authorization | Self-host | Ops burden | Verdict |
|---|---|---|---|---|---|---|---|
| **Supabase** | ✔ email/password, magic link, OAuth, MFA | Postgres | ✔ (S3-compatible) | **✔ native RLS** | ✔ Docker | Very low (managed) | **Chosen** |
| Appwrite | ✔ | Document DB (MariaDB) | ✔ | Per-document permissions (no SQL) | ✔ | Low | Good; weaker for relational reporting |
| PocketBase | ✔ | SQLite | ✔ | Rule expressions | ✔ single binary | Lowest | Great for small; one node, harder to scale/HA |
| Directus / Strapi | Via plugins | SQL | ✔ | Role permissions | ✔ | Medium | CMS-first; heavier than needed |
| Firebase | ✔ | Firestore | ✔ | Security rules | ✘ (not open-source) | Low | Lock-in; conflicts with "open source" goal |
| Custom (Node + Postgres) | Build it | ✔ | Build it | Build it | ✔ | High | Most flexible, most to secure and maintain |

**Why Supabase:** authorization lives *in the database* (Row Level Security), so a bug in the front end cannot expose another user's data. It is open source (can be self-hosted later), managed hosting has a free tier, and the migration is plain SQL that ports to any Postgres.

**Fallback plan:** because the schema is standard Postgres, moving to self-hosted Supabase, Neon, RDS or another host only changes connection settings.

## 3. Architecture

```
Browser ──────────────────────────────────────────────────────────────┐
  │  marketing pages (static HTML + React shell)                      │
  │  /portal/*  React routes (TanStack Start)                         │
  │      │  supabase-js with the PUBLIC anon key                      │
  ▼      ▼                                                            │
Vercel (site + /api/contact serverless fn)          Supabase          │
                                                    ├─ Auth (JWT)     │
                                                    ├─ Postgres + RLS ◄┘  every query is filtered by the caller's JWT
                                                    └─ Storage (private 'resumes' bucket)
```

* Browser holds only the **anon key**. Data safety comes from RLS, not from hiding the key.
* The **service-role key** (bypasses RLS) is never a `VITE_` variable and never sent to the browser. If server code needs it later (e.g. sending notification emails on new applications), it goes in a server-only env var.
* Resumes are stored in a **private** bucket under `resumes/<user-id>/…`; staff open them through 60-second signed URLs.

## 4. Roles & permissions

One role per user (`profiles.role`). New sign-ups are always `candidate`. Promotion is done by an admin (or SQL for the very first admin).

| Capability | Anonymous | Candidate | Recruiter | Admin |
|---|:-:|:-:|:-:|:-:|
| Read published jobs | ✔ | ✔ | ✔ | ✔ |
| Create / edit / publish jobs | | | ✔ | ✔ |
| Apply for a job (one per role) | | ✔ | | |
| See **own** applications | | ✔ | | |
| Withdraw own application (only while submitted / in review) | | ✔ | | |
| See **all** applications, change status | | | ✔ | ✔ |
| Read internal notes | | ✘ (never) | ✔ | ✔ |
| Open any resume | | own only | ✔ | ✔ |
| Submit an enquiry (contact / playbook) | ✔ | ✔ | ✔ | ✔ |
| Read enquiries | | | ✔ | ✔ |
| View all users, change roles | | | | ✔ |
| Read audit log | | | | ✔ |

Enforced in `supabase/migrations/0001_init.sql`:
* RLS enabled on every table; policies per role above.
* Users **cannot change their own role** (policy `with check`), even by calling the API directly.
* `internal_notes` is column-protected: candidates cannot read it or write it; staff use RPCs.
* Only `applications.status` is updatable through the API; a candidate can only move their own row to `withdrawn`.
* Status changes write to `audit_log` via trigger.

## 5. Database structure

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | 1:1 with `auth.users` | `id`, `email`, `full_name`, `role` |
| `jobs` | Open roles (seeded from `content/jobs.json`) | `slug`, `title`, `summary`, `published` |
| `applications` | Candidate ↔ job | `job_id`, `applicant_id`, `cover_note`, `resume_path`, `status`, `internal_notes`; unique `(job_id, applicant_id)` |
| `enquiries` | Contact + playbook requests (replaces email-only later) | name, email, company, message, `kind`, `handled` |
| `audit_log` | Append-only history | `actor`, `action`, `entity`, `detail` |

## 6. API surface (what the portal calls)

No custom server is needed for the current features — PostgREST/RPC through `supabase-js`:

| Action | Call |
|---|---|
| Sign up / in / out, magic link | `supabase.auth.*` |
| List published jobs | `from('jobs').select().eq('published', true)` |
| Apply | `storage.from('resumes').upload()` then `from('applications').insert()` |
| My applications | `from('applications').select(explicit columns).eq('applicant_id', me)` |
| Staff: list / update status | `from('applications').select() / .update({status})` |
| Staff: notes | `rpc('staff_internal_notes')`, `rpc('staff_set_internal_notes')` |
| Admin: users | `from('profiles').select() / .update({role})` |

> Always select **explicit columns** on `applications` — `select *` is rejected on purpose because `internal_notes` is not readable by API roles.

## 7. Set-up (about 15 minutes)

1. Create a project at supabase.com (or run Supabase locally with Docker).
2. SQL editor → run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
3. Authentication → URL configuration: add your site URL and `http://localhost:5173`. Turn on **email confirmations**.
4. Copy *Project URL* and *anon public key* into `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and into Vercel env vars.
5. Visit `/portal/login`, create your account, then in the SQL editor:
   `update public.profiles set role = 'admin' where email = 'you@innovsol.ai';`
6. Reload `/portal` — you now see the staff and admin views.

## 8. How the public site connects to the portal
* Navigation has a **Sign in** link on every page.
* **Apply Now** on each job page and role card goes to `/portal?job=<slug>`. The slug is remembered through sign-in / email confirmation (browser session), then the Apply form opens with that role selected.
* "Apply by email" (mailto) remains next to every Apply button.

## 9. Built vs. next milestones

**Built:** schema + RLS, auth (password, magic link), profile/role hook, candidate view (apply with resume upload, track, withdraw), staff view (filter, status change, open resume), admin view (roles).

**Next (recommended order):**
1. Jobs manager UI (create/edit/publish) – the RLS already allows it.
2. Email notification to `hello@innovsol.ai` on new application (Supabase Edge Function or DB webhook → existing SMTP code).
3. Move the contact form and playbook requests into `enquiries` (keep email as a notification).
4. Internal notes UI (RPCs exist).
5. MFA for staff, and a Supabase CAPTCHA (hCaptcha/Turnstile) on sign-up.
6. Automated RLS tests (pgTAP) in CI.

## 9. Additions in migration 0002 and the portal (2026-10-01)

Run `supabase/migrations/0002_features.sql` after `0001_init.sql` (paste the file **contents** into the SQL editor).

* **Self-service deletion** — `delete_my_account()`; the portal first removes resume files through the Storage API (SQL would orphan them), then deletes the account (cascades to profile and applications). Audit log entries survive with the actor cleared.
* **MFA** — authenticator-app (TOTP) enrolment in the portal and a code step at sign-in. To make it mandatory for staff, enable the commented `is_staff()` replacement in the migration (enrol your own authenticator first).
* **Jobs manager** — staff can create / edit / publish / unpublish roles; deletion is intentionally not offered (it would cascade to applications).
* **Internal notes** — staff-only, via the `staff_internal_notes` / `staff_set_internal_notes` RPCs.
* **Password reset** — `/portal/reset`; set the Supabase redirect URLs for your domain.
* **Notifications** — database webhook on `applications` → `/api/notify` → email (setup in `OPERATIONS.md` §3).
* **Enquiries** — the public contact and playbook forms now also write to `enquiries` (anon insert is allowed by policy; nothing readable by anon).
* **Tests** — `npm run test:rls`.
