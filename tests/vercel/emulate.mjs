// Local emulator of Vercel's Build Output routing, to test the REAL .vercel/output before deploying.
//   npm run build                         (creates .vercel/output)
//   node tests/vercel/emulate.mjs         (serves it on http://127.0.0.1:4500)
//   node tests/vercel/smoke.mjs           (runs the checks against it)
//
// Emulates: routes[] in config.json (headers + continue), { handle: "filesystem" } (static files),
// then the catch-all to the serverless function (default export { fetch(request, context) }).
// It is an approximation of Vercel's router, not Vercel itself: still confirm on a Preview deployment.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, '.vercel', 'output');
const PORT = Number(process.env.PORT || 4500);
const config = JSON.parse(fs.readFileSync(path.join(OUT, 'config.json'), 'utf8'));
const fnDir = path.join(OUT, 'functions', '__server.func');
const vc = JSON.parse(fs.readFileSync(path.join(fnDir, '.vc-config.json'), 'utf8'));
const handler = (await import(pathToFileURL(path.join(fnDir, vc.handler)).href)).default;

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };

function staticFile(pathname) {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '');
  const abs = path.join(OUT, 'static', rel);
  if (!abs.startsWith(path.join(OUT, 'static'))) return null;
  // exact-case check, like a Linux file system
  let cur = path.join(OUT, 'static');
  for (const seg of rel.split('/').filter(Boolean)) { if (!fs.existsSync(cur) || !fs.readdirSync(cur).includes(seg)) return null; cur = path.join(cur, seg); }
  return fs.existsSync(abs) && fs.statSync(abs).isFile() ? abs : null;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const extra = {};
  let served = false;
  for (const r of config.routes) {
    if (r.handle === 'filesystem') {
      const f = staticFile(url.pathname === '/' ? '/index.html' : url.pathname);
      if (f) {
        res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', ...extra });
        fs.createReadStream(f).pipe(res); served = true; break;
      }
      continue;
    }
    if (r.src && new RegExp(`^${r.src}$`).test(url.pathname)) {
      if (r.headers) Object.assign(extra, Object.fromEntries(Object.entries(r.headers).map(([k, v]) => [k.toLowerCase(), v])));
      if (r.dest === '/__server') {
        const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await new Promise((ok) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); });
        const request = new Request(url, { method: req.method, headers: req.headers, body });
        const response = await handler.fetch(request, { waitUntil() {} });
        const h = { ...extra }; response.headers.forEach((v, k) => { h[k] = v; });
        res.writeHead(response.status, h);
        if (response.body) { for await (const chunk of response.body) res.write(chunk); }
        res.end(); served = true; break;
      }
      if (!r.continue) break;
    }
  }
  if (!served && !res.headersSent) { res.writeHead(404, extra); res.end('Not found'); }
}).listen(PORT, '127.0.0.1', () => console.log(`Vercel output emulator: http://127.0.0.1:${PORT}  (function runtime ${vc.runtime}, regions ${vc.regions || 'default'})`));
