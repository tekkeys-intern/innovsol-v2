# Marketing & SEO (task 11)

Set `SITE_URL` (default `https://innovsol.ai`) before generating if the production domain differs:
`SITE_URL=https://www.example.com npm run gen` and update `src/routes/*.tsx` canonical constants.

## Implemented

| Area | Done |
|---|---|
| **Titles / descriptions** | Unique per page. Industry: "*{Industry}* AI Solutions \| Innovsol"; jobs: "*{Role}* \| Careers at Innovsol"; description 50–160 chars, generated from content |
| **Canonical URLs** | On every page |
| **Open Graph / Twitter** | title, description, url, image (`/og-image.jpg`, 1200×630), `summary_large_image` |
| **Structured data (JSON-LD)** | Organization + WebSite (home); BreadcrumbList + Service (industries); **JobPosting** (each role: remote, employment type, hiring org) |
| **Heading hierarchy** | Exactly one `<h1>` per page (home carousel slides 2–4 are `h2`); logical `h2`/`h3` sections |
| **Internal linking** | Footer → industry pages, careers, legal; each industry page → 3 related industries; cards → matching industry; breadcrumbs everywhere; job → related roles |
| **URLs** | Clean, stable: `/industries/healthcare.html`, `/careers/DataEngineer.html`, `/careers` |
| **Indexability** | `robots.txt` (blocks only `/api/`), `sitemap.xml` (19 URLs, auto-generated), `/portal` is `noindex` |
| **Performance for SEO** | Small pages, lazy images with dimensions (no layout shift), hero video compressed with poster, preconnect to fonts |
| **Accessibility (helps SEO)** | Alt text on all images (checked), skip link, focus rings, ARIA labels, keyboard-operable cards, reduced motion |
| **Mobile** | Fully responsive industry + job pages (previously a scaled desktop canvas) |
| **Branding metadata** | Replaced placeholder "Lovable App" title/author/Twitter handle |

`npm run check` verifies title, description, canonical, viewport, single h1, alt text, broken links and sitemap coverage on every static page.

## Known SEO limitation (and the fix)
The **home and careers pages** render their body from injected HTML in a React shell; the HTML is included in the server response, so crawlers see it, but a fully static export would be more robust. If organic traffic to `/` matters most, convert those two pages to static generation (same generators) — a small follow-up.

## After launch (marketing checklist)
1. Google Search Console + Bing Webmaster: verify domain, submit `sitemap.xml`.
2. Google Business Profile; consistent NAP (name, address, phone: +91 95827 99988).
3. Analytics (privacy-friendly: Plausible / GA4 with consent). Update Cookie Policy if you add it.
4. Content engine: the "Insights" cards currently open the contact form. Publish real articles (e.g. *"Why 95 % of Enterprise AI Pilots Fail"*, *"The 12-Week AI Sprint"*, *"RAG vs Fine-tuning"*) at `/insights/<slug>` — biggest organic-traffic lever.
5. Gated playbooks: currently email-request based. A landing page per playbook (one per industry) with a form creates a lead-capture funnel (`enquiries.kind = 'playbook'` in the V2 schema).
6. Case studies as pages with metrics (already on the home cards) + Review/FAQ schema.
7. Backlinks: partner pages (SAP/Microsoft/AWS marketplace listings), LinkedIn company page linking to industry pages, guest posts.
8. Target keywords are in each industry page's `<meta name="keywords">` (low SEO weight, useful as a content brief): e.g. "AI in banking", "predictive maintenance", "AI claims automation".
9. Track: impressions/clicks per industry page, contact-form conversion, mailto clicks (add event tracking to `[href^="mailto:"]`).
