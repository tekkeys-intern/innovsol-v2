// Generates every industry detail page from content/industries.json.
//   node scripts/industries/build.cjs
// Content lives in the JSON; per-industry look/feel (colour, scene, icons, SEO) lives in META below.
const fs = require('fs');
const path = require('path');
const { icon } = require('./icons.cjs');
const art = require('./art.cjs');

const ROOT = path.join(__dirname, '../..');
const SITE = process.env.SITE_URL || 'https://innovsol.ai';
const OUT = path.join(ROOT, 'public/industries');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/industries.json'), 'utf8'));
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/^﻿/, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lines = (s) => s.split('|').map(esc).join('<br>');
const flat = (s) => esc(s.replace(/\|/g, ' '));

const MODCOL = (a) => [a, '#e5484d', a, '#2b4a7a', a, '#7a45c9'];
const META = {
  banking_finance: { short: 'Banking', raster: 'bank', desc: 'AI for banks and financial institutions: loan processing, fraud detection, KYC automation and compliance. See how Innovsol delivers measurable outcomes in BFSI.', keywords: 'AI in banking, fraud detection AI, loan processing automation, KYC AI, BFSI AI consulting' },
  manufacturingOperations: { short: 'Manufacturing', raster: 'factory', desc: 'AI for manufacturing and operations: predictive maintenance, quality inspection, supply chain and energy optimisation, delivered from pilot to scale.', keywords: 'AI in manufacturing, predictive maintenance, AI quality inspection, supply chain AI' },
  healthcare: { short: 'Healthcare', scene: 'hospital', chips: ['heart-pulse', 'stethoscope', 'scan-line', 'shield-check'], beforeIcon: 'stethoscope', mods: ['file-pen-line', 'scan-search', 'clipboard-check', 'calendar-clock', 'activity', 'receipt'], ecoIcons: ['clipboard-check', 'scan-search', 'calendar-clock', 'file-pen-line', 'shield-check'], desc: 'AI for healthcare and life sciences: clinical documentation, medical imaging, prior authorisation and patient flow, built with HIPAA-grade security.', keywords: 'healthcare AI, clinical documentation AI, medical imaging AI, prior authorization automation' },
  retail: { short: 'Retail', scene: 'store', chips: ['shopping-cart', 'tag', 'trending-up', 'sparkles'], beforeIcon: 'shopping-bag', mods: ['sparkles', 'tag', 'trending-up', 'message-circle', 'boxes', 'scan-search'], ecoIcons: ['megaphone', 'shopping-cart', 'heart', 'scan-search', 'store'], desc: 'AI for retail and e-commerce: personalisation, dynamic pricing, demand forecasting and conversational commerce that lift revenue and loyalty.', keywords: 'retail AI, e-commerce personalisation, dynamic pricing AI, demand forecasting' },
  telecom: { short: 'Telecom', scene: 'tower', chips: ['signal', 'phone-call', 'wifi', 'shield-check'], beforeIcon: 'radio-tower', mods: ['radio-tower', 'user-minus', 'headset', 'receipt', 'gift', 'shield-alert'], ecoIcons: ['radio-tower', 'shield-alert', 'user-minus', 'receipt', 'smile'], desc: 'AI for telecom and media: predictive network operations, churn prevention, AI customer care and revenue assurance.', keywords: 'telecom AI, churn prediction, network operations AI, revenue assurance' },
  insurance: { short: 'Insurance', scene: 'shield', chips: ['file-check', 'car', 'house', 'heart-pulse'], beforeIcon: 'shield-check', mods: ['file-check', 'shield-alert', 'scale', 'messages-square', 'badge-percent', 'landmark'], ecoIcons: ['file-check', 'shield-alert', 'scale', 'users', 'badge-percent'], desc: 'AI for insurers: claims automation, underwriting, fraud detection and dynamic pricing that make insurance faster, fairer and more profitable.', keywords: 'insurance AI, claims automation, AI underwriting, insurance fraud detection' },
  gcc: { short: 'GCC', scene: 'office', chips: ['bot', 'file-text', 'workflow', 'chart-column'], beforeIcon: 'building-2', mods: ['scan-text', 'receipt', 'calculator', 'bot', 'shield-check', 'layout-dashboard'], ecoIcons: ['scan-text', 'workflow', 'calculator', 'shield-check', 'chart-column'], desc: 'AI for Global Capability Centres and shared services: intelligent document processing, touchless finance, agentic automation and compliance.', keywords: 'GCC AI, shared services automation, intelligent document processing, agentic automation' },
  startups: { short: 'Startups', scene: 'rocket', chips: ['rocket', 'code-xml', 'sparkles', 'brain'], beforeIcon: 'rocket', mods: ['bot', 'search', 'wand-sparkles', 'chart-line', 'shield-check', 'layers'], ecoIcons: ['bot', 'search', 'thumbs-up', 'shield-check', 'trending-up'], desc: 'AI engineering for high-growth startups: ship copilots, RAG, search and personalisation in weeks, with production-grade guardrails and cost control.', keywords: 'AI for startups, LLM integration, RAG, AI copilot development, AI-native architecture' },
};
const ACCENT = { banking_finance: '#1d5be0', manufacturingOperations: '#1d5be0' };

const BRAND = {
  SAP: '#0a6ed1', ORACLE: '#e2231a', Oracle: '#e2231a', Microsoft: 'ms', Salesforce: '#00a1e0', salesforce: '#00a1e0', Temenos: '#1b2b63', FINACLE: '#1e3f86', SIEMENS: '#009999',
  Epic: '#e11d48', Cerner: '#00539b', Meditech: '#005a9c', Allscripts: '#006fb7', Shopify: '#5a863e', Magento: '#ee672f', AWS: '#ff9900', Amdocs: '#e5322d', Ericsson: '#0082f0', Nokia: '#124191',
  Guidewire: '#0a5ba8', 'Duck Creek': '#f26522', Applied: '#004b87', Workday: '#0875e1', ServiceNow: '#62d84e', OpenAI: '#10a37f', Claude: '#d97757', Gemini: '#4285f4', 'Google Cloud': '#4285f4', AVEVA: '#4b2382',
};
// WCAG: brand colours used as TEXT must reach 4.5:1 on white, so darken until they do
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ensureContrast = (h) => { let c = h; for (let i = 0; i < 30 && 1.05 / (lum(c) + 0.05) < 4.5; i++) c = art.dark(c, 0.08); return c; };
const msLogo = '<svg viewBox="0 0 92 20" aria-label="Microsoft" role="img"><rect width="9.5" height="9.5" fill="#F25022"/><rect x="10.5" width="9.5" height="9.5" fill="#7FBA00"/><rect y="10.5" width="9.5" height="9.5" fill="#00A4EF"/><rect x="10.5" y="10.5" width="9.5" height="9.5" fill="#FFB900"/><text x="26" y="15" font-family="Segoe UI,Arial,sans-serif" font-size="14" fill="#5e5e5e">Microsoft</text></svg>';

const all = Object.keys(data);
const shell = {
  css: ['src/modules/shared/base.css', 'src/modules/layout/navbar/navbar.css', 'src/modules/layout/footer/footer.css', 'src/modules/shared/responsive.css'].map(read).join('\n'),
  navJs: read('src/modules/layout/navbar/navbar.js'),
  nav: read('src/modules/layout/navbar/navbar.html').replaceAll('href="#', 'href="/#').replace('<nav id="nav">', '<nav id="nav" class="sc" aria-label="Main">').replace('<a href="/#industries">Industries</a>', '<a href="/#industries" class="act" aria-current="page">Industries</a>'),
  footer: read('src/modules/layout/footer/footer.html').replaceAll('href="#', 'href="/#'),
};

const mailto = (() => { const m = require('../mailto.cjs'); return m.playbookLink; })();
const ck = icon('check', { size: 12, width: 3 }), xk = icon('x', { size: 12, width: 3 });

function write(rel, content) { const p = path.join(ROOT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); }

function statBlock(s) {
  const m = /^(\d+)(%|X)$/.exec(s.value);
  const attr = m ? ` data-count="${m[1]}" data-suffix="${m[2]}"` : '';
  return `<div class="stat" role="listitem">${icon(s.icon)}<div><b${attr}>${esc(s.value)}</b><span>${flat(s.label)}</span></div></div>`;
}
function logoBlock(n) {
  if (BRAND[n] === 'ms') return `<div class="logo">${msLogo}</div>`;
  return `<div class="logo" style="color:${ensureContrast(BRAND[n] || '#334455')}">${esc(n)}</div>`;
}

function page(slug) {
  const d = data[slug], m = META[slug];
  const accent = ACCENT[slug] || d.accent;
  const p = art.palette(accent);
  const raster = !!m.raster;
  const url = `${SITE}/industries/${slug}.html`;
  const contactQ = (topic) => `/?industry=${encodeURIComponent(d.name)}&topic=${encodeURIComponent(topic)}#contact-form`;
  const title = `${d.name} AI Solutions | Innovsol`;
  const desc = m.desc;

  // ----- art
  let heroHtml, beforeSrc, afterSrc;
  if (raster) {
    heroHtml = `<img src="assets/hero-${m.raster}.jpg" width="1335" height="1176" alt="${esc(d.name)} AI illustration" fetchpriority="high" decoding="async">`;
    beforeSrc = `assets/before-${m.raster === 'bank' ? 'ai.png' : 'factory.png'}`;
    afterSrc = `assets/after-${m.raster === 'bank' ? 'ai.png' : 'factory.png'}`;
  } else {
    heroHtml = art.hero(m.scene, accent, m.chips).replace('<svg ', `<svg role="img" aria-label="${esc(d.name)} AI illustration" `).replace('aria-hidden="true"', '');
    write(`public/industries/assets/${slug}/before.svg`, art.before(accent, m.beforeIcon));
    write(`public/industries/assets/${slug}/after.svg`, art.after(accent, m.beforeIcon));
    beforeSrc = `assets/${slug}/before.svg`;
    afterSrc = `assets/${slug}/after.svg`;
  }

  // ----- sections
  const baItems = (arr, mark) => arr.map((t, i) => `<li style="--i:${i}"><span class="mk">${mark}</span>${esc(t)}</li>`).join('');
  const nStats = d.stats.length;

  let ecoHtml = '';
  if (d.eco.length) {
    const nodes = d.eco;
    const node = (n) => `<div class="eco-node"><div class="eco-ring">${icon(n.icon)}</div><b>${esc(n.title)}</b><p>${lines(n.text)}</p></div>`;
    const arrow = `<span class="eco-arrow">${icon('arrow-right', { size: 26 })}</span>`;
    const list = `<ul class="eco-list ui-card">${d.ecoList.map((t, i) => `<li><i>${icon(m.ecoIcons ? m.ecoIcons[i] : 'sparkles')}</i>${esc(t)}</li>`).join('')}</ul>`;
    ecoHtml = `<section class="ind-sec" aria-labelledby="h-eco"><div class="ind-wrap"><h2 class="ind-h reveal" id="h-eco">${esc(d.headings[1])}</h2>
<div class="eco reveal d1">${node(nodes[0])}${arrow}${node(nodes[1])}${arrow}${node(nodes[2])}${arrow}${list}${arrow}${node(nodes[3])}</div></div></section>`;
  }

  let modsHtml = '';
  if (d.modules.length) {
    const cols = MODCOL(accent);
    modsHtml = `<section class="ind-sec" style="background:var(--accent-t)" aria-labelledby="h-mod"><div class="ind-wrap"><h2 class="ind-h reveal" id="h-mod">${esc(d.headings[2])}</h2>
<div class="grid c3">${d.modules.map((mod, i) => {
      const tileHtml = raster ? `<img src="assets/module-${i + 1}.png" width="168" height="168" alt="" loading="lazy" decoding="async">` : art.tile(m.mods[i], cols[i], i + 1);
      return `<a class="ui-card mod reveal d${(i % 3) + 1}" href="${contactQ(mod.title)}" aria-label="${esc(mod.title)}: talk to us about this module"><div class="tile">${tileHtml}</div><h3>${esc(mod.title)}</h3><p>${flat(mod.text)}</p><span class="ui-arrow">Explore ${icon('arrow-right', { size: 16 })}</span></a>`;
    }).join('')}</div></div></section>`;
  }

  let useHtml = '', stepsHtml = '';
  if (d.useCases.length) {
    useHtml = `<section class="ind-sec" style="background:var(--accent-t)" aria-labelledby="h-use"><div class="ind-wrap"><h2 class="ind-h reveal" id="h-use">${esc(d.headings[1])}</h2>
<div class="grid c3">${d.useCases.map((u, i) => `<a class="ui-card uc reveal d${(i % 3) + 1}" href="${contactQ(u.title)}" aria-label="${esc(u.title)}: talk to us about this use case"><img src="${u.img}" width="345" height="264" alt="" loading="lazy" decoding="async"><div class="mod"><h3>${esc(u.title)}</h3><p>${flat(u.text)}</p><span class="ui-arrow">Explore ${icon('arrow-right', { size: 16 })}</span></div></a>`).join('')}</div></div></section>`;
  }
  if (d.steps.length) {
    stepsHtml = `<section class="ind-sec" aria-labelledby="h-steps"><div class="ind-wrap"><h2 class="ind-h reveal" id="h-steps">${esc(d.headings[2])}</h2>
<ol class="steps n${d.steps.length}" style="list-style:none">${d.steps.map((s, i) => `<li class="ui-card step reveal d${(i % 3) + 1}"><div class="c">${icon(s.icon)}</div><b>${esc(s.title)}</b><p>${flat(s.text)}</p></li>`).join('')}</ol></div></section>`;
  }

  const logosH = d.headings[d.headings.length - 1];
  const related = all.filter((s) => s !== slug).slice(0, 3);
  const pbMail = mailto(d.name);
  const pbLink = `/playbooks/${slug}.html`;

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Industries', item: SITE + '/#industries' }, { '@type': 'ListItem', position: 3, name: d.name, item: url }] },
      { '@type': 'Service', name: `${d.name} AI Solutions`, description: desc, provider: { '@type': 'Organization', name: 'Innovsol', url: SITE }, areaServed: 'Worldwide', serviceType: `AI transformation for ${d.name}` },
    ],
  };

  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="keywords" content="${esc(m.keywords)}">
<meta name="theme-color" content="${accent}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Innovsol"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og-image.jpg">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/shell/site-shell.css">
<link rel="stylesheet" href="/industries/industry.css">
<script>document.documentElement.className='';</script>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body class="ind" style="--accent:${accent};--accent-d:${p.deep};--accent-s:${p.soft};--accent-t:${p.tint}">
<a class="skip" href="#main" style="position:absolute;left:-999px;top:0;background:#fff;padding:8px 14px;z-index:3000" onfocus="this.style.left='8px'" onblur="this.style.left='-999px'">Skip to content</a>
${shell.nav}
<main id="main">
<section class="ind-hero" aria-labelledby="h1">
  <div class="ind-wrap ind-hero-grid">
    <div>
      <nav class="crumb" aria-label="Breadcrumb"><a href="/">Home</a>${icon('chevron-right')}<a href="/#industries">Industries</a>${icon('chevron-right')}<span aria-current="page">${esc(d.name)}</span></nav>
      ${d.eyebrow ? `<div class="eyebrow">${esc(d.eyebrow)}</div>` : ''}
      <h1 id="h1">${lines(d.h1)}</h1>
      ${d.tagline ? `<p class="tag">${lines(d.tagline)}</p>` : ''}
      <p class="blurb">${flat(d.blurb)}</p>
      <div class="ind-cta">
        <a class="ind-btn dk" href="/?industry=${encodeURIComponent(d.name)}&topic=${encodeURIComponent('AI Discovery Workshop')}#contact-form">${icon('calendar-days')}Book AI Discovery Workshop</a>
        <a class="ind-btn ol" href="${esc(pbLink)}">${icon('file-text')}Download Playbook</a>
      </div>
      <div class="conf">${icon('shield-check')}${esc(d.conf)}</div>
    </div>
    <div class="hero-art">${heroHtml}</div>
  </div>
</section>

<section class="ind-sec" aria-labelledby="h-ba"><div class="ind-wrap">
  <h2 class="ind-h reveal" id="h-ba">${esc(d.headings[0])}</h2>
  <div class="ba">
    <div class="ba-card b"><div><h3>BEFORE AI</h3><ul>${baItems(d.before, xk)}</ul></div><img src="${beforeSrc}" width="150" height="150" alt="Team overwhelmed by manual work before AI" loading="lazy" decoding="async"></div>
    <div class="vs" aria-hidden="true">VS</div>
    <div class="ba-card a"><div><h3>AFTER AI</h3><ul>${baItems(d.after, ck)}</ul></div><img src="${afterSrc}" width="150" height="150" alt="Team working with an AI dashboard after AI" loading="lazy" decoding="async"></div>
  </div>
  <div class="stats n${nStats} reveal" style="margin-top:28px" role="list">${d.stats.map(statBlock).join('')}</div>
  <p class="stats-note" style="margin-top:12px;font-size:.78rem;color:#4b5263;text-align:center">Indicative results from comparable engagements; outcomes vary with scope, data and environment.</p>
</div></section>

${ecoHtml}${modsHtml}${useHtml}${stepsHtml}

<section class="ind-sec" aria-labelledby="h-int"><div class="ind-wrap">
  <h2 class="ind-h reveal" id="h-int">${esc(logosH)}</h2>
  <div class="logos reveal">${d.integrations.map(logoBlock).join('')}<div class="logo more">&amp; More</div></div>
</div></section>

<section class="ind-sec" style="padding-top:0" aria-label="Why Innovsol"><div class="ind-wrap">
  <div class="blk reveal">
    <div class="why"><h3>Why Innovsol</h3><ul>${d.why.map((w) => `<li>${icon('circle-check')}${esc(w)}</li>`).join('')}</ul></div>
    <div class="sec"><h3>Enterprise Grade Security</h3><div class="sec-row">${d.security.map((s) => `<div>${icon(s.icon)}<span>${lines(s.label)}</span></div>`).join('')}</div></div>
    <div class="cta-box"><h3>${lines(d.cta.title)}</h3><p>${flat(d.cta.text)}</p><a class="ind-btn on-dark" href="/?industry=${encodeURIComponent(d.name)}&topic=${encodeURIComponent('Free AI Discovery Workshop')}#contact-form">Book a Free AI Discovery Workshop${icon('arrow-right')}</a></div>
  </div>
</div></section>

<section class="ind-sec" style="padding-top:0" aria-label="Playbook"><div class="ind-wrap">
  <div class="pb reveal"><div class="book">${icon('book-open-check')}</div>
    <div class="pb-copy"><h3>${esc(d.playbook.title)}</h3><p>${flat(d.playbook.text)}</p><p class="note">Leave your details and we send it over. <a href="${esc(pbMail)}" style="text-decoration:underline">Prefer email?</a></p></div>
    <a class="ind-btn on-dark" href="${esc(pbLink)}">${icon('download')}Request Playbook</a></div>
</div></section>

<section class="ind-sec related" style="padding-top:0" aria-labelledby="h-rel"><div class="ind-wrap">
  <h2 class="ind-h reveal" id="h-rel">Explore Other Industries</h2>
  <div class="grid c3">${related.map((s) => `<a class="ui-card reveal" href="/industries/${s}.html"><span>${esc(data[s].name)}</span><span class="ui-arrow">${icon('arrow-right', { size: 18 })}</span></a>`).join('')}</div>
</div></section>
</main>
${shell.footer}
<script src="/shell/navbar.js" defer></script>
<script src="/shell/site-extras.js" defer></script>
<script src="/industries/industry.js" defer></script>
<script src="/mailto-fallback.js" defer></script>
</body>
</html>
`;
}

// ----- shared assets
write('public/shell/site-shell.css', shell.css);
write('public/shell/navbar.js', shell.navJs);
fs.copyFileSync(path.join(__dirname, 'industry.css'), path.join(OUT, 'industry.css'));
fs.copyFileSync(path.join(__dirname, 'industry.js'), path.join(OUT, 'industry.js'));
for (const slug of all) { write(`public/industries/${slug}.html`, page(slug)); console.log('built', slug); }
