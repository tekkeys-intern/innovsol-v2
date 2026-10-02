// ── Role accordion ────────────────────────────────────────────────────────
function toggleRole (id) {
  const role = document.getElementById(id);
  if (!role) return;
  const body   = role.querySelector('.car-role-body');
  const isOpen = role.classList.contains('open');

  // Close all open panels
  document.querySelectorAll('.car-role.open').forEach(r => {
    r.classList.remove('open');
    r.querySelector('.car-role-body').style.maxHeight = '0';
  });

  // Open the clicked panel (unless it was already open)
  if (!isOpen) {
    role.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
  }
}

// ── Smooth scroll for in-page anchor links ────────────────────────────────
document.querySelectorAll('a.car-scroll-link').forEach(a => {
  a.addEventListener('click', e => {
    const href   = a.getAttribute('href');
    const target = href.startsWith('#') ? document.querySelector(href) : null;
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
