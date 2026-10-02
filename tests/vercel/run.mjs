// One command: start the Vercel-output emulator, run the smoke tests, stop it.
//   npm run build && npm run test:vercel
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || '4500';
const emu = spawn(process.execPath, [path.join(here, 'emulate.mjs')], { env: { ...process.env, PORT }, stdio: ['ignore', 'inherit', 'inherit'] });

let up = false;
for (let i = 0; i < 60 && !up; i++) {
  try { up = (await fetch(`http://127.0.0.1:${PORT}/robots.txt`)).ok; } catch { await new Promise((r) => setTimeout(r, 500)); }
}
let code = 1;
if (!up) console.error('emulator did not start (did you run `npm run build` first?)');
else code = spawnSync(process.execPath, [path.join(here, 'smoke.mjs')], { env: { ...process.env, BASE: `http://127.0.0.1:${PORT}` }, stdio: 'inherit' }).status ?? 1;
emu.kill();
process.exit(code);
