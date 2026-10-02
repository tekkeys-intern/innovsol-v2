// Signed-in navigation: with a saved Supabase session the nav shows the user's name + account menu.
//   BASE=http://127.0.0.1:4500 node tests/e2e/session.cjs
const puppeteer = require('puppeteer-core');
const BASE = process.env.BASE || 'http://127.0.0.1:4500';
const REF = process.env.SUPABASE_REF || 'micwhngfzcmkwbmhzixn';
const KEY = `sb-${REF}-auth-token`;
const session = { access_token: 'fake', refresh_token: 'fake', expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'u1', email: 'asha.verma@example.com', user_metadata: { full_name: 'Asha Verma' } } };
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };

(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  for (const [label, path, wait, vp] of [['static page', '/faq.html', 900, { width: 1280, height: 800 }], ['home (React)', '/', 3200, { width: 1280, height: 800 }]]) {
    console.log(label);
    const p = await b.newPage(); await p.setViewport(vp);
    await p.goto(BASE + path, { waitUntil: 'load' });
    ok('signed out: "Sign in" link visible, no account menu', await p.evaluate(() => { const a = document.querySelector('a.nav-signin'); return !!a && !a.hidden && !document.querySelector('.nav-acct'); }));
    await p.evaluate((k, s) => localStorage.setItem(k, JSON.stringify(s)), KEY, session);
    await p.reload({ waitUntil: 'load' }); await new Promise((r) => setTimeout(r, wait));
    const st = await p.evaluate(() => ({ name: document.querySelector('.nav-nm')?.textContent, av: document.querySelector('.nav-av')?.textContent, signinHidden: document.querySelector('a.nav-signin')?.hidden, email: document.querySelector('.nav-acct-em')?.textContent }));
    ok('signed in: shows first name "Asha"', st.name === 'Asha', JSON.stringify(st));
    ok('avatar initial "A", "Sign in" hidden', st.av === 'A' && st.signinHidden === true);
    await p.click('.nav-acct-btn');
    ok('menu opens with email, My portal, Sign out', await p.evaluate(() => document.querySelector('.nav-acct').classList.contains('open') && document.querySelector('.nav-acct-menu a[href="/portal"]') && !!document.querySelector('[data-signout]')));
    await Promise.all([p.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => null), p.click('.nav-acct-menu [data-signout]')]);
    ok('Sign out clears the saved login and returns home', (await p.evaluate((k) => localStorage.getItem(k), KEY)) === null && new URL(p.url()).pathname === '/');
    await new Promise((r) => setTimeout(r, wait));
    ok('after sign out: "Sign in" is back', await p.evaluate(() => { const a = document.querySelector('a.nav-signin'); return !!a && !a.hidden && !document.querySelector('.nav-acct'); }));
    await p.close();
  }
  console.log('mobile drawer');
  const m = await b.newPage(); await m.setViewport({ width: 390, height: 844 });
  await m.goto(BASE + '/faq.html', { waitUntil: 'load' });
  await m.evaluate((k, s) => localStorage.setItem(k, JSON.stringify(s)), KEY, session);
  await m.reload({ waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 900));
  ok('drawer shows "Signed in as Asha", My portal, Sign out', await m.evaluate(() => { const d = document.querySelector('.mob-acct'); return !!d && /Asha/.test(d.textContent) && !!d.querySelector('a[href="/portal"]') && !!d.querySelector('[data-signout]'); }));
  ok('drawer "Sign in / Apply" link hidden', await m.evaluate(() => document.querySelector('.mob-nav-links a[href="/portal/login"]').hidden === true));
  const errors = [];
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
