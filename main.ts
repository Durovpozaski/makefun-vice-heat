// VICE HEAT handed in (Node 22, standard library only): the app is this
// directory's app/ folder, plain static files a desktop browser loads offline
// (app/index.html and its ES module, no library and no network request), and
// the program hands it in. It copies app/ and screenshots/ from beside this
// file to /output and writes /output/dossier.json, the summary the judge reads,
// with the vendored make.fun library. The screenshots were taken by the author
// with a local headless browser before the commit; this program refuses to hand
// in a screenshot that breaks the bounty's caps (long side over 1280 px, short
// side under 480 px, or over 256 KiB).
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output
// and MAKEFUN_INPUT_DIR stands in for this directory:
//   mkdir -p out && MAKEFUN_INPUT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const input = process.env.MAKEFUN_INPUT_DIR ?? here;
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const SHOTS = [
  { name: '1-cover.jpg', query: '?shot=cover&layout=hero&grade=vice-sunset&size=1920x1080&export=1', w: 1280, h: 720 },
  { name: '2-editor.jpg', query: '?shot=editor', w: 1280, h: 800 },
  { name: '3-cover.jpg', query: '?shot=cover&layout=diagonal&grade=neon-night&size=1080x1350&export=1', w: 1024, h: 1280 },
  { name: '4-variant.jpg', query: '?shot=cover&layout=nine&grade=vice-sunset&size=1080x1080&export=1', w: 1080, h: 1080 },
];

function jpegDimensions(buf) {
  let off = 2;
  while (off + 9 < buf.length) {
    if (buf[off] !== 0xff) throw new Error('not a jpeg');
    const marker = buf[off + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { off += 2; continue; }
    const len = buf.readUInt16BE(off + 2);
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { h: buf.readUInt16BE(off + 5), w: buf.readUInt16BE(off + 7) };
    }
    off += 2 + len;
  }
  throw new Error('no SOF marker in jpeg');
}

function countFiles(dir) {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countFiles(join(dir, e.name));
    else if (e.isFile()) n += 1;
  }
  return n;
}

// Pre-flight: every screenshot must fit the bounty's caps, or the hand-in fails.
for (const shot of SHOTS) {
  const p = join(input, 'screenshots', shot.name);
  if (!existsSync(p)) throw new Error(`missing screenshot: ${shot.name}`);
  const buf = readFileSync(p);
  if (buf.length > 262144) throw new Error(`${shot.name} is ${buf.length} bytes, over the 256 KiB cap`);
  const { w, h } = jpegDimensions(buf);
  if (w !== shot.w || h !== shot.h) throw new Error(`${shot.name} is ${w}x${h}, expected ${shot.w}x${shot.h}`);
  if (Math.max(w, h) > 1280) throw new Error(`${shot.name} long side ${Math.max(w, h)} exceeds 1280 px`);
  if (Math.min(w, h) < 480) throw new Error(`${shot.name} short side ${Math.min(w, h)} is under 480 px`);
}

mkdirSync(out, { recursive: true });
cpSync(join(input, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(input, 'screenshots'))) cpSync(join(input, 'screenshots'), join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
writeFileSync(join(out, 'shots.json'), JSON.stringify(SHOTS, null, 2) + '\n');

const appFiles = countFiles(join(input, 'app'));
console.log(`VICE HEAT handed in: ${SHOTS.length} screenshot(s), ${appFiles} app file(s)`);
