// Generates the content pages: About, Services (+6), Case studies (+3), Insights (+3 drafts), FAQ,
// Engagement models, Security, Accessibility, Brand, Thank-you and one Playbook landing page per industry.
//   node scripts/pages/build.cjs        (also run by `npm run gen`)
// Copy lives in content/*.json; layout/wording of generic sections lives below.
const fs = require('fs');
const path = require('path');
const { icon } = require('../industries/icons.cjs');
const { shell, esc, write, read, ROOT } = require('../lib/shell.cjs');

const J = (f) => JSON.parse(read('content/' + f));
const site = J('site.json'), services = J('services.json'), cases = J('case-studies.json'), eng = J('engagement.json'),
  why = J('why.json'), fde = J('fde.json'), inds = J('industries.json'), faq = J('faq.json'), insights = J('insights.json');
const SITE = process.env.SITE_URL || site.url;
const sh = shell();
const manifest = [];
const q = encodeURIComponent;
const contact = (topic) => `/?topic=${q(topic)}#contact-form`;
const arrow = icon('arrow-right', { size: 15 });

function layout(o) {
  const url = SITE + o.path;
  const title = o.title.length > 60 ? o.title : `${o.title} | Innovsol`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', href: '/' }, ...(o.crumbs || [])].concat([{ name: o.crumbLabel || o.h1, href: o.path }]).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: SITE + c.href })) }, ...(o.ld || [])];
  const crumbs = [`<a href="/">Home</a>`, ...(o.crumbs || []).map((c) => `<a href="${c.href}">${esc(c.name)}</a>`), `<span aria-current="page">${esc(o.crumbLabel || o.h1)}</span>`].join(icon('chevron-right'));
  const html = `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${o.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">
<meta property="og:type" content="${o.og || 'website'}"><meta property="og:site_name" content="Innovsol"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og-image.jpg">
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#3f6cb5">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/shell/site-shell.css"><link rel="stylesheet" href="/pages/pages.css">
<script>document.documentElement.className='';</script>
<script type="application/ld+json">${JSON.stringify(ld.length === 1 ? ld[0] : { '@context': 'https://schema.org', '@graph': ld.map((x) => { const { '@context': _c, ...r } = x; return r; }) })}</script>
</head>
<body class="pg">
<a class="skip" href="#main" style="position:absolute;left:-999px;top:0;background:#fff;padding:8px 14px;z-index:3000" onfocus="this.style.left='8px'" onblur="this.style.left='-999px'">Skip to content</a>
${sh.nav}
<main id="main">
<section class="pg-hero${o.wide ? ' wide' : ''}" aria-labelledby="h1"><div class="pg-wrap">
  <nav class="crumb" aria-label="Breadcrumb">${crumbs}</nav>
  ${o.eyebrow ? `<div class="pg-eyebrow">${esc(o.eyebrow)}</div>` : ''}
  <h1 id="h1">${esc(o.h1)}</h1>
  ${o.intro ? `<p class="pg-intro">${o.intro}</p>` : ''}
  ${o.actions ? `<div class="pg-actions">${o.actions}</div>` : ''}
</div></section>
${o.body}
</main>
${sh.footer}
<script src="/shell/navbar.js" defer></script>
<script src="/shell/site-extras.js" defer></script>
<script src="/pages/pages.js" defer></script>
${o.scripts || ''}
</body>
</html>
`;
  write('public' + o.path, html);
  if (!o.noindex) manifest.push({ path: o.path, priority: o.priority || 0.6, freq: o.freq || 'monthly' });
}

const sec = (inner, alt = false, id = '') => `<section class="pg-sec${alt ? ' alt' : ''}"${id ? ` aria-labelledby="${id}"` : ''}><div class="pg-wrap">${inner}</div></section>`;
const head = (id, h, sub) => `<h2 class="pg-h reveal" id="${id}">${esc(h)}</h2>${sub ? `<p class="pg-sub reveal">${sub}</p>` : ''}`;
const cta = (h, p, topic) => sec(`<div class="pg-cta reveal"><div><h2>${esc(h)}</h2><p>${esc(p)}</p></div><a class="btn-pg orange" href="${contact(topic)}">Talk to our team ${arrow}</a></div>`);
// Whole sentences from the service description (never cut mid-sentence); the first may use " — " as a clause break.
const bullets = (text) => text.replace(/ — /g, '. ').split(/(?<=\.)\s+/).map((s) => s.trim().replace(/\.$/, '')).filter((s) => s.length > 12).slice(0, 4);
const isTimeline = (badge) => /\d|week|wk/i.test(badge);
const phasesHtml = (n = 4) => `<div class="pg-steps n${n}">${eng.phases.map((p) => `<div class="pg-step reveal"><div class="when">${esc(p.when)}</div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><div class="out">${esc(p.deliverable)}</div></div>`).join('')}</div>`;
const indLinks = Object.values(inds).map((d) => `<a class="pg-card reveal" href="/industries/${d.slug}.html"><h3>${esc(d.name)}</h3><span class="more">View solutions ${arrow}</span></a>`).join('');

/* ───────────── shared client script for these pages ───────────── */
write('public/pages/pages.js', `(function(){var n=document.getElementById('nav');if(n){var k=function(){n.classList.add('sc')};k();addEventListener('scroll',k,{passive:true})}
var els=document.querySelectorAll('.reveal');var red=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!('IntersectionObserver' in window)||red){els.forEach(function(e){e.classList.add('in-view')});return}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in-view');io.unobserve(e.target)}})},{threshold:.12});els.forEach(function(e){io.observe(e)})})();
`);
fs.copyFileSync(path.join(__dirname, 'pages.css'), path.join(ROOT, 'public/pages/pages.css'));
fs.copyFileSync(path.join(__dirname, 'playbook.js'), path.join(ROOT, 'public/pages/playbook.js'));

/* ───────────── Services ───────────── */
layout({ path: '/services.html', h1: 'AI Services for the Enterprise', eyebrow: 'Services', priority: 0.8, wide: true,
  title: 'AI Services: Strategy, Engineering, Agents & GenAI', desc: 'Full-stack AI services for enterprises: strategy, product engineering, AI agents, generative AI, AI infrastructure and forward deployed engineering.',
  intro: 'From strategy through engineering to scale: every capability an enterprise needs to put AI into production.',
  actions: `<a class="btn-pg dark" href="${contact('AI services')}">Talk to our team ${arrow}</a>`,
  body: sec(`<div class="pg-grid c3">${services.map((s) => `<a class="pg-card reveal" href="/services/${s.slug}.html"><img src="${esc(s.image)}" alt="" width="700" height="400" loading="lazy"><span class="tag">${esc(s.badge)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text.split(/ — /)[0])}.</p><span class="more">Learn more ${arrow}</span></a>`).join('')}</div>`) + sec(head('h-how', 'How we deliver', 'Every service follows the same four phases, each ending with a deliverable and a decision.') + phasesHtml(), true, 'h-how') + cta('Not sure which service fits?', 'Tell us the problem you want to solve and we will recommend a starting point.', 'AI services') });

for (const s of services) {
  const others = services.filter((x) => x.slug !== s.slug).slice(0, 3);
  layout({ path: `/services/${s.slug}.html`, crumbs: [{ name: 'Services', href: '/services.html' }], h1: s.title, eyebrow: `Service ${s.num} · ${s.badge}`, priority: 0.7,
    title: `${s.title} | AI Services`, desc: `${s.text}`.slice(0, 158), og: 'website',
    intro: esc(s.text), actions: `<a class="btn-pg dark" href="${contact(s.title)}">Discuss this service ${arrow}</a><a class="btn-pg line" href="/engagement-models.html">See how we engage</a>`,
    ld: [{ '@context': 'https://schema.org', '@type': 'Service', name: s.title, description: s.text, provider: { '@type': 'Organization', name: 'Innovsol', url: SITE }, areaServed: 'Worldwide' }],
    body: sec(head('h-inc', 'What this typically includes') + `<ul class="checks reveal">${bullets(s.text).map((b) => `<li>${icon('circle-check')}<span>${esc(b.charAt(0).toUpperCase() + b.slice(1))}</span></li>`).join('')}${isTimeline(s.badge) ? `<li>${icon('circle-check')}<span>${esc(`Typical timeline: ${s.badge}`)}</span></li>` : ''}</ul>`, false, 'h-inc') +
      sec(head('h-how', 'How we deliver') + phasesHtml(), true, 'h-how') +
      sec(head('h-ind', 'Industries where we apply it', 'The same service is tailored to the data, systems and regulations of each sector.') + `<div class="pg-grid c3">${indLinks}</div>`, false, 'h-ind') +
      sec(head('h-rel', 'Related services') + `<div class="pg-grid c3">${others.map((o) => `<a class="pg-card reveal" href="/services/${o.slug}.html"><span class="tag">${esc(o.badge)}</span><h3>${esc(o.title)}</h3><span class="more">Learn more ${arrow}</span></a>`).join('')}</div>`, true, 'h-rel') +
      cta(`Interested in ${s.title}?`, 'We reply within one business day.', s.title) });
}

/* ───────────── Case studies ───────────── */
layout({ path: '/case-studies.html', h1: 'Case Studies: Frontier AI Meets the Real World', eyebrow: 'Case studies', priority: 0.8, wide: true,
  title: 'AI Case Studies: Insurance, Manufacturing, Banking', desc: 'Real AI deployments with measurable outcomes: claims triage automation, predictive maintenance at scale and a RAG-based banking customer agent.',
  intro: 'Real AI deployments, real business challenges, measurable outcomes, achieved through embedded engineering. Client names are withheld.',
  body: sec(`<div class="pg-grid c3">${cases.map((c) => `<a class="pg-card reveal" href="/case-studies/${c.slug}.html"><span class="tag">${esc(c.industry)}</span><h3>${esc(c.title)}</h3><p>${esc(c.type)}</p><p style="margin-top:10px;font-weight:700;color:#0b1022">${esc(c.results[0])}</p><span class="more">Read the case study ${arrow}</span></a>`).join('')}</div><p class="note">Figures are results reported from client engagements and are indicative; outcomes vary with scope, data and environment.</p>`) + cta('Want results like these?', 'Tell us your use case and we will outline how we would approach it.', 'Case study discussion') });

for (const c of cases) {
  const others = cases.filter((x) => x.slug !== c.slug);
  layout({ path: `/case-studies/${c.slug}.html`, crumbs: [{ name: 'Case studies', href: '/case-studies.html' }], h1: c.title, eyebrow: `${c.industry} · ${c.type}`, priority: 0.6, wide: true,
    title: c.title, desc: `${c.industry}: ${c.title}. ${c.results.join('. ')}.`.slice(0, 158),
    intro: `${esc(c.industry)} · ${esc(c.type)}`, actions: `<a class="btn-pg dark" href="${contact('Case study: ' + c.title)}">Discuss a similar project ${arrow}</a>${c.industryPage ? `<a class="btn-pg line" href="${c.industryPage}">${esc(c.industry.split(' — ')[0])} solutions</a>` : ''}`,
    ld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: c.title, about: c.industry, publisher: { '@type': 'Organization', name: 'Innovsol' } }],
    body: sec(head('h-res', 'Results') + `<div class="stat-row">${c.results.map((r) => { const m = r.match(/^([^\s]+(?:\s*(?:%|M|K))?)\s+(.*)$/); return `<div class="reveal"><b>${esc(m ? m[1] : r)}</b><span>${esc(m ? m[2] : '')}</span></div>`; }).join('')}</div><p class="note">Results reported from the engagement; client identity withheld. Figures are indicative.</p>`, false, 'h-res') +
      sec(head('h-glance', 'The engagement at a glance') + `<ul class="checks reveal">${c.details.map((d) => `<li>${icon('circle-check')}<span>${esc(d)}</span></li>`).join('')}</ul>`, true, 'h-glance') +
      sec(head('h-how', 'How we work on projects like this', esc(fde.text[0] || '')) + phasesHtml(), false, 'h-how') +
      sec(head('h-more', 'More case studies') + `<div class="pg-grid c2">${others.map((o) => `<a class="pg-card reveal" href="/case-studies/${o.slug}.html"><span class="tag">${esc(o.industry)}</span><h3>${esc(o.title)}</h3><span class="more">Read the case study ${arrow}</span></a>`).join('')}</div>`, true, 'h-more') +
      cta('Have a similar challenge?', 'We reply within one business day.', 'Case study: ' + c.title) });
}

/* ───────────── Insights (drafts: noindex until reviewed) ───────────── */
layout({ path: '/insights.html', h1: 'Insights on Enterprise AI', eyebrow: 'Insights', noindex: true, priority: 0.5,
  title: 'Insights on Enterprise AI', desc: 'Articles on enterprise AI delivery, strategy and technology from the Innovsol team.',
  intro: 'Practical thinking on getting AI into production.',
  body: sec(`<div class="draft">${icon('triangle-alert')}Draft articles: review before publishing. These pages are hidden from search engines until you remove the draft notice and the <code>noindex</code> tag.</div><div class="pg-grid c3">${insights.map((a) => `<a class="pg-card reveal" href="/insights/${a.slug}.html"><span class="tag">${esc(a.tag)}</span><h3>${esc(a.title)}</h3><p>${esc(a.excerpt)}</p><span class="more">Read article ${arrow}</span></a>`).join('')}</div>`) });
for (const a of insights) {
  layout({ path: `/insights/${a.slug}.html`, crumbs: [{ name: 'Insights', href: '/insights.html' }], h1: a.title, eyebrow: a.tag, noindex: true, wide: true, og: 'article', crumbLabel: a.title,
    title: a.title, desc: a.excerpt,
    ld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, datePublished: a.date, author: { '@type': 'Organization', name: 'Innovsol' }, publisher: { '@type': 'Organization', name: 'Innovsol' } }],
    body: sec(`<div class="draft">${icon('triangle-alert')}DRAFT. Pending review by Innovsol before publication.</div><article class="pg-prose">${a.body}</article>`) + cta('Talk through your own AI roadmap', 'We reply within one business day.', 'Insight: ' + a.title) });
}

/* ───────────── About ───────────── */
layout({ path: '/about.html', h1: 'About Innovsol', eyebrow: 'Who we are', priority: 0.8, wide: true,
  title: 'About Innovsol: Enterprise AI Engineering', desc: 'Innovsol delivers enterprise-grade AI, product engineering and digital transformation, with engineers embedded in your team to ship production AI in weeks.',
  intro: 'Innovate. Adopt. Transform. We help enterprises move AI from slideware to production, with engineers embedded inside your team.',
  actions: `<a class="btn-pg dark" href="/#contact-form">Contact us ${arrow}</a><a class="btn-pg line" href="/careers">Join the team</a>`,
  ld: [{ '@context': 'https://schema.org', '@type': 'Organization', name: 'Innovsol', url: SITE, logo: SITE + '/images/logo.png', email: site.email, telephone: site.phone, address: { '@type': 'PostalAddress', streetAddress: '411, Good Earth Business Bay-1, Sector-58', addressLocality: 'Gurugram', postalCode: '122098', addressCountry: 'IN' } }],
  body: sec(head('h-do', 'What we do', 'Full-stack AI services for the enterprise, from strategy to scale.') + `<div class="pg-grid c3">${services.map((s) => `<a class="pg-card reveal" href="/services/${s.slug}.html"><h3>${esc(s.title)}</h3><p>${esc(s.text.split(/ — /)[0])}.</p><span class="more">Learn more ${arrow}</span></a>`).join('')}</div>`, false, 'h-do') +
    sec(head('h-how', 'How we work', esc((fde.text[0] || '').replace(/\s+/g, ' '))) + `<ul class="checks reveal"><li>${icon('circle-check')}<span>${esc('Engineers embedded in your team, systems and sprint rhythm')}</span></li><li>${icon('circle-check')}<span>${esc('Production-ready AI in under 12 weeks as the delivery target')}</span></li><li>${icon('circle-check')}<span>${esc('Fixed-price discovery with no long-term commitment to start')}</span></li></ul><p style="margin-top:18px"><a class="btn-pg line" href="/engagement-models.html">See engagement models ${arrow}</a></p>`, true, 'h-how') +
    sec(head('h-why', 'Why Innovsol') + `<div class="pg-grid c3">${why.map((w) => `<div class="pg-card reveal"><span class="tag">${esc(w.tag)}</span><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p></div>`).join('')}</div>`, false, 'h-why') +
    sec(head('h-ind', 'Industries we serve') + `<div class="pg-grid c3">${indLinks}</div>`, true, 'h-ind') +
    sec(head('h-where', 'Where to find us') + `<div class="pg-grid c2"><div class="pg-card reveal"><h3>Headquarters</h3><p>${esc(site.address)}</p></div><div class="pg-card reveal"><h3>Get in touch</h3><p><a href="mailto:${site.email}" style="text-decoration:underline">${site.email}</a><br>${esc(site.phone)}</p></div></div>`, false, 'h-where') +
    cta('Let us talk about your AI roadmap', 'We reply within one business day.', 'About Innovsol') });

/* ───────────── Engagement models ───────────── */
layout({ path: '/engagement-models.html', h1: 'How We Engage', eyebrow: 'Engagement models', priority: 0.7,
  title: 'Engagement Models: Discovery Sprint to Scale', desc: 'Start with a fixed-price discovery sprint, then build and scale with embedded engineers. See the four phases, deliverables and ways to engage.',
  intro: eng.pills.map(esc).join(' · '),
  actions: `<a class="btn-pg dark" href="${contact('Discovery Sprint')}">Book a Discovery Sprint ${arrow}</a>`,
  body: sec(head('h-ph', 'Four phases, each with a deliverable') + phasesHtml(), false, 'h-ph') +
    sec(head('h-ways', 'Ways to engage', 'Choose the entry point that matches where you are.') + `<div class="pg-grid c2">${services.filter((s) => /week|Autonomous|RAG|Next/.test(s.badge) || true).slice(0, 6).map((s) => `<a class="pg-card reveal" href="/services/${s.slug}.html"><span class="tag">${esc(s.badge)}</span><h3>${esc(s.title)}</h3><span class="more">Learn more ${arrow}</span></a>`).join('')}</div>`, true, 'h-ways') +
    cta('Start with a Discovery Sprint', 'A fixed-price sprint to your AI roadmap, with no long-term commitment.', 'Discovery Sprint') });

/* ───────────── FAQ ───────────── */
layout({ path: '/faq.html', h1: 'Frequently Asked Questions', eyebrow: 'FAQ', priority: 0.6,
  title: 'FAQ: Enterprise AI Delivery with Innovsol', desc: 'Answers about our forward deployed engineering model, delivery timelines, discovery sprints, security, industries and how to get started.',
  intro: "Can't find your answer? Ask us and we will reply within one business day.",
  ld: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }],
  body: sec(`<div class="pg-faq">${faq.map((f) => `<details class="reveal"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>`) + cta('Still have a question?', 'We reply within one business day.', 'Question from FAQ') });

/* ───────────── Security & trust ───────────── */
layout({ path: '/security.html', h1: 'Security & Trust', eyebrow: 'Security', priority: 0.6,
  title: 'Security & Trust: How We Protect Your Data', desc: 'How Innovsol approaches security in client delivery and how this website protects visitors, with a clear statement of what we do and do not claim.',
  intro: 'Security is designed in from the first week, not added at the end.',
  body: sec(head('h-del', 'In client delivery') + `<ul class="checks reveal">${['Data isolation between environments and clients', 'Role-based access control', 'Audit logging of access and changes', 'Private-cloud and on-premises deployment options', 'Human-in-the-loop review where decisions carry risk', 'A security and governance framework defined in the Design phase'].map((t) => `<li>${icon('circle-check')}<span>${esc(t)}</span></li>`).join('')}</ul>`, false, 'h-del') +
    sec(head('h-web', 'On this website') + `<ul class="checks reveal">${['HTTPS with HSTS; strict Content-Security-Policy and other security headers', 'Contact form validation, spam protection and rate limiting; inputs are escaped and length-limited', 'No advertising cookies; optional analytics only after you consent', 'Candidate portal: row-level security in the database, private resume storage, role-based access, optional multi-factor authentication', 'Your data can be deleted on request, or from within the portal'].map((t) => `<li>${icon('circle-check')}<span>${esc(t)}</span></li>`).join('')}</ul>`, true, 'h-web') +
    sec(head('h-comp', 'Compliance') + `<p class="pg-prose reveal">Regulatory requirements differ by industry and engagement (for example HIPAA, PCI DSS, GDPR, India's DPDP Act or insurance and banking regulators). Tell us which apply to you and we will confirm in writing what our approach does and does not cover before work starts. We do not claim certifications on this page; ask us about any specific attestation you need.</p>`, false, 'h-comp') +
    sec(head('h-vuln', 'Report a vulnerability') + `<p class="pg-prose reveal">If you believe you have found a security issue on this website, please email <a href="mailto:${site.email}?subject=Security%20report">${site.email}</a> with details. We will acknowledge your report and ask that you give us reasonable time to fix the issue before disclosing it. See also <a href="/.well-known/security.txt">security.txt</a>.</p>`, true, 'h-vuln') +
    cta('Questions about security or compliance?', 'We will answer accurately.', 'Security and compliance') });
write('public/.well-known/security.txt', `Contact: mailto:${site.email}\nExpires: 2027-09-30T00:00:00.000Z\nPreferred-Languages: en\nCanonical: ${SITE}/.well-known/security.txt\nPolicy: ${SITE}/security.html\n`);

/* ───────────── Accessibility ───────────── */
layout({ path: '/accessibility.html', h1: 'Accessibility Statement', eyebrow: 'Accessibility', priority: 0.3,
  title: 'Accessibility Statement', desc: 'Innovsol aims for WCAG 2.1 level AA. What we have done, known limitations and how to report an accessibility problem.',
  intro: 'We want everyone to be able to use this website.',
  body: sec(`<div class="pg-prose"><h2>Our target</h2><p>We aim to meet WCAG 2.1 level AA. This is a goal we test against, not a certification.</p><h2>What we do</h2><ul><li>Full keyboard operation, visible focus indicators and a skip-to-content link.</li><li>Text alternatives for images; semantic headings and landmarks.</li><li>Respect for the “reduce motion” setting: animations are switched off.</li><li>Automated accessibility tests (axe-core) run on every static page in our build pipeline.</li></ul><h2>Known limitations</h2><ul><li>Some home-page carousel and scroll-driven sections are being reviewed for screen-reader behaviour.</li><li>Automated tests cannot find every problem; a manual audit with assistive technology is still planned.</li></ul><h2>Tell us about a problem</h2><p>Email <a href="mailto:${site.email}?subject=Accessibility%20feedback">${site.email}</a> and tell us the page and what went wrong. We aim to respond within five working days.</p><p><small>Last reviewed: 1 October 2026.</small></p></div>`) });

/* ───────────── Thank you (noindex) ───────────── */
layout({ path: '/thank-you.html', h1: 'Thank You', eyebrow: 'Message received', noindex: true,
  title: 'Thank You', desc: 'We have received your message and will reply within one business day.',
  intro: 'We have received your message and will reply within one business day.',
  actions: `<a class="btn-pg dark" href="/">Back to home</a><a class="btn-pg line" href="/case-studies.html">See case studies</a>`,
  body: sec(head('h-next', 'While you wait') + `<div class="pg-grid c3"><a class="pg-card reveal" href="/engagement-models.html"><h3>How we engage</h3><span class="more">Read more ${arrow}</span></a><a class="pg-card reveal" href="/faq.html"><h3>Frequently asked questions</h3><span class="more">Read more ${arrow}</span></a><a class="pg-card reveal" href="/services.html"><h3>Our services</h3><span class="more">Read more ${arrow}</span></a></div>`, false, 'h-next') });

/* ───────────── Brand ───────────── */
const tokens = [['Brand blue', '#3f6cb5'], ['Deep blue', '#2d5294'], ['Brand orange', '#faa720'], ['Deep orange', '#d4890f'], ['Near-black', '#0f1923'], ['Pale blue', '#edf2fb']];
layout({ path: '/brand.html', h1: 'Brand Assets', eyebrow: 'Brand', priority: 0.3,
  title: 'Brand Assets: Logo, Colours, Typography', desc: 'Download the Innovsol logo and see the brand colours and typography.',
  intro: 'Please use these assets as provided. Do not recolour, distort or add effects to the logo.',
  body: sec(head('h-logo', 'Logo') + `<div class="logos-dl"><div class="box"><img src="/images/logo.png" alt="Innovsol logo, colour" width="560" height="232"><a class="btn-pg line" href="/images/logo.png" download>Download PNG</a></div><div class="box dark"><img src="/images/white-text-logo.png" alt="Innovsol logo, white text" width="560" height="232"><a class="btn-pg orange" href="/images/white-text-logo.png" download>Download PNG</a></div></div>`, false, 'h-logo') +
    sec(head('h-col', 'Colours') + `<div class="swatches">${tokens.map(([n, h]) => `<div class="sw"><i style="background:${h}"></i><div><b>${n}</b>${h}</div></div>`).join('')}</div>`, true, 'h-col') +
    sec(head('h-type', 'Typography') + `<p class="pg-prose">Inter (Google Fonts), weights 400–800. Headings use tight tracking (−0.02em) and weight 700–800.</p>`, false, 'h-type') });

/* ───────────── Playbook landing pages (one per industry) ───────────── */
for (const d of Object.values(inds)) {
  const pdf = `/playbooks/${d.slug}.pdf`;
  layout({ path: `/playbooks/${d.slug}.html`, crumbs: [{ name: 'Industries', href: '/#industries' }, { name: d.name, href: `/industries/${d.slug}.html` }], h1: d.playbook.title, crumbLabel: 'Playbook', eyebrow: 'Free playbook', priority: 0.5,
    title: d.playbook.title, desc: d.playbook.text.replace(/\|/g, ' ').slice(0, 158),
    intro: esc(d.playbook.text.replace(/\|/g, ' ')),
    body: sec(`<div class="pg-grid c2" style="align-items:start"><div><h2 class="pg-h" id="h-get">Get the playbook</h2><p class="pg-sub">Tell us where to send it. We use your details only to share the playbook and follow up about ${esc(d.name)}.</p>
<form id="pbform" class="pg-form" data-industry="${esc(d.name)}" data-title="${esc(d.playbook.title)}" data-pdf="${pdf}" novalidate>
<label>Full name<input name="name" required maxlength="100" autocomplete="name"></label>
<label>Work email<input name="email" type="email" required maxlength="254" autocomplete="email"></label>
<label>Company<input name="company" required maxlength="120" autocomplete="organization"></label>
<label>Job title (optional)<input name="role" maxlength="80" autocomplete="organization-title"></label>
<div class="hp" aria-hidden="true"><label>Leave empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn-pg dark" type="submit">Request the playbook</button>
<p id="pbstatus" class="pg-status" role="status" aria-live="polite"></p><div id="pbresult"></div>
</form></div>
<div class="pg-card"><h3>What is inside</h3><ul class="checks" style="margin-top:12px"><li>${icon('circle-check')}<span>Use cases and where AI pays back first</span></li><li>${icon('circle-check')}<span>Frameworks for adoption and governance</span></li><li>${icon('circle-check')}<span>ROI models and delivery timelines</span></li></ul><p class="note">Prefer email? <a href="mailto:${site.email}?subject=${q('Playbook request: ' + d.name)}" style="text-decoration:underline">${site.email}</a></p></div></div>`, false, 'h-get'),
    scripts: '<script src="/pages/playbook.js" defer></script>' });
}

fs.writeFileSync(path.join(ROOT, 'scripts/.pages-manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`content pages built: ${manifest.length} indexable + noindex drafts`);
