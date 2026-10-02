// ── Engagement sticky scroll — page scroll drives card transitions ────────
// Performance notes (this replaced a version that felt laggy on "Discover / Design / Deploy / Scale"):
//  • layout is measured once (and on resize), never inside the scroll handler
//  • the scroll handler is rAF-throttled and only reads window.scrollY
//  • clicking a phase activates it immediately and tweens the scroll in 450ms,
//    ignoring scroll events meanwhile, so intermediate cards never flash by
(function () {
  const driver = document.getElementById('engagement');
  const cards  = Array.from(document.querySelectorAll('.eng-card'));
  const steps  = Array.from(document.querySelectorAll('.eng-steplbl'));
  const dots   = Array.from(document.querySelectorAll('.eng-dot'));
  const fill   = document.querySelector('.eng-fill');
  if (!driver || !cards.length) return;

  const root   = document.documentElement;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeIdx = -1, top = 0, available = 0, ticking = false, lockUntil = 0;

  function measure () {
    top       = driver.getBoundingClientRect().top + window.scrollY;
    available = driver.offsetHeight - window.innerHeight;
  }

  function getIdx () {
    if (available <= 0) return 0;
    const p = Math.min(1, Math.max(0, (window.scrollY - top) / available));
    return Math.min(cards.length - 1, Math.floor(p * cards.length));
  }

  function activate (idx) {
    if (idx === activeIdx) return;
    const prev = activeIdx;
    activeIdx = idx;

    if (prev >= 0) {
      cards[prev].classList.remove('eng-active');
      cards[prev].classList.add('eng-exit');
      setTimeout(() => cards[prev] && cards[prev].classList.remove('eng-exit'), 300);
    }
    cards[idx].classList.add('eng-active');

    steps.forEach((s, i) => {
      s.classList.toggle('active', i === idx);
      s.setAttribute('aria-current', i === idx ? 'step' : 'false');
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  function progress () {
    if (!fill || available <= 0) return;
    const p = Math.min(1, Math.max(0, (window.scrollY - top) / available));
    fill.style.transform = 'scaleX(' + p.toFixed(3) + ')';
  }

  function onScroll () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      progress();                                   // the bar always follows the scroll
      if (performance.now() >= lockUntil) activate(getIdx());
    });
  }

  function tweenTo (y, ms) {
    if (reduce) { root.style.scrollBehavior = 'auto'; window.scrollTo(0, y); root.style.scrollBehavior = ''; return; }
    const from = window.scrollY, delta = y - from, t0 = performance.now();
    root.style.scrollBehavior = 'auto'; // the page-level "smooth" would fight this tween
    (function frame (now) {
      const p = Math.min(1, (now - t0) / ms);
      window.scrollTo(0, from + delta * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
      else { root.style.scrollBehavior = ''; lockUntil = 0; activate(getIdx()); }
    })(t0);
  }

  measure();
  activate(getIdx());
  progress();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); activate(getIdx()); });
  window.addEventListener('load', () => { measure(); activate(getIdx()); });

  // Click a phase → jump to the middle of that card's scroll range
  steps.forEach((s, i) => {
    const go = (ev) => {
      ev.preventDefault();
      measure();
      const target = top + ((i + 0.5) / cards.length) * available;
      lockUntil = performance.now() + 500;
      activate(i);
      tweenTo(target, 450);
    };
    s.addEventListener('click', go);
    s.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') go(ev); });
  });
})();
