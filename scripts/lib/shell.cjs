// The shared site shell (navbar + footer + base CSS/JS) for the statically generated pages.
// Single source of truth = the same modules the React pages use (src/modules).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/^﻿/, '');

/** @param {{active?: string}} opts  active = anchor id to highlight in the nav, e.g. "industries" */
function shell(opts = {}) {
  let nav = read('src/modules/layout/navbar/navbar.html').replaceAll('href="#', 'href="/#').replace('<nav id="nav">', '<nav id="nav" class="sc" aria-label="Main">');
  if (opts.active) {
    nav = nav.replace(new RegExp(`<a href="/#${opts.active}">([^<]*)</a>`), `<a href="/#${opts.active}" class="act" aria-current="page">$1</a>`);
  }
  return {
    nav,
    footer: read('src/modules/layout/footer/footer.html').replaceAll('href="#', 'href="/#'),
    css: ['src/modules/shared/base.css', 'src/modules/layout/navbar/navbar.css', 'src/modules/layout/footer/footer.css', 'src/modules/shared/responsive.css'].map(read).join('\n'),
    navJs: read('src/modules/layout/navbar/navbar.js'),
  };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function write(rel, content) { const p = path.join(ROOT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); }

module.exports = { shell, esc, write, read, ROOT };
