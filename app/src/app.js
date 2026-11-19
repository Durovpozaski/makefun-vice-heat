// VICE HEAT Cover Studio v3 — full-bleed top-1 composition.
// Photos run edge-to-edge, a huge title overlaps the LOWER photos, faces sit high,
// the script tucks under the title's tail, and the default grade is clean warm photography.
(function () {
'use strict';

var $ = function (s) { return document.querySelector(s); };
var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

var SIZES = { '1920x1080': [1920, 1080], '1080x1350': [1080, 1350], '1080x1080': [1080, 1080] };
var STRIP_H = 0.10; // bottom strip + footer take the lowest 10% of the canvas
var TITLE_TOP = 0.58, TITLE_BOT = 0.88; // title zone, fraction of full canvas height

// The 8 demo photos (generated, free to use) with their GTA story labels.
var SAMPLE_DEFS = [
  { file: 'samples/photo1.jpg', place: 'OCEAN DRIVE', sub: '6:42 PM \u2014 LOOKING FOR TROUBLE' },
  { file: 'samples/photo2.jpg', place: 'PIER 26', sub: '5:30 AM \u2014 GONE FISHING' },
  { file: 'samples/photo3.jpg', place: 'PALM BOULEVARD', sub: '9:15 PM \u2014 LIGHTS OUT' },
  { file: 'samples/photo4.jpg', place: 'MARINA DEL SOL', sub: '7:40 PM \u2014 NO WITNESSES' },
  { file: 'samples/photo5.jpg', place: 'INTERSTATE 6', sub: '11:58 PM \u2014 FULL THROTTLE' },
  { file: 'samples/photo6.jpg', place: 'SUNSET HEIGHTS', sub: '8:30 PM \u2014 BIG MONEY' },
  { file: 'samples/photo7.jpg', place: 'VICE PETRO', sub: '2:12 AM \u2014 RUNNING ON EMPTY' },
  { file: 'samples/photo8.jpg', place: 'TOWER 2', sub: '6:10 PM \u2014 LAST SWIM' }
];

// Grades: warm = orange wash strength, sat/con = canvas filter, painterly/ink/halftone 0-100.
// Miami Sunset is the DEFAULT: clean warm photographic, like top 1's main cover.
var GRADES = {
  'Miami Sunset':    { warm: 0.55, sat: 1.12, con: 1.05, painterly: 10, ink: 15, halftone: 0,  sw: 'linear-gradient(90deg,#ffb347,#ff5e8a)' },
  'Neon Night':      { warm: 0.10, sat: 1.25, con: 1.10, painterly: 15, ink: 20, halftone: 0,  sw: 'linear-gradient(90deg,#7b5cff,#ff2e88)' },
  'Golden Hour':     { warm: 0.80, sat: 1.18, con: 1.06, painterly: 10, ink: 10, halftone: 0,  sw: 'linear-gradient(90deg,#ffd76a,#ff8c2e)' },
  'Duotone Pink/Teal': { warm: 0.25, sat: 1.30, con: 1.08, painterly: 20, ink: 25, halftone: 10, sw: 'linear-gradient(90deg,#ff6ec7,#37e0e6)' },
  'Comic Ink':       { warm: 0.35, sat: 1.35, con: 1.18, painterly: 70, ink: 55, halftone: 30, sw: 'linear-gradient(90deg,#ff5e8a,#7b2eff)' },
  'Natural':         { warm: 0.00, sat: 1.00, con: 1.00, painterly: 0,  ink: 0,  halftone: 0,  sw: 'linear-gradient(90deg,#cfd8dc,#90a4ae)' },
  'Palm Noir':       { warm: 0.20, sat: 0.90, con: 1.22, painterly: 25, ink: 35, halftone: 15, sw: 'linear-gradient(90deg,#3a3a4d,#0e0e1a)' }
};
var GRADE_NAMES = Object.keys(GRADES);

// Panel rects live in photo-zone space: x 0..1, y 0..1 (photo zone = canvas top to 1-STRIP_H).
// photo = index into state.photos. label = which sample's story label to show (null = none).
// poly = optional diagonal clip polygon (fractions of the panel rect).
function P(x, y, w, h, photo, label) { return { x: x, y: y, w: w, h: h, photo: photo, label: label }; }
var LAYOUTS = {
  'Hero': [
    P(0.000, 0, 0.555, 1.00, 0, 0),
    P(0.560, 0, 0.215, 0.30, 1, 1),
    P(0.780, 0, 0.220, 0.30, 5, 5),
    P(0.560, 0.305, 0.440, 0.315, 6, 6),
    P(0.560, 0.625, 0.215, 0.375, 2, 2),
    P(0.780, 0.625, 0.220, 0.375, 4, 4)
  ],
  'Comic': [
    P(0.000, 0, 0.450, 0.62, 1, 1),
    P(0.455, 0, 0.545, 0.30, 0, 0),
    P(0.455, 0.305, 0.545, 0.315, 6, 6),
    P(0.000, 0.625, 0.330, 0.375, 3, 3),
    P(0.335, 0.625, 0.330, 0.375, 5, 5),
    P(0.670, 0.625, 0.330, 0.375, 2, 2)
  ],
  '9 Panels': [
    P(0.000, 0, 0.330, 0.330, 0, 0), P(0.335, 0, 0.330, 0.330, 1, 1), P(0.670, 0, 0.330, 0.330, 2, 2),
    P(0.000, 0.335, 0.330, 0.330, 3, 3), P(0.335, 0.335, 0.330, 0.330, 4, 4), P(0.670, 0.335, 0.330, 0.330, 5, 5),
    P(0.000, 0.670, 0.330, 0.330, 6, 6), P(0.335, 0.670, 0.330, 0.330, 7, 7), P(0.670, 0.670, 0.330, 0.330, 3, 3)
  ],
  '1 Panel': [ P(0, 0, 1, 1, 0, 0) ],
  '2 Panels': [ P(0, 0, 0.4975, 1, 0, 0), P(0.5025, 0, 0.4975, 1, 1, 1) ],
  '3 Panels': [
    P(0.000, 0, 0.500, 1.00, 0, 0),
    P(0.505, 0, 0.495, 0.4975, 1, 1),
    P(0.505, 0.5025, 0.495, 0.4975, 6, 6)
  ],
  '4 Panels': [
    P(0.000, 0, 0.4975, 0.4975, 0, 0), P(0.5025, 0, 0.4975, 0.4975, 1, 1),
    P(0.000, 0.5025, 0.4975, 0.4975, 6, 6), P(0.5025, 0.5025, 0.4975, 0.4975, 4, 4)
  ],
  'Diagonal Split': [
    P(0.000, 0, 0.620, 0.62, 0, 0),
    P(0.380, 0, 0.620, 0.62, 1, 1),
    P(0.000, 0.625, 0.4975, 0.375, 3, 3),
    P(0.5025, 0.625, 0.4975, 0.375, 6, 6)
  ],
  'Hero + Strip': [
    P(0, 0, 1, 0.62, 0, 0),
    P(0.000, 0.625, 0.330, 0.375, 2, 2),
    P(0.335, 0.625, 0.330, 0.375, 6, 6),
    P(0.670, 0.625, 0.330, 0.375, 4, 4)
  ]
};
var LAYOUT_NAMES = Object.keys(LAYOUTS);

var state = {
  size: '1920x1080',
  layout: 'Hero',
  grade: 'Miami Sunset',
  title: 'VICE HEAT',
  subtitle: 'Leonida',
  tagline: 'WELCOME TO LEONIDA \u2014 SUMMER 2026',
  quote: 'PURE ADRENALINE IN EVERY FRAME',
  wanted: true, stars: 5, vol: 'VOL. 06', seal: true,
  painterly: 10, ink: 15, halftone: 0, skin: 70,
  faceSafe: true,
  photos: [],           // {img, name, place, sub}
  crops: {},            // panel index -> {zoom, fx, fy} face anchor in photo fractions
  selected: 0,
  labels: {}            // panel index -> {place, sub} overrides
};

function defaultCrop() { return { zoom: 1, fx: 0.5, fy: 0.30 }; }
function cropFor(i) { if (!state.crops[i]) state.crops[i] = defaultCrop(); return state.crops[i]; }
function labelFor(panel, i) {
  if (state.labels[i]) return state.labels[i];
  var s = state.photos[panel.photo];
  return s ? { place: s.place, sub: s.sub } : { place: '', sub: '' };
}

function loadImage(src) {
  return new Promise(function (res, rej) {
    var im = new Image();
    im.onload = function () { res(im); };
    im.onerror = function () { rej(new Error('load failed: ' + src)); };
    im.src = src;
  });
}

var fontsReady = Promise.all([
  document.fonts.load('900 100px ViceDisplay'),
  document.fonts.load('900 100px ViceCond'),
  document.fonts.load('700 40px ViceSans'),
  document.fonts.load('400 60px ViceScript')
]).catch(function () { /* fall back to system fonts */ });

// ---- grade pipeline: draw one photo into a panel-sized canvas, graded ----
function drawPhotoCover(g, img, pw, ph, crop) {
  // Cover-fit, anchored so the face point (crop.fx, crop.fy of the photo) lands at
  // panel position (0.5, 0.26): faces sit in the UPPER THIRD, clear of the title zone.
  var scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * crop.zoom;
  var dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  var fx = crop.fx * dw, fy = crop.fy * dh;
  var ox = pw * 0.5 - fx, oy = ph * 0.26 - fy;
  ox = Math.min(0, Math.max(pw - dw, ox));
  oy = Math.min(0, Math.max(ph - dh, oy));
  g.drawImage(img, ox, oy, dw, dh);
}

function posterize(g, pw, ph, amount) {
  if (amount <= 0) return;
  var levels = Math.max(3, Math.round(9 - amount / 14)); // 100 -> 3 levels, 10 -> 8
  var id = g.getImageData(0, 0, pw, ph), d = id.data, step = 255 / (levels - 1);
  for (var i = 0; i < d.length; i += 4) {
    d[i] = Math.round(d[i] / step) * step;
    d[i + 1] = Math.round(d[i + 1] / step) * step;
    d[i + 2] = Math.round(d[i + 2] / step) * step;
  }
  g.putImageData(id, 0, 0);
}

function inkContours(g, pw, ph, amount) {
  if (amount <= 0) return;
  var src = g.getImageData(0, 0, pw, ph), s = src.data;
  var out = g.createImageData(pw, ph), o = out.data;
  var lum = new Float32Array(pw * ph);
  for (var i = 0; i < pw * ph; i++) lum[i] = 0.299 * s[i * 4] + 0.587 * s[i * 4 + 1] + 0.114 * s[i * 4 + 2];
  var strength = amount / 100 * 1.6;
  for (var y = 0; y < ph; y++) {
    for (var x = 0; x < pw; x++) {
      var idx = y * pw + x;
      var gx = lum[idx + 1] - lum[idx - 1] || 0;
      var gy = lum[idx + pw] - lum[idx - pw] || 0;
      var e = Math.min(1, Math.sqrt(gx * gx + gy * gy) / 90 * strength);
      var k = 1 - e * 0.85;
      o[idx * 4] = s[idx * 4] * k; o[idx * 4 + 1] = s[idx * 4 + 1] * k;
      o[idx * 4 + 2] = s[idx * 4 + 2] * k; o[idx * 4 + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
}

function halftoneDots(g, pw, ph, amount) {
  if (amount <= 0) return;
  var gap = Math.max(5, Math.round(11 - amount / 12));
  var r = gap * 0.42;
  g.fillStyle = 'rgba(20,4,42,0.28)';
  for (var y = gap / 2; y < ph; y += gap) {
    for (var x = gap / 2; x < pw; x += gap) {
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  }
}

function faceMaskCanvas(pw, ph, crop) {
  // Feathered white rounded rect over the face area (upper third), black elsewhere.
  var m = document.createElement('canvas'); m.width = pw; m.height = ph;
  var mg = m.getContext('2d');
  mg.fillStyle = '#000'; mg.fillRect(0, 0, pw, ph);
  var fw = pw * 0.36, fh = ph * 0.30;
  var fx = pw * 0.5 - fw / 2, fy = ph * 0.26 - fh / 2;
  mg.filter = 'blur(' + Math.max(6, pw * 0.02) + 'px)';
  mg.fillStyle = '#fff';
  mg.beginPath();
  if (mg.roundRect) mg.roundRect(fx, fy, fw, fh, fh * 0.35); else mg.rect(fx, fy, fw, fh);
  mg.fill();
  mg.filter = 'none';
  return m;
}

function renderPanel(panel, i, pw, ph) {
  // Returns a canvas of the graded panel photo at pw x ph.
  var photo = state.photos[panel.photo];
  var c = document.createElement('canvas'); c.width = Math.max(2, pw); c.height = Math.max(2, ph);
  var g = c.getContext('2d');
  var grade = GRADES[state.grade];
  var painterly = state.painterly, ink = state.ink, halftone = state.halftone;
  if (!photo || !photo.img) { g.fillStyle = '#2a1248'; g.fillRect(0, 0, pw, ph); return c; }
  var crop = cropFor(i);
  // Clean copy (for the face-safe blend) and graded copy share the same crop.
  var clean = document.createElement('canvas'); clean.width = c.width; clean.height = c.height;
  var cg = clean.getContext('2d');
  drawPhotoCover(cg, photo.img, pw, ph, crop);
  g.drawImage(clean, 0, 0);
  // Warm wash + saturation/contrast.
  g.filter = 'saturate(' + grade.sat + ') contrast(' + grade.con + ')';
  g.drawImage(clean, 0, 0);
  g.filter = 'none';
  if (grade.warm > 0) { g.fillStyle = 'rgba(255,122,26,' + (grade.warm * 0.10) + ')'; g.fillRect(0, 0, pw, ph); }
  posterize(g, pw, ph, painterly);
  inkContours(g, pw, ph, ink);
  halftoneDots(g, pw, ph, halftone);
  // Face-safe: blend the clean photo back inside the face area, feathered.
  if (state.faceSafe && state.skin > 0 && (painterly > 0 || ink > 0 || halftone > 0)) {
    var mask = faceMaskCanvas(pw, ph, crop);
    var tmp = document.createElement('canvas'); tmp.width = pw; tmp.height = ph;
    var tg = tmp.getContext('2d');
    tg.drawImage(clean, 0, 0);
    tg.globalCompositeOperation = 'destination-in';
    tg.drawImage(mask, 0, 0);
    tg.globalCompositeOperation = 'source-over';
    g.globalAlpha = state.skin / 100;
    g.drawImage(tmp, 0, 0);
    g.globalAlpha = 1;
  }
  return c;
}

// ---- cover renderer: full-bleed collage, huge title over the LOWER photos ----
function fitFont(g, text, font, maxW, start) {
  var size = start;
  g.font = '900 ' + size + 'px ' + font;
  while (size > 10 && g.measureText(text).width > maxW) {
    size = Math.round(size * 0.94);
    g.font = '900 ' + size + 'px ' + font;
  }
  return size;
}

function drawPalm(g, x, y, h, flip) {
  // Small palm silhouette: trunk + 5 fronds. Only ever drawn at the far edges of the strip.
  g.save();
  g.translate(x, y); if (flip) g.scale(-1, 1);
  g.strokeStyle = '#14042a'; g.fillStyle = '#14042a'; g.lineWidth = Math.max(2, h * 0.06); g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(h * 0.08, -h * 0.55, h * 0.22, -h * 0.85); g.stroke();
  for (var a = 0; a < 5; a++) {
    var ang = -Math.PI * (0.08 + a * 0.19);
    var len = h * (0.42 - Math.abs(a - 2) * 0.05);
    g.beginPath(); g.moveTo(h * 0.22, -h * 0.85);
    g.quadraticCurveTo(h * 0.22 + Math.cos(ang) * len * 0.6, -h * 0.85 + Math.sin(ang) * len * 0.6,
      h * 0.22 + Math.cos(ang) * len, -h * 0.85 + Math.sin(ang) * len + h * 0.12);
    g.stroke();
  }
  g.restore();
}

function drawStarburst(g, cx, cy, r, lines) {
  g.save(); g.translate(cx, cy);
  g.beginPath();
  var spikes = 14;
  for (var i = 0; i < spikes * 2; i++) {
    var ang = i * Math.PI / spikes - Math.PI / 2;
    var rr = i % 2 === 0 ? r : r * 0.78;
    var x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
  g.fillStyle = '#fff3c4'; g.fill();
  g.lineWidth = Math.max(2, r * 0.07); g.strokeStyle = '#14042a'; g.stroke();
  g.fillStyle = '#14042a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  var fs = r * 0.20;
  g.font = '900 ' + Math.round(fs) + 'px ViceSans, sans-serif';
  g.fillText('\u2605 \u2605 \u2605', 0, -r * 0.34);
  g.font = '900 ' + Math.round(fs * 0.95) + 'px ViceSans, sans-serif';
  g.fillText(lines[0], 0, -r * 0.02);
  g.fillText(lines[1], 0, r * 0.30);
  g.restore();
}

function drawBarcode(g, x, y, w, h) {
  g.fillStyle = '#fff';
  var bx = x, seed = 7;
  while (bx < x + w) {
    seed = (seed * 16807) % 2147483647;
    var bw = 1 + (seed % 3) * (w / 90);
    if (seed % 3 !== 0) g.fillRect(bx, y, bw, h);
    bx += bw + w / 90;
  }
}

function renderCover(W, H) {
  var c = document.createElement('canvas'); c.width = W; c.height = H;
  var g = c.getContext('2d');
  var photoH = H * (1 - STRIP_H); // photo zone height
  var gutter = Math.max(2, Math.round(W * 0.003));
  var panels = LAYOUTS[state.layout];
  var titleTop = H * TITLE_TOP, titleBot = H * TITLE_BOT;
  var u = W / 1000; // scale unit for chrome sizes
  var qBarH = Math.max(12, Math.round(W * 0.015)) * 2.1 + 10 * u; // quote bar height + gap, reserved above the title
  var titleSizePre = fitFont(g, state.title, 'ViceCond, ViceDisplay, sans-serif', W * 0.96, Math.round(W * 0.155));
  titleSizePre = Math.min(titleSizePre, Math.round((titleBot - titleTop) * 1.15));
  var titleYPre = (titleTop + titleBot) / 2 + titleSizePre * 0.34;
  var glyphTop = titleYPre - titleSizePre * 0.8; // top of the title capitals: no label may cross it
  var qfsPre = Math.max(12, Math.round(W * 0.015));
  g.font = '900 ' + qfsPre + 'px ViceSans, sans-serif';
  var qwPre = g.measureText('\u2605\u2605\u2605\u2605\u2605  ' + state.quote).width + 22 * u;
  var qxPre = W * 0.03, qyPre = titleTop - qfsPre * 2.1, qhPre = qfsPre * 1.7; // stars+quote bar rect

  // 1. Photo collage, edge to edge.
  panels.forEach(function (panel, i) {
    var px = Math.round(panel.x * W), py = Math.round(panel.y * photoH);
    var pw = Math.round(panel.w * W), ph = Math.round(panel.h * photoH);
    if (panel.x > 0) { px += gutter; pw -= gutter; }
    if (panel.y > 0) { py += gutter; ph -= gutter; }
    var pc = renderPanel(panel, i, pw, ph);
    g.save();
    if (state.layout === 'Diagonal Split' && i < 2) {
      // Diagonal seam: left panel's right edge slants, right panel's left edge slants.
      g.beginPath();
      if (i === 0) { g.moveTo(px, py); g.lineTo(px + pw, py); g.lineTo(px + pw - pw * 0.22, py + ph); g.lineTo(px, py + ph); }
      else { g.moveTo(px + pw * 0.22, py); g.lineTo(px + pw, py); g.lineTo(px + pw, py + ph); g.lineTo(px, py + ph); }
      g.closePath(); g.clip();
    }
    g.drawImage(pc, px, py);
    g.restore();
    // Thin white gutter lines are the gaps left between panels; outer frame below.
    // 2. Story label chip: only where it fits entirely above the title glyphs.
    // A panel whose bottom sits inside the title zone gets no label at its bottom
    // (like top 1's bottom panels) — a label half-hidden behind the title reads
    // worse than none. Try panel bottom, then just above the title zone, then panel top.
    var lab = labelFor(panel, i);
    if (lab.place) {
      var fs1 = Math.max(11, Math.round(W * 0.016)), fs2 = Math.max(9, Math.round(W * 0.011));
      g.font = '900 ' + fs1 + 'px ViceSans, sans-serif';
      var w1 = g.measureText(lab.place).width;
      g.font = '700 ' + fs2 + 'px ViceSans, sans-serif';
      var w2 = g.measureText(lab.sub).width;
      var chipW = Math.max(w1, w2) + 18 * u, chipH = fs1 + fs2 + 16 * u;
      var lx = px + 8 * u;
      var lyA = py + ph - chipH - 6 * u;
      var lyB = titleTop - chipH - 8 * u - qBarH;
      var lyC = py + 6 * u;
      var cands = [];
      if (lyA + chipH <= glyphTop - 6 * u) cands.push(lyA);
      if (lyB >= py + 4 * u && lyB + chipH <= glyphTop - 6 * u) cands.push(lyB);
      if (lyC + chipH <= glyphTop - 6 * u) cands.push(lyC);
      var ly = -1;
      for (var ci = 0; ci < cands.length; ci++) {
        var cy = cands[ci];
        var overQuote = lx < qxPre + qwPre && lx + chipW > qxPre && cy < qyPre + qhPre && cy + chipH > qyPre;
        if (!overQuote) { ly = cy; break; }
      }
      if (ly >= 0) {
        g.fillStyle = 'rgba(8,2,20,0.82)';
        g.beginPath();
        if (g.roundRect) g.roundRect(lx, ly, chipW, chipH, 4 * u); else g.rect(lx, ly, chipW, chipH);
        g.fill();
        g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
        g.font = '900 ' + fs1 + 'px ViceSans, sans-serif';
        g.fillText(lab.place, lx + 9 * u, ly + fs1 + 5 * u);
        g.fillStyle = '#ffd76a';
        g.font = '700 ' + fs2 + 'px ViceSans, sans-serif';
        g.fillText(lab.sub, lx + 9 * u, ly + fs1 + fs2 + 10 * u);
      }
    }
  });

  // Outer frame.
  g.strokeStyle = '#0d0218'; g.lineWidth = Math.max(3, W * 0.006);
  g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, photoH - g.lineWidth / 2);

  // 3. Stickers ON the photos: VOL top-left, WANTED top-right, EST seal mid-left.
  var fsStick = Math.max(12, Math.round(W * 0.016));
  g.save();
  g.translate(W * 0.035, photoH * 0.045); g.rotate(-0.06);
  g.fillStyle = '#ffd21f'; g.fillRect(-W * 0.045, -fsStick * 0.85, W * 0.09, fsStick * 1.7);
  g.fillStyle = '#14042a'; g.font = '900 ' + fsStick + 'px ViceSans, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(state.vol, 0, 0);
  g.restore();
  if (state.wanted) {
    var stars = '\u2605'.repeat(state.stars);
    g.font = '900 ' + fsStick + 'px ViceSans, sans-serif';
    var wtxt = g.measureText('WANTED ' + stars).width;
    var bx = W - wtxt - 26 * u, by = photoH * 0.018;
    g.fillStyle = 'rgba(8,2,20,0.85)';
    g.beginPath();
    if (g.roundRect) g.roundRect(bx, by, wtxt + 20 * u, fsStick * 1.8, fsStick * 0.9); else g.rect(bx, by, wtxt + 20 * u, fsStick * 1.8);
    g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('WANTED ', bx + 10 * u, by + fsStick * 0.9);
    var wx = bx + 10 * u + g.measureText('WANTED ').width;
    g.fillStyle = '#ffd21f'; g.fillText(stars, wx, by + fsStick * 0.9);
  }
  if (state.seal) {
    var sr = Math.max(16, W * 0.026);
    var sx = W * 0.955, sy = photoH * 0.50;
    g.save(); g.translate(sx, sy);
    g.beginPath();
    for (var si = 0; si < 24; si++) {
      var sa = si * Math.PI / 12, srr = si % 2 === 0 ? sr : sr * 0.85;
      var sx2 = Math.cos(sa) * srr, sy2 = Math.sin(sa) * srr;
      if (si === 0) g.moveTo(sx2, sy2); else g.lineTo(sx2, sy2);
    }
    g.closePath(); g.fillStyle = '#ffd21f'; g.fill();
    g.lineWidth = 2; g.strokeStyle = '#14042a'; g.stroke();
    g.fillStyle = '#14042a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 ' + Math.round(sr * 0.32) + 'px ViceSans, sans-serif';
    g.fillText('EST.', 0, -sr * 0.22); g.fillText('2026', 0, sr * 0.22);
    g.restore();
  }
  // Starburst on the photo, right side, overlapping a panel boundary.
  drawStarburst(g, W * 0.71, photoH * 0.41, Math.max(24, W * 0.044), ['ORIGINAL', 'COVER ART']);

  // 4. Stars + quote bar directly above the title.
  var qfs = Math.max(12, Math.round(W * 0.015));
  g.font = '900 ' + qfs + 'px ViceSans, sans-serif';
  var qtxt = '\u2605\u2605\u2605\u2605\u2605  ' + state.quote;
  var qw = g.measureText(qtxt).width + 22 * u;
  var qy = titleTop - qfs * 2.1;
  g.fillStyle = 'rgba(8,2,20,0.88)';
  g.beginPath();
  if (g.roundRect) g.roundRect(W * 0.03, qy, qw, qfs * 1.7, 3 * u); else g.rect(W * 0.03, qy, qw, qfs * 1.7);
  g.fill();
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillStyle = '#ffd21f';
  g.fillText('\u2605\u2605\u2605\u2605\u2605', W * 0.03 + 10 * u, qy + qfs * 0.85);
  g.fillStyle = '#fff';
  g.fillText(state.quote, W * 0.03 + 10 * u + g.measureText('\u2605\u2605\u2605\u2605\u2605  ').width, qy + qfs * 0.85);

  // 5. The TITLE: huge, full width, overlapping the lower photos.
  var titleSize = titleSizePre;
  var titleY = titleYPre;
  var grad = g.createLinearGradient(0, titleY - titleSize * 0.8, 0, titleY + titleSize * 0.25);
  grad.addColorStop(0, '#fff7dc'); grad.addColorStop(0.45, '#ffb347'); grad.addColorStop(1, '#ff5e8a');
  g.save();
  g.font = '900 ' + titleSize + 'px ViceCond, ViceDisplay, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.lineJoin = 'round';
  g.shadowColor = 'rgba(43,0,86,0.9)'; g.shadowBlur = titleSize * 0.10; g.shadowOffsetY = titleSize * 0.045;
  g.strokeStyle = '#14042a'; g.lineWidth = titleSize * 0.075;
  g.strokeText(state.title, W / 2, titleY);
  g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
  g.fillStyle = grad;
  g.fillText(state.title, W / 2, titleY);
  g.restore();

  // 6. Script subtitle overlapping the title's tail.
  var scrSize = Math.round(titleSize * 0.42);
  g.save();
  g.font = '400 ' + scrSize + 'px ViceScript, cursive';
  var sw = g.measureText(state.subtitle).width;
  g.translate(W * 0.985 - sw, titleY + scrSize * 0.28);
  g.rotate(-0.07);
  g.shadowColor = 'rgba(255,46,136,0.9)'; g.shadowBlur = scrSize * 0.35;
  g.fillStyle = '#ff6ec7';
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillText(state.subtitle, 0, 0);
  g.restore();

  // 7. Thin bottom strip: palms ONLY at the far edges, tagline centered.
  var stripY = photoH, stripH = H * 0.055;
  var sg = g.createLinearGradient(0, stripY, W, stripY);
  sg.addColorStop(0, '#ff2e88'); sg.addColorStop(0.5, '#ff5e3a'); sg.addColorStop(1, '#ff9a3c');
  g.fillStyle = sg; g.fillRect(0, stripY, W, stripH);
  var palmH = stripH * 1.15;
  drawPalm(g, W * 0.018, stripY + stripH, palmH, false);
  drawPalm(g, W * 0.045, stripY + stripH, palmH * 0.8, false);
  drawPalm(g, W * 0.982, stripY + stripH, palmH, true);
  drawPalm(g, W * 0.955, stripY + stripH, palmH * 0.8, true);
  var tgSize = fitFont(g, state.tagline, 'ViceSans, sans-serif', W * 0.80, Math.max(12, Math.round(W * 0.024)));
  g.font = '900 ' + tgSize + 'px ViceSans, sans-serif';
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(state.tagline, W / 2, stripY + stripH / 2);

  // 8. Footer microcopy + barcode.
  var footY = stripY + stripH;
  g.fillStyle = '#0d0218'; g.fillRect(0, footY, W, H - footY);
  var ffs = Math.max(8, Math.round(W * 0.009));
  g.font = '700 ' + ffs + 'px ViceSans, sans-serif';
  g.fillStyle = '#cbb8e8'; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText(state.title + ' \u2014 A VICE HEAT COVER STUDIO PICTURE \u2014 STARRING YOU \u2014 SHOT ON YOUR OWN CAMERA \u2014 GRADED BY HAND \u2014 LETTERING AND SEAL ORIGINAL \u2014 CAT. VH-0626',
    W * 0.012, footY + (H - footY) / 2);
  drawBarcode(g, W * 0.93, footY + (H - footY) * 0.2, W * 0.055, (H - footY) * 0.6);

  return c;
}

// ---- editor: preview, interaction, export ----
var preview = $('#preview');
var pctx = preview.getContext('2d');
var lastRender = null; // {canvas, W, H} of the current preview render

function previewSize() {
  var wh = SIZES[state.size];
  var maxW = Math.min(880, ($('#center').clientWidth || 880) - 24);
  var scale = Math.min(1, maxW / wh[0]);
  return [Math.round(wh[0] * scale), Math.round(wh[1] * scale)];
}

function renderPreview() {
  var wh = previewSize();
  var c = renderCover(wh[0], wh[1]);
  preview.width = wh[0]; preview.height = wh[1];
  pctx.drawImage(c, 0, 0);
  lastRender = { canvas: c, W: wh[0], H: wh[1] };
  drawFaceBox();
}

function panelRects(W, H) {
  var photoH = H * (1 - STRIP_H);
  return LAYOUTS[state.layout].map(function (p) {
    return { x: p.x * W, y: p.y * photoH, w: p.w * W, h: p.h * photoH, panel: p };
  });
}

function drawFaceBox() {
  if (!lastRender || !state.faceSafe) return;
  var rects = panelRects(lastRender.W, lastRender.H);
  var r = rects[state.selected];
  if (!r) return;
  var crop = cropFor(state.selected);
  var fw = r.w * 0.36, fh = r.h * 0.30;
  var fx = r.x + r.w * 0.5 - fw / 2, fy = r.y + r.h * 0.26 - fh / 2;
  pctx.save();
  pctx.strokeStyle = '#37e0e6'; pctx.lineWidth = 2; pctx.setLineDash([6, 4]);
  pctx.strokeRect(fx, fy, fw, fh);
  pctx.setLineDash([]);
  pctx.fillStyle = '#37e0e6'; pctx.font = '700 11px ViceSans, sans-serif'; pctx.textAlign = 'left';
  pctx.fillText('FACE', fx + 4, fy + 13);
  pctx.restore();
}

function refreshChrome() {
  var panels = LAYOUTS[state.layout];
  $('#panelLabel').textContent = (state.selected + 1) + ' OF ' + panels.length;
  var crop = cropFor(state.selected);
  $('#zoomSlider').value = crop.zoom;
  $('#zoomVal').textContent = crop.zoom.toFixed(1) + '\u00d7';
  var lab = labelFor(panels[state.selected], state.selected);
  $('#placeInput').value = lab.place;
  $('#subInput').value = lab.sub;
  $('#photoCount').textContent = state.photos.length + ' LOADED';
  $$('#photoGrid img').forEach(function (im, i) {
    im.classList.toggle('sel', panels[state.selected] && panels[state.selected].photo === i);
  });
  $$('#layoutGrid button').forEach(function (b) { b.classList.toggle('on', b.dataset.layout === state.layout); });
  $$('#gradeGrid button').forEach(function (b) { b.classList.toggle('on', b.dataset.grade === state.grade); });
  $$('#sizePicker button').forEach(function (b) { b.classList.toggle('on', b.dataset.size === state.size); });
  $('#painterlySlider').value = state.painterly; $('#painterlyVal').textContent = state.painterly;
  $('#inkSlider').value = state.ink; $('#inkVal').textContent = state.ink;
  $('#halftoneSlider').value = state.halftone; $('#halftoneVal').textContent = state.halftone;
  $('#skinSlider').value = state.skin; $('#skinVal').textContent = state.skin;
  $('#exportBtn').textContent = 'EXPORT PNG ' + state.size.replace('x', ' \u00d7 ');
}

function renderAll() { renderPreview(); refreshChrome(); }

function buildPhotoGrid() {
  var grid = $('#photoGrid'); grid.innerHTML = '';
  state.photos.forEach(function (p, i) {
    var im = document.createElement('img');
    im.src = p.img.src; im.alt = p.name; im.title = p.place;
    im.addEventListener('click', function () {
      var panels = LAYOUTS[state.layout];
      panels[state.selected].photo = i;
      renderAll();
    });
    grid.appendChild(im);
  });
}

function buildPanelButtons() {
  var wrap = $('#panelButtons'); wrap.innerHTML = '';
  LAYOUTS[state.layout].forEach(function (p, i) {
    var b = document.createElement('button');
    b.textContent = i + 1;
    b.addEventListener('click', function () { state.selected = i; renderAll(); });
    wrap.appendChild(b);
  });
}

function buildPickers() {
  var lg = $('#layoutGrid'); lg.innerHTML = '';
  LAYOUT_NAMES.forEach(function (name) {
    var b = document.createElement('button');
    b.textContent = name; b.dataset.layout = name;
    b.addEventListener('click', function () {
      state.layout = name; state.selected = 0; buildPanelButtons(); renderAll();
    });
    lg.appendChild(b);
  });
  var gg = $('#gradeGrid'); gg.innerHTML = '';
  GRADE_NAMES.forEach(function (name) {
    var b = document.createElement('button');
    b.dataset.grade = name;
    var sw = document.createElement('i'); sw.style.background = GRADES[name].sw;
    b.appendChild(sw); b.appendChild(document.createTextNode(name));
    b.addEventListener('click', function () {
      state.grade = name;
      var gr = GRADES[name];
      state.painterly = gr.painterly; state.ink = gr.ink; state.halftone = gr.halftone;
      renderAll();
    });
    gg.appendChild(b);
  });
}

function exportPNG(sizeKey) {
  var wh = SIZES[sizeKey];
  var c = renderCover(wh[0], wh[1]);
  return new Promise(function (res) {
    c.toBlob(function (blob) {
      var a = document.createElement('a');
      var name = 'vice-heat-' + sizeKey.replace('x', 'x') + '.png';
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      $('#savedMsg').textContent = 'SAVED ' + name.toUpperCase();
      res(name);
    }, 'image/png');
  });
}

// ---- pointer interaction on the preview: pan, zoom, move face box ----
var drag = null;
function previewPos(e) {
  var r = preview.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (preview.width / r.width), y: (e.clientY - r.top) * (preview.height / r.height) };
}
preview.addEventListener('mousedown', function (e) {
  var pos = previewPos(e);
  var rects = panelRects(lastRender.W, lastRender.H);
  for (var i = 0; i < rects.length; i++) {
    var r = rects[i];
    if (pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h) {
      state.selected = i;
      var fw = r.w * 0.36, fh = r.h * 0.30;
      var fx = r.x + r.w * 0.5 - fw / 2, fy = r.y + r.h * 0.26 - fh / 2;
      var onFace = state.faceSafe && pos.x >= fx - 6 && pos.x <= fx + fw + 6 && pos.y >= fy - 6 && pos.y <= fy + fh + 6;
      drag = { kind: onFace ? 'face' : 'pan', panel: i, sx: pos.x, sy: pos.y, crop: Object.assign({}, cropFor(i)) };
      renderAll();
      break;
    }
  }
});
window.addEventListener('mousemove', function (e) {
  if (!drag) return;
  var pos = previewPos(e);
  var crop = cropFor(drag.panel);
  if (drag.kind === 'face') {
    // Move the face anchor inside the photo; clamp to the upper 60% of the panel.
    var rects = panelRects(lastRender.W, lastRender.H);
    var r = rects[drag.panel];
    var dx = (pos.x - drag.sx) / r.w, dy = (pos.y - drag.sy) / r.h;
    crop.fx = Math.min(0.9, Math.max(0.1, drag.crop.fx + dx));
    crop.fy = Math.min(0.55, Math.max(0.05, drag.crop.fy + dy));
  } else {
    var rects2 = panelRects(lastRender.W, lastRender.H);
    var r2 = rects2[drag.panel];
    var ddx = (pos.x - drag.sx) / r2.w, ddy = (pos.y - drag.sy) / r2.h;
    crop.fx = Math.min(0.95, Math.max(0.05, drag.crop.fx - ddx));
    crop.fy = Math.min(0.95, Math.max(0.05, drag.crop.fy - ddy));
  }
  renderPreview();
});
window.addEventListener('mouseup', function () { drag = null; });
preview.addEventListener('wheel', function (e) {
  e.preventDefault();
  var crop = cropFor(state.selected);
  crop.zoom = Math.min(3, Math.max(1, crop.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  renderAll();
}, { passive: false });
preview.addEventListener('dblclick', function () { state.crops[state.selected] = defaultCrop(); renderAll(); });

// ---- wiring ----
function bind(id, ev, fn) { $(id).addEventListener(ev, fn); }
function wire() {
  buildPickers(); buildPanelButtons();
  bind('#addPhotosBtn', 'click', function () { $('#fileInput').click(); });
  bind('#addPhotosBtn2', 'click', function () { $('#fileInput').click(); });
  bind('#fileInput', 'change', function (e) {
    Array.prototype.forEach.call(e.target.files, function (f) {
      var rd = new FileReader();
      rd.onload = function () {
        loadImage(rd.result).then(function (im) {
          state.photos.push({ img: im, name: f.name, place: 'YOUR PHOTO', sub: 'JUST NOW \u2014 YOUR STORY' });
          buildPhotoGrid(); renderAll();
        });
      };
      rd.readAsDataURL(f);
    });
    e.target.value = '';
  });
  $$('#sizePicker button').forEach(function (b) {
    b.addEventListener('click', function () { state.size = b.dataset.size; renderAll(); });
  });
  bind('#zoomSlider', 'input', function (e) {
    cropFor(state.selected).zoom = parseFloat(e.target.value);
    renderAll();
  });
  bind('#autoCenterBtn', 'click', function () { state.crops[state.selected] = defaultCrop(); renderAll(); });
  bind('#replaceBtn', 'click', function () { $('#fileInput').click(); });
  bind('#fillAllBtn', 'click', function () {
    var ph = LAYOUTS[state.layout][state.selected].photo;
    LAYOUTS[state.layout].forEach(function (p) { p.photo = ph; });
    renderAll();
  });
  bind('#spreadBtn', 'click', function () {
    LAYOUTS[state.layout].forEach(function (p, i) { p.photo = i % state.photos.length; });
    renderAll();
  });
  bind('#faceSafeChk', 'change', function (e) { state.faceSafe = e.target.checked; renderAll(); });
  bind('#wantedChk', 'change', function (e) { state.wanted = e.target.checked; renderAll(); });
  bind('#starsSlider', 'input', function (e) { state.stars = parseInt(e.target.value, 10); renderAll(); });
  bind('#volInput', 'input', function (e) { state.vol = e.target.value.toUpperCase(); renderAll(); });
  bind('#sealChk', 'change', function (e) { state.seal = e.target.checked; renderAll(); });
  bind('#placeInput', 'input', function (e) {
    state.labels[state.selected] = { place: e.target.value.toUpperCase(), sub: labelFor(LAYOUTS[state.layout][state.selected], state.selected).sub };
    renderAll();
  });
  bind('#subInput', 'input', function (e) {
    var cur = labelFor(LAYOUTS[state.layout][state.selected], state.selected);
    state.labels[state.selected] = { place: cur.place, sub: e.target.value.toUpperCase() };
    renderAll();
  });
  bind('#painterlySlider', 'input', function (e) { state.painterly = parseInt(e.target.value, 10); renderAll(); });
  bind('#inkSlider', 'input', function (e) { state.ink = parseInt(e.target.value, 10); renderAll(); });
  bind('#halftoneSlider', 'input', function (e) { state.halftone = parseInt(e.target.value, 10); renderAll(); });
  bind('#skinSlider', 'input', function (e) { state.skin = parseInt(e.target.value, 10); renderAll(); });
  bind('#titleInput', 'input', function (e) { state.title = e.target.value.toUpperCase(); renderAll(); });
  bind('#subtitleInput', 'input', function (e) { state.subtitle = e.target.value; renderAll(); });
  bind('#taglineInput', 'input', function (e) { state.tagline = e.target.value.toUpperCase(); renderAll(); });
  bind('#quoteInput', 'input', function (e) { state.quote = e.target.value.toUpperCase(); renderAll(); });
  bind('#exportBtn', 'click', function () { exportPNG(state.size); });
  bind('#exportAllBtn', 'click', function () {
    exportPNG('1920x1080').then(function () { return exportPNG('1080x1350'); })
      .then(function () { return exportPNG('1080x1080'); });
  });
  bind('#exportAllTopBtn', 'click', function () { $('#exportAllBtn').click(); });
  bind('#surpriseBtn', 'click', function () {
    state.layout = LAYOUT_NAMES[Math.floor(Math.random() * LAYOUT_NAMES.length)];
    state.grade = GRADE_NAMES[Math.floor(Math.random() * GRADE_NAMES.length)];
    var gr = GRADES[state.grade];
    state.painterly = gr.painterly; state.ink = gr.ink; state.halftone = gr.halftone;
    var order = state.photos.map(function (p, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; }
    LAYOUTS[state.layout].forEach(function (p, k) { p.photo = order[k % order.length]; });
    state.selected = 0; buildPanelButtons(); renderAll();
  });
}

// ---- init ----
Promise.all(SAMPLE_DEFS.map(function (d) {
  return loadImage(d.file).then(function (im) {
    return { img: im, name: d.file.split('/').pop(), place: d.place, sub: d.sub };
  });
})).then(function (loaded) {
  state.photos = loaded;
  wire(); buildPhotoGrid();
  return fontsReady;
}).then(function () {
  renderAll();
  document.title = 'VICE HEAT Cover Studio \u2014 ready';
  window.__vhApi = {
    state: state, render: renderCover, renderPreview: renderPreview,
    exportPNG: exportPNG, layouts: LAYOUT_NAMES, grades: GRADE_NAMES,
    setLayout: function (n) { state.layout = n; state.selected = 0; buildPanelButtons(); renderAll(); },
    setGrade: function (n) { state.grade = n; var gr = GRADES[n]; state.painterly = gr.painterly; state.ink = gr.ink; state.halftone = gr.halftone; renderAll(); }
  };
}).catch(function (err) {
  document.title = 'VICE HEAT Cover Studio \u2014 error: ' + err.message;
});

})();
