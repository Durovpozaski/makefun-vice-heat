// VICE HEAT Cover Studio — a GTA 6 style poster cover maker that runs offline.
// One canvas renderer draws every cover: full-bleed photos, a huge italic gold
// title over the lower photos, story labels, WANTED badge, starburst, stickers
// and a thin bottom strip with its own barcode zone. The editor beside the
// canvas picks layouts and grades, tunes the grade, edits the words, moves the
// face box and exports PNGs in the three post sizes. Everything is local:
// the eight photos and four fonts live under app/, no network is ever used.
// Rendering is deterministic: grain comes from a fixed-seed generator, never
// from Math.random or the clock, so the same state always paints the same cover.

const PHOTOS = [
  { file: 'photo1.jpg', label: 'OCEAN DRIVE', sub: '6:42 PM', faceY: 0.22 },
  { file: 'photo2.jpg', label: 'THE PIER', sub: 'FIRST LIGHT', faceY: 0.20 },
  { file: 'photo3.jpg', label: 'COLLINS AVE', sub: 'AFTER RAIN', faceY: 0.42 },
  { file: 'photo4.jpg', label: 'COLONY HOTEL', sub: 'OCEAN DR', faceY: 0.45 },
  { file: 'photo5.jpg', label: 'BISCAYNE BAY', sub: 'FULL THROTTLE', faceY: 0.42 },
  { file: 'photo6.jpg', label: 'DOWNTOWN', sub: 'MAGIC HOUR', faceY: 0.45 },
  { file: 'photo7.jpg', label: 'RETRO FUEL', sub: 'OPEN 24 HOURS', faceY: 0.30 },
  { file: 'photo8.jpg', label: 'TOWER 12', sub: 'MIAMI BEACH', faceY: 0.45 },
];

const GRADES = {
  'vice-sunset': { name: 'Miami Sunset', posterize: 7, painterly: 35, ink: 22, halftone: 8, keepSkin: 70, warm: 65, blueShift: 80, sat: 1.14, contrast: 1.06, bright: 1.02 },
  'neon-night': { name: 'Neon Night', posterize: 6, painterly: 25, ink: 30, halftone: 14, keepSkin: 40, warm: 30, blueShift: 95, sat: 1.25, contrast: 1.12, bright: 0.98 },
  'comic-ink': { name: 'Comic Ink', posterize: 5, painterly: 70, ink: 65, halftone: 30, keepSkin: 50, warm: 45, blueShift: 70, sat: 1.18, contrast: 1.18, bright: 1.0 },
  'golden-hour': { name: 'Golden Hour', posterize: 8, painterly: 20, ink: 10, halftone: 0, keepSkin: 80, warm: 90, blueShift: 60, sat: 1.1, contrast: 1.04, bright: 1.05 },
  'pastel-dawn': { name: 'Pastel Dawn', posterize: 9, painterly: 15, ink: 8, halftone: 0, keepSkin: 85, warm: 40, blueShift: 45, sat: 0.95, contrast: 0.98, bright: 1.08 },
  'noir-vice': { name: 'Noir Vice', posterize: 6, painterly: 30, ink: 45, halftone: 18, keepSkin: 30, warm: 20, blueShift: 90, sat: 0.85, contrast: 1.22, bright: 0.92 },
  'candy-pop': { name: 'Candy Pop', posterize: 7, painterly: 20, ink: 15, halftone: 10, keepSkin: 60, warm: 50, blueShift: 65, sat: 1.35, contrast: 1.1, bright: 1.03 },
};

const LAYOUTS = {
  hero: { name: 'Hero Key Art', panels: [{ p: 0, x: 0, y: 0, w: 1, h: 0.93 }] },
  diagonal: {
    name: 'Diagonal Split',
    panels: [
      { p: 0, x: 0, y: 0, w: 1, h: 0.93, clip: [[0, 0], [1, 0], [1, 0.58], [0, 0.38]] },
      { p: 6, x: 0, y: 0, w: 1, h: 0.93, clip: [[0, 0.38], [1, 0.58], [1, 0.93], [0, 0.93]] },
    ],
  },
  'nine-panels': {
    name: 'Nine Panels',
    panels: [
      { p: 0, x: 0, y: 0, w: 1 / 3, h: 0.31 }, { p: 2, x: 1 / 3, y: 0, w: 1 / 3, h: 0.31 }, { p: 1, x: 2 / 3, y: 0, w: 1 / 3, h: 0.31 },
      { p: 3, x: 0, y: 0.31, w: 1 / 3, h: 0.31 }, { card: true, x: 1 / 3, y: 0.31, w: 1 / 3, h: 0.31 }, { p: 4, x: 2 / 3, y: 0.31, w: 1 / 3, h: 0.31 },
      { p: 5, x: 0, y: 0.62, w: 1 / 3, h: 0.31 }, { p: 7, x: 1 / 3, y: 0.62, w: 1 / 3, h: 0.31 }, { p: 6, x: 2 / 3, y: 0.62, w: 1 / 3, h: 0.31 },
    ],
  },
  duo: { name: 'Duo Split', panels: [{ p: 0, x: 0, y: 0, w: 0.5, h: 0.93 }, { p: 1, x: 0.5, y: 0, w: 0.5, h: 0.93 }] },
  triptych: { name: 'Triptych', panels: [{ p: 2, x: 0, y: 0, w: 1 / 3, h: 0.93 }, { p: 0, x: 1 / 3, y: 0, w: 1 / 3, h: 0.93 }, { p: 5, x: 2 / 3, y: 0, w: 1 / 3, h: 0.93 }] },
  strip: {
    name: 'Skyline Strip',
    panels: [
      { p: 5, x: 0, y: 0, w: 1, h: 0.6 },
      { p: 1, x: 0, y: 0.6, w: 1 / 3, h: 0.33 }, { p: 4, x: 1 / 3, y: 0.6, w: 1 / 3, h: 0.33 }, { p: 6, x: 2 / 3, y: 0.6, w: 1 / 3, h: 0.33 },
    ],
  },
  quad: {
    name: 'Quad',
    panels: [
      { p: 0, x: 0, y: 0, w: 0.5, h: 0.465 }, { p: 2, x: 0.5, y: 0, w: 0.5, h: 0.465 },
      { p: 3, x: 0, y: 0.465, w: 0.5, h: 0.465 }, { p: 7, x: 0.5, y: 0.465, w: 0.5, h: 0.465 },
    ],
  },
  mosaic: {
    name: 'Mosaic',
    panels: [
      { p: 0, x: 0, y: 0, w: 0.6, h: 0.93 },
      { p: 2, x: 0.6, y: 0, w: 0.4, h: 0.465 }, { p: 4, x: 0.6, y: 0.465, w: 0.4, h: 0.465 },
    ],
  },
  coast: {
    name: 'Coast Line',
    panels: [
      { p: 5, x: 0, y: 0, w: 1, h: 0.55 },
      { p: 7, x: 0, y: 0.55, w: 1 / 3, h: 0.38 }, { p: 3, x: 1 / 3, y: 0.55, w: 1 / 3, h: 0.38 }, { p: 1, x: 2 / 3, y: 0.55, w: 1 / 3, h: 0.38 },
    ],
  },
};

const SURPRISES = [
  { layout: 'diagonal', grade: 'neon-night', title: 'VICE HEAT', script: 'Leonida', quote: 'THE CITY NEVER SLEEPS.', tagline: 'EVERY SUNSET HAS A PRICE.', place: 'LEONIDA — VICE CITY' },
  { layout: 'nine-panels', grade: 'comic-ink', title: 'VICE HEAT', script: 'Leonida', quote: 'WANTED IN EVERY DISTRICT.', tagline: 'RUN THE NIGHT.', place: 'VICE CITY — EST. 2026' },
  { layout: 'coast', grade: 'golden-hour', title: 'VICE HEAT', script: 'Leonida', quote: 'GOLD ON THE WATER.', tagline: 'CHASE THE LAST LIGHT.', place: 'BISCAYNE BAY — FLORIDA' },
  { layout: 'mosaic', grade: 'candy-pop', title: 'VICE HEAT', script: 'Leonida', quote: 'TOO MUCH IS NEVER ENOUGH.', tagline: 'TURN IT UP.', place: 'OCEAN DRIVE — MIAMI' },
  { layout: 'triptych', grade: 'noir-vice', title: 'VICE HEAT', script: 'Leonida', quote: 'NOBODY LEAVES CLEAN.', tagline: 'TRUST NO SUNSET.', place: 'LEONIDA — AFTER DARK' },
  { layout: 'hero', grade: 'pastel-dawn', title: 'VICE HEAT', script: 'Leonida', quote: 'MORNING AFTER THE HEAT.', tagline: 'NEW DAY. SAME FIRE.', place: 'MIAMI BEACH — DAWN' },
];

const DEFAULTS = {
  layout: 'hero', grade: 'vice-sunset',
  title: 'VICE HEAT', script: 'Leonida',
  quote: 'THE CITY NEVER LOOKED THIS GOOD.',
  tagline: 'EVERY SUNSET HAS A PRICE.', place: 'LEONIDA — VICE CITY',
  wanted: true, faceShift: 0, surprise: 0,
};

const state = { ...DEFAULTS, painterly: null, ink: null, halftone: null, keepSkin: null };

const clamp = (v, lo = 0, hi = 255) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;

// A tiny deterministic generator: the same seed always yields the same grain.
function seeded(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const imageCache = new Map();
function loadPhoto(index) {
  if (!imageCache.has(index)) {
    const img = new Image();
    img.src = `samples/${PHOTOS[index].file}`;
    imageCache.set(index, img.decode().then(() => img));
  }
  return imageCache.get(index);
}

let fontsReady = null;
function loadFonts() {
  if (!fontsReady) {
    fontsReady = Promise.all([
      document.fonts.load('100px "ViceCond"'),
      document.fonts.load('100px "ViceBlack"'),
      document.fonts.load('40px "ViceSans"'),
      document.fonts.load('60px "ViceScript"'),
    ]).catch(() => undefined).then(() => document.fonts.ready).catch(() => undefined);
  }
  return fontsReady;
}

// Cover-fit draw of one photo into a rectangle, keeping the photo's face
// (or its focus point) near the top of the frame so the title never covers it.
function drawCoverFit(ctx, img, x, y, w, h, faceY, faceShift) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale, sh = h / scale;
  const sx = (iw - sw) / 2;
  const target = clamp(faceY + faceShift, 0.05, 0.6);
  const sy = clamp(target * ih - 0.2 * sh, 0, Math.max(0, ih - sh));
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// The grade: warm wash, blue water pushed to purple/magenta, saturation and
// contrast, then posterize into flat colour blocks (the mosaic look) with
// skin kept softer, and a whisper of deterministic grain on top.
function gradePixels(imageData, g, seed) {
  const d = imageData.data;
  const levels = g.posterize > 0 ? g.posterize : 0;
  const fine = Math.min(24, levels * 3 + 2);
  const warm = g.warm / 100, shift = g.blueShift / 100, keep = g.keepSkin / 100;
  const rnd = seeded(seed);
  const quant = (v, lv) => {
    if (lv <= 1) return v;
    const step = 255 / (lv - 1);
    return Math.round(v / step) * step;
  };
  for (let i = 0; i < d.length; i += 4) {
    const or = d[i], og = d[i + 1], ob = d[i + 2];
    let r = or, gg = og, b = ob;
    r += warm * 26; gg += warm * 5; b -= warm * 30;
    if (shift > 0) {
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      const dlt = mx - mn;
      if (dlt > 24 && mx === b) {
        const hue = 60 * (4 + (r - gg) / dlt);
        if (hue >= 185 && hue <= 265) {
          const nh = hue + (295 - hue) * shift * 0.7;
          const l = (mx + mn) / 2 / 255;
          const c = dlt / 255;
          const x = c * (1 - Math.abs(((nh / 60) % 2) - 1));
          const m = l - c / 2;
          let rr = 0, g2 = 0, bb = 0;
          if (nh < 60) { rr = c; g2 = x; }
          else if (nh < 120) { rr = x; g2 = c; }
          else if (nh < 180) { g2 = c; bb = x; }
          else if (nh < 240) { g2 = x; bb = c; }
          else if (nh < 300) { rr = x; bb = c; }
          else { rr = c; bb = x; }
          r = (rr + m) * 255; gg = (g2 + m) * 255; b = (bb + m) * 255;
        }
      }
    }
    const lum = 0.299 * r + 0.587 * gg + 0.114 * b;
    r = lum + (r - lum) * g.sat; gg = lum + (gg - lum) * g.sat; b = lum + (b - lum) * g.sat;
    r = (r - 128) * g.contrast + 128; gg = (gg - 128) * g.contrast + 128; b = (b - 128) * g.contrast + 128;
    r *= g.bright; gg *= g.bright; b *= g.bright;
    const skin = or > 95 && or > og && og > ob && or - og < 85 && og - ob < 75 && or < 252;
    let pr = quant(r, levels), pg = quant(gg, levels), pb = quant(b, levels);
    if (skin && keep > 0) {
      const k = keep * 0.85;
      pr = lerp(pr, quant(r, fine), k); pg = lerp(pg, quant(gg, fine), k); pb = lerp(pb, quant(b, fine), k);
    }
    const n = (rnd() - 0.5) * 10;
    d[i] = clamp(pr + n); d[i + 1] = clamp(pg + n); d[i + 2] = clamp(pb + n);
  }
}

function softenPainterly(off, amount) {
  if (amount <= 0) return;
  const f = 1 - (amount / 100) * 0.55;
  const tw = Math.max(2, Math.round(off.width * f));
  const th = Math.max(2, Math.round(off.height * f));
  const tiny = document.createElement('canvas');
  tiny.width = tw; tiny.height = th;
  const tctx = tiny.getContext('2d');
  tctx.drawImage(off, 0, 0, tw, th);
  const octx = off.getContext('2d');
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.clearRect(0, 0, off.width, off.height);
  octx.drawImage(tiny, 0, 0, tw, th, 0, 0, off.width, off.height);
}

function inkVignette(off, amount) {
  if (amount <= 0) return;
  const ctx = off.getContext('2d');
  const w = off.width, h = off.height;
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  grad.addColorStop(0, 'rgba(12,2,10,0)');
  grad.addColorStop(1, `rgba(12,2,10,${(amount / 100) * 0.38})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function halftoneDots(off, amount) {
  if (amount <= 0) return;
  const ctx = off.getContext('2d');
  const w = off.width, h = off.height;
  const step = 7;
  ctx.fillStyle = `rgba(18,0,12,${0.05 + (amount / 100) * 0.1})`;
  for (let yy = step / 2; yy < h; yy += step) {
    for (let xx = step / 2; xx < w; xx += step) ctx.fillRect(xx, yy, 1.6, 1.6);
  }
  ctx.fillStyle = 'rgba(255,240,220,0.05)';
  for (let yy = step; yy < h; yy += step) {
    for (let xx = step; xx < w; xx += step) ctx.fillRect(xx, yy, 1.2, 1.2);
  }
}

async function paintPanel(ctx, panel, px, py, pw, ph, grade, seed, H) {
  const img = await loadPhoto(panel.p);
  const off = document.createElement('canvas');
  off.width = Math.max(2, Math.round(pw)); off.height = Math.max(2, Math.round(ph));
  const octx = off.getContext('2d');
  drawCoverFit(octx, img, 0, 0, off.width, off.height, PHOTOS[panel.p].faceY, state.faceShift);
  const data = octx.getImageData(0, 0, off.width, off.height);
  gradePixels(data, grade, seed);
  octx.putImageData(data, 0, 0);
  softenPainterly(off, grade.painterly);
  inkVignette(off, grade.ink);
  halftoneDots(off, grade.halftone);
  ctx.save();
  if (panel.clip) {
    ctx.beginPath();
    panel.clip.forEach(([fx, fy], i) => {
      const cx = px + fx * pw, cy = py + fy * ph;
      if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.clip();
  }
  ctx.drawImage(off, px, py, pw, ph);
  ctx.restore();
  if (panel.clip) {
    ctx.save();
    ctx.strokeStyle = '#f7efda';
    ctx.lineWidth = Math.max(3, pw * 0.004);
    ctx.beginPath();
    ctx.moveTo(px, py + 0.38 * ph);
    ctx.lineTo(px + pw, py + 0.58 * ph);
    ctx.stroke();
    ctx.restore();
  }
  const photo = PHOTOS[panel.p];
  const labelH = Math.max(16, ph * 0.055);
  const label = `${photo.label} — ${photo.sub}`;
  ctx.save();
  ctx.font = `700 ${Math.round(labelH * 0.52)}px "ViceSans", sans-serif`;
  const tw = ctx.measureText(label).width;
  // The title covers the lower photos, so a label near a panel's bottom edge
  // moves: a tall panel's label sits just above the title zone, a short
  // bottom-row panel's label sits at its own top edge, inside its photo.
  const nearBottom = py + ph - labelH - ph * 0.03;
  const labelTop = nearBottom > H * 0.6 - labelH
    ? (ph > H * 0.5 ? H * 0.6 - labelH - 8 : py + 8)
    : nearBottom;
  ctx.fillStyle = 'rgba(16,4,14,0.72)';
  ctx.fillRect(px + pw * 0.02, labelTop, tw + labelH * 0.9, labelH);
  ctx.fillStyle = '#f7efda';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, px + pw * 0.02 + labelH * 0.45, labelTop + labelH / 2);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function star(ctx, cx, cy, outer, inner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function paintTitleCard(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#1c0512';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#f7efda';
  ctx.lineWidth = Math.max(2, w * 0.012);
  ctx.strokeRect(x + w * 0.04, y + h * 0.04, w * 0.92, h * 0.92);
  const size = Math.min(w * 0.24, h * 0.26);
  ctx.font = `900 ${Math.round(size)}px "ViceCond", "Arial Narrow", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffc93c';
  ctx.fillText('VICE', x + w / 2, y + h * 0.36);
  ctx.fillText('HEAT', x + w / 2, y + h * 0.62);
  ctx.font = `${Math.round(size * 0.52)}px "ViceScript", cursive`;
  ctx.fillStyle = '#ff6fa5';
  ctx.fillText('Leonida', x + w / 2, y + h * 0.88);
  ctx.restore();
}

// The title: skewed first, gradient created AFTER the skew, so the letters
// sample the whole cream-gold-orange-pink run instead of only its pale top.
function paintTitle(ctx, W, H) {
  const title = (state.title || 'VICE HEAT').toUpperCase();
  const stripTop = H * 0.93;
  let size = H * 0.34;
  ctx.save();
  ctx.font = `900 ${Math.round(size)}px "ViceCond", "Arial Narrow", sans-serif`;
  const textW = ctx.measureText(title).width;
  const fit = (W * 0.90) / Math.max(1, textW);
  if (fit < 1) size *= fit;
  ctx.font = `900 ${Math.round(size)}px "ViceCond", "Arial Narrow", sans-serif`;
  const capH = size * 0.72;
  const baseY = stripTop - H * 0.015;
  const tx = Math.max(W * 0.02, (W - ctx.measureText(title).width) / 2);
  ctx.translate(tx, baseY);
  ctx.transform(1, 0, -0.22, 1, 0, 0);
  ctx.font = `900 ${Math.round(size)}px "ViceCond", "Arial Narrow", sans-serif`;
  ctx.textBaseline = 'alphabetic';
  const grad = ctx.createLinearGradient(0, -capH, 0, size * 0.08);
  grad.addColorStop(0, '#fff8dc');
  grad.addColorStop(0.38, '#ffd23c');
  grad.addColorStop(0.68, '#ff7a1a');
  grad.addColorStop(1, '#ff4d8d');
  ctx.fillStyle = 'rgba(46,8,84,0.92)';
  ctx.fillText(title, size * 0.02, size * 0.028);
  ctx.fillStyle = 'rgba(74,20,140,0.92)';
  ctx.fillText(title, size * 0.01, size * 0.014);
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  ctx.restore();

  const scriptSize = H * 0.085;
  ctx.save();
  ctx.font = `${Math.round(scriptSize)}px "ViceScript", cursive`;
  ctx.fillStyle = '#ff6fa5';
  ctx.strokeStyle = 'rgba(255,248,220,0.9)';
  ctx.lineWidth = Math.max(1, scriptSize * 0.03);
  const sw = ctx.measureText(state.script || 'Leonida').width;
  const sx = Math.min(W * 0.66, W * 0.97 - sw);
  ctx.translate(Math.max(W * 0.08, sx), baseY - capH * 0.42);
  ctx.rotate(-0.14);
  ctx.strokeText(state.script || 'Leonida', 0, 0);
  ctx.fillText(state.script || 'Leonida', 0, 0);
  ctx.restore();

  // Stars and press quote sit right above the title.
  const qY = baseY - capH - H * 0.052;
  ctx.save();
  ctx.font = `700 ${Math.round(H * 0.024)}px "ViceSans", sans-serif`;
  const stars = '★★★★★';
  const quote = state.quote || '';
  const qText = `${stars}  ${quote}`;
  const qw = ctx.measureText(qText).width;
  ctx.fillStyle = 'rgba(16,4,14,0.6)';
  roundRect(ctx, W / 2 - qw / 2 - H * 0.018, qY - H * 0.026, qw + H * 0.036, H * 0.048, H * 0.012);
  ctx.fill();
  ctx.fillStyle = '#ffd23c';
  ctx.textBaseline = 'middle';
  ctx.fillText(stars, W / 2 - qw / 2, qY);
  ctx.fillStyle = '#f7efda';
  ctx.fillText(quote, W / 2 - qw / 2 + ctx.measureText(stars).width + ctx.measureText('  ').width, qY);
  ctx.restore();
}

function paintBadges(ctx, W, H, layoutKey) {
  const s = H * 0.001;
  if (state.wanted) {
    ctx.save();
    const bh = H * 0.052;
    const bx = W * 0.028, by = H * 0.032;
    ctx.font = `900 ${Math.round(H * 0.026)}px "ViceCond", "Arial Narrow", sans-serif`;
    const wWord = ctx.measureText('WANTED').width;
    ctx.font = `${Math.round(H * 0.02)}px "ViceSans", sans-serif`;
    const wStars = ctx.measureText('★★★★★').width;
    const bw = Math.max(W * 0.13, wWord + wStars + bh * 1.6);
    ctx.fillStyle = 'rgba(16,4,14,0.82)';
    roundRect(ctx, bx, by, bw, bh, H * 0.01);
    ctx.fill();
    ctx.strokeStyle = '#ffd23c';
    ctx.lineWidth = Math.max(1.5, s * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd23c';
    ctx.font = `900 ${Math.round(H * 0.026)}px "ViceCond", "Arial Narrow", sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('WANTED', bx + bh * 0.55, by + bh / 2);
    ctx.font = `${Math.round(H * 0.02)}px "ViceSans", sans-serif`;
    ctx.fillStyle = '#ff6fa5';
    ctx.fillText('★★★★★', bx + bh * 0.55 + wWord + bh * 0.3, by + bh / 2);
    ctx.restore();
  }
  // Starburst: original cover art. In nine-panels the top-right photo is the
  // fisherman, so the burst moves to the top middle, over sky, not his face.
  ctx.save();
  const nine = layoutKey === 'nine-panels';
  const bx = nine ? W * 0.5 : W * 0.875, by = nine ? H * 0.05 : H * 0.105, br = nine ? H * 0.045 : H * 0.052;
  ctx.translate(bx, by);
  ctx.rotate(-0.2);
  ctx.fillStyle = '#ffd23c';
  ctx.strokeStyle = '#7a2b00';
  ctx.lineWidth = Math.max(1.5, s * 2);
  star(ctx, 0, 0, br, br * 0.62, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3a0a00';
  ctx.font = `900 ${Math.round(H * 0.0135)}px "ViceSans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ORIGINAL', 0, -H * 0.008);
  ctx.fillText('COVER ART', 0, H * 0.01);
  ctx.restore();
  // Round stickers.
  const sticker = (cx, cy, r, text) => {
    ctx.save();
    ctx.fillStyle = '#f7efda';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c22a5e';
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#c22a5e';
    ctx.font = `900 ${Math.round(r * 0.34)}px "ViceSans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  };
  sticker(W * 0.925, H * 0.42, H * 0.038, 'VOL. 06');
  sticker(W * 0.075, H * 0.47, H * 0.034, 'EST. 2026');
}

// The bottom strip: tagline, microcopy, then the barcode in its own reserved
// zone at the right edge, with padding, so it can never hit the microcopy.
function paintStrip(ctx, W, H) {
  const top = H * 0.93, h = H * 0.07;
  ctx.save();
  ctx.fillStyle = '#160409';
  ctx.fillRect(0, top, W, h);
  ctx.fillStyle = '#f7efda';
  ctx.font = `900 ${Math.round(h * 0.32)}px "ViceCond", "Arial Narrow", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(state.tagline || '', W * 0.02, top + h * 0.5);
  const tagEnd = W * 0.02 + ctx.measureText(state.tagline || '').width;
  const barcodeW = W * 0.085;
  const barcodeX = W * 0.985 - barcodeW;
  const microStart = Math.max(W * 0.335, tagEnd + W * 0.02);
  const microMax = barcodeX - W * 0.015 - microStart;
  ctx.font = `700 ${Math.round(h * 0.21)}px "ViceSans", sans-serif`;
  ctx.fillStyle = 'rgba(247,239,218,0.75)';
  let micro = state.place || '';
  while (micro.length > 1 && ctx.measureText(micro).width > microMax) micro = micro.slice(0, -1);
  if (micro !== (state.place || '')) micro = micro.replace(/.$/, '…');
  if (microMax > 20) ctx.fillText(micro, microStart, top + h * 0.52);
  const bx = barcodeX + barcodeW * 0.06, bw = barcodeW * 0.88;
  const by = top + h * 0.16, bh = h * 0.52;
  ctx.fillStyle = '#f7efda';
  ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
  ctx.fillStyle = '#160409';
  const digits = '6901262026006';
  let x = bx;
  for (let i = 0; i < digits.length; i++) {
    const wBar = (digits.charCodeAt(i) % 3) + 1;
    const gap = (digits.charCodeAt(i + 1 < digits.length ? i + 1 : 0) % 2) + 1;
    ctx.fillRect(x, by, wBar * (bw / 34), bh);
    x += (wBar + gap) * (bw / 34);
  }
  ctx.font = `700 ${Math.round(h * 0.17)}px "ViceSans", sans-serif`;
  ctx.fillStyle = 'rgba(247,239,218,0.85)';
  ctx.textAlign = 'center';
  ctx.fillText('VH-2026-006', barcodeX + barcodeW / 2, top + h * 0.9);
  ctx.restore();
}

function gradeOf() {
  const base = GRADES[state.grade] || GRADES['vice-sunset'];
  return {
    ...base,
    painterly: state.painterly ?? base.painterly,
    ink: state.ink ?? base.ink,
    halftone: state.halftone ?? base.halftone,
    keepSkin: state.keepSkin ?? base.keepSkin,
  };
}

async function renderCover(canvas, W, H) {
  const ctx = canvas.getContext('2d');
  canvas.width = Math.round(W);
  canvas.height = Math.round(H);
  const grade = gradeOf();
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  ctx.fillStyle = '#f7efda';
  ctx.fillRect(0, 0, W, H);
  const gut = Math.max(3, Math.round(Math.min(W, H) * 0.005));
  let seed = 20261120;
  for (const panel of layout.panels) {
    const px = panel.x * W + gut, py = panel.y * H + gut;
    const pw = panel.w * W - gut * 2, ph = panel.h * H - gut * 2;
    seed += 1013;
    if (panel.card) { paintTitleCard(ctx, px, py, pw, ph); continue; }
    await paintPanel(ctx, panel, px, py, pw, ph, grade, seed, H);
  }
  ctx.save();
  ctx.strokeStyle = '#f7efda';
  ctx.lineWidth = Math.max(4, Math.round(Math.min(W, H) * 0.006));
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
  ctx.restore();
  paintBadges(ctx, W, H, state.layout);
  paintTitle(ctx, W, H);
  paintStrip(ctx, W, H);
}

const photoPromises = [];
function preloadAll() {
  for (let i = 0; i < PHOTOS.length; i++) photoPromises.push(loadPhoto(i));
  return Promise.allSettled(photoPromises);
}

async function renderPreview() {
  const canvas = document.getElementById('cover');
  if (!canvas) return;
  await Promise.all([preloadAll(), loadFonts()]);
  await renderCover(canvas, 1080, 1080);
}

async function exportPNG(w, h, download = true) {
  await Promise.all([preloadAll(), loadFonts()]);
  const off = document.createElement('canvas');
  await renderCover(off, w, h);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const bytes = blob ? blob.size : 0;
  window.__lastExport = { w, h, bytes };
  if (download && blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-heat-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  return window.__lastExport;
}

function syncControls() {
  const grade = GRADES[state.grade] || GRADES['vice-sunset'];
  document.querySelectorAll('#layoutGrid button').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('#gradeGrid button').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = String(v); };
  set('slPainterly', state.painterly ?? grade.painterly);
  set('slInk', state.ink ?? grade.ink);
  set('slHalftone', state.halftone ?? grade.halftone);
  set('slSkin', state.keepSkin ?? grade.keepSkin);
  const ht = document.getElementById('halftoneToggle');
  if (ht) ht.checked = (state.halftone ?? grade.halftone) > 0;
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('inTitle', state.title); setVal('inScript', state.script); setVal('inQuote', state.quote);
  setVal('inTagline', state.tagline); setVal('inPlace', state.place);
  const wt = document.getElementById('wantedToggle');
  if (wt) wt.checked = state.wanted;
  const fb = document.getElementById('faceBox');
  if (fb) fb.style.top = `${(0.16 + state.faceShift) * 100}%`;
}

function buildEditor() {
  const lg = document.getElementById('layoutGrid');
  Object.entries(LAYOUTS).forEach(([key, layout]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = key;
    b.textContent = layout.name;
    b.addEventListener('click', () => { state.layout = key; syncControls(); renderPreview(); });
    lg.appendChild(b);
  });
  const gg = document.getElementById('gradeGrid');
  Object.entries(GRADES).forEach(([key, grade]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = key;
    b.textContent = grade.name;
    b.addEventListener('click', () => {
      state.grade = key;
      state.painterly = null; state.ink = null; state.halftone = null; state.keepSkin = null;
      syncControls(); renderPreview();
    });
    gg.appendChild(b);
  });
  const bindSlider = (id, key) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => { state[key] = Number(el.value); renderPreview(); });
  };
  bindSlider('slPainterly', 'painterly');
  bindSlider('slInk', 'ink');
  bindSlider('slHalftone', 'halftone');
  bindSlider('slSkin', 'keepSkin');
  document.getElementById('halftoneToggle').addEventListener('change', (e) => {
    state.halftone = e.target.checked ? Math.max(8, state.halftone ?? 8) : 0;
    syncControls(); renderPreview();
  });
  const bindText = (id, key) => {
    document.getElementById(id).addEventListener('input', (e) => { state[key] = e.target.value; renderPreview(); });
  };
  bindText('inTitle', 'title'); bindText('inScript', 'script'); bindText('inQuote', 'quote');
  bindText('inTagline', 'tagline'); bindText('inPlace', 'place');
  document.getElementById('wantedToggle').addEventListener('change', (e) => { state.wanted = e.target.checked; renderPreview(); });
  document.getElementById('surpriseBtn').addEventListener('click', () => {
    const pick = SURPRISES[state.surprise % SURPRISES.length];
    state.surprise += 1;
    Object.assign(state, pick);
    state.painterly = null; state.ink = null; state.halftone = null; state.keepSkin = null;
    syncControls(); renderPreview();
  });
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', async () => {
      const [w, h] = b.dataset.export.split('x').map(Number);
      const status = document.getElementById('status');
      status.textContent = `Exporting ${w} x ${h}…`;
      const done = await exportPNG(w, h, true);
      status.textContent = `Exported vice-heat-${done.w}x${done.h}.png (${(done.bytes / 1024).toFixed(0)} KB).`;
    });
  });
  const fb = document.getElementById('faceBox');
  let dragging = false;
  fb.addEventListener('pointerdown', (e) => { dragging = true; fb.setPointerCapture(e.pointerId); });
  fb.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const stage = document.getElementById('stage');
    const r = stage.getBoundingClientRect();
    const frac = (e.clientY - r.top) / r.height;
    state.faceShift = clamp(frac - 0.16, -0.1, 0.2);
    syncControls(); renderPreview();
  });
  fb.addEventListener('pointerup', () => { dragging = false; });
  syncControls();
  renderPreview();
}

async function runShot(query) {
  const shot = query.get('shot') || 'editor';
  const layout = query.get('layout');
  const grade = query.get('grade');
  if (layout && LAYOUTS[layout]) state.layout = layout;
  if (grade && GRADES[grade]) state.grade = grade;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = (query.get('size') || '1920x1080').split('x').map(Number);
    const canvas = document.getElementById('cover');
    await Promise.all([preloadAll(), loadFonts()]);
    await renderCover(canvas, size[0], size[1]);
  } else {
    buildEditor();
    await renderPreview();
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}

window.__viceHeat = { state, renderCover, exportPNG, renderPreview, PHOTOS, GRADES, LAYOUTS };

const params = new URLSearchParams(window.location.search);
if (params.get('shot')) {
  runShot(params).catch((err) => {
    window.__shotError = String(err);
    document.getElementById('status').textContent = `Shot failed: ${err}`;
  });
} else {
  buildEditor();
}
