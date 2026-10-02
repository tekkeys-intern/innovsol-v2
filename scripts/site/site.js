/* Site-wide behaviour driven by content/site.json (via window.__SITE__):
   • "Book a Strategy Call" opens the booking page (Calendly / Cal.com) when bookingUrl is set
   • footer legal-entity line */
(function () {
  var S = window.__SITE__ || {};
  document.addEventListener('click', function (e) {
    if (!S.bookingUrl) return;
    var a = e.target.closest && e.target.closest('a'); if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/#contact-form$/.test(href) && /strategy call|discovery/i.test(a.textContent) && !/\?(industry|topic)=/.test(href)) {
      e.preventDefault(); window.open(S.bookingUrl, '_blank', 'noopener');
    }
  });
  function legal() {
    var el = document.querySelector('[data-company]');
    if (!el || !(S.legalName || S.registration)) return;
    el.textContent = [S.legalName, S.registration].filter(Boolean).join(' · ');
    el.hidden = false;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', legal); else legal();
  // React pages inject their markup after load
  window.addEventListener('load', function () { setTimeout(legal, 800); });
})();
