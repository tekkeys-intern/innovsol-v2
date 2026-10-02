# Technology stacks & packaging (task 6)

Goal: keep the product modular and documented so it can be offered in the form that best fits a client. This repository contains the implementations below; nothing outside it is covered.

## 1. Catalog

| ID | Stack | Status | Where | Best for |
|---|---|---|---|---|
| **A** | React 19 + TanStack Start + Vite, generated pages, deployed on Vercel | ✔ Production-ready | this repo | Custom features, best performance & SEO control |
| **A+** | Stack A + Supabase portal (Version 2) | ◐ Foundation built | `supabase/`, `src/routes/portal*` | Candidate / recruiter / admin logins |
| **D** | Pure static HTML (output of the generators) | ◐ Possible today | `public/` after `npm run gen` | Lowest cost, no server, any static host |

## 2. Choosing between them

| The client says… | Recommend |
|---|---|
| "We need candidate login, dashboards, roles." | **A+** |
| "SEO and speed are critical; we have a developer." | **A** |
| "Cheapest possible, rarely changes." | **D** |
| "We need to integrate with our own systems / APIs." | **A** (or A+) |

| Dimension | A / A+ | D (static) |
|---|---|---|
| Editing content | Edit JSON / HTML modules | Edit generated files or JSON, rebuild |
| Performance | ★★★ | ★★★ |
| Security surface | Small (few deps, RLS for A+) | Smallest |
| Hosting | Vercel (free–low) | Any static host (free) |
| Custom features / portal | ★★★ | ✘ |

## 3. Content is separate from presentation

| Source of truth | Contains | Used by |
|---|---|---|
| `content/industries.json` | 8 industry pages: copy, stats, modules, integrations | industry page generator |
| `content/jobs.json` | 6 roles: copy, stack, perks, hiring process | job page generator, `supabase/seed.sql` |
| `src/modules/*` | Home / careers / contact / layout modules | React pages |
| `scripts/mailto.cjs` | Apply / Playbook email templates | job + industry pages |

Change copy in the JSON first, then run `npm run gen`. Design tokens (colours, fonts) are the `:root` variables in `src/modules/shared/base.css`.

## 4. Documentation standard for any stack

Each stack needs a README covering: what it is · run locally · deploy · edit content · env vars · known limits · owner. Template: [`stacks/STACK-TEMPLATE.md`](../stacks/STACK-TEMPLATE.md). Stack A's answers: `README.md`, `docs/DEPLOYMENT.md`, `src/modules/README.md`.

## 5. Modularity rules

1. One section = one module folder.
2. No copy hard-coded in more than one place; reuse the JSON.
3. Reusable interactive pieces are attribute-driven (`data-href` / `data-topic`), not page-specific.
4. Acceptance checklist for every deliverable: CTAs work (`npm run check`) · forms deliver · mailto flows · sitemap + robots · Lighthouse ≥ 90 · legal pages · 404 page.

## 6. Packaging

For each offered stack prepare a demo URL, a one-page spec (from §2), a hosting guide and the acceptance-checklist result. `stacks/catalog.json` is a machine-readable version for proposals.
