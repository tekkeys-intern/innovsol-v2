# Performance & optimization (tasks 7 and 10)

## Results (production build, local server, headless Chrome, cold cache)

| Page | Transfer | Requests | DOMContentLoaded | Load | LCP |
|---|--:|--:|--:|--:|--:|
| Home | 1.7 MB | 22 | 1.8 s | 2.1 s | 2.2 s |
| Industry (e.g. Healthcare) | 111 KB | 12 | 0.45 s | 0.47 s | 0.75 s |
| Job page | 387 KB | 25 | 0.13 s | 0.35 s | 0.42 s |
| Careers | 116 KB | 11 | 0.12 s | 0.41 s | 0.42 s |

(Local network, so treat as relative. Re-measure on the live URL with Lighthouse / PageSpeed Insights.)

## What changed vs Version 1

| Area | Version 1 | Version 2 |
|---|---|---|
| Hero videos | 4 files, **45 MB** (1080p-class bitrate ~5.3 Mbps), all requested up front | **5 MB** total (H.264, ~1.2 Mbps, no audio track, `faststart`), poster image per slide |
| `public/` size | ~68 MB | **~10 MB** |
| Logos | 1250 px PNGs (~200 KB each) | 560 px (~64 KB) |
| Contact map | 1.1 MB PNG | 100 KB JPG, lazy-loaded, width/height set |
| Industry pages | Fixed 863 px canvas + `zoom` hack, 356 KB icon library **×3 copies** | Fluid CSS, icons inlined at build time (no library, no extra request); page ≈ 110 KB |
| Job pages | Same fixed canvas + 356 KB icon library | Fluid CSS, inline icons; below-fold images lazy |
| Unused files | Old logos, duplicate videos/posters, empty stub pages | Removed |
| Engagement ("Deploy") section | Layout read on every scroll event; long CSS smooth-scroll on click | See §Animation fix |
| Caching | none | Immutable-style caching for media/images; short cache for generated CSS/JS (via nitro `routeRules`) |

## Animation fix — the "Deploy" click lag (task 7)

**Symptoms:** clicking Discover / Design / Deploy / Scale felt delayed, cards flickered.

**Root causes found in `engagement.js`:**
1. `getBoundingClientRect()` + `offsetHeight` (forced layout) ran on **every scroll event**, un-throttled.
2. Click used the page-level CSS `scroll-behavior: smooth` over a ~240 vh distance (~1 s+). While it travelled, every intermediate card activated and animated, so users saw cards flash by before the target.
3. The click target was computed **exactly on a card boundary**; floating-point rounding could land on the *previous* card (wrong card / extra correction).

**Fix:** layout measured once (and on resize/load); scroll handler is `requestAnimationFrame`-throttled and reads only `scrollY`; clicking activates the phase **immediately** and tweens the scroll in 450 ms while ignoring intermediate scroll events; target is the **middle** of the card's range; `will-change` + `contain` on the sticky section; keyboard support; reduced-motion respected.

**Measured:** click → target card active in **~3–4 ms**, with **no intermediate card** activated (previously several). Test: `home-check` script in the delivery notes / repeat with the snippet in `docs/TESTING.md`.

## Animations that explain content (task 7)

| Where | Animation | What it communicates |
|---|---|---|
| Industry pages – Before/After | list items stagger in as you scroll to them | the shift from pain points to outcomes, one item at a time |
| Industry pages – stats | numbers count up (70 %, 2 X…) when visible | scale of impact |
| Industry pages – ecosystem | glow travels Customer → AI layer → Intelligence → Modules → Core systems | how data flows through the AI stack |
| Home – engagement | **progress track fills as you scroll** through Discover → Design → Deploy → Scale | position within the 4-phase journey |
| Every home/industry page | thin page-progress bar | reading progress |
| Job pages | sections reveal on scroll | pacing of a long page |
| Hero illustrations | floating chips (6 s ease) | subtle depth, not distraction |

Rules followed: transform/opacity only (compositor-friendly), no layout animation, `IntersectionObserver` not scroll listeners for reveals, all animation disabled under `prefers-reduced-motion`.

## Remaining opportunities
* Serve the 4 Unsplash section photos locally as WebP (removes a third-party dependency and ~500 KB from home).
* Split `responsive.css` (10 KB) per module and load home-only CSS only on the home page.
* Preload only the first hero video; lazy-attach slides 2–4 when the carousel advances.
* Run Lighthouse CI in the deploy pipeline and fail the build under 90.
