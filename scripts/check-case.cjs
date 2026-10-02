// Case-sensitivity audit. Windows / macOS file systems ignore letter case; Vercel (Linux) does not.
// A link or import that works on your machine but differs in capitalisation from the real file name
// would 404 / fail to build in production. This checks every relative import in src/ and every local
// asset reference in the HTML/CSS source with an exact-case file-system walk.
//   node scripts/check-case.cjs        (part of `npm run check`)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const cache = new Map();
const list = (dir) => { if (!cache.has(dir)) cache.set(dir, fs.existsSync(dir) ? fs.readdirSync(dir) : null); return cache.get(dir); };
/** true only if every path segment matches the on-disk name exactly */
function exactExists(abs) {
  const rel = path.relative(ROOT, abs);
  if (rel.startsWith('..')) return fs.existsSync(abs);
  let cur = ROOT;
  for (const seg of rel.split(path.sep).filter(Boolean)) {
    const names = list(cur);
    if (!names || !names.includes(seg)) return false;
    cur = path.join(cur, seg);
  }
  return true;
}
const walk = (d, skip = []) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  if (skip.includes(e.name)) return [];
  const p = path.join(d, e.name);
  return e.isDirectory() ? walk(p, skip) : [p];
});

const problems = [];
const SKIP = ['node_modules', '.git', '.vercel', '.output', '.tanstack', 'archive'];
const EXT = ['', '.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.json', '.css'];

// 1) relative imports in source
for (const f of walk(path.join(ROOT, 'src'), SKIP).filter((x) => /\.(ts|tsx|js|jsx)$/.test(x) && !x.endsWith('.gen.ts'))) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/(?:from\s+|import\s*\(\s*|require\(\s*)["'](\.{1,2}\/[^"']+)["']/g)) {
    const spec = m[1].split('?')[0];
    const base = path.resolve(path.dirname(f), spec);
    const hit = EXT.some((e) => exactExists(base + e) && fs.statSync(base + e).isFile()) || exactExists(path.join(base, 'index.ts')) || exactExists(path.join(base, 'index.tsx'));
    if (!hit) problems.push(`${path.relative(ROOT, f)}: import "${m[1]}" does not match a file with that exact capitalisation`);
  }
}

// 2) local assets referenced from HTML / CSS source and generated pages
const PUB = path.join(ROOT, 'public');
const htmlFiles = [...walk(path.join(ROOT, 'src/modules'), SKIP).filter((x) => x.endsWith('.html') || x.endsWith('.css')), ...walk(PUB, SKIP).filter((x) => /\.(html|css)$/.test(x))];
for (const f of htmlFiles) {
  const src = fs.readFileSync(f, 'utf8');
  const dirOfPage = '/' + path.relative(PUB, path.dirname(f)).replace(/\\/g, '/');
  for (const m of src.matchAll(/(?:src|href|poster)="([^"#?]+\.(?:png|jpe?g|svg|webp|gif|mp4|css|js|json|webmanifest|ico|pdf|txt|xml))"|url\(["']?(\/[^)"'#?]+\.(?:png|jpe?g|svg|webp|gif))/g)) {
    const ref = m[1] || m[2];
    if (/^(https?:|data:|mailto:|\/\/)/.test(ref)) continue;
    let abs;
    if (ref.startsWith('/')) abs = path.join(PUB, decodeURIComponent(ref));
    else abs = path.join(PUB, dirOfPage.startsWith('/..') ? '' : dirOfPage, decodeURIComponent(ref));
    if (f.includes(path.join('src', 'modules')) && !ref.startsWith('/')) continue; // relative refs in module source are resolved at page level
    if (fs.existsSync(abs) && !exactExists(abs)) problems.push(`${path.relative(ROOT, f)}: "${ref}" exists only with different capitalisation (would 404 on Linux)`);
  }
}

if (problems.length) { console.log(`${problems.length} case problem(s):`); problems.forEach((p) => console.log('  ✗', p)); process.exit(1); }
console.log('✓ case-sensitive check: all imports and asset references match exact file names');
