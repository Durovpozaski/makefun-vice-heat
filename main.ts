// VICE HEAT Cover Studio, a gta6-cover-art-01 entry (Node 22, standard library only).
// The app is this directory's app/ folder: plain static files a desktop browser
// loads offline (app/index.html and its ES modules, local fonts and sample
// photos, no library and no network request at runtime). This program hands the
// app in: it copies app/ and screenshots/ from beside this file to /output and
// writes /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Before it copies anything it runs a pre-flight: the
// screenshots must be 3-4 files of at most 256 KiB each, every one a whole PNG
// or JPEG whose long side is at most 1280 px and whose short side is at least
// 480 px (the gate refuses anything bigger — a cover exported at 1920x1080 or
// 1080x1350 fails, so the app exports are always scaled down to fit); no
// .html/.js/.css file under app/ may reference an http(s) URL (the app must
// work offline); and the four bundled fonts the cover lettering needs must be
// there. Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const MAX_SHOT_BYTES = 262144;
const MAX_LONG_SIDE = 1280;
const MIN_SHORT_SIDE = 480;

// Reads a whole PNG's or JPEG's dimensions from its header, no decoding.
function imageSize(buf) {
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), kind: 'PNG' };
  }
  if (buf.length > 2 && buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xff) { off += 1; continue; }
      const marker = buf[off + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { off += 2; continue; }
      const len = buf.readUInt16BE(off + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: buf.readUInt16BE(off + 5), w: buf.readUInt16BE(off + 7), kind: 'JPEG' };
      }
      off += 2 + len;
    }
    throw new Error('no JPEG SOF marker found');
  }
  throw new Error('not a whole PNG or JPEG');
}

// Walk a directory and return every file path under it.
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

// Pre-flight 1: 3-4 screenshots, each at most 256 KiB, long side at most
// 1280 px, short side at least 480 px.
const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir) ? walk(shotsDir).sort() : [];
if (shots.length < 3 || shots.length > 4) throw new Error(`expected 3-4 screenshots, found ${shots.length}`);
for (const s of shots) {
  const bytes = statSync(s).size;
  if (bytes > MAX_SHOT_BYTES) throw new Error(`${s} is ${bytes} bytes, over the 256 KiB screenshot cap`);
  const { w, h, kind } = imageSize(readFileSync(s));
  const longSide = Math.max(w, h), shortSide = Math.min(w, h);
  if (longSide > MAX_LONG_SIDE) throw new Error(`${s} is ${w}x${h} ${kind}, long side ${longSide} over the 1280 px cap`);
  if (shortSide < MIN_SHORT_SIDE) throw new Error(`${s} is ${w}x${h} ${kind}, short side ${shortSide} under the 480 px floor`);
}

// Pre-flight 2: the app must not load anything over the network at runtime.
const appDir = join(here, 'app');
const external = walk(appDir)
  .filter((f) => /\.(html|js|css)$/.test(f))
  .filter((f) => /https?:\/\//.test(readFileSync(f, 'utf8')));
if (external.length) throw new Error(`app/ references external URLs in: ${external.join(', ')}`);

// Pre-flight 3: the bundled fonts the cover lettering needs must be there.
for (const font of ['display-black.ttf', 'display-cond-black.ttf', 'script-italic.ttf', 'sans-bold.ttf']) {
  if (!existsSync(join(appDir, 'fonts', font))) throw new Error(`missing bundled font app/fonts/${font}`);
}

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (shots.length) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of
// app files, in all, or a path under app/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: MAX_SHOT_BYTES },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`Vice Heat handed in: ${shots.length} screenshot(s), ${walk(appDir).length} app file(s) -> ${out}`);
