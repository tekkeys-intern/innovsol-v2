/* Cookie consent + analytics loader. Nothing is loaded and no banner is shown unless an analytics
   ID is configured in content/site.json (the site itself sets no tracking cookies). */
(function () {
  var S = window.__SITE__ || {}, A = S.analytics || {};
  var KEY = 'innovsol-consent';
  if (!A.ga4Id && !A.plausibleDomain) return;

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } }

  function load() {
    if (window.__analyticsLoaded) return; window.__analyticsLoaded = true;
    if (A.ga4Id) {
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(A.ga4Id); document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', A.ga4Id, { anonymize_ip: true });
    }
    if (A.plausibleDomain) {
      var p = document.createElement('script'); p.defer = true; p.setAttribute('data-domain', A.plausibleDomain); p.src = 'https://plausible.io/js/script.js'; document.head.appendChild(p);
    }
  }

  function banner() {
    if (document.getElementById('consent-banner')) return;
    var d = document.createElement('div'); d.id = 'consent-banner'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cookie consent');
    d.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;max-width:560px;margin:0 auto;z-index:10001;background:#0b1022;color:#fff;border-radius:14px;padding:18px 20px;box-shadow:0 18px 50px rgba(0,0,0,.35);font:14px/1.5 Inter,system-ui,sans-serif';
    d.innerHTML = '<p style="margin:0 0 12px">We use optional analytics cookies to understand how the site is used. No advertising cookies. See our <a href="/cookies.html" style="color:#faa720;text-decoration:underline">Cookie Policy</a>.</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button id="consent-yes" style="flex:1;min-height:42px;border:0;border-radius:8px;background:#faa720;color:#0b1022;font-weight:700;cursor:pointer">Accept analytics</button>' +
      '<button id="consent-no" style="flex:1;min-height:42px;border:1.5px solid rgba(255,255,255,.5);border-radius:8px;background:transparent;color:#fff;font-weight:700;cursor:pointer">Decline</button></div>';
    document.body.appendChild(d);
    d.querySelector('#consent-yes').onclick = function () { set('granted'); d.remove(); load(); };
    d.querySelector('#consent-no').onclick = function () { set('denied'); d.remove(); };
  }

  var c = get();
  if (c === 'granted') load(); else if (c !== 'denied') (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', banner) : banner());

  // footer link "Cookie settings" re-opens the choice
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-cookie-settings]'); if (!a) return;
    e.preventDefault(); try { localStorage.removeItem(KEY); } catch (x) { /* ignore */ } banner();
  });
})();
