// Rewrites the "Download Playbook" links on the industry pages to mailto:. (Job pages and role cards are generated / edited elsewhere: they now lead into the portal.)
// Idempotent: safe to re-run. Run from the project root: node scripts/apply-mailto.cjs
const fs = require('fs');
const path = require('path');
const { applyLink, playbookLink } = require('./mailto.cjs');

const esc = (s) => s.replace(/&/g, '&amp;');
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const CTA = /href="(?:\/#contact-form|mailto:[^"]*)"/;
let changed = 0;

// 2. Industry pages: "Download Playbook"
for (const f of fs.readdirSync('public/industries').filter((x) => x.endsWith('.html'))) {
  const p = path.join('public/industries', f);
  const s = fs.readFileSync(p, 'utf8');
  const industry = text(s.match(/<title>([\s\S]*?)<\/title>/)[1].replace(/\s+[–-]\s+InnovSol$/, ''));
  const href = `href="${esc(playbookLink(industry))}"`;
  const out = s.replace(/<a([^>]*?)href="(?:\/#contact-form|mailto:[^"]*)"([^>]*)>((?:(?!<\/a>)[\s\S])*Download Playbook[\s\S]*?)<\/a>/g,
    (m, a, b, inner) => `<a${a}${href}${b}>${inner}</a>`);
  if (out !== s) { fs.writeFileSync(p, out); changed++; }
}

console.log('files updated:', changed);
