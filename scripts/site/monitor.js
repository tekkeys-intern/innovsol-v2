/* Lightweight front-end error reporting → /api/log (visible in the host's server logs).
   Max 5 reports per page view; sends only message, file, line and page path (no personal data). */
(function () {
  var sent = 0;
  function report(message, source, line, col) {
    if (sent >= 5) return; sent++;
    try {
      var body = JSON.stringify({ message: String(message || '').slice(0, 300), source: String(source || '').slice(0, 200), line: line, col: col, page: location.pathname });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/log', new Blob([body], { type: 'application/json' }));
      else fetch('/api/log', { method: 'POST', body: body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    } catch (e) { /* never throw from the reporter */ }
  }
  window.addEventListener('error', function (e) { report(e.message, e.filename, e.lineno, e.colno); });
  window.addEventListener('unhandledrejection', function (e) { report('unhandledrejection: ' + (e.reason && (e.reason.message || e.reason)), '', 0, 0); });
})();
