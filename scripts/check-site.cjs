// Static site checker: every link/CTA, image, id and SEO tag, without a browser.
//   npm run check          (exit code 1 if anything is broken)
// Pages checked: the React pages (home, careers — from src/modules) and every static page in /public.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const read = (f) => fs.readFileSync(f, 'utf8').replace(/^﻿/, '');

/* ---- pages ---- */
const pages = {};
const modHtml = (glob) => walk(path.join(ROOT, 'src/modules')).filter((f) => f.endsWith('.html') && glob.test(f.replace(/\\/g, '/'))).map(read).join('\n');
pages['/'] = { html: modHtml(/modules\/(layout|home|contact)\/|careers\/teaser\//), react: true };
// careers reuses navbar/footer with a "/" prefix (navbar(base) / footer(base) in pages/careers.ts)
pages['/careers'] = { html: modHtml(/modules\/layout\/(navbar|footer)\//).replaceAll('href="#', 'href="/#') + modHtml(/modules\/careers\/(hero|fde-way|why|open-roles|apply-cta)\//), react: true };
for (const f of walk(PUB).filter((f) => f.endsWith('.html'))) {
  const rel = '/' + path.relative(PUB, f).replace(/\\/g, '/');
  pages[rel] = { html: read(f), file: f };
}

const idsOf = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const resolveFile = (p) => {
  const clean = decodeURIComponent(p.split('#')[0].split('?')[0]);
  const f = path.join(PUB, clean);
  return fs.existsSync(f) && fs.statSync(f).isFile();
};
const isRoute = (p) => p === '/' || p === '/careers' || p === '/api/contact' || p === '/portal' || p === '/portal/login';

const problems = [];
const warn = [];
const add = (page, msg) => problems.push(`${page}: ${msg}`);
const stats = { links: 0, ctas: 0, mailto: 0, images: 0 };

for (const [url, { html, react }] of Object.entries(pages)) {
  const ids = idsOf(html);
  // ---- links
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const attrs = m[1], text = m[2].replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
    const href = (attrs.match(/\bhref="([^"]*)"/) || [])[1];
    stats.links++;
    if (href === undefined) { if (!/data-phase|data-href|data-topic|role="button"/.test(attrs)) add(url, `link without href: "${text.slice(0, 40)}"`); continue; }
    if (href === '' || href === '#') { if (!/js-share|data-save|onclick/.test(attrs)) add(url, `dead link href="${href}": "${text.slice(0, 40)}"`); continue; }
    if (/^(mailto:|tel:)/.test(href)) {
      stats.mailto++;
      if (/^mailto:/.test(href) && !/^mailto:[^@\s?]+@[^@\s?]+\.[a-z]{2,}/i.test(href)) add(url, `bad mailto "${href.slice(0, 50)}"`);
      continue;
    }
    if (/^https?:\/\//.test(href)) continue; // external: not fetched
    const [pathPart, hash] = href.replace(/&amp;/g, '&').split('#');
    const target = pathPart.split('?')[0] || url;
    if (/btn|cta|hb|jbtn|ind-btn/.test(attrs)) stats.ctas++;
    if (target === url || target === '' || (!pathPart && hash)) {
      if (hash && !ids.has(hash)) add(url, `anchor #${hash} not found on this page ("${text.slice(0, 30)}")`);
      continue;
    }
    if (isRoute(target)) {
      if (hash) { const t = pages[target]; if (t && !idsOf(t.html).has(hash)) add(url, `${target}#${hash} not found ("${text.slice(0, 30)}")`); }
      continue;
    }
    if (!resolveFile(target)) add(url, `missing file ${target} ("${text.slice(0, 30)}")`);
    else if (hash && pages[target] && !idsOf(pages[target].html).has(hash)) add(url, `${target}#${hash} not found`);
  }
  // ---- data-href / data-topic cards
  for (const m of html.matchAll(/data-href="([^"]+)"/g)) {
    const h = m[1]; stats.ctas++;
    if (h.startsWith('#')) { if (!ids.has(h.slice(1))) add(url, `data-href ${h} not found`); }
    else if (!resolveFile(h.split('#')[0]) && !isRoute(h.split('#')[0])) add(url, `data-href missing ${h}`);
  }
  // ---- images / media
  for (const m of html.matchAll(/<img\b([^>]*)>/g)) {
    stats.images++;
    const src = (m[1].match(/\bsrc="([^"]*)"/) || [])[1] || '';
    if (!/\balt=/.test(m[1])) add(url, `image without alt: ${src.slice(-40)}`);
    if (/^https?:|^data:/.test(src)) continue;
    const base = url.endsWith('/') ? url : url.replace(/[^/]*$/, '');
    const abs = src.startsWith('/') ? src : base + src;
    if (!resolveFile(abs)) add(url, `missing image ${src}`);
  }
  for (const m of html.matchAll(/<(?:source|script|link)\b[^>]*\b(?:src|href)="([^"#?]+)"[^>]*>/g)) {
    const src = m[1];
    if (/^https?:|^data:|^mailto:|^#/.test(src) || !/\.(js|css|mp4|jpg|png|svg|webmanifest)$/.test(src)) continue;
    const base = url.endsWith('/') ? url : url.replace(/[^/]*$/, '');
    if (!resolveFile(src.startsWith('/') ? src : base + src)) add(url, `missing asset ${src}`);
  }
  // ---- duplicate ids
  const seen = {}; for (const m of html.matchAll(/\sid="([^"]+)"/g)) { seen[m[1]] = (seen[m[1]] || 0) + 1; }
  for (const [id, n] of Object.entries(seen)) if (n > 1) add(url, `duplicate id "${id}" x${n}`);
  // ---- SEO (static pages)
  if (!react) {
    const t = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    if (!t) add(url, 'missing <title>'); else if (t.length > 70) warn.push(`${url}: title is ${t.length} chars (>70)`);
    if (!/<meta name="description" content="[^"]{50,}/.test(html)) add(url, 'missing/short meta description');
    if (!/<link rel="canonical"/.test(html)) add(url, 'missing canonical');
    if (!/<meta name="viewport"/.test(html)) add(url, 'missing viewport');
    const h1 = (html.match(/<h1\b/g) || []).length;
    if (h1 !== 1) add(url, `expected exactly 1 <h1>, found ${h1}`);
  }
}
// sitemap coverage
const sm = fs.existsSync(path.join(PUB, 'sitemap.xml')) ? read(path.join(PUB, 'sitemap.xml')) : '';
for (const [url, pg] of Object.entries(pages)) if (!pg.react && !/noindex/.test(pg.html) && !/\/(index)\.html$/.test(url) && !sm.includes(`https://innovsol.ai${url}<`)) warn.push(`${url}: not in sitemap.xml`);

console.log(`Checked ${Object.keys(pages).length} pages | ${stats.links} links (${stats.ctas} CTAs, ${stats.mailto} mailto/tel) | ${stats.images} images`);
warn.forEach((w) => console.log('  warn:', w));
if (problems.length) { console.log(`\n${problems.length} PROBLEM(S):`); problems.forEach((p) => console.log('  ✗', p)); process.exit(1); }
console.log('✓ no broken links, dead CTAs, missing images or SEO basics');
