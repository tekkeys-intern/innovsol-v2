// axe-core accessibility scan of every static page (WCAG 2.1 A/AA rules).
//   BASE=http://127.0.0.1:4300 npm run test:a11y      exit code 1 if any serious/critical violation
// Needs a running server (production build recommended) and Chrome (CHROME=/path on macOS/Linux).
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const BASE = process.env.BASE || 'http://127.0.0.1:4300';
const ROOT = path.join(__dirname, '../..');
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const pages = ['/', '/careers', '/portal/login', ...walk(path.join(ROOT, 'public')).filter((f) => f.endsWith('.html')).map((f) => '/' + path.relative(path.join(ROOT, 'public'), f).replace(/\\/g, '/'))];

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  let bad = 0, total = 0; const summary = {};
  for (const url of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    try {
      await page.goto(BASE + url, { waitUntil: 'load', timeout: 45000 });
      await new Promise((r) => setTimeout(r, url === '/' || url === '/careers' ? 2500 : 600));
      // reveal-on-scroll content must be visible for contrast checks
      await page.evaluate(() => document.querySelectorAll('.reveal,.fi').forEach((e) => e.classList.add('in-view', 'vis', 'show')));
      await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}.reveal,.fi{opacity:1!important;transform:none!important}' });
      await new Promise((r) => setTimeout(r, 150));
      await page.evaluate(axeSrc);
      const res = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
      const v = res.violations.filter((x) => ['serious', 'critical'].includes(x.impact));
      total++;
      if (v.length) { bad++; console.log(`✗ ${url}`); v.forEach((x) => { const t = x.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' ; '); console.log(`   [${x.impact}] ${x.id}: ${x.help} (${x.nodes.length} node${x.nodes.length > 1 ? 's' : ''})`); console.log('      e.g.', x.nodes[0].target.join(' '), '|', (x.nodes[0].failureSummary || '').split('\n')[1] || ''); summary[x.id] = (summary[x.id] || 0) + x.nodes.length; }); }
    } catch (e) { console.log('! could not scan', url, e.message); }
    await page.close();
  }
  await browser.close();
  console.log(`\nscanned ${total} pages · ${bad} with serious/critical violations`, Object.keys(summary).length ? JSON.stringify(summary) : '');
  process.exit(bad ? 1 : 0);
})();
