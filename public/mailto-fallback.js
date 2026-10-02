// If a mailto: link doesn't open an email app (none installed / set as default, or the
// browser blocks it), show a small dialog with web-mail alternatives instead of doing nothing.
(function () {
  var css = '.mf-ov{position:fixed;inset:0;background:rgba(5,7,12,.55);display:none;align-items:center;justify-content:center;z-index:10000;padding:16px}.mf-ov.on{display:flex}.mf-box{background:#fff;border-radius:12px;max-width:440px;width:100%;padding:22px;font-family:inherit;color:#05070c;box-shadow:0 20px 60px rgba(0,0,0,.3)}.mf-h{display:flex;justify-content:space-between;align-items:center}.mf-h b{font-size:18px}.mf-x{border:0;background:none;font-size:22px;cursor:pointer;color:#555}.mf-p{font-size:13.5px;color:#555;margin:6px 0 16px;line-height:1.5}.mf-b{display:flex;flex-direction:column;gap:10px}.mf-b a,.mf-b button{display:block;text-align:center;padding:11px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;border:0;cursor:pointer;color:#fff}.mf-g{background:#d93025}.mf-o{background:#0a66c2}.mf-c{background:#1a56db}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var ov, cur;

  function parse(href) {
    var m = href.match(/^mailto:([^?]*)(?:\?(.*))?$/i), q = new URLSearchParams(m[2] || '');
    return { to: decodeURIComponent(m[1]), subject: q.get('subject') || '', body: q.get('body') || '' };
  }
  function build() {
    ov = document.createElement('div'); ov.className = 'mf-ov';
    ov.innerHTML = '<div class="mf-box" role="dialog" aria-modal="true"><div class="mf-h"><b>Send by email</b><button class="mf-x" aria-label="Close">&times;</button></div>' +
      '<p class="mf-p">We couldn\'t open your email app. Choose another way to send this to <b class="mf-to"></b>. Remember to <b>attach your resume</b> if you are applying.</p>' +
      '<div class="mf-b"><a class="mf-g" target="_blank" rel="noopener">Open in Gmail</a><a class="mf-o" target="_blank" rel="noopener">Open in Outlook</a><button class="mf-c" type="button">Copy email details</button></div></div>';
    ov.querySelector('.mf-x').onclick = close;
    ov.onclick = function (e) { if (e.target === ov) close(); };
    ov.querySelector('.mf-c').onclick = function () {
      var t = 'To: ' + cur.to + '\nSubject: ' + cur.subject + '\n\n' + cur.body, b = this;
      function done() { b.textContent = 'Copied! Paste it into your email'; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { prompt('Copy this', t); });
      else prompt('Copy this', t);
    };
    document.body.appendChild(ov);
  }
  function show(m) {
    cur = m; if (!ov) build();
    var e = encodeURIComponent;
    ov.querySelector('.mf-to').textContent = m.to;
    ov.querySelector('.mf-g').href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + e(m.to) + '&su=' + e(m.subject) + '&body=' + e(m.body);
    ov.querySelector('.mf-o').href = 'https://outlook.office.com/mail/deeplink/compose?to=' + e(m.to) + '&subject=' + e(m.subject) + '&body=' + e(m.body);
    ov.querySelector('.mf-c').textContent = 'Copy email details';
    ov.classList.add('on');
  }
  function close() { ov.classList.remove('on'); }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov) close(); });

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a) return;
    var opened = false;
    function mark() { opened = true; }
    function vis() { if (document.visibilityState === "hidden") opened = true; }
    window.addEventListener("blur", mark, { once: true });
    document.addEventListener("visibilitychange", vis, { once: true });
    setTimeout(function () {
      window.removeEventListener('blur', mark); document.removeEventListener('visibilitychange', vis);
      if (!opened && document.hasFocus()) show(parse(a.getAttribute('href')));
    }, 1500);
  });
})();
