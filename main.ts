// VICE HEAT Cover Studio — the hand-in program (Node 22, standard library only).
//
// It copies app/ and screenshots/ from beside this file into the output
// directory and writes dossier.json with the vendored make.fun library, as the
// kit's starter does. The four screenshots are made by the maker with a real
// browser and committed in screenshots/; this program never launches a
// browser, because the grader runs it in a fresh container with no network,
// nothing installed and a ten second budget, so a browser launch cannot fit.
// Before it hands anything in it checks every screenshot itself: long side at
// most 1280 px, short side at least 480 px, at most 256 KiB, or it throws.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

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
  { name: '4-variant.jpg', query: '?shot=cover&layout=nine-panels&grade=vice-sunset&size=1080x1080&export=1', w: 1080, h: 1080 },
];

const MAX_LONG_SIDE = 1280;
const MIN_SHORT_SIDE = 480;
const MAX_SHOT_BYTES = 262144;

// A JPEG's or PNG's pixel size, read from its header alone.
function imageSize(bytes: Buffer): { w: number; h: number } {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) };
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) throw new Error('bad JPEG marker');
      const marker = bytes[i + 1];
      if (marker === 0xda) break;
      const len = bytes.readUInt16BE(i + 2);
      if (marker === 0xc0 || marker === 0xc2) {
        return { h: bytes.readUInt16BE(i + 5), w: bytes.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    throw new Error('no JPEG frame found');
  }
  throw new Error('not a PNG or JPEG');
}

function countAppFiles(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? countAppFiles(join(dir, entry.name)) : 1;
  }
  return n;
}

mkdirSync(out, { recursive: true });
cpSync(join(input, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(input, 'screenshots'))) {
  cpSync(join(input, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Pre-flight: every screenshot must fit the bounty caps, or nothing is handed in.
const shotDir = join(out, 'screenshots');
const shotNames = readdirSync(shotDir).filter((name) => !name.startsWith('.')).sort();
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`screenshots: ${shotNames.length} image(s), expected 3 or 4`);
}
if (shotNames[0] !== '1-cover.jpg') throw new Error('screenshots: the first by name must be 1-cover.jpg');
for (const name of shotNames) {
  const bytes = readFileSync(join(shotDir, name));
  if (bytes.length > MAX_SHOT_BYTES) {
    throw new Error(`screenshots/${name}: ${bytes.length} bytes, over the ${MAX_SHOT_BYTES} allowed`);
  }
  const { w, h } = imageSize(bytes);
  const long = Math.max(w, h), short = Math.min(w, h);
  if (long > MAX_LONG_SIDE) throw new Error(`screenshots/${name}: ${w}x${h}, long side over ${MAX_LONG_SIDE}`);
  if (short < MIN_SHORT_SIDE) throw new Error(`screenshots/${name}: ${w}x${h}, short side under ${MIN_SHORT_SIDE}`);
}

writeFileSync(join(out, 'shots.json'), JSON.stringify(SHOTS, null, 2) + '\n');

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

const appFiles = countAppFiles(join(out, 'app'));
console.log(`VICE HEAT handed in: ${shotNames.length} screenshot(s), ${appFiles} app file(s)`);
