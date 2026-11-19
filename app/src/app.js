// VICE HEAT Cover Studio — GTA 6 style poster cover maker. Offline, no network.
// The cover is drawn on a canvas: graded photos, a huge italic gold title, story
// labels, stickers and a thin bottom strip with its own barcode zone.
'use strict';

// ---------- data ----------
const PHOTOS = [
  { id: 'heroine', src: 'samples/photo1.jpg', label: 'OCEAN DRIVE — 6:42 PM', face: { x: 0.40, y: 0.06, w: 0.24, h: 0.32 } },
  { id: 'fisherman', src: 'samples/photo2.jpg', label: 'THE PIER — FIRST LIGHT', face: { x: 0.46, y: 0.08, w: 0.28, h: 0.36 } },
  { id: 'sportscar', src: 'samples/photo3.jpg', label: 'COLLINS AVE — AFTER RAIN', face: null },
  { id: 'artdeco', src: 'samples/photo4.jpg', label: 'COLONY HOTEL — OCEAN DR', face: null },
  { id: 'speedboat', src: 'samples/photo5.jpg', label: 'BISCAYNE BAY — FULL THROTTLE', face: null },
  { id: 'skyline', src: 'samples/photo6.jpg', label: 'DOWNTOWN — MAGIC HOUR', face: null },
  { id: 'gasstation', src: 'samples/photo7.jpg', label: 'RETRO FUEL — OPEN 24 HOURS', face: null },
  { id: 'lifeguard', src: 'samples/photo8.jpg', label: 'TOWER 12 — MIAMI BEACH', face: null },
];
const PHOTO_BY_ID = Object.fromEntries(PHOTOS.map((p) => [p.id, p]));

const LAYOUTS = [
  { id: 'hero', name: 'Hero Key Art' },
  { id: 'diagonal', name: 'Diagonal Split' },
  { id: 'nine', name: 'Nine Panels' },
  { id: 'duo', name: 'Duo Split' },
  { id: 'triptych', name: 'Triptych' },
  { id: 'skyline', name: 'Skyline Strip' },
  { id: 'quad', name: 'Quad' },
  { id: 'mosaic', name: 'Mosaic' },
  { id: 'coast', name: 'Coast Line' },
];

const GRADES = [
  { id: 'vice-sunset', name: 'Miami Sunset', warm: 0.85, blueShift: 80, sat: 1.18, light: 0.0, contrast: 1.05, grain: 7, posterize: true },
  { id: 'neon-night', name: 'Neon Night', warm: 0.15, blueShift: 45, sat: 1.32, light: -0.08, contrast: 1.18, grain: 5, posterize: true },
  { id: 'comic-ink', name: 'Comic Ink', warm: 0.35, blueShift: 30, sat: 1.12, light: 0.02, contrast: 1.22, grain: 4, posterize: true },
  { id: 'golden-hour', name: 'Golden Hour', warm: 1.0, blueShift: 25, sat: 1.10, light: 0.04, contrast: 1.02, grain: 3, posterize: false },
  { id: 'pastel-dawn', name: 'Pastel Dawn', warm: 0.30, blueShift: 15, sat: 0.72, light: 0.10, contrast: 0.95, grain: 3, posterize: true },
  { id: 'noir-vice', name: 'Noir Vice', warm: 0.0, blueShift: 0, sat: 0.38, light: -0.06, contrast: 1.30, grain: 8, posterize: true },
  { id: 'candy-pop', name: 'Candy Pop', warm: 0.40, blueShift: 55, sat: 1.50, light: 0.02, contrast: 1.08, grain: 5, posterize: true },
];
const GRADE_BY_ID = Object.fromEntries(GRADES.map((g) => [g.id, g]));

const state = {
  layout: 'hero',
  grade: 'vice-sunset',
  tune: { painterly: 35, ink: 22, halftone: 8, keepSkin: 70, halftoneOn: true },
  words: { title: 'VICE HEAT', script: 'Leonida', quote: 'THE CITY NEVER LOOKED THIS GOOD.', tagline: 'EVERY SUNSET HAS A PRICE.', place: 'LEONIDA — VICE CITY' },
  wanted: true,
  face: { x: 0.40, y: 0.06, w: 0.24, h: 0.32 },
};

const CREAM = '#f5e9c8';
const DARK = '#1a050c';
const GOLD = '#ffc93c';
const PINK = '#ff4d8d';
const PURPLE = '#7b2fbe';
const PURPLE_DEEP = '#5b1e8c';

// ---------- deterministic random ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---------- color helpers (0..1) ----------
function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslToRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}
function posterizeLevels(tune) {
  return Math.max(2, Math.min(12, Math.round(11 - tune.painterly * 0.11)));
}

// ---------- grade engine ----------
// Pixel work on a working canvas (<= 760px wide). Deterministic: one seeded
// PRNG per (photo, grade, tune), so the same state always paints the same bytes.
const gradeCache = new Map();
const loadedImages = new Map();

function loadImage(src) {
  if (loadedImages.has(src)) return loadedImages.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('cannot load ' + src));
    img.src = src;
  });
  loadedImages.set(src, p);
  return p;
}

function gradedPhoto(photo, gradeId, tune) {
  const key = [photo.id, gradeId, tune.painterly, tune.ink, tune.halftone, tune.keepSkin, tune.halftoneOn].join('|');
  if (gradeCache.has(key)) return gradeCache.get(key);
  const img = loadedImages.get(photo.src);
  const out = gradeImage(img, GRADE_BY_ID[gradeId], tune, hashString(key));
  gradeCache.set(key, out);
  return out;
}

function gradeImage(img, grade, tune, seed) {
  const w = Math.min(img.naturalWidth, 760);
  const h = Math.round((img.naturalHeight * w) / img.naturalWidth);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const levels = posterizeLevels(tune);
  const step = 255 / (levels - 1);
  const rnd = mulberry32(seed);
  const blueShift = grade.blueShift / 360;
  const keep = tune.keepSkin / 100;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    const r0 = px[o], g0 = px[o + 1], b0 = px[o + 2];
    lum[i] = 0.2126 * r0 + 0.7152 * g0 + 0.0722 * b0;
    let [hh, ss, ll] = rgbToHsl(r0 / 255, g0 / 255, b0 / 255);
    // Skin mask: warm hues, moderate saturation, not too dark.
    const skin = (hh >= 0.02 && hh <= 0.13 && ss >= 0.20 && ss <= 0.80 && ll > 0.30) ? 1 : 0;
    // Blues (incl. teal) rotate toward purple / magenta: the GTA illustrated look.
    if (hh >= 0.51 && hh <= 0.74) hh = (hh + blueShift) % 1;
    ss = clamp(ss * grade.sat, 0, 1);
    ll = clamp((ll - 0.5) * grade.contrast + 0.5 + grade.light, 0, 1);
    let [r, g, b] = hslToRgb(hh, ss, ll);
    // Warm wash: push red up, blue down.
    r = clamp(r + grade.warm * 20, 0, 255);
    b = clamp(b - grade.warm * 15, 0, 255);
    // Posterize: flat color blocks (the mosaic).
    if (grade.posterize && levels < 12) {
      r = Math.round(r / step) * step;
      g = Math.round(g / step) * step;
      b = Math.round(b / step) * step;
    }
    // Keep skin: blend the graded pixel back toward the original.
    if (skin && keep > 0) {
      const k = keep * 0.85;
      r = r + (r0 - r) * k; g = g + (g0 - g) * k; b = b + (b0 - b) * k;
    }
    // Deterministic fine grain.
    const n = (rnd() - 0.5) * grade.grain * 2;
    px[o] = clamp(Math.round(r + n), 0, 255);
    px[o + 1] = clamp(Math.round(g + n), 0, 255);
    px[o + 2] = clamp(Math.round(b + n), 0, 255);
  }
  // Ink edges: darken pixels where the local luminance jumps.
  if (tune.ink > 5) {
    const amt = (tune.ink / 100) * 0.55;
    for (let y = 1; y < h; y++) {
      for (let x = 1; x < w; x++) {
        const i = y * w + x;
        const edge = Math.abs(lum[i] - lum[i - 1]) + Math.abs(lum[i] - lum[i - w]);
        if (edge > 26) {
          const o = i * 4;
          px[o] *= (1 - amt); px[o + 1] *= (1 - amt); px[o + 2] *= (1 - amt);
        }
      }
    }
  }
  ctx.putImageData(data, 0, 0);
  // Halftone dots: deterministic grid, radius from darkness.
  if (tune.halftoneOn && tune.halftone > 2) {
    const cell = 7;
    const alpha = clamp(0.12 + (tune.halftone / 100) * 0.55, 0, 0.6);
    ctx.fillStyle = `rgba(24, 6, 18, ${alpha})`;
    for (let y = cell / 2; y < h; y += cell) {
      for (let x = cell / 2; x < w; x += cell) {
        const i = (Math.floor(y) * w + Math.floor(x)) * 4;
        const l = (px[i] + px[i + 1] + px[i + 2]) / 3 / 255;
        const r = (1 - l) * 2.4 * (0.4 + tune.halftone / 60);
        if (r > 0.4) { ctx.beginPath(); ctx.arc(x, y, Math.min(r, 3.1), 0, Math.PI * 2); ctx.fill(); }
      }
    }
  }
  return cv;
}

// ---------- cover renderer ----------
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function renderCover(cv, W, H, st) {
  const ctx = cv.getContext('2d');
  cv.width = W; cv.height = H;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const inset = Math.max(4, Math.round(W * 0.006));
  const area = { x: inset, y: inset, w: W - inset * 2, h: H - inset * 2 };
  const stripH = Math.max(22, Math.round(H * 0.07));
  const photoArea = { x: area.x, y: area.y, w: area.w, h: area.h - stripH };
  drawLayout(ctx, st, photoArea);
  drawTitleBlock(ctx, st, photoArea, W, H);
  drawStrip(ctx, st, { x: area.x, y: area.y + area.h - stripH, w: area.w, h: stripH }, W);
  return cv;
}

// Face-aware cover crop: the face stays visible, near the upper third.
function drawPhotoCover(ctx, img, tx, ty, tw, th, face) {
  const iw = img.width, ih = img.height;
  const scale = Math.max(tw / iw, th / ih);
  let sw = tw / scale, sh = th / scale;
  let sx = (iw - sw) / 2, sy = (ih - sh) / 2;
  if (face) {
    const fx = (face.x + face.w / 2) * iw, fy = (face.y + face.h / 2) * ih;
    sy = clamp(fy - (th * 0.30) / scale, 0, ih - sh);
    sx = clamp(fx - sw / 2, 0, iw - sw);
    const fx0 = face.x * iw, fx1 = (face.x + face.w) * iw;
    const fy0 = face.y * ih, fy1 = (face.y + face.h) * ih;
    if (fx0 < sx) sx = Math.max(0, fx0 - sw * 0.05);
    if (fx1 > sx + sw) sx = Math.min(iw - sw, fx1 - sw + sw * 0.05);
    if (fy0 < sy) sy = Math.max(0, fy0 - sh * 0.03);
    if (fy1 > sy + sh) sy = Math.min(ih - sh, fy1 - sh + sh * 0.03);
    sx = clamp(sx, 0, iw - sw); sy = clamp(sy, 0, ih - sh);
  }
  ctx.drawImage(img, sx, sy, sw, sh, tx, ty, tw, th);
}

function panelLabel(ctx, text, x, y, H) {
  if (!text) return;
  const fs = Math.max(10, Math.round(H * 0.020));
  ctx.font = `700 ${fs}px "ViceDisplayCond", sans-serif`;
  const tw = ctx.measureText(text).width;
  const pad = Math.round(fs * 0.45);
  ctx.fillStyle = 'rgba(10, 2, 8, 0.72)';
  rr(ctx, x, y, tw + pad * 2, fs + pad, 3);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad, y + (fs + pad) / 2 + 1);
}

function drawPanel(ctx, st, photo, x, y, w, h, H, faceOverride) {
  const graded = gradedPhoto(photo, st.grade, st.tune);
  drawPhotoCover(ctx, graded, x, y, w, h, faceOverride !== undefined ? faceOverride : photo.face);
  if (w > 140 && h > 60) panelLabel(ctx, photo.label, x + 8, y + h - Math.round(H * 0.020) - 14, H);
}

function drawLayout(ctx, st, a) {
  const g = st.grade, t = st.tune;
  const gut = Math.max(2, Math.round(a.w * 0.004));
  const P = (id) => PHOTO_BY_ID[id];
  ctx.save();
  ctx.beginPath(); ctx.rect(a.x, a.y, a.w, a.h); ctx.clip();
  if (st.layout === 'hero') {
    drawPanel(ctx, st, P('heroine'), a.x, a.y, a.w, a.h, a.h, st.face);
  } else if (st.layout === 'diagonal') {
    drawPanel(ctx, st, P('gasstation'), a.x, a.y, a.w, a.h, a.h);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + a.w, a.y);
    ctx.lineTo(a.x + a.w, a.y + a.h * 0.50); ctx.lineTo(a.x, a.y + a.h * 0.66);
    ctx.closePath(); ctx.clip();
    drawPanel(ctx, st, P('heroine'), a.x, a.y, a.w, a.h * 0.72, a.h, st.face);
    ctx.restore();
    ctx.strokeStyle = CREAM; ctx.lineWidth = gut;
    ctx.beginPath(); ctx.moveTo(a.x, a.y + a.h * 0.66); ctx.lineTo(a.x + a.w, a.y + a.h * 0.50); ctx.stroke();
  } else if (st.layout === 'nine') {
    const cw = a.w / 3, ch = a.h / 3;
    const cells = [
      ['heroine', 'sportscar', 'fisherman'],
      ['artdeco', null, 'speedboat'],
      ['skyline', 'lifeguard', 'gasstation'],
    ];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const id = cells[r][c];
        const x = a.x + c * cw, y = a.y + r * ch;
        if (id === null) { drawTitleCard(ctx, st, x, y, cw, ch); continue; }
        drawPanel(ctx, st, P(id), x, y, cw, ch, a.h, id === 'heroine' ? st.face : undefined);
      }
    }
    ctx.strokeStyle = CREAM; ctx.lineWidth = gut;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(a.x + cw * i, a.y); ctx.lineTo(a.x + cw * i, a.y + a.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(a.x, a.y + ch * i); ctx.lineTo(a.x + a.w, a.y + ch * i); ctx.stroke();
    }
  } else if (st.layout === 'duo') {
    const w1 = a.w * 0.56;
    drawPanel(ctx, st, P('heroine'), a.x, a.y, w1, a.h, a.h, st.face);
    drawPanel(ctx, st, P('sportscar'), a.x + w1 + gut, a.y, a.w - w1 - gut, a.h, a.h);
    ctx.fillStyle = CREAM; ctx.fillRect(a.x + w1, a.y, gut, a.h);
  } else if (st.layout === 'triptych') {
    const w1 = a.w / 3;
    drawPanel(ctx, st, P('heroine'), a.x, a.y, w1, a.h, a.h, st.face);
    drawPanel(ctx, st, P('artdeco'), a.x + w1 + gut, a.y, w1 - gut, a.h, a.h);
    drawPanel(ctx, st, P('speedboat'), a.x + w1 * 2 + gut, a.y, w1 - gut, a.h, a.h);
    ctx.fillStyle = CREAM;
    ctx.fillRect(a.x + w1, a.y, gut, a.h);
    ctx.fillRect(a.x + w1 * 2, a.y, gut, a.h);
  } else if (st.layout === 'skyline') {
    const h1 = a.h * 0.70;
    drawPanel(ctx, st, P('skyline'), a.x, a.y, a.w, h1, a.h);
    const w1 = a.w / 3, y2 = a.y + h1 + gut, h2 = a.h - h1 - gut;
    drawPanel(ctx, st, P('fisherman'), a.x, y2, w1, h2, a.h);
    drawPanel(ctx, st, P('speedboat'), a.x + w1 + gut, y2, w1 - gut, h2, a.h);
    drawPanel(ctx, st, P('lifeguard'), a.x + w1 * 2 + gut, y2, w1 - gut, h2, a.h);
    ctx.fillStyle = CREAM; ctx.fillRect(a.x, a.y + h1, a.w, gut);
    ctx.fillRect(a.x + w1, y2, gut, h2);
    ctx.fillRect(a.x + w1 * 2, y2, gut, h2);
  } else if (st.layout === 'quad') {
    const w1 = a.w / 2, h1 = a.h / 2;
    drawPanel(ctx, st, P('heroine'), a.x, a.y, w1, h1, a.h, st.face);
    drawPanel(ctx, st, P('sportscar'), a.x + w1 + gut, a.y, w1 - gut, h1, a.h);
    drawPanel(ctx, st, P('fisherman'), a.x, a.y + h1 + gut, w1, h1 - gut, a.h);
    drawPanel(ctx, st, P('artdeco'), a.x + w1 + gut, a.y + h1 + gut, w1 - gut, h1 - gut, a.h);
    ctx.fillStyle = CREAM;
    ctx.fillRect(a.x + w1, a.y, gut, a.h);
    ctx.fillRect(a.x, a.y + h1, a.w, gut);
  } else if (st.layout === 'mosaic') {
    const w1 = a.w * 0.60, w2 = a.w - w1 - gut;
    drawPanel(ctx, st, P('heroine'), a.x, a.y, w1, a.h, a.h, st.face);
    const h1 = a.h * 0.55, x2 = a.x + w1 + gut;
    drawPanel(ctx, st, P('artdeco'), x2, a.y, w2, h1, a.h);
    const y2 = a.y + h1 + gut, h2 = a.h - h1 - gut, w3 = w2 / 2;
    drawPanel(ctx, st, P('speedboat'), x2, y2, w3, h2, a.h);
    drawPanel(ctx, st, P('lifeguard'), x2 + w3 + gut, y2, w3 - gut, h2, a.h);
    ctx.fillStyle = CREAM;
    ctx.fillRect(a.x + w1, a.y, gut, a.h);
    ctx.fillRect(x2, a.y + h1, w2, gut);
    ctx.fillRect(x2 + w3, y2, gut, h2);
  } else { // coast
    const h1 = a.h * 0.62;
    drawPanel(ctx, st, P('speedboat'), a.x, a.y, a.w, h1, a.h);
    const w1 = a.w / 3, y2 = a.y + h1 + gut, h2 = a.h - h1 - gut;
    drawPanel(ctx, st, P('heroine'), a.x, y2, w1, h2, a.h, st.face);
    drawPanel(ctx, st, P('fisherman'), a.x + w1 + gut, y2, w1 - gut, h2, a.h);
    drawPanel(ctx, st, P('skyline'), a.x + w1 * 2 + gut, y2, w1 - gut, h2, a.h);
    ctx.fillStyle = CREAM; ctx.fillRect(a.x, a.y + h1, a.w, gut);
    ctx.fillRect(a.x + w1, y2, gut, h2);
    ctx.fillRect(a.x + w1 * 2, y2, gut, h2);
  }
  ctx.restore();
}

function drawTitleCard(ctx, st, x, y, w, h) {
  ctx.fillStyle = DARK; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = CREAM; ctx.lineWidth = Math.max(2, w * 0.01);
  ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
  const fs = Math.round(h * 0.20);
  ctx.fillStyle = GOLD;
  ctx.font = `900 ${fs}px "ViceDisplayCond", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('VICE', x + w / 2, y + h * 0.34);
  ctx.fillText('HEAT', x + w / 2, y + h * 0.56);
  ctx.fillStyle = PINK;
  ctx.font = `400 ${Math.round(fs * 0.62)}px "ViceScript", cursive`;
  ctx.fillText(st.words.script, x + w / 2, y + h * 0.80);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function drawStarburst(ctx, cx, cy, r, lines) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const spikes = 12;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i * Math.PI) / spikes - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.72;
    const px = Math.cos(ang) * rad, py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = GOLD; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#7a1e2e'; ctx.stroke();
  ctx.fillStyle = '#2a0608';
  ctx.font = `900 ${Math.round(r * 0.24)}px "ViceDisplayCond", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((ln, i) => ctx.fillText(ln, 0, (i - (lines.length - 1) / 2) * r * 0.30));
  ctx.restore();
}

function drawSticker(ctx, cx, cy, r, lines) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = CREAM; ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.10); ctx.strokeStyle = PINK; ctx.stroke();
  ctx.fillStyle = '#7a1e2e';
  ctx.font = `900 ${Math.round(r * 0.30)}px "ViceDisplayCond", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((ln, i) => ctx.fillText(ln, cx, cy + (i - (lines.length - 1) / 2) * r * 0.36));
  ctx.restore();
}

function drawTitleBlock(ctx, st, a, W, H) {
  const nine = st.layout === 'nine';
  const zoneTop = a.y + a.h * (nine ? 0.68 : 0.56);
  const zoneBottom = a.y + a.h * (nine ? 0.93 : 0.88);
  const baselineY = zoneBottom;
  let fontSize = Math.round(a.h * 0.34);
  const title = st.words.title || 'VICE HEAT';
  ctx.font = `900 ${fontSize}px "ViceDisplayCond", sans-serif`;
  let tw = ctx.measureText(title).width;
  const maxW = a.w * 0.88; // room for the skew shift + the two purple 3D shadow offsets
  if (tw > maxW) {
    fontSize = Math.floor((fontSize * maxW) / tw);
    ctx.font = `900 ${fontSize}px "ViceDisplayCond", sans-serif`;
    tw = ctx.measureText(title).width;
  }
  const cx = a.x + a.w / 2;
  // Stars + quote pill, centered just above the title. Skipped on the nine-panels grid: it would cover the middle-row story labels.
  if (st.layout !== 'nine') {
  const qfs = Math.max(11, Math.round(H * 0.022));
  ctx.font = `700 ${qfs}px "ViceSans", sans-serif`;
  const quoteText = `★★★★★  ${st.words.quote}`;
  const qw = ctx.measureText(quoteText).width;
  const qpad = Math.round(qfs * 0.6);
  const qy = zoneTop - qfs - qpad * 2 - 6;
  ctx.fillStyle = 'rgba(10, 2, 8, 0.72)';
  rr(ctx, cx - qw / 2 - qpad, qy, qw + qpad * 2, qfs + qpad * 1.4, 4);
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.textBaseline = 'middle';
  ctx.fillText('★★★★★', cx - qw / 2 + qpad, qy + (qfs + qpad * 1.4) / 2 + 1);
  ctx.fillStyle = '#fff';
  const starsW = ctx.measureText('★★★★★  ').width;
  ctx.fillText(st.words.quote, cx - qw / 2 + qpad + starsW, qy + (qfs + qpad * 1.4) / 2 + 1);
  }
  // WANTED badge, top-left.
  if (st.wanted) {
    const wfs = Math.max(11, Math.round(H * 0.024));
    ctx.font = `900 ${wfs}px "ViceSans", sans-serif`;
    const wt = `WANTED  ★★★★★`;
    const ww = ctx.measureText(wt).width;
    const wp = Math.round(wfs * 0.7);
    ctx.fillStyle = 'rgba(10, 2, 8, 0.85)';
    rr(ctx, a.x + 10, a.y + 10, ww + wp * 2, wfs + wp * 1.2, 5);
    ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = GOLD; ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.fillText('WANTED', a.x + 10 + wp, a.y + 10 + (wfs + wp * 1.2) / 2 + 1);
    ctx.fillStyle = PINK;
    ctx.fillText('★★★★★', a.x + 10 + wp + ctx.measureText('WANTED  ').width, a.y + 10 + (wfs + wp * 1.2) / 2 + 1);
  }
  // Starburst + stickers. Starburst top-center on nine-panels (never over a face),
  // top-right everywhere else.
  const sr = Math.max(26, Math.round(H * 0.055));
  if (nine) drawStarburst(ctx, cx, a.y + sr + 6, sr, ['ORIGINAL', 'COVER ART']);
  else drawStarburst(ctx, a.x + a.w - sr - 10, a.y + sr + 8, sr, ['ORIGINAL', 'COVER ART']);
  const str = Math.max(18, Math.round(H * 0.042));
  drawSticker(ctx, a.x + a.w - str - 8, a.y + a.h * 0.44, str, ['VOL. 06']);
  drawSticker(ctx, a.x + str + 8, a.y + a.h * 0.52, str, ['EST.', '2026']);
  // The huge title: gradient is created AFTER the skew transform, so the letters
  // sample the whole cream -> gold -> orange -> pink run (never white).
  ctx.save();
  ctx.translate(cx, baselineY);
  ctx.transform(1, 0, -0.22, 1, 0, 0);
  ctx.font = `900 ${fontSize}px "ViceDisplayCond", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const off1 = fontSize * 0.045, off2 = fontSize * 0.022;
  ctx.fillStyle = PURPLE_DEEP;
  ctx.fillText(title, off1, off1 * 1.1);
  ctx.fillStyle = PURPLE;
  ctx.fillText(title, off2, off2 * 1.1);
  const grad = ctx.createLinearGradient(0, -fontSize * 0.82, 0, fontSize * 0.18);
  grad.addColorStop(0, '#fff6d8');
  grad.addColorStop(0.38, '#ffc93c');
  grad.addColorStop(0.62, '#ff7a1a');
  grad.addColorStop(1, '#ff4d8d');
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = fontSize * 0.03;
  ctx.shadowOffsetY = fontSize * 0.015;
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  ctx.restore();
  // Script overlapping the title tail.
  const sfs = Math.round(fontSize * 0.44);
  ctx.save();
  ctx.translate(cx + tw * 0.5 - tw * 0.30, baselineY - fontSize * 0.30);
  ctx.rotate(-0.14);
  ctx.font = `400 ${sfs}px "ViceScript", cursive`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, sfs * 0.04);
  ctx.strokeStyle = 'rgba(90, 10, 60, 0.85)';
  ctx.strokeText(st.words.script, 0, 0);
  ctx.fillStyle = '#ff6fae';
  ctx.fillText(st.words.script, 0, 0);
  ctx.restore();
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
}

function drawStrip(ctx, st, s, W) {
  ctx.fillStyle = DARK;
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.fillStyle = CREAM;
  ctx.fillRect(s.x, s.y, s.w, 2);
  const midY = s.y + s.h / 2;
  // Barcode zone: reserved at the far right, with its own padding. Nothing else
  // is allowed to enter it.
  const zoneW = Math.max(84, Math.round(W * 0.085));
  const zoneX = s.x + s.w - zoneW - 10;
  const zonePad = 8;
  const tfs = Math.max(12, Math.round(s.h * 0.34));
  ctx.font = `700 ${tfs}px "ViceSans", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(st.words.tagline, s.x + 14, midY + 1);
  const tagW = ctx.measureText(st.words.tagline).width;
  const mfs = Math.max(10, Math.round(s.h * 0.26));
  ctx.font = `700 ${mfs}px "ViceSans", sans-serif`;
  ctx.fillStyle = '#c9a9b4';
  let micro = st.words.place;
  const microX = s.x + 14 + tagW + 18;
  const avail = zoneX - zonePad - microX;
  while (micro.length > 4 && ctx.measureText(micro).width > avail) micro = micro.slice(0, -1);
  if (micro !== st.words.place) micro = micro.slice(0, -3) + '…';
  ctx.fillText(micro, microX, midY + 1);
  // Barcode: deterministic bars from a fixed seed.
  const rnd = mulberry32(2026);
  const bx = zoneX + zonePad, bw = zoneW - zonePad * 2;
  const bh = Math.max(14, s.h - 20);
  const by = s.y + 5;
  ctx.fillStyle = CREAM;
  let x = bx;
  while (x < bx + bw - 2) {
    const bwBar = 1 + Math.floor(rnd() * 3) * (W >= 1000 ? 1.6 : 1);
    const gap = rnd() < 0.6 ? 1.6 : 3.2;
    ctx.fillRect(x, by, Math.min(bwBar, bx + bw - x), bh);
    x += bwBar + gap;
  }
  const cfs = Math.max(8, Math.round(s.h * 0.16));
  ctx.font = `700 ${cfs}px "ViceSans", sans-serif`;
  ctx.fillStyle = '#8a6a76';
  ctx.textAlign = 'right';
  ctx.fillText('VH-2026-006', s.x + s.w - 10, s.y + s.h - cfs - 2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

// ---------- editor + shot mode ----------
const $ = (id) => document.getElementById(id);
const canvas = $('cover');
let ready = false;
let renderToken = 0;

function currentPhotoArea() {
  const W = canvas.width, H = canvas.height;
  const inset = Math.max(4, Math.round(W * 0.006));
  const stripH = Math.max(22, Math.round(H * 0.07));
  return { x: inset, y: inset, w: W - inset * 2, h: H - inset * 2 - stripH };
}

// Same crop math as drawPhotoCover, for placing the face box on the preview.
function cropFor(img, tw, th, face) {
  const iw = img.width, ih = img.height;
  const scale = Math.max(tw / iw, th / ih);
  let sw = tw / scale, sh = th / scale;
  let sx = (iw - sw) / 2, sy = (ih - sh) / 2;
  if (face) {
    const fx = (face.x + face.w / 2) * iw, fy = (face.y + face.h / 2) * ih;
    sy = clamp(fy - (th * 0.30) / scale, 0, ih - sh);
    sx = clamp(fx - sw / 2, 0, iw - sw);
    const fx0 = face.x * iw, fx1 = (face.x + face.w) * iw;
    const fy0 = face.y * ih, fy1 = (face.y + face.h) * ih;
    if (fx0 < sx) sx = Math.max(0, fx0 - sw * 0.05);
    if (fx1 > sx + sw) sx = Math.min(iw - sw, fx1 - sw + sw * 0.05);
    if (fy0 < sy) sy = Math.max(0, fy0 - sh * 0.03);
    if (fy1 > sy + sh) sy = Math.min(ih - sh, fy1 - sh + sh * 0.03);
    sx = clamp(sx, 0, iw - sw); sy = clamp(sy, 0, ih - sh);
  }
  return { sx, sy, sw, sh, scale };
}

function renderPreview() {
  if (!ready) return;
  const token = ++renderToken;
  renderCover(canvas, 1280, 720, state);
  if (token !== renderToken) return;
  positionFaceBox();
}

function positionFaceBox() {
  const box = $('facebox');
  if (state.layout !== 'hero') { box.hidden = true; return; }
  const a = currentPhotoArea();
  const img = gradedPhoto(PHOTO_BY_ID.heroine, state.grade, state.tune);
  const c = cropFor(img, a.w, a.h, state.face);
  const fx = state.face.x * img.width, fy = state.face.y * img.height;
  const fw = state.face.w * img.width, fh = state.face.h * img.height;
  const rx = a.x + (fx - c.sx) * c.scale;
  const ry = a.y + (fy - c.sy) * c.scale;
  const rw = fw * c.scale, rh = fh * c.scale;
  box.style.left = (rx / canvas.width * 100) + '%';
  box.style.top = (ry / canvas.height * 100) + '%';
  box.style.width = (rw / canvas.width * 100) + '%';
  box.style.height = (rh / canvas.height * 100) + '%';
  box.hidden = false;
}

function fitStage() {
  if (document.body.classList.contains('shot-cover')) return;
  const stage = document.querySelector('.stage');
  const wrap = $('cover-wrap');
  const availW = stage.clientWidth;
  const availH = Math.max(200, stage.clientHeight - 52);
  let w = availW, h = (w * 9) / 16;
  if (h > availH) { h = availH; w = (h * 16) / 9; }
  wrap.style.width = Math.floor(w) + 'px';
  wrap.style.height = Math.floor(h) + 'px';
  wrap.style.margin = '0 auto';
  wrap.style.flex = '0 0 auto';
}

function buildPickers() {
  const lp = $('layout-picker');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = l.name; b.dataset.id = l.id;
    if (l.id === state.layout) b.classList.add('active');
    b.addEventListener('click', () => {
      state.layout = l.id;
      lp.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      renderPreview();
    });
    lp.appendChild(b);
  });
  const gp = $('grade-picker');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = g.name; b.dataset.id = g.id;
    if (g.id === state.grade) b.classList.add('active');
    b.addEventListener('click', () => {
      state.grade = g.id;
      gp.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
      renderPreview();
    });
    gp.appendChild(b);
  });
}

function wireControls() {
  const slider = (id, key) => {
    const el = $(id), v = $(id + '-v');
    el.addEventListener('input', () => {
      state.tune[key] = Number(el.value);
      v.textContent = el.value;
      renderPreview();
    });
  };
  slider('tune-painterly', 'painterly');
  slider('tune-ink', 'ink');
  slider('tune-halftone', 'halftone');
  slider('tune-keepskin', 'keepSkin');
  $('tune-halftone-on').addEventListener('change', (e) => { state.tune.halftoneOn = e.target.checked; renderPreview(); });
  const word = (id, key) => {
    $(id).addEventListener('input', (e) => { state.words[key] = e.target.value; renderPreview(); });
  };
  word('word-title', 'title');
  word('word-script', 'script');
  word('word-quote', 'quote');
  word('word-tagline', 'tagline');
  word('word-place', 'place');
  $('wanted-toggle').addEventListener('change', (e) => { state.wanted = e.target.checked; renderPreview(); });
  const surprise = () => {
    state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
    state.grade = GRADES[Math.floor(Math.random() * GRADES.length)].id;
    state.tune.painterly = 10 + Math.floor(Math.random() * 80);
    state.tune.ink = Math.floor(Math.random() * 70);
    state.tune.halftone = Math.floor(Math.random() * 45);
    state.tune.keepSkin = 50 + Math.floor(Math.random() * 50);
    $('layout-picker').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.layout));
    $('grade-picker').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.grade));
    $('tune-painterly').value = state.tune.painterly; $('tune-painterly-v').textContent = state.tune.painterly;
    $('tune-ink').value = state.tune.ink; $('tune-ink-v').textContent = state.tune.ink;
    $('tune-halftone').value = state.tune.halftone; $('tune-halftone-v').textContent = state.tune.halftone;
    $('tune-keepskin').value = state.tune.keepSkin; $('tune-keepskin-v').textContent = state.tune.keepSkin;
    renderPreview();
  };
  $('btn-surprise').addEventListener('click', surprise);
  $('btn-surprise-top').addEventListener('click', surprise);
  document.querySelectorAll('.btn.export').forEach((b) => {
    b.addEventListener('click', () => exportPng(b.dataset.export));
  });
  // Draggable face box: drag moves the face rect in the hero photo.
  const box = $('facebox');
  let drag = null;
  box.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    box.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, face: { ...state.face } };
  });
  box.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const wrap = $('cover-wrap').getBoundingClientRect();
    const a = currentPhotoArea();
    const img = gradedPhoto(PHOTO_BY_ID.heroine, state.grade, state.tune);
    const c = cropFor(img, a.w, a.h, drag.face);
    const dx = (e.clientX - drag.x) * (canvas.width / wrap.width);
    const dy = (e.clientY - drag.y) * (canvas.height / wrap.height);
    state.face.x = clamp(drag.face.x + dx / (c.scale * img.width), 0, 1 - state.face.w);
    state.face.y = clamp(drag.face.y + dy / (c.scale * img.height), 0, 1 - state.face.h);
    renderPreview();
  });
  box.addEventListener('pointerup', () => { drag = null; });
  window.addEventListener('resize', () => { fitStage(); });
}

function exportPng(size) {
  const [W, H] = size.split('x').map(Number);
  const off = document.createElement('canvas');
  renderCover(off, W, H, state);
  window.__exportDone = false;
  off.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vice-heat-${size}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    window.__exportDone = true;
  }, 'image/png');
}

async function init() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const layout = params.get('layout');
    const grade = params.get('grade');
    if (layout && LAYOUTS.some((l) => l.id === layout)) state.layout = layout;
    if (grade && GRADE_BY_ID[grade]) state.grade = grade;
  }
  buildPickers();
  wireControls();
  // Fonts first (with a timeout so a missing font never blocks the shot),
  // then all eight photos.
  const fontLoad = (async () => {
    try {
      await Promise.race([
        Promise.all([
          document.fonts.load('900 40px "ViceDisplayCond"'),
          document.fonts.load('900 40px "ViceDisplay"'),
          document.fonts.load('700 20px "ViceSans"'),
          document.fonts.load('400 30px "ViceScript"'),
          document.fonts.ready,
        ]),
        new Promise((r) => setTimeout(r, 3000)),
      ]);
    } catch (e) { /* render anyway */ }
  })();
  const imgLoad = Promise.all(PHOTOS.map(async (p) => {
    const img = await loadImage(p.src);
    loadedImages.set(p.src, img);
  }));
  try {
    await Promise.all([fontLoad, imgLoad]);
  } catch (e) {
    window.__readyError = String(e);
  }
  ready = true;
  if (shot === 'cover') {
    const W = window.innerWidth, H = window.innerHeight;
    renderCover(canvas, W, H, state);
    $('facebox').hidden = true;
  } else {
    fitStage();
    renderPreview();
  }
  window.__ready = true;
}

init();
