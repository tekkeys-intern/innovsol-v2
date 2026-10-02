// ── Reusable clickable elements ───────────────────────────────────────────
//   data-href="#section" | "/path" | "https://…"  → scroll / navigate
//   data-topic="Something" [data-industry="…"]     → open the contact form pre-filled
// Works with mouse, touch, and keyboard (Enter / Space). Clicks on real links or buttons
// inside a card are left alone, so nested "Learn more" links keep working.
(function () {
  function scrollToId (id) {
    const el = document.getElementById(id);
    if (!el) return false;
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* ignore */ }
    return true;
  }

  function prefill (el) {
    if (typeof window.prefillContactForm === 'function') {
      window.prefillContactForm({ topic: el.getAttribute('data-topic'), industry: el.getAttribute('data-industry') || '' });
    }
  }

  function activate (el) {
    const topic = el.getAttribute('data-topic');
    const href  = el.getAttribute('data-href');
    if (topic) {
      prefill(el);
      if (scrollToId('contact-form')) return;
      window.location.href = '/?topic=' + encodeURIComponent(topic) + '#contact-form';
      return;
    }
    if (!href) return;
    if (href.charAt(0) === '#') { if (!scrollToId(href.slice(1))) window.location.hash = href; return; }
    window.location.href = href;
  }

  function enhance (root) {
    (root || document).querySelectorAll('[data-href], [data-topic]:not(a)').forEach(function (el) {
      if (el.__clickable) return;
      el.__clickable = true;
      el.classList.add('is-clickable');
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'link');
      el.addEventListener('click', function (e) {
        if (e.target.closest('a[href], button')) return;
        activate(el);
      });
      el.addEventListener('keydown', function (e) {
        if (e.target !== el) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(el); }
      });
    });
    // plain links carrying a topic (e.g. "Learn more") pre-fill the form before the hash jump
    (root || document).querySelectorAll('a[data-topic]').forEach(function (a) {
      if (a.__topic) return;
      a.__topic = true;
      a.addEventListener('click', function () { prefill(a); });
    });
  }

  window.enhanceClickables = enhance;
  enhance(document);
})();
