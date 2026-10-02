// ── Active nav link ──────────────────────────────────────────────────────
const navLinks   = document.querySelectorAll('.nav-links a');
const allSections = Array.from(document.querySelectorAll('section[id], div[id].eng-scroll-driver'));

function updateActiveNav () {
  const offset = 120; // navbar height + buffer
  let current  = '';
  allSections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - offset) current = sec.id;
  });
  navLinks.forEach(a => {
    a.classList.toggle('act', a.getAttribute('href') === '#' + current);
  });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav(); // run once on load

