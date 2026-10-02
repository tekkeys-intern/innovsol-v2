/* Shows the signed-in state in the site navigation.
   The portal (supabase-js) keeps the session in localStorage under  sb-<project-ref>-auth-token .
   This script only READS that entry to display the user's name; it never sends or stores tokens elsewhere.
   Signed out: the "Sign in" link stays.  Signed in: an account menu (My portal / Sign out). */
(function () {
  var S = window.__SITE__ || {};
  if (!S.supabaseUrl) return;
  var ref;
  try { ref = new URL(S.supabaseUrl).hostname.split('.')[0]; } catch (e) { return; }
  var KEY = 'sb-' + ref + '-auth-token';

  function read() {
    try {
      var raw = localStorage.getItem(KEY); if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !(s.refresh_token || s.access_token) || !s.user) return null;
      // a session with a refresh token is still valid even when the 1-hour access token has lapsed
      if (!s.refresh_token && s.expires_at && s.expires_at * 1000 < Date.now()) return null;
      return s;
    } catch (e) { return null; }
  }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function signOut(s) {
    try {
      // best effort: revoke this session on the server (local scope), then clear it locally
      fetch(S.supabaseUrl + '/auth/v1/logout?scope=local', { method: 'POST', keepalive: true, headers: { Authorization: 'Bearer ' + (s.access_token || ''), apikey: '' } }).catch(function () {});
    } catch (e) { /* ignore */ }
    try { localStorage.removeItem(KEY); sessionStorage.removeItem('applyJob'); } catch (e) { /* ignore */ }
    location.href = '/';
  }

  function render() {
    var s = read();
    document.querySelectorAll('.nav-acct, .mob-acct').forEach(function (n) { if (!s) n.remove(); });
    if (!s) {
      document.querySelectorAll('a.nav-signin[data-hidden]').forEach(function (a) { a.hidden = false; a.removeAttribute('data-hidden'); });
      document.querySelectorAll('.mob-nav-links a[data-signin]').forEach(function (a) { a.hidden = false; a.removeAttribute('data-signin'); });
      return;
    }
    var meta = s.user.user_metadata || {};
    var full = (meta.full_name || meta.name || '').trim();
    var email = s.user.email || '';
    var first = full ? full.split(/\s+/)[0] : (email.split('@')[0] || 'Account');
    var initial = (first[0] || 'U').toUpperCase();

    // desktop
    var link = document.querySelector('a.nav-signin');
    if (link && !document.querySelector('.nav-acct')) {
      link.setAttribute('data-hidden', '1'); link.hidden = true;
      var box = document.createElement('div'); box.className = 'nav-acct';
      box.innerHTML = '<button type="button" class="nav-acct-btn" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu for ' + esc(first) + '"><span class="nav-av" aria-hidden="true">' + esc(initial) + '</span><span class="nav-nm">' + esc(first) + '</span></button>' +
        '<div class="nav-acct-menu" role="menu"><div class="nav-acct-em">' + esc(email) + '</div><a role="menuitem" href="/portal">My portal</a><button type="button" role="menuitem" data-signout>Sign out</button></div>';
      link.parentNode.insertBefore(box, link);
      var btn = box.querySelector('.nav-acct-btn');
      btn.addEventListener('click', function (e) { e.stopPropagation(); var o = box.classList.toggle('open'); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); });
      box.querySelector('[data-signout]').addEventListener('click', function () { signOut(s); });
    }
    // mobile drawer
    var drawer = document.querySelector('.mob-nav-links a[href="/portal/login"]');
    if (drawer && !document.querySelector('.mob-acct')) {
      drawer.setAttribute('data-signin', '1'); drawer.hidden = true;
      var m = document.createElement('div'); m.className = 'mob-acct';
      m.innerHTML = '<div class="mob-acct-hi">Signed in as <b>' + esc(first) + '</b></div><a href="/portal">My portal</a><a href="#" data-signout>Sign out</a>';
      drawer.parentNode.insertBefore(m, drawer);
      m.querySelector('[data-signout]').addEventListener('click', function (e) { e.preventDefault(); signOut(s); });
    }
  }

  document.addEventListener('click', function (e) {
    document.querySelectorAll('.nav-acct.open').forEach(function (b) { if (!b.contains(e.target)) { b.classList.remove('open'); var x = b.querySelector('.nav-acct-btn'); if (x) x.setAttribute('aria-expanded', 'false'); } });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.querySelectorAll('.nav-acct.open').forEach(function (b) { b.classList.remove('open'); }); });
  window.addEventListener('storage', function (e) { if (e.key === KEY) render(); });          // other tabs
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
  // React pages inject their navigation after load; re-run once it has settled
  window.addEventListener('load', function () { setTimeout(render, 400); setTimeout(render, 1500); });
})();
