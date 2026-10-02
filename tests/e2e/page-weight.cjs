const puppeteer = require('puppeteer-core');
const BASE = process.env.BASE || 'http://127.0.0.1:4300';
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  for (const [name, path, w, h] of [['home', '/', 1280, 800], ['industry', '/industries/healthcare.html', 1280, 800], ['job', '/careers/DataEngineer.html', 1280, 800], ['careers', '/careers', 1280, 800]]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h });
    const c = await p.createCDPSession(); await c.send('Network.enable');
    let bytes = 0, reqs = 0; const byType = {};
    c.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; reqs++; });
    const types = {}; c.on('Network.responseReceived', (e) => { types[e.requestId] = e.type; });
    c.on('Network.loadingFinished', (e) => { const t = types[e.requestId] || 'Other'; byType[t] = (byType[t] || 0) + e.encodedDataLength; });
    const t0 = Date.now();
    await p.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
    const loadMs = Date.now() - t0;
    await new Promise((r) => setTimeout(r, 3000));
    const perf = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const lcp = new Promise((res) => new PerformanceObserver((l) => res(l.getEntries().pop().startTime)).observe({ type: 'largest-contentful-paint', buffered: true })); return Promise.race([lcp, new Promise((r) => setTimeout(() => r(null), 500))]).then((l) => ({ dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), lcp: l && Math.round(l) })); });
    console.log(name.padEnd(9), `${(bytes / 1024).toFixed(0).padStart(6)} KB`, `${String(reqs).padStart(3)} req`, JSON.stringify(Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, Math.round(v / 1024) + 'KB']))), JSON.stringify(perf));
    await p.close();
  }
  await b.close();
})();
