// Inlines lucide icons at build time (no runtime icon library, no extra request).
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '../../node_modules/lucide-react/dist/esm/icons');
const cache = {};

function nodes(name) {
  if (cache[name]) return cache[name];
  const file = path.join(DIR, name + '.js');
  if (!fs.existsSync(file)) throw new Error('Unknown lucide icon: ' + name);
  const src = fs.readFileSync(file, 'utf8');
  const alias = src.match(/export \{ default \} from ['"]\.\/([^'"]+?)(?:\.js)?['"]/);
  if (alias) return (cache[name] = nodes(alias[1]));
  const m = src.match(/const __iconNode = (\[[\s\S]*?\]);\s*\nconst /);
  if (!m) throw new Error('Cannot parse icon ' + name);
  return (cache[name] = new Function('return ' + m[1])());
}

/** Inner SVG markup (24x24 viewBox) for an icon. */
function inner(name) {
  return nodes(name)
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ');
      return `<${tag} ${a}/>`;
    })
    .join('');
}

/** Standalone inline <svg>. */
function icon(name, { size = 24, stroke = 'currentColor', width = 2, cls = '' } = {}) {
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner(name)}</svg>`;
}

module.exports = { icon, inner };
