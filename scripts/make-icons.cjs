// Renders public/favicon.svg to the PNG sizes browsers and phones ask for.
//   node scripts/make-icons.cjs     (needs puppeteer-core + Chrome/Edge; set CHROME=/path if not on Windows)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const ROOT = path.join(__dirname, '..');
const svg = fs.readFileSync(path.join(ROOT, 'public/favicon.svg'), 'utf8');
const sizes = { 'favicon-32.png': 32, 'favicon-192.png': 192, 'favicon-512.png': 512, 'apple-touch-icon.png': 180 };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  for (const [file, px] of Object.entries(sizes)) {
    await page.setViewport({ width: px, height: px, deviceScaleFactor: 1 });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${px}px;height:${px}px}</style>${svg}`);
    await page.screenshot({ path: path.join(ROOT, 'public', file), omitBackground: true });
    console.log('wrote', file, px + 'px');
  }
  await browser.close();
})();
