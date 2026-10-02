const puppeteer = require('puppeteer-core');
const BASE = process.env.BASE || 'http://127.0.0.1:4300';
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 800 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|404/.test(m.text())) errs.push(m.text()); });
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 2500));
  const out = {};
  // 1. a card with data-topic (security card) → contact form prefilled + scrolled
  out.topicCard = await p.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const card = document.querySelector('.why-card[data-topic]'); card.scrollIntoView({ block: 'center' });
    await new Promise((r) => setTimeout(r, 400));
    card.click(); await new Promise((r) => setTimeout(r, 1200));
    const f = document.getElementById('contact-form').getBoundingClientRect();
    return { msg: document.querySelector('#cform textarea[name=message]').value.trim(), formTop: Math.round(f.top), hash: location.hash, cls: card.className.includes('is-clickable') };
  });
  // 2. keyboard activation on a why-card
  out.whyCardKeyboard = await p.evaluate(async () => {
    const c = document.querySelector('.why-card[data-href="#industries"]'); c.focus();
    c.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await new Promise((r) => setTimeout(r, 1200));
    return { hash: location.hash, tabindex: c.getAttribute('tabindex'), role: c.getAttribute('role') };
  });
  // 2b. a service card opens its own service page
  await p.goto(BASE + '/', { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 2000));
  const navS = p.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => null);
  await p.evaluate(() => document.querySelector('.svc-card[data-href]').click());
  await navS; out.serviceCard = p.url().replace(BASE, '');
  await p.goto(BASE + '/', { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 2000));
  // 3. case study card navigates to its case-study page
  const nav = p.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => null);
  await p.evaluate(() => document.querySelector('.cs-card[data-href]').click());
  await nav; out.caseStudy = p.url().replace(BASE, '');
  // 4. industry page → Explore module → contact form pre-filled from URL
  await p.goto(BASE + '/industries/healthcare.html', { waitUntil: 'load' });
  const nav2 = p.waitForNavigation({ waitUntil: 'load', timeout: 20000 }).catch(() => null);
  await p.evaluate(() => document.querySelector('.mod').click());
  await nav2; await new Promise((r) => setTimeout(r, 2500));
  out.explore = await p.evaluate(() => ({ url: location.pathname + location.search + location.hash, industry: document.querySelector('#cform select[name=industry]').value, msg: document.querySelector('#cform textarea[name=message]').value.trim(), y: Math.round(scrollY) }));
  // 5. honeypot present + status region
  out.form = await p.evaluate(() => ({ hp: !!document.querySelector('#cform input[name=website]'), status: !!document.getElementById('cform-status') }));
  // 6. apply mailto on a job page
  await p.goto(BASE + '/careers/DataEngineer.html', { waitUntil: 'load' });
  out.apply = await p.evaluate(() => [...document.querySelectorAll('a[href^="mailto:"]')].filter((a) => /Apply/.test(a.textContent)).map((a) => decodeURIComponent(a.getAttribute('href')).includes('attach your resume')));
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
