# Innovsol website — Version 2

Enterprise-AI marketing site with reusable modules, generated industry & job pages, email workflows (Apply / Playbook), a hardened contact API, SEO, and an optional Supabase-backed portal.

```bash
npm install
npm run dev        # http://localhost:5173
npm run gen        # regenerate industry, job and content pages, sitemap, legal pages, site config
npm run check      # link / CTA / image / SEO checker (49 pages)
npm run test:unit  # 17 unit tests (validation, mailto, content integrity)
npm run test:a11y  # axe-core accessibility scan (needs a running server; see docs/TESTING.md)
npm run test:rls   # database access-rule tests against your Supabase project
npm run build      # production build = Vercel Build Output (runs gen first, checks after)
npm run test:vercel # rehearse the deployment on the build output (routing, headers, API)
```

## What is in the box

| Path | What |
|---|---|
| `src/modules/` | Reusable site modules: `layout/`, `home/`, `careers/`, `contact/`, `shared/` — see `src/modules/README.md` |
| `src/pages/` | Page = ordered list of modules (`home.ts`, `careers.ts`) |
| `src/routes/` | Thin routes (SEO head + mount a page) + `/portal/*` (Version 2) |
| `content/` | Copy as data: `industries.json`, `jobs.json` |
| `scripts/` | Generators (industries, jobs, static/SEO), `check-site.cjs`, `mailto.cjs`, Supabase seed |
| `public/` | Static output: `industries/`, `careers/`, `media/`, `images/`, sitemap, robots, legal pages |
| `supabase/` | Version 2 database schema (RLS) + seed |
| `tests/e2e/` | Browser tests (engagement, CTAs, page weight, screenshots) |
| `docs/` | Architecture, security, performance, SEO, deployment, testing, task status |
| `stacks/` | Multi-stack product package catalog + template |

## Documentation
* **[docs/GAPS.md](docs/GAPS.md)** — enterprise-readiness tracker: what is done, what needs you
* **[docs/TASKS.md](docs/TASKS.md)** — status of the 11 original tasks and where each is implemented
* **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — deploy to Vercel + connect Supabase, step by step
* [docs/OPERATIONS.md](docs/OPERATIONS.md) — env vars, email DNS, notifications, monitoring, backups, staging
* [docs/CLAIMS-TO-VERIFY.md](docs/CLAIMS-TO-VERIFY.md) — statements on the site you must evidence before launch
* [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) · [docs/TESTING.md](docs/TESTING.md) · [docs/SECURITY.md](docs/SECURITY.md)
* [docs/PERFORMANCE.md](docs/PERFORMANCE.md) · [docs/SEO.md](docs/SEO.md)
* [docs/ARCHITECTURE-V2.md](docs/ARCHITECTURE-V2.md) · [docs/STACKS.md](docs/STACKS.md)

## Version 1 vs Version 2
Version 1 (the sibling `innovsolv-main` folder) is untouched. Version 2 keeps every Version 1 page and flow and adds the work listed in `docs/TASKS.md`. `archive/` holds the pre-modular single-file source and `docs/design-reference/` the original design mock-ups (neither is shipped).
