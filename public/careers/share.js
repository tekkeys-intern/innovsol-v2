(function () {
  var css = '.sj-ov{position:fixed;inset:0;background:rgba(5,7,12,.55);display:none;align-items:center;justify-content:center;z-index:9999;padding:16px}.sj-ov.on{display:flex}.sj-box{background:#fff;border-radius:12px;max-width:420px;width:100%;padding:22px;font-family:inherit;box-shadow:0 20px 60px rgba(0,0,0,.3)}.sj-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}.sj-h b{font-size:18px;color:#05070c}.sj-x{border:0;background:none;font-size:22px;cursor:pointer;color:#555}.sj-t{font-size:13px;color:#666;margin-bottom:16px}.sj-g{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.sj-g a{display:block;text-align:center;padding:12px 4px;border-radius:8px;color:#fff;font-weight:700;font-size:13px;text-decoration:none}.sj-r{display:flex;gap:8px;margin-top:16px}.sj-r input{flex:1;min-width:0;border:1px solid #d5d9e2;border-radius:6px;padding:9px;font-size:12px}.sj-r button{border:0;background:#1a56db;color:#fff;border-radius:6px;padding:0 14px;font-weight:700;cursor:pointer}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var ov;
  function build() {
    var u = location.href.split('#')[0], t = document.title.replace(/\s*(\||[–-])\s*(Careers at Innovsol|InnovSol Careers)$/i, '');
    var eu = encodeURIComponent(u), et = encodeURIComponent('Check out this role at InnovSol: ' + t);
    var links = [
      ['WhatsApp', '#25D366', 'https://wa.me/?text=' + et + '%20' + eu],
      ['LinkedIn', '#0A66C2', 'https://www.linkedin.com/sharing/share-offsite/?url=' + eu],
      ['X', '#000', 'https://twitter.com/intent/tweet?text=' + et + '&url=' + eu],
      ['Facebook', '#1877F2', 'https://www.facebook.com/sharer/sharer.php?u=' + eu],
      ['Telegram', '#27A7E7', 'https://t.me/share/url?url=' + eu + '&text=' + et],
      ['Email', '#4b5563', 'mailto:?subject=' + encodeURIComponent(t + ' at InnovSol') + '&body=' + et + '%0A' + eu]
    ];
    ov = document.createElement('div'); ov.className = 'sj-ov';
    ov.innerHTML = '<div class="sj-box" role="dialog" aria-modal="true" aria-label="Share this job"><div class="sj-h"><b>Share this job</b><button class="sj-x" aria-label="Close">&times;</button></div><div class="sj-t"></div><div class="sj-g">' +
      links.map(function (l) { return '<a ' + (l[2].indexOf('mailto:') === 0 ? '' : 'target="_blank" rel="noopener" ') + 'style="background:' + l[1] + '" href="' + l[2] + '">' + l[0] + '</a>'; }).join('') +
      '</div><div class="sj-r"><input readonly><button type="button">Copy Link</button></div></div>';
    ov.querySelector('.sj-t').textContent = t;
    var inp = ov.querySelector('input'); inp.value = u;
    var btn = ov.querySelector('.sj-r button');
    btn.onclick = function () {
      function ok() { btn.textContent = 'Copied!'; setTimeout(function () { btn.textContent = 'Copy Link'; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(ok, function () { inp.select(); document.execCommand('copy'); ok(); });
      else { inp.select(); document.execCommand('copy'); ok(); }
    };
    ov.querySelector('.sj-x').onclick = close;
    ov.onclick = function (e) { if (e.target === ov) close(); };
    document.body.appendChild(ov);
  }
  function close() { ov.classList.remove('on'); }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov) close(); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.js-share');
    if (!a) return;
    e.preventDefault();
    if (!ov) build();
    ov.classList.add('on');
  });
})();
