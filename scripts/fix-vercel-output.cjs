// Runs automatically after `npm run build` (npm "postbuild").
//
// Nitro writes the security / cache headers into .vercel/output/config.json as routes that have
// `headers` but no `continue: true`. In Vercel's Build Output API a matched route without `continue`
// is the final match, so those routes could stop requests (for example /api/contact) before they reach
// the filesystem or the serverless function. Marking them `continue: true` is the documented form:
// "apply these headers, then keep routing".
//
// Also checks the output is what Vercel expects, and fails the build loudly if not, so a broken
// deployment is caught here instead of in production.
const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, '..', '.vercel', 'output');
const cfgPath = path.join(out, 'config.json');
if (!fs.existsSync(cfgPath)) {
  console.log('[fix-vercel-output] no .vercel/output/config.json (not a Vercel build) — skipping');
  process.exit(0);
}

const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
let fixed = 0;
for (const r of cfg.routes || []) {
  if (r.headers && !r.dest && !r.handle && !r.status && r.continue !== true) { r.continue = true; fixed++; }
}
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));

// ── sanity checks ──────────────────────────────────────────────────────────
const problems = [];
const routes = cfg.routes || [];
const fsIdx = routes.findIndex((r) => r.handle === 'filesystem');
const fallback = routes.findIndex((r) => r.dest === '/__server');
if (cfg.version !== 3) problems.push(`config.json version is ${cfg.version}, expected 3`);
if (fsIdx < 0) problems.push('no { handle: "filesystem" } route (static files would not be served)');
if (fallback < 0 || fallback < fsIdx) problems.push('no catch-all route to /__server after the filesystem handler');
if (!routes.some((r) => r.headers && r.headers['Content-Security-Policy'])) problems.push('security headers (CSP) missing from routes');
if (!fs.existsSync(path.join(out, 'functions', '__server.func', '.vc-config.json'))) problems.push('server function (__server.func/.vc-config.json) missing');
for (const f of ['static/industries/healthcare.html', 'static/careers/DataEngineer.html', 'static/sitemap.xml', 'static/robots.txt']) {
  if (!fs.existsSync(path.join(out, f))) problems.push(`static file missing: ${f}`);
}
const vc = path.join(out, 'functions', '__server.func', '.vc-config.json');
const fn = fs.existsSync(vc) ? JSON.parse(fs.readFileSync(vc, 'utf8')) : {};

// Run the function next to the database (Supabase project region ap-southeast-1 = Singapore = sin1).
// Override with VERCEL_FUNCTION_REGION (e.g. bom1 for Mumbai); set it to "none" to leave Vercel's default.
const region = process.env.VERCEL_FUNCTION_REGION || 'sin1';
if (region !== 'none' && fs.existsSync(vc)) { fn.regions = [region]; fs.writeFileSync(vc, JSON.stringify(fn, null, 2)); }

if (problems.length) {
  console.error('[fix-vercel-output] FAILED:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log(`[fix-vercel-output] ok: ${routes.length} routes (${fixed} header routes marked continue), function runtime ${fn.runtime}${fn.regions ? ', regions ' + fn.regions.join(',') : ''}`);
