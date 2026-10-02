/* Job page behaviour: scroll reveal, "Save job" toggle. The page works without JS. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('nav');
  if (nav) { var keep = function () { nav.classList.add('sc'); }; keep(); addEventListener('scroll', keep, { passive: true }); }

  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce) { items.forEach(function (el) { el.classList.add('in-view'); }); }
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  var key = 'saved:' + location.pathname;
  function state() { try { return !!localStorage.getItem(key); } catch (e) { return false; } }
  function paint() {
    document.querySelectorAll('[data-save]').forEach(function (b) {
      var on = state();
      b.classList.toggle('saved', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var t = b.querySelector('.lbl'); if (t) t.textContent = on ? 'Saved' : 'Save Job';
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-save]');
    if (!b) return;
    e.preventDefault();
    try { if (state()) localStorage.removeItem(key); else localStorage.setItem(key, '1'); } catch (err) { /* private mode */ }
    paint();
  });
  paint();
})();
