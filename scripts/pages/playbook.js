/* Playbook landing pages: posts the lead to /api/contact (kind=playbook), then offers the PDF if one is published. */
(function () {
  var f = document.getElementById('pbform'); if (!f) return;
  var S = window.__SITE__ || {};
  var status = document.getElementById('pbstatus');
  var say = function (m, c) { status.textContent = m; status.className = 'pg-status ' + (c || ''); };
  window.addEventListener('load', function () {
    if (!S.turnstileSiteKey || f.querySelector('.cf-turnstile')) return;
    var h = document.createElement('div'); h.className = 'cf-turnstile'; h.setAttribute('data-sitekey', S.turnstileSiteKey);
    f.insertBefore(h, f.querySelector('button'));
    var s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; document.head.appendChild(s);
  });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var b = f.querySelector('button'); var label = b.textContent; b.disabled = true; b.textContent = 'Sending…'; say('');
    var g = function (n) { return f.elements[n] ? f.elements[n].value.trim() : ''; };
    var parts = g('name').split(/\s+/);
    fetch('/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'playbook', firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '-', email: g('email'), company: g('company'),
        industry: f.getAttribute('data-industry'), enquiryType: 'Playbook request',
        message: 'Playbook requested: ' + f.getAttribute('data-title') + (g('role') ? ' | Role: ' + g('role') : ''),
        website: g('website'), turnstileToken: g('cf-turnstile-response')
      })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        b.disabled = false; b.textContent = label;
        if (!(x.ok && x.j.success)) return say(x.j.error || 'Something went wrong. Please try again or email hello@innovsol.ai.', 'err');
        f.reset(); say('Thank you! We have your request.', 'ok');
        var el = document.getElementById('pbresult'), pdf = f.getAttribute('data-pdf');
        fetch(pdf, { method: 'HEAD' }).then(function (r) {
          if (r.ok && /pdf/i.test(r.headers.get('content-type') || '')) el.innerHTML = '<a class="btn-pg dark" href="' + pdf + '" download>Download the playbook (PDF)</a>';
          else el.textContent = 'We will email the playbook to you shortly.';
        }).catch(function () { el.textContent = 'We will email the playbook to you shortly.'; });
      })
      .catch(function () { b.disabled = false; b.textContent = label; say('Could not reach the server. Please try again or email hello@innovsol.ai.', 'err'); });
  });
})();
