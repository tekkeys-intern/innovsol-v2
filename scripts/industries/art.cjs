// Vector illustrations for the industry pages (isometric hero scenes, before/after
// scenes, module tiles). Everything is generated from a palette, so a new industry
// only needs a colour and a scene name. Output is plain SVG: resolution independent,
// tiny, and cacheable.
const { inner } = require('./icons.cjs');

/* ---------- colour helpers ---------- */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a) => '#' + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
const light = (c, t) => mix(c, '#ffffff', t);
const dark = (c, t) => mix(c, '#0b1022', t);

function palette(accent) {
  return {
    accent,
    deep: dark(accent, 0.35),
    mid: light(accent, 0.35),
    soft: light(accent, 0.8),
    tint: light(accent, 0.92),
    wall: light(accent, 0.9),
    wallL: light(accent, 0.78),
    wallR: light(accent, 0.62),
    glass: '#cfe3ff',
    glassDark: '#9cc0f0',
  };
}

/* ---------- isometric toolkit ---------- */
function iso(ox, oy, u) {
  const c = 0.866, s = 0.5;
  const P = (x, y, z) => [ox + (x - y) * c * u, oy + (x + y) * s * u - z * u];
  const pts = (arr) => arr.map((p) => P(...p).map((n) => n.toFixed(1)).join(',')).join(' ');
  const poly = (arr, fill, extra = '') => `<polygon points="${pts(arr)}" fill="${fill}" ${extra}/>`;
  const box = (x, y, z, w, d, h, top, left, right, extra = '') =>
    poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], right, extra) +
    poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], left, extra) +
    poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], top, extra);
  const faceL = (x, Y, z, w, h, fill, extra = '') => poly([[x, Y, z], [x + w, Y, z], [x + w, Y, z + h], [x, Y, z + h]], fill, extra); // plane y = Y
  const faceR = (X, y, z, w, h, fill, extra = '') => poly([[X, y, z], [X, y + w, z], [X, y + w, z + h], [X, y, z + h]], fill, extra); // plane x = X
  return { P, poly, box, faceL, faceR };
}

const glyph = (name, x, y, size, color, sw = 2) =>
  `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner(name)}</g>`;

/* ---------- hero scenes ---------- */
function platform(I, p) {
  let g = '';
  g += I.box(-5.2, -5.2, -0.7, 10.4, 10.4, 0.7, '#f3f6fd', '#dfe6f5', '#cdd7ee');
  g += I.box(-4.6, -4.6, 0, 9.2, 9.2, 0.16, p.tint, p.soft, light(p.accent, 0.6));
  for (let i = -4; i <= 4; i++) {
    g += `<polyline points="${I.P(i, -4.6, 0.17).join(',')} ${I.P(i, 4.6, 0.17).join(',')}" stroke="${p.accent}" stroke-opacity=".10" fill="none"/>`;
    g += `<polyline points="${I.P(-4.6, i, 0.17).join(',')} ${I.P(4.6, i, 0.17).join(',')}" stroke="${p.accent}" stroke-opacity=".10" fill="none"/>`;
  }
  return g;
}

function windows(I, p, plane, fixed, from, to, z0, z1, dz, dw, gap) {
  let g = '';
  for (let z = z0; z + dz <= z1 + 0.001; z += dz + gap) {
    for (let a = from; a + dw <= to + 0.001; a += dw + gap) {
      g += plane === 'L' ? I.faceL(a, fixed, z, dw, dz, p.glass, `stroke="${p.glassDark}" stroke-width=".6"`)
        : I.faceR(fixed, a, z, dw, dz, p.glassDark, `stroke="${p.glassDark}" stroke-width=".6"`);
    }
  }
  return g;
}

const SCENES = {
  hospital(I, p) {
    let g = I.box(-4.2, -1.2, 0, 1.9, 2.6, 1.8, p.wall, p.wallL, p.wallR);
    g += I.box(-2.4, -1.8, 0, 5.2, 3.6, 3.2, p.wall, p.wallL, p.wallR);
    g += I.box(-2.6, -2, 3.2, 5.6, 4, 0.25, '#ffffff', p.soft, p.mid);
    g += windows(I, p, 'L', 1.8, -2.1, 2.5, 0.9, 2.9, 0.75, 0.75, 0.35);
    g += windows(I, p, 'R', 2.8, -1.4, 1.6, 0.9, 2.9, 0.75, 0.75, 0.35);
    g += I.faceL(-0.55, 1.8, 0, 1.1, 1.2, dark(p.accent, 0.45), '');
    g += I.faceL(-0.45, 1.8, 0, 0.9, 1.05, '#ffffff', 'opacity=".25"');
    g += I.faceL(-4.2, 1.4, 0.5, 1.9, 0.9, p.glass, `stroke="${p.glassDark}" stroke-width=".6"`);
    // emblem
    g += I.box(-0.32, -0.9, 3.45, 0.64, 1.8, 0.35, '#ff5d5d', '#d93030', '#b71c1c');
    g += I.box(-0.9, -0.32, 3.45, 1.8, 0.64, 0.35, '#ff5d5d', '#d93030', '#b71c1c');
    g += I.box(-0.32, -0.32, 3.8, 0.64, 0.64, 0.02, '#ff8a8a', '#ff8a8a', '#ff8a8a');
    // ambulance
    g += I.box(3.3, 1.4, 0, 1.9, 1, 0.9, '#ffffff', '#e8edf7', '#d4dcef');
    g += I.box(4.4, 1.4, 0, 0.8, 1, 0.6, '#ffffff', p.wallL, p.wallR);
    g += I.faceL(3.6, 2.4, 0.5, 0.5, 0.25, '#ff5d5d', '');
    return g;
  },
  store(I, p) {
    let g = I.box(-2.8, -2.2, 0, 5.6, 4.4, 2.6, p.wall, p.wallL, p.wallR);
    g += I.box(-3, -2.4, 2.6, 6, 4.8, 0.2, '#ffffff', p.soft, p.mid);
    // awning stripes on the left face
    for (let i = 0; i < 8; i++) {
      const x0 = -2.8 + i * 0.7;
      g += I.poly([[x0, 2.2, 2.6], [x0 + 0.7, 2.2, 2.6], [x0 + 0.7, 3.05, 2.05], [x0, 3.05, 2.05]], i % 2 ? '#ffffff' : p.accent, `stroke="${dark(p.accent, 0.1)}" stroke-width=".4"`);
    }
    g += I.faceL(-2.4, 2.2, 0.15, 3, 1.6, p.glass, `stroke="${p.glassDark}" stroke-width=".6"`);
    g += I.faceL(1.1, 2.2, 0.15, 1.1, 1.75, dark(p.accent, 0.4), '');
    g += windows(I, p, 'R', 2.8, -1.6, 1.6, 0.5, 2, 0.9, 1.3, 0.3);
    // shopping bag + boxes
    g += I.box(3.5, 1.2, 0, 1.2, 0.9, 1.4, p.accent, p.deep, dark(p.accent, 0.5));
    g += `<path d="M${I.P(3.9, 2.1, 1.4).join(',')} q6,-26 26,-2" fill="none" stroke="${p.deep}" stroke-width="3" stroke-linecap="round"/>`;
    g += I.box(-4.8, 1.0, 0, 1.2, 1.2, 0.8, '#ffd9a8', '#f4b978', '#dc9a55');
    g += I.box(-4.6, 1.2, 0.8, 0.8, 0.8, 0.6, '#fff0dc', '#ffdcae', '#f2c184');
    return g;
  },
  tower(I, p) {
    let g = I.box(-4.4, -1.2, 0, 3, 2.6, 1.3, p.wall, p.wallL, p.wallR);
    g += windows(I, p, 'L', 1.4, -4.1, -1.9, 0.35, 1.0, 0.5, 0.55, 0.3);
    const b = I.P(0.6, -0.2, 0.2), H = 200, W0 = 58, W1 = 9, N = 8;
    const hw = (i) => W0 + (W1 - W0) * (i / N), yy = (i) => b[1] - (H * i) / N;
    g += `<ellipse cx="${b[0]}" cy="${b[1] + 8}" rx="84" ry="22" fill="#000" opacity=".08"/>`;
    g += `<polygon points="${b[0] - W0},${b[1]} ${b[0] + W0},${b[1]} ${b[0] + W1},${yy(N)} ${b[0] - W1},${yy(N)}" fill="${p.accent}" opacity=".10"/>`;
    for (let i = 0; i <= N; i++) g += `<line x1="${b[0] - hw(i)}" y1="${yy(i)}" x2="${b[0] + hw(i)}" y2="${yy(i)}" stroke="${p.deep}" stroke-width="2.2"/>`;
    for (let i = 0; i < N; i++) {
      g += `<line x1="${b[0] - hw(i)}" y1="${yy(i)}" x2="${b[0] + hw(i + 1)}" y2="${yy(i + 1)}" stroke="${p.accent}" stroke-width="2"/>`;
      g += `<line x1="${b[0] + hw(i)}" y1="${yy(i)}" x2="${b[0] - hw(i + 1)}" y2="${yy(i + 1)}" stroke="${p.accent}" stroke-width="2"/>`;
    }
    g += `<line x1="${b[0] - W0}" y1="${b[1]}" x2="${b[0] - W1}" y2="${yy(N)}" stroke="${p.deep}" stroke-width="5" stroke-linecap="round"/><line x1="${b[0] + W0}" y1="${b[1]}" x2="${b[0] + W1}" y2="${yy(N)}" stroke="${p.deep}" stroke-width="5" stroke-linecap="round"/>`;
    const top = [b[0], yy(N)];
    g += `<line x1="${top[0]}" y1="${top[1]}" x2="${top[0]}" y2="${top[1] - 40}" stroke="${p.deep}" stroke-width="4"/><circle cx="${top[0]}" cy="${top[1] - 46}" r="7" fill="#ff5d5d"/>`;
    for (let i = 1; i <= 3; i++) {
      const r = 20 + i * 20;
      g += `<path d="M${top[0] - r * 0.8},${top[1] - 46 - r * 0.3} A${r},${r} 0 0 1 ${top[0] + r * 0.8},${top[1] - 46 - r * 0.3}" fill="none" stroke="${p.accent}" stroke-width="4" stroke-linecap="round" opacity="${(0.8 - i * 0.2).toFixed(2)}"/>`;
    }
    const d = [b[0] + 28, yy(5)];
    g += `<ellipse cx="${d[0]}" cy="${d[1]}" rx="18" ry="13" fill="#fff" stroke="${p.deep}" stroke-width="2.5" transform="rotate(-20 ${d[0]} ${d[1]})"/><circle cx="${d[0] - 4}" cy="${d[1] + 2}" r="3" fill="${p.deep}"/>`;
    const d2 = [b[0] - 26, yy(3)];
    g += `<rect x="${d2[0] - 9}" y="${d2[1] - 12}" width="18" height="24" rx="3" fill="#fff" stroke="${p.deep}" stroke-width="2.2"/>`;
    g += I.box(2.8, 1.4, 0, 0.5, 0.5, 2.2, light(p.accent, 0.5), p.mid, p.accent);
    return g;
  },
  shield(I, p) {
    let g = I.box(2.6, -2.2, 0, 2.2, 1.9, 1.2, p.wall, p.wallL, p.wallR);
    g += I.poly([[2.4, -2.4, 1.2], [4.8, -2.4, 1.2], [3.6, -1.25, 2.3]], p.accent, '');
    g += I.poly([[2.4, -0.3, 1.2], [4.8, -0.3, 1.2], [3.6, -1.25, 2.3]], p.deep, '');
    g += I.faceL(3.3, -0.3, 0, 0.6, 0.8, dark(p.accent, 0.4), '');
    const cx = 300, cy = 178;
    const sh = (dx, dy, fill, extra = '') => `<path transform="translate(${dx} ${dy})" d="M${cx},${cy - 96} L${cx + 92},${cy - 62} V${cy + 8} C${cx + 92},${cy + 62} ${cx + 52},${cy + 100} ${cx},${cy + 122} C${cx - 52},${cy + 100} ${cx - 92},${cy + 62} ${cx - 92},${cy + 8} V${cy - 62} Z" fill="${fill}" ${extra}/>`;
    g += sh(0, 40, '#000', 'opacity=".08"');
    g += sh(22, -12, dark(p.accent, 0.35));
    g += sh(11, -6, p.deep);
    g += sh(0, 0, 'url(#shieldGrad)', `stroke="#fff" stroke-width="5"`);
    g += `<path d="M${cx - 42},${cy + 12} l30,32 l60,-70" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>`;
    g += `<defs><linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light(p.accent, 0.25)}"/><stop offset="1" stop-color="${p.accent}"/></linearGradient></defs>`;
    return g;
  },
  office(I, p) {
    let g = '';
    const tower = (x, y, w, d, h) => {
      g += I.box(x, y, 0, w, d, h, '#ffffff', p.wallL, p.wallR);
      for (let z = 0.5; z + 0.5 <= h - 0.2; z += 0.9) {
        for (let a = x + 0.25; a + 0.4 <= x + w - 0.15; a += 0.65) g += I.faceL(a, y + d, z, 0.4, 0.5, p.glass, '');
        for (let a = y + 0.25; a + 0.4 <= y + d - 0.15; a += 0.65) g += I.faceR(x + w, a, z, 0.4, 0.5, p.glassDark, '');
      }
    };
    tower(-3.6, -3, 2.2, 2.2, 3.8);
    tower(1.2, -3.4, 2.4, 2.4, 5.2);
    tower(-1.6, -0.8, 2.6, 2.4, 2.6);
    tower(1.4, 0.4, 2.2, 2.2, 3.6);
    g += I.box(-4.6, 1.6, 0, 1.4, 1.4, 0.6, '#d8f3e3', '#b7e7cc', '#8fd3b0');
    return g;
  },
  rocket(I, p) {
    let g = I.box(-2.8, -2.8, 0, 5.6, 5.6, 0.5, dark(p.accent, 0.1), p.deep, dark(p.accent, 0.5));
    g += I.box(-2.2, -2.2, 0.5, 4.4, 4.4, 0.08, light(p.accent, 0.3), p.mid, p.mid);
    g += I.box(2.6, -0.6, 0.5, 0.4, 0.4, 4.2, '#dfe6f5', '#c8d2ea', '#b1bfe0');
    const cx = 290, cy = 140;
    g += `<defs><linearGradient id="rk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9eefb"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#c9d4ee"/></linearGradient>
      <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#ff6b35" stop-opacity="0"/></linearGradient></defs>`;
    g += `<ellipse cx="${cx}" cy="${cy + 190}" rx="70" ry="16" fill="#000" opacity=".07"/>`;
    g += `<path d="M${cx - 30},${cy + 96} Q${cx},${cy + 230} ${cx + 30},${cy + 96} Z" fill="url(#fl)"/>`;
    g += `<path d="M${cx - 62},${cy + 60} L${cx - 34},${cy + 4} L${cx - 34},${cy + 92} Z" fill="${p.accent}"/><path d="M${cx + 62},${cy + 60} L${cx + 34},${cy + 4} L${cx + 34},${cy + 92} Z" fill="${p.deep}"/>`;
    g += `<path d="M${cx},${cy - 118} C${cx + 58},${cy - 60} ${cx + 44},${cy + 40} ${cx + 34},${cy + 100} L${cx - 34},${cy + 100} C${cx - 44},${cy + 40} ${cx - 58},${cy - 60} ${cx},${cy - 118} Z" fill="url(#rk)" stroke="#dfe6f5"/>`;
    g += `<path d="M${cx},${cy - 118} C${cx + 30},${cy - 92} ${cx + 40},${cy - 68} ${cx + 44},${cy - 52} L${cx - 44},${cy - 52} C${cx - 40},${cy - 68} ${cx - 30},${cy - 92} ${cx},${cy - 118} Z" fill="${p.accent}"/>`;
    g += `<circle cx="${cx}" cy="${cy - 10}" r="22" fill="${p.deep}"/><circle cx="${cx}" cy="${cy - 10}" r="16" fill="#bfe0ff"/><circle cx="${cx - 5}" cy="${cy - 16}" r="5" fill="#fff" opacity=".8"/>`;
    g += `<path d="M${cx - 190},${cy + 170} C${cx - 120},${cy - 40} ${cx + 60},${cy - 120} ${cx + 230},${cy - 150}" fill="none" stroke="${p.accent}" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round" opacity=".6"/>`;
    [[cx + 100, cy - 90], [cx - 110, cy - 60], [cx + 170, cy - 20]].forEach(([x, y]) => (g += `<path d="M${x},${y - 8} l2.5,5.5 l5.5,2.5 l-5.5,2.5 l-2.5,5.5 l-2.5,-5.5 l-5.5,-2.5 l5.5,-2.5 z" fill="${p.accent}" opacity=".7"/>`));
    [[-58, 180, 30], [-30, 200, 22], [40, 195, 28], [66, 178, 20]].forEach(([dx, dy, r]) => (g += `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r}" fill="#fff" opacity=".9"/>`));
    return g;
  },
};

// [x, y] of chips as a fraction of the 640x560 canvas
const CHIP_SLOTS = [[0.13, 0.2], [0.85, 0.16], [0.9, 0.55], [0.1, 0.62]];

function hero(kind, accent, chipIcons) {
  const p = palette(accent);
  const I = iso(320, 300, 36);
  const scene = SCENES[kind](I, p);
  const plat = kind === 'rocket' || kind === 'shield' ? platform(I, p) : platform(I, p);
  let chips = '', lines = '';
  chipIcons.forEach((name, i) => {
    const [fx, fy] = CHIP_SLOTS[i];
    const x = fx * 640, y = fy * 560;
    lines += `<line x1="${x}" y1="${y}" x2="320" y2="300" stroke="${p.accent}" stroke-opacity=".28" stroke-width="1.5" stroke-dasharray="4 6"/>`;
    chips += `<g class="chip chip-${i}"><rect x="${x - 34}" y="${y - 34}" width="68" height="68" rx="18" fill="#fff" filter="url(#sh)"/><rect x="${x - 34}" y="${y - 34}" width="68" height="68" rx="18" fill="none" stroke="${p.soft}"/>${glyph(name, x, y, 32, p.accent, 2)}</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 560" role="img" aria-hidden="true">
<defs>
<radialGradient id="bg" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="${p.soft}"/><stop offset="1" stop-color="${p.tint}" stop-opacity="0"/></radialGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="${p.accent}" flood-opacity=".22"/></filter>
</defs>
<circle cx="320" cy="290" r="270" fill="url(#bg)"/>
<ellipse cx="320" cy="430" rx="250" ry="70" fill="#0b1022" opacity=".07"/>
${lines}
${plat}
${scene}
${chips}
</svg>`;
}

/* ---------- before / after scenes ---------- */
function person(cx, cy, s, { mood, suit = '#1e2a4a', hair = '#1b1b1f', tie = '#c62828' }) {
  const mouth = mood === 'happy' ? `<path d="M${cx - 9},${cy + 8} q9,10 18,0" fill="none" stroke="#7a3b2e" stroke-width="2.6" stroke-linecap="round"/>` : `<path d="M${cx - 8},${cy + 13} q8,-7 16,0" fill="none" stroke="#7a3b2e" stroke-width="2.6" stroke-linecap="round"/>`;
  const brows = mood === 'happy' ? `<path d="M${cx - 17},${cy - 12} q6,-4 11,0 M${cx + 6},${cy - 12} q6,-4 11,0" stroke="${hair}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` : `<path d="M${cx - 17},${cy - 10} l11,-5 M${cx + 6},${cy - 15} l11,5" stroke="${hair}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  return `<g transform="translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})">
<path d="M${cx - 88},${cy + 130} q0,-64 88,-64 q88,0 88,64 z" fill="${suit}"/>
<path d="M${cx - 22},${cy + 66} L${cx},${cy + 96} L${cx + 22},${cy + 66} Z" fill="#fff"/>
<path d="M${cx - 6},${cy + 74} h12 l4,46 l-10,10 l-10,-10 z" fill="${tie}"/>
<rect x="${cx - 13}" y="${cy + 30}" width="26" height="38" rx="10" fill="#f1c4a4"/>
<ellipse cx="${cx}" cy="${cy - 2}" rx="34" ry="38" fill="#f6d1b5"/>
<path d="M${cx - 36},${cy - 8} C${cx - 40},${cy - 52} ${cx + 40},${cy - 52} ${cx + 36},${cy - 8} C${cx + 28},${cy - 28} ${cx - 26},${cy - 28} ${cx - 36},${cy - 8} Z" fill="${hair}"/>
<circle cx="${cx - 12}" cy="${cy}" r="3.2" fill="#2a1a14"/><circle cx="${cx + 12}" cy="${cy}" r="3.2" fill="#2a1a14"/>
${brows}${mouth}
${mood === 'happy' ? '' : `<path d="M${cx + 38},${cy - 14} q6,10 0,16 q-6,-6 0,-16 z" fill="#8ec9ff"/>`}
</g>`;
}

function before(accent, iconName) {
  const p = palette(accent);
  const sheets = [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${44 + (i % 2) * 4}" y="${228 - i * 17}" width="76" height="17" rx="2" fill="#fff" stroke="#e6cfcf"/><path d="M${52 + (i % 2) * 4},${236 - i * 17} h40" stroke="#e9b8b8" stroke-width="2"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-hidden="true">
<defs><radialGradient id="b" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#ffe4e4"/><stop offset="1" stop-color="#fbc9c9"/></radialGradient><clipPath id="c"><circle cx="160" cy="160" r="150"/></clipPath></defs>
<circle cx="160" cy="160" r="150" fill="url(#b)"/>
<g clip-path="url(#c)">
${sheets}
<rect x="32" y="232" width="256" height="90" fill="#6b4a3a"/><rect x="32" y="232" width="256" height="10" fill="#8a624d"/>
${person(170, 130, 0.9, { mood: 'stressed', suit: '#27304f', tie: '#c62828' })}
<circle cx="256" cy="66" r="30" fill="#fff" stroke="#c62828" stroke-width="5"/><path d="M256,66 V46 M256,66 L270,74" stroke="#c62828" stroke-width="4" stroke-linecap="round"/>
<g transform="translate(232 140)"><rect width="50" height="34" rx="4" fill="#dfe3ea"/><rect x="4" y="4" width="42" height="24" fill="#f2f4f8"/></g>
<path d="M64,80 l14,-24 l14,24 z" fill="#ffb020" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M78,66 v7 M78,77 h.01" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
</g>
${glyph(iconName, 248, 258, 26, '#c62828', 2.2)}
</svg>`;
}

function after(accent, iconName) {
  const p = palette(accent);
  const bars = [30, 52, 40, 70, 58, 86].map((h, i) => `<rect x="${118 + i * 14}" y="${150 - h * 0.6}" width="9" height="${h * 0.6}" rx="2" fill="${i % 2 ? p.mid : p.accent}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-hidden="true">
<defs><radialGradient id="a" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#e3f8ee"/><stop offset="1" stop-color="#b7e8d0"/></radialGradient><clipPath id="c"><circle cx="160" cy="160" r="150"/></clipPath></defs>
<circle cx="160" cy="160" r="150" fill="url(#a)"/>
<g clip-path="url(#c)">
<rect x="32" y="240" width="256" height="90" fill="#3f5c73"/><rect x="32" y="240" width="256" height="10" fill="#587892"/>
${person(90, 150, 0.85, { mood: 'happy', suit: '#1f3b57', hair: '#3b2a20', tie: p.accent })}
<g transform="translate(120 70)"><rect width="172" height="118" rx="8" fill="#16233a"/><rect x="6" y="6" width="160" height="104" rx="4" fill="#0f1b30"/>
<rect x="14" y="14" width="66" height="10" rx="3" fill="${p.accent}" opacity=".85"/>${bars.replace(/x="(\d+)"/g, (m, x) => `x="${x - 108}"`).replace(/y="([\d.]+)"/g, (m, y) => `y="${+y - 32}"`)}
<polyline points="14,88 44,72 74,80 104,52 134,58 158,34" fill="none" stroke="#ffd166" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="140" cy="30" r="9" fill="#22c55e"/><path d="M136,30 l3,3 l6,-7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>
<rect x="196" y="190" width="24" height="14" fill="#2b3a52"/><rect x="176" y="202" width="64" height="8" rx="4" fill="#2b3a52"/>
</g>
<circle cx="250" cy="70" r="22" fill="#22c55e"/><path d="M240,70 l7,8 l14,-16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
${glyph(iconName, 62, 60, 30, p.accent, 2.2)}
</svg>`;
}

/* ---------- module tile ---------- */
function tile(iconName, color, id) {
  const c = color, d = dark(c, 0.3), l = light(c, 0.35);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-hidden="true">
<defs><linearGradient id="t${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${l}"/><stop offset="1" stop-color="${d}"/></linearGradient>
<filter id="s${id}" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="${c}" flood-opacity=".35"/></filter></defs>
<rect x="18" y="20" width="60" height="60" rx="18" fill="${light(c, 0.8)}" transform="rotate(-8 48 50)"/>
<rect x="16" y="14" width="64" height="64" rx="19" fill="url(#t${id})" filter="url(#s${id})"/>
<path d="M22,26 q26,-14 52,-4" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>
${glyph(iconName, 48, 46, 34, '#ffffff', 2)}
<circle cx="84" cy="20" r="3" fill="${l}"/><circle cx="10" cy="80" r="2.5" fill="${c}" opacity=".5"/>
</svg>`;
}

module.exports = { hero, before, after, tile, palette, mix, light, dark, SCENES };
