// Generates every job detail page from content/jobs.json.
//   node scripts/jobs/build.cjs
// (Replaces the old hand-positioned pages. Edit content/jobs.json or job.css, then rebuild.)
const fs = require('fs');
const path = require('path');
const { icon } = require('../industries/icons.cjs');
const { applyLink } = require('../mailto.cjs');
const { shell, esc, write, ROOT } = require('../lib/shell.cjs');

const SITE = process.env.SITE_URL || 'https://innovsol.ai';
const jobs = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/jobs.json'), 'utf8'));
const sh = shell({ active: 'careers' });
const slugs = Object.keys(jobs);
const A = '/careers/assets/';
const siteCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const SHOW_TESTIMONIALS = process.env.SHOW_TESTIMONIALS === '1' || siteCfg.showTestimonials === true;

const employment = (j) => ((j.meta.find((m) => /full/i.test(m.text)) || {}).text || 'Full-Time').toLowerCase().includes('part') ? 'PART_TIME' : 'FULL_TIME';

function page(slug) {
  const j = jobs[slug];
  const url = `${SITE}/careers/${slug}.html`;
  const apply = esc(applyLink(j.title));            // email fallback
  const portalHref = `/portal?job=${slug}`;          // sign in + apply with resume upload
  const desc = j.about.slice(0, 155);
  const title = `${j.title} | Careers at Innovsol`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'JobPosting', title: j.title, description: j.about, datePosted: '2026-09-01', validThrough: '2027-03-31T23:59:00+05:30',
    employmentType: employment(j), jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'Worldwide' },
    hiringOrganization: { '@type': 'Organization', name: 'Innovsol', sameAs: SITE, logo: `${SITE}/images/logo.png` }, directApply: false,
    responsibilities: j.responsibilities.join('; '), skills: j.stack.map((s) => s.name).join(', '),
  };
  const related = slugs.filter((s) => s !== slug);
  const saveBtn = (cls) => `<button type="button" class="jbtn ${cls}" data-save aria-pressed="false">${icon('heart')}<span class="lbl">Save Job</span></button>`;
  const shareBtn = (cls) => `<a class="jbtn ${cls} js-share" href="#" role="button">${icon('share-2')}Share Job</a>`;

  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:site_name" content="Innovsol"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#3f6cb5">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/shell/site-shell.css">
<link rel="stylesheet" href="/careers/job.css">
<script>document.documentElement.className='';</script>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body class="job">
<a class="skip" href="#main" style="position:absolute;left:-999px;top:0;background:#fff;padding:8px 14px;z-index:3000" onfocus="this.style.left='8px'" onblur="this.style.left='-999px'">Skip to content</a>
${sh.nav}
<main id="main" class="job-main"><div class="job-wrap">
  <nav class="crumb" aria-label="Breadcrumb"><a href="/">Home</a>${icon('chevron-right')}<a href="/careers">Careers</a>${icon('chevron-right')}<span aria-current="page">${esc(j.title)}</span></nav>

  <section class="card hero" aria-labelledby="h1">
    <div>
      <h1 id="h1">${esc(j.title)}</h1>
      <span class="badge">${icon('star')}${esc(j.badge)}</span>
      <div class="meta">${j.meta.map((m) => `<div>${icon(m.icon)}<span>${esc(m.text)}</span></div>`).join('')}</div>
      <div class="btns">
        <a class="jbtn dark" href="${portalHref}" title="Sign in and apply with your resume">Apply Now ${icon('send')}</a>
        ${shareBtn('line')}
        ${saveBtn('line')}
      </div>
    </div>
    <div class="hero-art"><img src="${A}hero-ai.jpg" width="894" height="699" alt="AI chip illustration" fetchpriority="high" decoding="async">${j.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
  </section>

  <section class="card reveal" aria-labelledby="h-why"><h2 id="h-why" style="text-align:center">Why Join Innovsol?</h2>
    <div class="why-grid">${j.why.map((w) => `<div>${icon(w.icon)}<h3>${esc(w.title)}</h3><p>${esc(w.text)}</p></div>`).join('')}</div>
  </section>

  <div class="two reveal">
    <section class="card soft about" aria-labelledby="h-about"><h2 id="h-about">About the Role</h2><p>${esc(j.about)}</p></section>
    <section class="card soft" aria-labelledby="h-key"><h2 id="h-key">Key Responsibilities</h2><ul class="checks">${j.responsibilities.map((r) => `<li>${icon('circle-check')}<span>${esc(r)}</span></li>`).join('')}</ul></section>
  </div>

  <section class="card soft reveal" style="margin-top:24px" aria-labelledby="h-stack"><h2 id="h-stack">Tech Stack You’ll Use</h2>
    <div class="chips">${j.stack.map((s) => `<span class="chip">${s.icon ? `<img src="${A}${s.icon.replace(/^assets\//, '')}" alt="" width="20" height="20" loading="lazy">` : ''}${esc(s.name)}</span>`).join('')}</div>
  </section>

  <section class="card soft reveal" aria-labelledby="h-proj"><h2 id="h-proj">Projects You May Work On</h2>
    <div class="proj">${j.projects.map((p) => `<a href="mailto:hello@innovsol.ai?subject=${encodeURIComponent('Question about ' + j.title + ': ' + p.text)}" title="Ask us about this project"><span class="pi">${icon(p.icon)}</span>${esc(p.text)}</a>`).join('')}</div>
  </section>

  <div class="three reveal">
    <section class="card soft growth" aria-labelledby="h-grow"><h2 id="h-grow">Growth Path</h2><ol>${j.growth.map((g) => `<li>${esc(g)}</li>`).join('')}</ol></section>
    <section class="card soft perks" aria-labelledby="h-perk"><h2 id="h-perk">Benefits &amp; Perks</h2><ul>${j.perks.map((p) => `<li>${icon(p.icon)}${esc(p.text)}</li>`).join('')}</ul></section>
    <section class="card soft hire" aria-labelledby="h-hire"><h2 id="h-hire">Our Hiring Process</h2><ol>${j.hiring.map((h, i) => `<li><span class="num">${i + 1}</span>${esc(h)}</li>`).join('')}</ol><div class="est">${icon('timer')}<span>Estimated time: <b>${esc(j.hiringTime)}</b></span></div></section>
  </div>

  <section class="card reveal" style="margin-top:24px" aria-labelledby="h-life"><h2 id="h-life">Life at Innovsol</h2>
    <div class="photos">${[['life-1.jpg', 'Team collaborating'], ['life-2.jpg', 'Innovsol team photo'], ['life-3.jpg', 'Engineers working'], ['life-4.jpg', 'Innovsol office']].map(([f, alt]) => `<a href="/careers"><img src="${A}${f}" width="549" height="360" alt="${alt}" loading="lazy" decoding="async"></a>`).join('')}</div>
  </section>

  ${SHOW_TESTIMONIALS ? `<div class="tests reveal">${j.testimonials.map((t) => `<section class="card soft test"><img src="${A}${(t.avatar || '').replace(/^assets\//, '')}" alt="${esc(t.who.split(',')[0])}" width="56" height="56" loading="lazy"><div><div class="stars" aria-label="5 out of 5 stars">★★★★★</div><p>“${esc(t.quote)}”</p><div class="who">— ${esc(t.who)}</div></div></section>`).join('')}</div>` : ''}

  <section class="reveal" style="margin-top:24px" aria-labelledby="h-rel"><h2 id="h-rel">Related Open Positions</h2>
    <div class="rel">${related.map((s) => `<a href="/careers/${s}.html">${esc(jobs[s].title)}${icon('arrow-right')}</a>`).join('')}</div>
  </section>

  <section class="apply reveal" aria-labelledby="h-apply">
    <div><h2 id="h-apply">Ready to apply for ${esc(j.title)}?</h2><p>Sign in, upload your resume and track your application in the portal. We review every application and reply within a few working days.</p>
    <span class="note">${icon('paperclip')}Prefer email? <a href="${apply}" style="text-decoration:underline">Apply by email</a> and attach your resume (PDF or DOCX).</span></div>
    <a class="jbtn light" href="${portalHref}">Sign in &amp; apply ${icon('send')}</a>
  </section>
</div></main>

<div class="bar" role="toolbar" aria-label="Job actions">
  ${saveBtn('dark')}
  ${shareBtn('dark')}
  <a class="jbtn blue" href="${portalHref}">${icon('rocket')}Apply Now</a>
</div>
${sh.footer}
<script src="/shell/navbar.js" defer></script>
<script src="/shell/site-extras.js" defer></script>
<script src="/careers/job.js" defer></script>
<script src="/careers/share.js" defer></script>
<script src="/mailto-fallback.js" defer></script>
</body>
</html>
`;
}

fs.copyFileSync(path.join(__dirname, 'job.css'), path.join(ROOT, 'public/careers/job.css'));
fs.copyFileSync(path.join(__dirname, 'job.js'), path.join(ROOT, 'public/careers/job.js'));
write('public/shell/site-shell.css', sh.css);
write('public/shell/navbar.js', sh.navJs);
for (const s of slugs) { write(`public/careers/${s}.html`, page(s)); console.log('built', s); }
