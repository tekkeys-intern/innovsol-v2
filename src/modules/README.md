# Site modules

Each visible part of the website is a self-contained module: a folder with its own
markup, styles and behaviour. Pages are assembled from modules in `src/pages/`.

```
src/
  routes/          thin TanStack routes (SEO head + mount a page)
  pages/           home.ts, careers.ts — list the modules a page is made of, in order
  lib/page.ts      composePage() + the Module type
  modules/
    layout/        navbar (+ mobile drawer), footer, widgets (back-to-top, toast)
    home/          hero, logo-strip, services, why, metrics, industries,
                   engagement, case-studies, fde, insights, cta
    careers/       teaser (the home-page careers strip) + the careers page:
                   hero, fde-way, why, open-roles, apply-cta
    contact/       contact info/map, contact form, form submit handler
    shared/        base.css (reset, tokens, buttons), responsive.css, effects.js,
                   components.css + clickable.js (reusable data-href / data-topic cards)
    _unused/       styles for sections that no longer exist (not bundled)
public/
  industries/      static industry detail pages
  careers/         static job detail pages (+ share.js share dialog)
scripts/           one-off generators (generate_roles.cjs builds the job pages)
docs/design-reference/  design mock-ups and screenshots (not shipped)
archive/           the old single-file version of the site (safe to delete)
```

## A module

```
modules/home/services/
  services.html   markup
  services.css    styles
  services.js     optional behaviour
  index.ts        exports { html, css, js } as a Module
```

## Common tasks

- **Edit a section:** change the files in its folder.
- **Reorder / remove a section on a page:** edit the list in `src/pages/home.ts`.
- **Add a section:** create a folder with the files above and an `index.ts`
  (copy a small one such as `home/cta`), then add it to a page's list.
- **Make anything clickable:** add `data-href="#section"` / `data-href="/page"` or `data-topic="Something"` (opens the contact form pre-filled). No JS to write — `shared/clickable.js` adds keyboard + touch support.
- **Reuse on another page:** import it in that page's file. `navbar(base)` and
  `footer(base)` take a prefix so their `#anchor` links point at the home page
  from other pages (`navbar("/")`).

## Notes

- CSS order matters. `composePage` concatenates in list order; pass `{ css: [...] }`
  to override it (see `pages/careers.ts`).
- `shared/responsive.css` still holds the media queries for *all* sections; moving
  each rule next to its section is a possible follow-up.
- JS files are plain scripts sharing one global scope (inline `onclick="toggleMob()"`
  handlers depend on that). Keep top-level names unique across modules.
