'use strict';
/* VICE HEAT Cover Studio v2 — GTA-style multi-panel poster maker.
   Redesign: title locked to the bottom band (never over a face), per-panel
   story labels, a WANTED badge, and a painterly engine that turns photos
   into illustration instead of showing raw snapshots. */

const PHOTO_TOP = 0, PHOTO_BOTTOM = 0.64;   /* photo zone: top 64% of cover */
const TITLE_TOP = 0.64, TITLE_BOTTOM = 0.86; /* title band: locked, faces never enter */
const STRIP_TOP = 0.86, STRIP_BOTTOM = 0.93;
const FOOTER_TOP = 0.93;
const SIZES = { '1920x1080': [1920, 1080], '1080x1350': [1080, 1350], '1080x1080': [1080, 1080] };

function gridPanels(cols, rows) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push([c / cols, r / rows, 1 / cols, 1 / rows]);
  return out;
}
const DIAGONAL_POLYS = [
  [[0, 0], [0.62, 0], [0.42, 0.62], [0, 0.62]],
  [[0.62, 0], [1, 0], [1, 0.62], [0.42, 0.62]],
  [[0, 0.62], [0.5, 0.62], [0.5, 1], [0, 1]],
  [[0.5, 0.62], [1, 0.62], [1, 1], [0.5, 1]],
];
const LAYOUTS = {
  hero:      { name: 'Hero',          panels: [[0, 0, 0.56, 1], [0.56, 0, 0.44, 0.5], [0.56, 0.5, 0.44, 0.5]], photos: [0, 1, 6] },
  comic:     { name: 'Comic',         panels: gridPanels(3, 2), photos: [0, 1, 2, 3, 4, 5] },
  nine:      { name: '9 Panels',      panels: gridPanels(3, 3), photos: [0, 1, 2, 3, 4, 5, 6, 7, 0] },
  one:       { name: '1 Panel',       panels: [[0, 0, 1, 1]], photos: [0] },
  two:       { name: '2 Panels',      panels: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]], photos: [0, 1] },
  three:     { name: '3 Panels',      panels: [[0, 0, 0.34, 1], [0.34, 0, 0.33, 1], [0.67, 0, 0.33, 1]], photos: [0, 1, 2] },
  four:      { name: '4 Panels',      panels: gridPanels(2, 2), photos: [0, 1, 2, 3] },
  diagonal:  { name: 'Diagonal Split', panels: DIAGONAL_POLYS, photos: [0, 1, 3, 6] },
  herostrip: { name: 'Hero + Strip',  panels: [[0, 0, 1, 0.62], [0, 0.62, 0.34, 0.38], [0.34, 0.62, 0.33, 0.38], [0.67, 0.62, 0.33, 0.38]], photos: [0, 1, 2, 5] },
};
const GRADES = {
  'vice-sunset': { name: 'Miami Sunset', shadow: '#3a0d5e', mid: '#ff7a2f', high: '#ffd9a0', sat: 1.15, con: 1.05, paint: 70, ink: 55, half: 30, sw: 'linear-gradient(90deg,#ffd9a0,#ff7a2f,#ff5e8a)' },
  'neon-night':  { name: 'Neon Night',   shadow: '#0a1030', mid: '#ff2e88', high: '#7fe7ff', sat: 1.25, con: 1.10, paint: 65, ink: 60, half: 35, sw: 'linear-gradient(90deg,#7fe7ff,#b14bff,#ff2e88)' },
  'golden-hour': { name: 'Golden Hour',  shadow: '#4a2405', mid: '#ffb347', high: '#fff3c4', sat: 1.20, con: 1.05, paint: 60, ink: 45, half: 25, sw: 'linear-gradient(90deg,#fff3c4,#ffb347,#ff8a3d)' },
  'duotone':     { name: 'Duotone Pink/Teal', shadow: '#062a30', mid: '#ff5e8a', high: '#8ff5e1', sat: 1.10, con: 1.08, paint: 70, ink: 55, half: 40, sw: 'linear-gradient(90deg,#8ff5e1,#ff5e8a,#7a2bff)' },
  'comic-ink':   { name: 'Comic Ink',    shadow: '#12041f', mid: '#ff2e88', high: '#ffe9a8', sat: 1.05, con: 1.25, paint: 80, ink: 90, half: 60, sw: 'linear-gradient(90deg,#ffe9a8,#ff2e88,#2a0a3d)' },
  'natural':     { name: 'Natural',      shadow: '#1c2430', mid: '#c8b18a', high: '#f5efe0', sat: 1.00, con: 1.00, paint: 25, ink: 20, half: 10, sw: 'linear-gradient(90deg,#f5efe0,#c8b18a,#8a7a5a)' },
  'palm-noir':   { name: 'Palm Noir',    shadow: '#05060f', mid: '#5b2a86', high: '#ffb3c8', sat: 0.90, con: 1.15, paint: 75, ink: 70, half: 45, sw: 'linear-gradient(90deg,#ffb3c8,#5b2a86,#05060f)' },
};
const PHOTO_LABELS = [
  ['OCEAN DRIVE', '6:42 PM — LOOKING FOR TROUBLE'],
  ['PIER 26', '5:30 AM — GONE FISHING'],
  ['PALM BOULEVARD', '9:15 PM — LIGHTS OUT'],
  ['MARINA DEL SOL', '7:40 PM — NO WITNESSES'],
  ['INTERSTATE 6', '11:58 PM — FULL THROTTLE'],
  ['SUNSET HEIGHTS', '8:30 PM — BIG MONEY'],
  ['VICE PETRO', '2:12 AM — RUNNING ON EMPTY'],
  ['TOWER 2', '6:10 PM — LAST SWIM'],
];
const SURPRISE_TITLES = [
  ['VICE HEAT', 'Leonida', 'WELCOME TO LEONIDA — SUMMER 2026'],
  ['GOLD COAST', 'Vice City', 'ONE COAST · NO RULES · COMING SOON'],
  ['SUNSET VICE', 'Miami Nights', 'EVERY STREET HAS A PRICE'],
  ['PALM HEAT', 'Coast to Coast', 'LIGHTS ON · TOP DOWN · AFTER DARK'],
  ['OCEAN DRIVE', 'Leonida', 'EVERY SUMMER HAS A STORY'],
];

const state = {
  photos: [],            /* {img, name, label:[place, sub]} */
  layout: 'hero',
  grade: 'vice-sunset',
  size: '1920x1080',
  painterly: 70, ink: 55, halftone: 30, skin: 70,
  faceSafe: true,
  face: { panel: 0, x: 0.30, y: 0.06, w: 0.30, h: 0.38 }, /* fractions of panel 0 */
  selectedPanel: 0,
  panels: [],            /* {photo, zoom, panX, panY, place, sub} per layout panel */
  title: 'VICE HEAT', subtitle: 'Leonida',
  tagline: 'WELCOME TO LEONIDA — SUMMER 2026',
  quote: 'PURE ADRENALINE IN EVERY FRAME',
  wanted: true, stars: 5, vol: 'VOL. 06', seal: true,
};
let previewRects = [];   /* screen rects of panels on the preview canvas */
let lastRenderKey = '';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

function layoutPanels() { return LAYOUTS[state.layout].panels; }
function panelCount() { return layoutPanels().length; }
function gradeDef() { return GRADES[state.grade] || GRADES['vice-sunset']; }

function resetPanels() {
  const def = LAYOUTS[state.layout];
  state.panels = def.panels.map((_, i) => {
    const pi = def.photos[i % def.photos.length] % Math.max(1, state.photos.length);
    const lab = PHOTO_LABELS[pi] || ['VICE CITY', 'JUST NOW — STARRING YOU'];
    return { photo: pi, zoom: 1, panX: 0.5, panY: 0.5, place: lab[0], sub: lab[1] };
  });
  state.selectedPanel = 0;
  state.face.panel = 0;
}

function loadSamplePhotos() {
  const jobs = [];
  for (let i = 1; i <= 8; i++) {
    jobs.push(new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ img, name: 'photo' + i, label: PHOTO_LABELS[i - 1].slice() });
      img.onerror = () => resolve(null);
      img.src = 'samples/photo' + i + '.jpg';
    }));
  }
  return Promise.all(jobs).then((list) => {
    state.photos = list.filter(Boolean);
    resetPanels();
    buildPhotoGrid();
    buildPanelButtons();
    renderPreview();
  });
}

/* ---------- painterly engine: photos become illustration ---------- */
function coverCrop(img, tw, th, zoom, panX, panY) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const s = Math.max(tw / iw, th / ih) * zoom;
  const sw = Math.min(iw, tw / s), sh = Math.min(ih, th / s);
  const sx = Math.min(Math.max(0, panX * iw - sw / 2), Math.max(0, iw - sw));
  const sy = Math.min(Math.max(0, panY * ih - sh / 2), Math.max(0, ih - sh));
  return { sx, sy, sw, sh };
}
function posterizePixels(d, levels) {
  const step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.round(d[i] / step) * step;
    d[i + 1] = Math.round(d[i + 1] / step) * step;
    d[i + 2] = Math.round(d[i + 2] / step) * step;
  }
}
function inkContourPixels(d, w, h, ink) {
  const lum = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) lum[p] = 0.299 * d[p * 4] + 0.587 * d[p * 4 + 1] + 0.114 * d[p * 4 + 2];
  const thr = 95 - ink * 0.6;
  const strength = 0.35 + (ink / 100) * 0.65;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const gx = -lum[p - w - 1] - 2 * lum[p - 1] - lum[p + w - 1] + lum[p - w + 1] + 2 * lum[p + 1] + lum[p + w + 1];
      const gy = -lum[p - w - 1] - 2 * lum[p - w] - lum[p - w + 1] + lum[p + w - 1] + 2 * lum[p + w] + lum[p + w + 1];
      const m = Math.sqrt(gx * gx + gy * gy);
      if (m > thr) {
        const k = Math.min(1, (m - thr) / 120) * strength;
        const i4 = p * 4;
        d[i4] = d[i4] * (1 - k) + 22 * k;
        d[i4 + 1] = d[i4 + 1] * (1 - k) + 8 * k;
        d[i4 + 2] = d[i4 + 2] * (1 - k) + 34 * k;
      }
    }
  }
}
function halftoneDots(ctx, imgData, w, h, halftone, faceRect) {
  const step = Math.max(5, Math.round(w / 150));
  const d = imgData.data;
  ctx.fillStyle = '#1a0b2e';
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      if (faceRect && x > faceRect.x && x < faceRect.x + faceRect.w && y > faceRect.y && y < faceRect.y + faceRect.h) continue;
      const p = (Math.floor(y) * w + Math.floor(x)) * 4;
      const lum = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
      if (lum > 195) continue;
      const r = Math.max(0.4, (1 - lum / 255) * step * 0.52 * (halftone / 100));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
function paintPanelInto(img, pw, ph, panel, opts) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, pw); c.height = Math.max(2, ph);
  const x = c.getContext('2d');
  const crop = coverCrop(img, pw, ph, panel.zoom, panel.panX, panel.panY);
  x.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, pw, ph);
  const id = x.getImageData(0, 0, pw, ph);
  const levels = Math.max(2, Math.round(12 - opts.painterly * 0.09));
  posterizePixels(id.data, levels);
  if (opts.ink > 0) inkContourPixels(id.data, pw, ph, opts.ink);
  x.putImageData(id, 0, 0);
  if (opts.halftone > 0) halftoneDots(x, id, pw, ph, opts.halftone, opts.faceRect || null);
  /* grade wash: sunset / neon tint unifies the panels */
  const g = x.createLinearGradient(0, 0, 0, ph);
  g.addColorStop(0, opts.grade.high);
  g.addColorStop(0.55, opts.grade.mid);
  g.addColorStop(1, opts.grade.shadow);
  x.globalCompositeOperation = 'soft-light';
  x.fillStyle = g;
  x.fillRect(0, 0, pw, ph);
  x.globalCompositeOperation = 'source-over';
  /* face-safe: re-render the face box milder (finer posterize, light ink, no
     halftone) and feather its edge so no hard rectangle shows */
  if (opts.faceRect && opts.faceSafe) {
    const fr = opts.faceRect;
    const mild = paintPanelInto(img, pw, ph, panel, { painterly: 45, ink: 25, halftone: 0, faceSafe: false, faceRect: null, grade: opts.grade });
    x.save();
    x.filter = 'blur(6px)';
    x.globalAlpha = 0.6;
    roundRectPath(x, fr.x - 4, fr.y - 4, fr.w + 8, fr.h + 8, 14);
    x.clip();
    x.drawImage(mild, fr.x - 4, fr.y - 4, fr.w + 8, fr.h + 8, fr.x - 4, fr.y - 4, fr.w + 8, fr.h + 8);
    x.restore();
    x.save();
    roundRectPath(x, fr.x, fr.y, fr.w, fr.h, 10);
    x.clip();
    x.drawImage(mild, fr.x, fr.y, fr.w, fr.h, fr.x, fr.y, fr.w, fr.h);
    x.restore();
  }
  return c;
}
function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/* ---------- cover rendering ---------- */
function drawStoryLabel(ctx, rect, place, sub, W) {
  const pad = Math.max(6, W * 0.008);
  let fs = Math.max(11, Math.round(W * 0.015));
  ctx.font = fs + 'px ViceSans, Arial, sans-serif';
  const small = Math.round(fs * 0.72);
  const showSub = rect.w > W * 0.20 && sub;
  if (showSub) {
    while (ctx.measureText(place).width > rect.w - pad * 2 - 10 && fs > 10) { fs -= 1; ctx.font = fs + 'px ViceSans, Arial, sans-serif'; }
  }
  ctx.font = fs + 'px ViceSans, Arial, sans-serif';
  const tw = Math.max(ctx.measureText(place).width, showSub ? ctx.measureText(sub).width : 0);
  const bw = Math.min(rect.w - 4, tw + pad * 2);
  const bh = showSub ? fs + small + pad * 1.6 : fs + pad * 1.2;
  const bx = rect.x + 6, by = rect.y + rect.h - bh - 6;
  ctx.save();
  ctx.fillStyle = 'rgba(10,4,20,0.88)';
  roundRectPath(ctx, bx, by, bw, bh, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';
  ctx.fillText(place, bx + pad, by + pad * 0.7);
  if (showSub) {
    ctx.font = small + 'px ViceSans, Arial, sans-serif';
    ctx.fillStyle = '#ffd9a0';
    ctx.fillText(sub, bx + pad, by + pad * 0.7 + fs + 2);
  }
  ctx.restore();
}
function drawWantedBadge(ctx, W, H, stars) {
  const fs = Math.max(12, Math.round(H * 0.024));
  ctx.save();
  ctx.font = fs + 'px ViceSans, Arial, sans-serif';
  const label = 'WANTED ';
  const starTxt = '★'.repeat(stars) + '☆'.repeat(5 - stars);
  const w = ctx.measureText(label).width + ctx.measureText(starTxt).width + 22;
  const h = fs + 12;
  const x = W - w - W * 0.015, y = H * 0.015;
  ctx.fillStyle = 'rgba(10,4,20,0.92)';
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd23e'; ctx.lineWidth = 2; roundRectPath(ctx, x, y, w, h, h / 2); ctx.stroke();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, x + 11, y + h / 2 + 1);
  ctx.fillStyle = '#ffd23e';
  ctx.fillText(starTxt, x + 11 + ctx.measureText(label).width, y + h / 2 + 1);
  ctx.restore();
}
function drawVolSticker(ctx, W, H, text) {
  const fs = Math.max(12, Math.round(H * 0.026));
  ctx.save();
  ctx.font = fs + 'px ViceSans, Arial, sans-serif';
  const w = ctx.measureText(text).width + 18, h = fs + 10;
  ctx.translate(W * 0.02 + w / 2, H * 0.025 + h / 2);
  ctx.rotate(-0.1);
  ctx.fillStyle = '#ffd23e';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = '#14082a'; ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = '#14082a';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);
  ctx.restore();
}
function drawEstSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.82;
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd23e';
  ctx.fill();
  ctx.strokeStyle = '#14082a'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#14082a';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold ' + Math.round(r * 0.34) + 'px ViceSans, Arial, sans-serif';
  ctx.fillText('EST.', 0, -r * 0.16);
  ctx.fillText('2026', 0, r * 0.22);
  ctx.restore();
}
function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.07); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.5, x + s * 0.16, y - s * 0.85); ctx.stroke();
  const tx = x + s * 0.16, ty = y - s * 0.85;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + i * s * 0.24, ty - s * 0.18, tx + i * s * 0.46, ty + s * 0.28 + Math.abs(i) * s * 0.05);
    ctx.stroke();
  }
  ctx.restore();
}
function drawTitleLockup(ctx, W, H) {
  const bandTop = TITLE_TOP * H, bandH = (TITLE_BOTTOM - TITLE_TOP) * H;
  const g0 = ctx.createLinearGradient(0, bandTop, 0, bandTop + bandH);
  g0.addColorStop(0, '#241239'); g0.addColorStop(1, '#12081f');
  ctx.fillStyle = g0;
  ctx.fillRect(0, bandTop, W, bandH);
  ctx.fillStyle = '#ffd23e';
  ctx.fillRect(0, bandTop, W, 3);
  /* stars + quote bar, top of the band — never over a face */
  const qfs = Math.max(11, Math.round(H * 0.02));
  ctx.font = qfs + 'px ViceSans, Arial, sans-serif';
  const qText = '★★★★★  ' + state.quote;
  const qw = ctx.measureText(qText).width + 22;
  const qy = bandTop + bandH * 0.05;
  ctx.fillStyle = 'rgba(8,3,16,0.9)';
  roundRectPath(ctx, W * 0.04, qy, qw, qfs + 10, 4);
  ctx.fill();
  ctx.fillStyle = '#ffd23e';
  ctx.textBaseline = 'middle';
  ctx.fillText('★★★★★', W * 0.04 + 11, qy + (qfs + 10) / 2 + 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(state.quote, W * 0.04 + 11 + ctx.measureText('★★★★★  ').width, qy + (qfs + 10) / 2 + 1);
  /* main title: cream -> orange -> pink, thick outline, big shadow */
  let size = Math.round(bandH * 0.58);
  ctx.font = size + 'px ViceCond, Arial, sans-serif';
  const maxW = W * 0.94;
  while (ctx.measureText(state.title).width > maxW && size > 24) {
    size -= 4;
    ctx.font = size + 'px ViceCond, Arial, sans-serif';
  }
  const titleY = bandTop + bandH * 0.62;
  const grad = ctx.createLinearGradient(0, titleY - size, 0, titleY + size * 0.12);
  grad.addColorStop(0, '#fff6d8');
  grad.addColorStop(0.45, '#ffb347');
  grad.addColorStop(1, '#ff5e8a');
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(20,4,40,0.85)'; ctx.shadowBlur = size * 0.06; ctx.shadowOffsetY = size * 0.05;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14082a'; ctx.lineWidth = Math.max(4, size / 14);
  ctx.strokeText(state.title, W / 2, titleY);
  ctx.fillStyle = grad;
  ctx.fillText(state.title, W / 2, titleY);
  ctx.restore();
  /* pink neon script tucked under the title, inside the band */
  const sfs = Math.round(size * 0.44);
  ctx.save();
  ctx.font = sfs + 'px ViceScript, cursive';
  ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = sfs * 0.35;
  ctx.fillStyle = '#ff8fd0';
  ctx.fillText(state.subtitle, W * 0.97, bandTop + bandH - bandH * 0.06);
  ctx.restore();
}
function drawTaglineStrip(ctx, W, H) {
  const y0 = STRIP_TOP * H, h = (STRIP_BOTTOM - STRIP_TOP) * H;
  const g = ctx.createLinearGradient(0, y0, W, y0);
  g.addColorStop(0, '#ff2e88'); g.addColorStop(0.5, '#ff7a2f'); g.addColorStop(1, '#ff2e88');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, h);
  const fs = Math.max(12, Math.round(h * 0.42));
  ctx.font = fs + 'px ViceSans, Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = '4px'; } catch (e) {}
  ctx.fillStyle = '#ffffff';
  ctx.fillText(state.tagline, W / 2, y0 + h / 2 + 1);
  try { ctx.letterSpacing = '0px'; } catch (e) {}
  drawPalm(ctx, W * 0.03, y0 + h - 2, h * 0.9, 'rgba(20,8,42,0.85)');
  drawPalm(ctx, W * 0.97 - h * 0.5, y0 + h - 2, h * 0.9, 'rgba(20,8,42,0.85)');
}
function drawFooterBar(ctx, W, H) {
  const y0 = FOOTER_TOP * H, h = H - y0;
  ctx.fillStyle = '#06030c';
  ctx.fillRect(0, y0, W, h);
  const txt = 'VH   VICE HEAT — A VICE HEAT COVER STUDIO PICTURE — STARRING YOU — SHOT ON YOUR OWN CAMERA — GRADED BY HAND — LETTERING AND SEAL ORIGINAL — CAT. VH-0626';
  let fs = Math.max(8, Math.round(h * 0.34));
  ctx.font = fs + 'px ViceSans, Arial, sans-serif';
  while (ctx.measureText(txt).width > W * 0.92 && fs > 7) {
    fs -= 1;
    ctx.font = fs + 'px ViceSans, Arial, sans-serif';
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#9c7cc4';
  ctx.fillText(txt, W * 0.012, y0 + h / 2 + 1);
  /* barcode, right */
  const bars = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2];
  let bx = W * 0.94;
  const bw = Math.max(1, Math.round(W * 0.0016));
  ctx.fillStyle = '#ffffff';
  for (const b of bars) { ctx.fillRect(bx, y0 + h * 0.18, b * bw, h * 0.64); bx += (b + 1) * bw; }
}
function renderCover(canvas, W, H) {
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = gradeDef();
  const ph = H * (PHOTO_BOTTOM - PHOTO_TOP);
  ctx.fillStyle = '#f7ead0';
  ctx.fillRect(0, 0, W, ph);
  ctx.fillStyle = '#1a0b2e';
  ctx.fillRect(0, ph, W, H - ph);
  const gap = Math.max(2, Math.round(W * 0.003));
  const defs = layoutPanels();
  lastPanelRects = [];
  defs.forEach((def, i) => {
    const panel = state.panels[i];
    if (!panel) return;
    const photo = state.photos[panel.photo];
    if (!photo) return;
    const isPoly = Array.isArray(def[0]);
    let bx, by, bw, bh;
    if (isPoly) {
      const xs = def.map((p) => p[0]), ys = def.map((p) => p[1]);
      const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
      const y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      bx = x0 * W; by = y0 * ph; bw = (x1 - x0) * W; bh = (y1 - y0) * ph;
    } else {
      bx = def[0] * W; by = def[1] * ph; bw = def[2] * W; bh = def[3] * ph;
    }
    const rx = bx + gap / 2, ry = by + gap / 2, rw = bw - gap, rh = bh - gap;
    lastPanelRects.push({ x: rx, y: ry, w: rw, h: rh, poly: isPoly ? def : null, photoH: ph });
    const pw = Math.max(2, Math.round(rw)), pht = Math.max(2, Math.round(rh));
    const faceRect = (state.faceSafe && state.face.panel === i)
      ? { x: state.face.x * pw, y: state.face.y * pht, w: state.face.w * pw, h: state.face.h * pht }
      : null;
    const painted = paintPanelInto(photo.img, pw, pht, panel, {
      painterly: state.painterly, ink: state.ink, halftone: state.halftone,
      faceSafe: state.faceSafe, faceRect, grade,
    });
    ctx.save();
    if (isPoly) {
      ctx.beginPath();
      def.forEach((p, k) => { const px = p[0] * W, py = p[1] * ph; if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
      ctx.closePath();
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
    }
    ctx.filter = 'saturate(' + grade.sat + ') contrast(' + grade.con + ')';
    ctx.drawImage(painted, rx, ry, rw, rh);
    ctx.filter = 'none';
    ctx.restore();
    if (isPoly) {
      ctx.save();
      ctx.beginPath();
      def.forEach((p, k) => { const px = p[0] * W, py = p[1] * ph; if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
      ctx.closePath();
      ctx.strokeStyle = '#f7ead0'; ctx.lineWidth = gap;
      ctx.stroke();
      ctx.restore();
    }
    drawStoryLabel(ctx, { x: rx, y: ry, w: rw, h: rh }, panel.place, panel.sub, W);
  });
  if (state.wanted) drawWantedBadge(ctx, W, H, state.stars);
  drawVolSticker(ctx, W, H, state.vol);
  drawTitleLockup(ctx, W, H);
  /* EST seal: left end of the title band, drawn last so it is never half-cut */
  if (state.seal) drawEstSeal(ctx, W * 0.035, TITLE_TOP * H + (TITLE_BOTTOM - TITLE_TOP) * H * 0.55, Math.max(18, H * 0.042));
  drawTaglineStrip(ctx, W, H);
  drawFooterBar(ctx, W, H);
}
let lastPanelRects = [];
let renderTimer = null;
function schedulePreview() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderPreview, 120);
}
function renderPreview() {
  const dims = SIZES[state.size];
  const scale = state.size === '1920x1080' ? 960 / 1920 : state.size === '1080x1350' ? 640 / 1080 : 720 / 1080;
  const w = Math.round(dims[0] * scale), h = Math.round(dims[1] * scale);
  renderCover(preview, w, h);
  /* face box overlay on the preview only */
  if (state.faceSafe && lastPanelRects[state.face.panel]) {
    const r = lastPanelRects[state.face.panel];
    const fx = r.x + state.face.x * r.w, fy = r.y + state.face.y * r.h;
    const fw = state.face.w * r.w, fh = state.face.h * r.h;
    pctx.save();
    pctx.strokeStyle = '#22d3ee'; pctx.lineWidth = 2;
    pctx.setLineDash([6, 4]);
    pctx.strokeRect(fx, fy, fw, fh);
    pctx.setLineDash([]);
    pctx.fillStyle = '#22d3ee';
    pctx.font = 'bold 11px ViceSans, Arial, sans-serif';
    pctx.fillText('FACE', fx + 4, fy + 14);
    pctx.restore();
  }
  $('panelLabel').textContent = (state.selectedPanel + 1) + ' OF ' + panelCount();
}

/* ---------- editor wiring ---------- */
function buildPhotoGrid() {
  const grid = $('photoGrid');
  grid.innerHTML = '';
  state.photos.forEach((p, i) => {
    const img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    img.title = p.name;
    const sel = state.panels[state.selectedPanel];
    if (sel && sel.photo === i) img.classList.add('sel');
    img.addEventListener('click', () => {
      const panel = state.panels[state.selectedPanel];
      if (!panel) return;
      panel.photo = i;
      const lab = PHOTO_LABELS[i] || ['VICE CITY', 'JUST NOW — STARRING YOU'];
      panel.place = lab[0]; panel.sub = lab[1];
      syncStoryInputs();
      buildPhotoGrid();
      renderPreview();
    });
    grid.appendChild(img);
  });
  $('photoCount').textContent = state.photos.length + ' LOADED';
}
function buildPanelButtons() {
  const wrap = $('panelButtons');
  wrap.innerHTML = '';
  for (let i = 0; i < panelCount(); i++) {
    const b = document.createElement('button');
    b.textContent = i + 1;
    if (i === state.selectedPanel) b.classList.add('sel');
    b.addEventListener('click', () => { state.selectedPanel = i; syncStoryInputs(); buildPanelButtons(); buildPhotoGrid(); renderPreview(); });
    wrap.appendChild(b);
  }
}
function buildLayoutButtons() {
  const wrap = $('layoutBtns');
  wrap.innerHTML = '';
  Object.keys(LAYOUTS).forEach((key) => {
    const b = document.createElement('button');
    b.textContent = LAYOUTS[key].name;
    b.dataset.layout = key;
    if (key === state.layout) b.classList.add('sel');
    b.addEventListener('click', () => { setLayout(key); });
    wrap.appendChild(b);
  });
}
function buildGradeButtons() {
  const wrap = $('gradeBtns');
  wrap.innerHTML = '';
  Object.keys(GRADES).forEach((key) => {
    const b = document.createElement('button');
    const sw = document.createElement('span');
    sw.className = 'sw';
    sw.style.background = GRADES[key].sw;
    b.appendChild(sw);
    b.appendChild(document.createTextNode(GRADES[key].name));
    b.dataset.grade = key;
    if (key === state.grade) b.classList.add('sel');
    b.addEventListener('click', () => { setGrade(key); });
    wrap.appendChild(b);
  });
}
function setLayout(key) {
  if (!LAYOUTS[key]) return;
  state.layout = key;
  resetPanels();
  buildLayoutButtons();
  buildPanelButtons();
  buildPhotoGrid();
  syncStoryInputs();
  renderPreview();
}
function setGrade(key) {
  if (!GRADES[key]) return;
  state.grade = key;
  const g = GRADES[key];
  state.painterly = g.paint; state.ink = g.ink; state.halftone = g.half;
  syncSliderInputs();
  buildGradeButtons();
  renderPreview();
}
function setSize(key) {
  if (!SIZES[key]) return;
  state.size = key;
  document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('active', b.dataset.size === key));
  $('exportPng').textContent = 'EXPORT PNG ' + key.replace('x', ' × ');
  renderPreview();
}
function syncSliderInputs() {
  $('painterlyRange').value = state.painterly; $('painterlyVal').textContent = state.painterly;
  $('inkRange').value = state.ink; $('inkVal').textContent = state.ink;
  $('halftoneRange').value = state.halftone; $('halftoneVal').textContent = state.halftone;
  $('skinRange').value = state.skin; $('skinVal').textContent = state.skin;
}
function syncStoryInputs() {
  const panel = state.panels[state.selectedPanel];
  if (!panel) return;
  $('placeInput').value = panel.place;
  $('subInput').value = panel.sub;
  $('zoomRange').value = panel.zoom;
  $('zoomVal').textContent = panel.zoom.toFixed(2).replace(/0$/, '') + '×';
}
function bindSlider(id, valId, key) {
  $(id).addEventListener('input', () => {
    state[key] = Number($(id).value);
    $(valId).textContent = $(id).value;
    schedulePreview();
  });
}
function wireEditor() {
  buildLayoutButtons();
  buildGradeButtons();
  syncSliderInputs();
  bindSlider('painterlyRange', 'painterlyVal', 'painterly');
  bindSlider('inkRange', 'inkVal', 'ink');
  bindSlider('halftoneRange', 'halftoneVal', 'halftone');
  bindSlider('skinRange', 'skinVal', 'skin');
  document.querySelectorAll('.size-btn').forEach((b) => b.addEventListener('click', () => setSize(b.dataset.size)));
  $('addPhotos').addEventListener('click', () => $('photoInput').click());
  $('addPhotosTop').addEventListener('click', () => $('photoInput').click());
  $('photoInput').addEventListener('change', (ev) => { addUploads(ev.target.files, false); ev.target.value = ''; });
  $('zoomRange').addEventListener('input', () => {
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    panel.zoom = Number($('zoomRange').value);
    $('zoomVal').textContent = panel.zoom.toFixed(2).replace(/0$/, '') + '×';
    schedulePreview();
  });
  $('autoCrop').addEventListener('click', () => {
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    panel.zoom = 1; panel.panX = 0.5; panel.panY = 0.5;
    syncStoryInputs();
    renderPreview();
  });
  $('replacePhoto').addEventListener('click', () => $('photoInput').click());
  $('fillAll').addEventListener('click', () => {
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    state.panels.forEach((p) => { p.photo = panel.photo; });
    renderPreview();
  });
  $('spreadAll').addEventListener('click', () => {
    state.panels.forEach((p, i) => { p.photo = i % Math.max(1, state.photos.length); });
    renderPreview();
  });
  $('faceSafeChk').addEventListener('change', () => { state.faceSafe = $('faceSafeChk').checked; renderPreview(); });
  $('wantedChk').addEventListener('change', () => { state.wanted = $('wantedChk').checked; renderPreview(); });
  $('starsRange').addEventListener('input', () => { state.stars = Number($('starsRange').value); $('starsVal').textContent = state.stars; schedulePreview(); });
  $('volInput').addEventListener('input', () => { state.vol = $('volInput').value; schedulePreview(); });
  $('estChk').addEventListener('change', () => { state.seal = $('estChk').checked; renderPreview(); });
  $('placeInput').addEventListener('input', () => {
    const panel = state.panels[state.selectedPanel];
    if (panel) { panel.place = $('placeInput').value; schedulePreview(); }
  });
  $('subInput').addEventListener('input', () => {
    const panel = state.panels[state.selectedPanel];
    if (panel) { panel.sub = $('subInput').value; schedulePreview(); }
  });
  $('titleInput').addEventListener('input', () => { state.title = $('titleInput').value.toUpperCase(); schedulePreview(); });
  $('subtitleInput').addEventListener('input', () => { state.subtitle = $('subtitleInput').value; schedulePreview(); });
  $('taglineInput').addEventListener('input', () => { state.tagline = $('taglineInput').value.toUpperCase(); schedulePreview(); });
  $('quoteInput').addEventListener('input', () => { state.quote = $('quoteInput').value.toUpperCase(); schedulePreview(); });
  $('exportPng').addEventListener('click', () => { exportCoverPng(state.size); });
  $('exportAll').addEventListener('click', exportAllSizes);
  $('exportAllTop').addEventListener('click', exportAllSizes);
  $('surpriseBtn').addEventListener('click', surpriseMe);
  wirePreviewPointer();
}
function addUploads(files, replace) {
  const list = Array.from(files || []);
  if (!list.length) return;
  let done = 0;
  list.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.photos.push({ img, name: file.name, label: ['YOUR SHOT', 'JUST NOW — STARRING YOU'] });
        done += 1;
        if (done === list.length) { buildPhotoGrid(); renderPreview(); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function surpriseMe() {
  const layouts = Object.keys(LAYOUTS);
  const grades = Object.keys(GRADES);
  const pick = SURPRISE_TITLES[Math.floor(Math.random() * SURPRISE_TITLES.length)];
  state.title = pick[0]; state.subtitle = pick[1]; state.tagline = pick[2];
  $('titleInput').value = pick[0];
  $('subtitleInput').value = pick[1];
  $('taglineInput').value = pick[2];
  setLayout(layouts[Math.floor(Math.random() * layouts.length)]);
  setGrade(grades[Math.floor(Math.random() * grades.length)]);
  state.panels.forEach((p, i) => { p.photo = Math.floor(Math.random() * Math.max(1, state.photos.length)); });
  renderPreview();
}

/* ---------- preview pointer: select, pan, zoom, move the face box ---------- */
function previewPoint(ev) {
  const rect = preview.getBoundingClientRect();
  return {
    x: (ev.clientX - rect.left) * (preview.width / rect.width),
    y: (ev.clientY - rect.top) * (preview.height / rect.height),
  };
}
function faceBoxOnPreview() {
  const r = lastPanelRects[state.face.panel];
  if (!r) return null;
  return { x: r.x + state.face.x * r.w, y: r.y + state.face.y * r.h, w: state.face.w * r.w, h: state.face.h * r.h };
}
function wirePreviewPointer() {
  let drag = null;
  preview.addEventListener('pointerdown', (ev) => {
    const pt = previewPoint(ev);
    const fb = state.faceSafe ? faceBoxOnPreview() : null;
    if (fb && pt.x >= fb.x && pt.x <= fb.x + fb.w && pt.y >= fb.y && pt.y <= fb.y + fb.h) {
      drag = { kind: 'face', dx: pt.x - fb.x, dy: pt.y - fb.y };
      preview.setPointerCapture(ev.pointerId);
      return;
    }
    const idx = lastPanelRects.findIndex((r) => pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h);
    if (idx >= 0) {
      state.selectedPanel = idx;
      syncStoryInputs();
      buildPanelButtons();
      buildPhotoGrid();
      renderPreview();
      drag = { kind: 'pan', x: pt.x, y: pt.y };
      preview.setPointerCapture(ev.pointerId);
    }
  });
  preview.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const pt = previewPoint(ev);
    if (drag.kind === 'face') {
      const r = lastPanelRects[state.face.panel];
      if (!r) return;
      state.face.x = Math.min(Math.max(0, (pt.x - drag.dx - r.x) / r.w), 1 - state.face.w);
      state.face.y = Math.min(Math.max(0, (pt.y - drag.dy - r.y) / r.h), 1 - state.face.h);
      schedulePreview();
    } else if (drag.kind === 'pan') {
      const panel = state.panels[state.selectedPanel];
      const r = lastPanelRects[state.selectedPanel];
      if (!panel || !r) return;
      const photo = state.photos[panel.photo];
      if (!photo) return;
      const crop = coverCrop(photo.img, r.w, r.h, panel.zoom, panel.panX, panel.panY);
      const dx = (pt.x - drag.x) / r.w * (crop.sw / photo.img.naturalWidth);
      const dy = (pt.y - drag.y) / r.h * (crop.sh / photo.img.naturalHeight);
      panel.panX = Math.min(Math.max(0, panel.panX - dx), 1);
      panel.panY = Math.min(Math.max(0, panel.panY - dy), 1);
      drag.x = pt.x; drag.y = pt.y;
      schedulePreview();
    }
  });
  preview.addEventListener('pointerup', () => { drag = null; });
  preview.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    panel.zoom = Math.min(3, Math.max(1, panel.zoom * (ev.deltaY < 0 ? 1.1 : 0.9)));
    syncStoryInputs();
    schedulePreview();
  }, { passive: false });
  preview.addEventListener('dblclick', () => {
    const panel = state.panels[state.selectedPanel];
    if (!panel) return;
    panel.zoom = 1; panel.panX = 0.5; panel.panY = 0.5;
    syncStoryInputs();
    renderPreview();
  });
}

/* ---------- export ---------- */
function renderExportCanvas(sizeKey) {
  const dims = SIZES[sizeKey];
  const c = document.createElement('canvas');
  renderCover(c, dims[0], dims[1]);
  return c;
}
function downloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      $('savedMsg').textContent = 'SAVED ' + filename.toUpperCase();
      resolve({ width: canvas.width, height: canvas.height, bytes: blob ? blob.size : 0, filename });
    }, 'image/png');
  });
}
function exportCoverPng(sizeKey) {
  const c = renderExportCanvas(sizeKey);
  return downloadCanvas(c, 'vice-heat-' + sizeKey + '.png');
}
async function exportAllSizes() {
  for (const key of Object.keys(SIZES)) {
    await exportCoverPng(key);
    await new Promise((r) => setTimeout(r, 250));
  }
}

/* ---------- boot ---------- */
window.__vhApi = {
  state,
  setLayout, setGrade, setSize,
  renderCover, renderPreview,
  exportPng: exportCoverPng,
  exportAll: exportAllSizes,
  ready: false,
};
function applyQueryParams() {
  const q = new URLSearchParams(window.location.search);
  if (q.get('layout') && LAYOUTS[q.get('layout')]) state.layout = q.get('layout');
  if (q.get('grade') && GRADES[q.get('grade')]) state.grade = q.get('grade');
  if (q.get('size') && SIZES[q.get('size')]) state.size = q.get('size');
  const g = GRADES[state.grade];
  state.painterly = g.paint; state.ink = g.ink; state.halftone = g.half;
  return q;
}
const __query = applyQueryParams();
wireEditor();
setSize(state.size);
Promise.all([
  document.fonts.load('100px ViceCond'),
  document.fonts.load('100px ViceDisplay'),
  document.fonts.load('100px ViceScript'),
  document.fonts.load('bold 20px ViceSans'),
  document.fonts.ready,
]).catch(() => {}).finally(() => {
  loadSamplePhotos().then(() => {
    window.__vhApi.ready = true;
    document.title = 'VICE HEAT Cover Studio — ready';
    if (__query.get('export') === '1') {
      setTimeout(() => {
        exportCoverPng(state.size).then(() => { document.title = 'EXPORTED'; });
      }, 400);
    }
  });
});
