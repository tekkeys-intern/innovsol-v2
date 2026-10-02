const puppeteer = require('puppeteer-core');
const BASE = process.env.BASE || 'http://localhost:5173';
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3000));
  const base = await page.evaluate(() => ({ toggleMob: typeof toggleMob, sendForm: typeof sendForm, reel: !!window.__reelInit, steps: document.querySelectorAll('.eng-steplbl').length }));
  console.log('base', JSON.stringify(base));

  // Deploy click: measure activation latency and flashes
  await page.evaluate(() => { const d = document.getElementById('engagement'); document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, d.getBoundingClientRect().top + scrollY + 60); });
  await new Promise((r) => setTimeout(r, 700));
  const res = await page.evaluate(async () => {
    const seen = []; const t0 = performance.now();
    const cards = [...document.querySelectorAll('.eng-card')];
    const idx = () => cards.findIndex((c) => c.classList.contains('eng-active'));
    const mo = new MutationObserver(() => { const i = idx(); if (seen.length === 0 || seen[seen.length - 1].i !== i) seen.push({ i, t: Math.round(performance.now() - t0) }); });
    cards.forEach((c) => mo.observe(c, { attributes: true, attributeFilter: ['class'] }));
    document.documentElement.style.scrollBehavior = '';
    document.querySelectorAll('.eng-steplbl')[2].click();
    await new Promise((r) => setTimeout(r, 1200)); mo.disconnect();
    return { seen, active: idx(), label: document.querySelector('.eng-steplbl.active').textContent, hash: location.hash };
  });
  console.log('deploy click', JSON.stringify(res));
  const r2 = await page.evaluate(async () => { document.querySelectorAll('.eng-steplbl')[3].click(); await new Promise((r) => setTimeout(r, 900)); return document.querySelector('.eng-steplbl.active').textContent; });
  const r3 = await page.evaluate(async () => { document.querySelectorAll('.eng-steplbl')[0].click(); await new Promise((r) => setTimeout(r, 900)); return document.querySelector('.eng-steplbl.active').textContent; });
  console.log('scale ->', r2, '| discover ->', r3);
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
