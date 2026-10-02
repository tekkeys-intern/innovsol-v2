// usage: node shot.cjs <url> <out.png> [width] [height] [full] [scrollY]
const puppeteer = require('puppeteer-core');
(async () => {
  const [url, out, w = '1280', h = '800', full = '0', sy = '0'] = process.argv.slice(2);
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }).catch((e) => console.log('goto:', e.message));
  await new Promise((r) => setTimeout(r, 1800));
  if (+sy) { await p.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, y); }, +sy); await new Promise((r) => setTimeout(r, 1500)); }
  if (full === '1') { // trigger reveals by scrolling through
    await p.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
    await new Promise((r) => setTimeout(r, 1200));
  }
  await p.screenshot({ path: out, fullPage: full === '1' });
  const info = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  console.log(JSON.stringify(info));
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
