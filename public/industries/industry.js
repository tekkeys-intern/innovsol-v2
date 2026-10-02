/* Industry page behaviour: scroll reveal, count-up stats, ecosystem flow highlight.
   Progressive enhancement: the page is fully readable without it. */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // keep the shared navbar in its solid state (these pages have a light hero)
  var nav = document.getElementById('nav');
  if (nav) {
    var keep = function () { nav.classList.add('sc'); };
    keep(); addEventListener('scroll', keep, { passive: true });
  }

  // scroll reveal
  var items = document.querySelectorAll('.reveal, .ba');
  if (!('IntersectionObserver' in window) || reduce) {
    items.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // count-up: "70%" / "2X" / "4X"; ranges and words are left as-is
  var stats = document.querySelectorAll('.stat b[data-count]');
  function run(el) {
    var end = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '', t0 = null;
    if (reduce) { el.textContent = end + suffix; return; }
    (function step(ts) {
      t0 = t0 || ts;
      var p = Math.min((ts - t0) / 1100, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); so.unobserve(e.target); } });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { so.observe(el); });
  }

  // ecosystem: light up the flow node by node (pauses on hover/focus, off for reduced motion)
  var eco = document.querySelector('.eco');
  if (eco && !reduce) {
    var parts = eco.querySelectorAll('.eco-node, .eco-list, .eco-arrow');
    var seq = Array.prototype.slice.call(parts), i = 0, timer, paused = false;
    var tick = function () {
      if (paused) return;
      seq.forEach(function (n) { n.classList.remove('on'); });
      seq[i % seq.length].classList.add('on');
      if (seq[i % seq.length].previousElementSibling && seq[i % seq.length].classList.contains('eco-arrow')) seq[i % seq.length].classList.add('on');
      i++;
    };
    var start = function () { clearInterval(timer); timer = setInterval(tick, 900); };
    var visible = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { start(); } else { clearInterval(timer); } });
    }, { threshold: 0.3 });
    visible.observe(eco);
    eco.addEventListener('mouseenter', function () { paused = true; });
    eco.addEventListener('mouseleave', function () { paused = false; });
  }
})();
