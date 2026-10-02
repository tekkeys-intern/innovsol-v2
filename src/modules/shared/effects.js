// ── Showcase video: autoplay ─────────────────────────────────────────────
const showcase = document.getElementById('showcase');
const scVid = showcase && showcase.querySelector('.sc-video');
if (scVid) {
  scVid.play().catch(() => {});
  scVid.addEventListener('error', function(){
    const sources = scVid.querySelectorAll('source');
    let idx = 0;
    const tryNext = () => {
      if (idx >= sources.length) return;
      scVid.src = sources[idx++].src;
      scVid.load();
      scVid.play().catch(tryNext);
    };
    tryNext();
  });
  document.addEventListener('click', () => { if (scVid.paused) scVid.play().catch(()=>{}); }, { once: true });
}

// ── Showcase text reveal: add sc-go when section enters view ─────────────
if (showcase) {
  const scIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        showcase.classList.add('sc-go');
        scIO.unobserve(showcase);
      }
    });
  }, { threshold: 0.15 });
  scIO.observe(showcase);
}

// ── Auto-assign slow left/right animation to all section titles ──────────
(function () {
  const sections = document.querySelectorAll(
    '#services,#why,#industries,#engagement,#casestudies,#fde,#insights,#careers,#contact'
  );
  sections.forEach((sec, idx) => {
    const fromLeft  = idx % 2 === 0;   // alternate direction per section
    const labels = sec.querySelectorAll('.section-label');
    const h2s    = sec.querySelectorAll('h2');

    labels.forEach(el => {
      el.classList.remove('fi','fi-left','fi-right');
      el.classList.add(fromLeft ? 'fi-left' : 'fi-right', 'title-label');
    });
    h2s.forEach(el => {
      el.classList.remove('fi','fi-left','fi-right');
      // h2 comes from opposite side to label for a spreading effect
      el.classList.add(fromLeft ? 'fi-right' : 'fi-left', 'title-h2');
    });
  });
})();

// ── Intersection observer: fade-in animations ────────────────────────────
const ioFade = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('on');
    e.target.querySelectorAll('[data-count]').forEach(animNum);
    ioFade.unobserve(e.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fi,.fi-left,.fi-right').forEach(el => ioFade.observe(el));

// ── Staggered grid children ──────────────────────────────────────────────
const ioGrid = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    [...e.target.children].forEach((c, i) =>
      setTimeout(() => c.classList.add('on'), i * 90));
    ioGrid.unobserve(e.target);
  });
}, { threshold: 0.08 });

document.querySelectorAll('.why-grid,.ind-grid,.cs-grid,.ins-grid,.roles,.svc-grid').forEach(grid => {
  ioGrid.observe(grid);
});

// ── Number counter animation ─────────────────────────────────────────────
function animNum(el) {
  const target = +el.getAttribute('data-count');
  if (isNaN(target)) return;
  const pfx = el.getAttribute('data-pfx') || '';
  const sfx = el.getAttribute('data-sfx') || '';
  const dur = 1800, start = performance.now();
  const tick = now => {
    const t = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = pfx + Math.round(ease * target) + sfx;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}



// ── Page scroll progress bar ─────────────────────────────────────────────
(function () {
  if (document.getElementById('scroll-progress')) return;
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let ticking = false;
  function update () {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(3) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();
