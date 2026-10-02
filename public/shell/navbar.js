
// ── Mobile nav drawer (right-side slide-in) ──────────────────────────────
let _scrollY = 0;

function lockBodyScroll () {
  _scrollY = window.scrollY;
  document.body.style.position   = 'fixed';
  document.body.style.top        = '-' + _scrollY + 'px';
  document.body.style.width      = '100%';
  document.body.style.overflowY  = 'scroll';
}

function unlockBodyScroll () {
  document.body.style.position  = '';
  document.body.style.top       = '';
  document.body.style.width     = '';
  document.body.style.overflowY = '';
  window.scrollTo(0, _scrollY);
}

function toggleMob () {
  const nav     = document.getElementById('mobNav');
  const ham     = document.getElementById('ham');
  const overlay = document.getElementById('mobOverlay');
  const isOpen  = nav.classList.toggle('open');
  ham.classList.toggle('open', isOpen);
  overlay.classList.toggle('open', isOpen);
  isOpen ? lockBodyScroll() : unlockBodyScroll();
}

// close on overlay click
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('mobOverlay');
  if (overlay) overlay.addEventListener('click', toggleMob);
});

// ── Navbar scroll shadow ─────────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('sc', window.scrollY > 60);
}, { passive: true });

