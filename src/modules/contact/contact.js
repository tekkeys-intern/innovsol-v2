// ── Contact form ─────────────────────────────────────────────────────────
// Pre-fills the form. Used on page load from the URL, e.g.
//   /?industry=Healthcare%20%26%20Life%20Sciences&topic=Prior%20Auth%20AI#contact-form
// and by clickable cards on this page via window.prefillContactForm({ topic, industry }).
window.prefillContactForm = function (opts) {
  const form = document.getElementById('cform');
  if (!form || !opts) return;
  const industry = (opts.industry || '').trim(), topic = (opts.topic || '').trim();
  if (industry && form.elements.industry) {
    const want = industry.toLowerCase();
    const opt = Array.from(form.elements.industry.options).find(function (o) {
      const t = o.text.toLowerCase();
      return t === want || (t.length > 3 && want.indexOf(t.split(/[ /&]/)[0]) === 0);
    });
    if (opt) form.elements.industry.value = opt.value || opt.text;
  }
  if (topic && form.elements.message) {
    form.elements.message.value = "I'd like to discuss: " + topic.slice(0, 120) + '.' + String.fromCharCode(10);
  }
};
(function () {
  const q = new URLSearchParams(window.location.search);
  if (q.get('industry') || q.get('topic')) window.prefillContactForm({ industry: q.get('industry'), topic: q.get('topic') });
})();

// Cloudflare Turnstile widget (only when a site key is configured in content/site.json)
(function turnstile () {
  const key = (window.__SITE__ || {}).turnstileSiteKey;
  const form = document.getElementById('cform');
  if (!key || !form || form.querySelector('.cf-turnstile')) return;
  const holder = document.createElement('div');
  holder.className = 'cf-turnstile'; holder.setAttribute('data-sitekey', key); holder.style.margin = '.4rem 0 .8rem';
  const btn = form.querySelector('.fsub'); btn.parentNode.insertBefore(holder, btn);
  const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; s.defer = true; document.head.appendChild(s);
})();

function sendForm (e) {
  e.preventDefault();
  const form   = e.target;
  const btn    = form.querySelector('.fsub');
  const status = document.getElementById('cform-status');
  const get    = name => { const el = form.elements[name]; return el ? el.value.trim() : ''; };
  const say    = (msg, cls) => { if (status) { status.textContent = msg; status.className = 'cform-status ' + (cls || ''); } };
  const label  = btn.textContent;

  say('');
  btn.textContent = 'Sending…'; btn.disabled = true;

  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName:   get('firstName'),
      lastName:    get('lastName'),
      email:       get('email'),
      phone:       get('phone'),
      company:     get('company'),
      industry:    get('industry'),
      enquiryType: get('enquiryType'),
      message:     get('message'),
      website:     get('website'),         // honeypot – must stay empty
      turnstileToken: get('cf-turnstile-response')
    })
  })
  .then(r => r.json().catch(() => ({})).then(res => ({ ok: r.ok, res })))
  .then(({ ok, res }) => {
    btn.textContent = label; btn.disabled = false;
    if (ok && res.success) {
      form.reset();
      say('Thank you! We will be in touch within 1 business day.', 'ok');
      // dedicated thank-you page = clean conversion event for analytics
      setTimeout(() => { window.location.href = '/thank-you.html'; }, 700);
    } else {
      say(res.error || 'Something went wrong. Please try again or email hello@innovsol.ai.', 'err');
    }
  })
  .catch(() => {
    btn.textContent = label; btn.disabled = false;
    say('Could not reach the server. Please check your connection or email hello@innovsol.ai.', 'err');
  });
}
