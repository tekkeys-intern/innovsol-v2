// ── Hero Reel — 4-slide enterprise video carousel ────────────────────────
(function () {
  // Guard: prevent double-init from React StrictMode's double effect invocation
  if (window.__reelInit) return;
  window.__reelInit = true;

  const videos  = Array.from(document.querySelectorAll('.reel-video'));
  const slides  = Array.from(document.querySelectorAll('.reel-slide'));
  const dots    = Array.from(document.querySelectorAll('.reel-dot'));

  if (!videos.length) return;

  // Playback speed per slide (0 = first, last = videos.length-1)
  const rates = [0.6, 1.0, 1.0, 2.5];
  function applyRate (idx) {
    videos[idx].playbackRate = rates[idx] ?? 1.0;
  }

  let current       = 0;
  let transitioning = false;
  let fallback      = null;
  let heroInView    = true;

  const navEl = document.getElementById('nav');

  // Apply / remove the alt logo: only when video 1-3 is active,
  // hero is in view, AND nav hasn't gone white (scrollY <= 60)
  function syncNavLogo () {
    const navTransparent = window.scrollY <= 60;
    if (navEl) navEl.classList.toggle('reel-alt', current !== 0 && heroInView && navTransparent);
  }

  // Revert logo as soon as the navbar turns white on scroll
  window.addEventListener('scroll', syncNavLogo, { passive: true });

  // Watch hero section — revert logo when user scrolls away
  const heroSection = document.getElementById('home');
  if (heroSection) {
    new IntersectionObserver((entries) => {
      heroInView = entries[0].isIntersecting;
      syncNavLogo();
    }, { threshold: 0.1 }).observe(heroSection);
  }

  // Hard fallback — advance after 12s max per slide regardless of video state
  function resetFallback () {
    clearTimeout(fallback);
    fallback = setTimeout(() => goTo(current + 1), 12000);
  }

  function goTo (idx) {
    if (transitioning) return;
    const next = ((idx % videos.length) + videos.length) % videos.length;
    if (next === current) return;
    transitioning = true;

    clearTimeout(fallback);
    const prev = current;
    current = next;

    // Videos: crossfade
    videos[prev].classList.remove('reel-active');
    videos[prev].pause();
    videos[current].classList.add('reel-active');
    videos[current].muted = true;
    videos[current].currentTime = 0;
    applyRate(current);
    videos[current].play().catch(() => {});

    // Slides: fade out old, fade in new
    slides[prev].classList.remove('reel-active');
    slides[prev].classList.add('reel-exit');
    slides[current].classList.add('reel-active');

    // Dots
    dots.forEach((d, i) => d.classList.toggle('reel-dot-active', i === current));

    // Nav logo: original on slide 0 or when hero not in view
    syncNavLogo();

    setTimeout(() => {
      slides[prev].classList.remove('reel-exit');
      transitioning = false;
      resetFallback();
    }, 950);
  }

  // Three layers of advance detection (most → least reliable)
  videos.forEach((v, i) => {
    // 1. ended event (primary)
    v.addEventListener('ended', () => {
      if (i === current) goTo(current + 1);
    });
    // 2. timeupdate: advance when 97% through (catches ended-event failures)
    v.addEventListener('timeupdate', () => {
      if (i !== current || !v.duration) return;
      if (v.currentTime / v.duration >= 0.97) goTo(current + 1);
    });
    // 3. error: skip broken video immediately
    v.addEventListener('error', () => {
      if (i === current) goTo(current + 1);
    });
  });

  // Dot clicks
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.idx)));

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') goTo(current + 1);
    if (e.key === 'ArrowLeft')  goTo(current - 1);
  });

  // Init — React's dangerouslySetInnerHTML doesn't trigger browser autoplay;
  // we must call .play() programmatically after the DOM has settled.
  function tryPlay () {
    const v = videos[0];
    if (!v) return;
    v.muted = true;          // ensure muted flag is set in DOM
    v.currentTime = 0;
    applyRate(0);
    const p = v.play();
    if (p !== undefined) {
      p.catch(() => {
        // Browser blocked autoplay — retry on first user gesture
        const resume = () => {
          v.play().catch(() => {});
          document.removeEventListener('click',      resume);
          document.removeEventListener('touchstart', resume);
          document.removeEventListener('keydown',    resume);
        };
        document.addEventListener('click',      resume, { once: true });
        document.addEventListener('touchstart', resume, { once: true });
        document.addEventListener('keydown',    resume, { once: true });
      });
    }
  }

  // Wait two animation frames so React's paint + browser layout are complete
  requestAnimationFrame(() => requestAnimationFrame(() => {
    tryPlay();
    resetFallback();
  }));
})();

// ── Fire hero stats on load ──────────────────────────────────────────────
window.addEventListener('load', () => {
  document.querySelectorAll('.hero-txt .hn[data-count]').forEach(el => animNum(el));
});
