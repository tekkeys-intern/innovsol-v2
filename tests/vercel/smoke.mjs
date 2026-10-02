// Smoke tests for the built Vercel output (run against tests/vercel/emulate.mjs or any deployed URL).
//   BASE=http://127.0.0.1:4500 node tests/vercel/smoke.mjs
//   BASE=https://your-preview.vercel.app node tests/vercel/smoke.mjs     (also works on a real deployment)
const BASE = (process.env.BASE || 'http://127.0.0.1:4500').replace(/\/$/, '');
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗', name, extra); } };
const get = (p, o = {}) => fetch(BASE + p, { redirect: 'manual', ...o });

console.log(`Smoke test: ${BASE}`);
// ── static pages (served from /public) ──
for (const p of ['/industries/healthcare.html', '/careers/DataEngineer.html', '/services/generative-ai-solutions.html', '/case-studies.html', '/faq.html', '/privacy.html', '/playbooks/retail.html', '/about.html']) {
  const r = await get(p); const t = await r.text();
  ok(`${p} → 200 HTML`, r.status === 200 && /<h1/.test(t), r.status);
}
for (const p of ['/sitemap.xml', '/robots.txt', '/site.webmanifest', '/favicon.svg', '/shell/site-extras.js', '/media/hero-mission.jpg', '/.well-known/security.txt']) ok(`${p} → 200`, (await get(p)).status === 200);

// ── server-rendered React routes ──
for (const [p, needle] of [['/', 'Innovate'], ['/careers', 'Careers'], ['/portal/login', 'Portal'], ['/portal', 'Portal']]) {
  const r = await get(p); const t = await r.text();
  ok(`${p} → 200 server-rendered`, r.status === 200 && t.includes(needle), r.status);
}
// ── 404 ──
const nf = await get('/definitely-not-a-page');
ok('unknown URL → 404 with branded page', nf.status === 404 && /find that page|Page not found|404/i.test(await nf.text()), nf.status);

// ── headers (static AND function responses) ──
for (const p of ['/industries/healthcare.html', '/']) {
  const h = (await get(p)).headers;
  ok(`${p}: CSP present`, /default-src 'self'/.test(h.get('content-security-policy') || ''));
  ok(`${p}: HSTS`, /max-age=\d+/.test(h.get('strict-transport-security') || ''));
  ok(`${p}: nosniff + frame deny`, h.get('x-content-type-options') === 'nosniff' && h.get('x-frame-options') === 'DENY');
}
ok('CSP allows the Supabase project (when VITE_SUPABASE_URL was set at build)', process.env.EXPECT_SUPABASE ? (await get('/')).headers.get('content-security-policy').includes(process.env.EXPECT_SUPABASE) : true);
ok('long cache on /media assets', /max-age=\d{6,}/.test((await get('/media/hero-mission.jpg')).headers.get('cache-control') || ''));

// ── API ──
const post = (body, headers = {}) => fetch(BASE + '/api/contact', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.1.' + Math.floor(Math.random() * 250) + '.' + Math.floor(Math.random() * 250), ...headers }, body: JSON.stringify(body) });
ok('GET /api/contact → 405', (await get('/api/contact')).status === 405);
let r = await post({ firstName: 'a', lastName: 'b', email: 'nope', company: 'c' });
ok('invalid email → 400', r.status === 400, r.status);
r = await post({ firstName: 'a', lastName: 'b', email: 'a@b.co', company: 'c', website: 'http://spam' });
ok('honeypot → silent success, nothing sent', r.status === 200 && (await r.json()).success === true);
r = await post({ firstName: 'a', lastName: 'b', email: 'a@b.co', company: 'c' }, { origin: 'https://evil.example' });
ok('cross-origin POST → 403', r.status === 403, r.status);
r = await post({ firstName: 'a', lastName: 'b', email: 'a@b.co', company: 'c' }, { origin: new URL(BASE).origin });
ok('same-origin POST passes the origin check', r.status !== 403, r.status);
ok('/api/test-smtp is not public (404 or 403)', [403, 404].includes((await get('/api/test-smtp')).status));
r = await fetch(BASE + '/api/log', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"message":"smoke","page":"/"}' });
ok('/api/log accepts error reports (204)', r.status === 204, r.status);
ok('/api/notify without secret is refused', [403, 503].includes((await fetch(BASE + '/api/notify', { method: 'POST' })).status));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
