'use strict';
/* VICE HEAT Cover Studio v4 — color pass.
   Gold title (cream -> gold yellow -> orange -> pink), posterize mosaic grade
   (flat warm color blocks + fine grain, blues shifted to purple/magenta),
   thin cream gutters + border, hero with a big sunset sky.
   Everything original: no Rockstar logo, artwork or fonts. */
var SAMPLES = ['samples/photo1.jpg', 'samples/photo2.jpg', 'samples/photo3.jpg',
  'samples/photo4.jpg', 'samples/photo5.jpg', 'samples/photo6.jpg',
  'samples/photo7.jpg', 'samples/photo8.jpg'];
var FACE_DEFAULTS = [
  { x: 0.42, y: 0.24, w: 0.22, h: 0.30 },
  { x: 0.52, y: 0.20, w: 0.30, h: 0.34 },
  null, null, null, null, null, null
];
var LABELS = [
  { place: 'OCEAN DRIVE', sub: '6:42 PM — LOOKING FOR TROUBLE' },
  { place: 'PIER 26', sub: '5:30 AM — GONE FISHING' },
  { place: 'PALM BOULEVARD', sub: '9:15 PM — LIGHTS OUT' },
  { place: 'MARINA DEL SOL', sub: '7:40 PM — NO WITNESSES' },
  { place: 'INTERSTATE 6', sub: '11:58 PM — FULL THROTTLE' },
  { place: 'SUNSET HEIGHTS', sub: '8:30 PM — BIG MONEY' },
  { place: 'VICE PETRO', sub: '2:12 AM — RUNNING ON EMPTY' },
  { place: 'TOWER 2', sub: '6:10 PM — LAST SWIM' }
];
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
  '1 Panel': [P(0, 0, 1, 1, 0, 0)],
  '2 Panels': [P(0, 0, 0.4975, 1, 0, 0), P(0.5025, 0, 0.4975, 1, 1, 1)],
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
    P(0.440, 0, 0.560, 0.62, 1, 1),
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
var GRADES = {
  'Miami Sunset': { painterly: 35, ink: 22, halftone: 8, skin: 70, sat: 1.24, warm: 0.85, blueShift: 0.75 },
  'Neon Night': { painterly: 25, ink: 30, halftone: 15, skin: 70, sat: 1.20, warm: 0.55, blueShift: 0.55 },
  'Golden Hour': { painterly: 20, ink: 15, halftone: 5, skin: 70, sat: 1.28, warm: 1.00, blueShift: 0.80 },
  'Duotone Pink/Teal': { painterly: 40, ink: 35, halftone: 25, skin: 60, sat: 1.30, warm: 0.60, blueShift: 0.65 },
  'Comic Ink': { painterly: 70, ink: 55, halftone: 30, skin: 70, sat: 1.35, warm: 0.70, blueShift: 0.70 },
  'Natural': { painterly: 5, ink: 5, halftone: 0, skin: 80, sat: 1.10, warm: 0.35, blueShift: 0.30 },
  'Palm Noir': { painterly: 45, ink: 45, halftone: 20, skin: 60, sat: 1.15, warm: 0.45, blueShift: 0.50 }
};
var GRADE_NAMES = Object.keys(GRADES);
var SIZES = { '1920x1080': [1920, 1080], '1080x1350': [1080, 1350], '1080x1080': [1080, 1080] };
var state = {
  layout: 'Hero', grade: 'Miami Sunset', size: '1920x1080',
  title: 'VICE HEAT', subtitle: 'Leonida',
  wanted: true, stars: 5, vol: 'VOL. 06', est: true, faceSafe: true,
  selected: 0, surpriseIdx: 0,
  sliders: { painterly: 35, ink: 22, halftone: 8, skin: 70 },
  panels: []
};
var PHOTOS = [];
function $(id) { return document.getElementById(id); }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function loadImage(src) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = function () { reject(new Error('cannot load ' + src)); };
    img.src = src;
  });
}
/* Deterministic integer hash -> [0,1): the grain must be identical on every run. */
function hashNoise(x, y, seed) {
  var h = (x * 374761393 + y * 668265263 + seed * 974634) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (((h ^ (h >>> 16)) >>> 0) / 4294967295);
}
function buildPanels() {
  var defs = LAYOUTS[state.layout];
  state.panels = defs.map(function (d) {
    var lab = LABELS[d.label];
    return {
      photo: d.photo, zoom: 1, cx: 0.5, cy: 0.5, panned: false,
      label: { place: lab.place, sub: lab.sub },
      def: d
    };
  });
  state.selected = 0;
}
/* Cover-fit source rect for one panel, with face bias: when the photo has a
   face and the user has not panned, the face lands in the upper third. */
function computeCrop(img, panel, pw, ph) {
  var iw = img.naturalWidth, ih = img.naturalHeight;
  var z = panel.zoom;
  var sw = iw, sh = iw * ph / pw;
  if (sh > ih) { sh = ih; sw = ih * pw / ph; }
  sw /= z; sh /= z;
  var cx = panel.cx * iw, cy = panel.cy * ih;
  var photo = PHOTOS[panel.photo];
  if (photo && photo.face && !panel.panned) {
    cx = photo.face.x * iw;
    cy = photo.face.y * ih;
  }
  var sx = clamp(cx - sw / 2, 0, Math.max(0, iw - sw));
  var sy = clamp(cy - sh / 2, 0, Math.max(0, ih - sh));
  if (photo && photo.face && !panel.panned) {
    sy = clamp(photo.face.y * ih - 0.30 * sh, 0, Math.max(0, ih - sh));
    sx = clamp(photo.face.x * iw - 0.50 * sw, 0, Math.max(0, iw - sw));
  }
  return { sx: sx, sy: sy, sw: sw, sh: sh, iw: iw, ih: ih };
}

/* Render one panel's photo through the grade, on its own canvas.
   Posterize breaks the photo into flat warm color blocks (the mosaic look);
   saturation is boosted; blues are bent toward purple/magenta so sea, sky
   and night panels stay warm; ink darkens edges; halftone dots and fine
   deterministic grain finish the print look. Skin inside the face box is
   blended back toward the original photo. */
function gradePanel(img, panel, pw, ph, seed) {
  var c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(pw));
  c.height = Math.max(2, Math.round(ph));
  var x = c.getContext('2d');
  var crop = computeCrop(img, panel, pw, ph);
  x.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, c.width, c.height);
  var g = currentGrade();
  var imgData = x.getImageData(0, 0, c.width, c.height);
  var d = imgData.data;
  var w = c.width, h = c.height, n = w * h;
  var lum = new Float32Array(n);
  var i, r, gg, b, l;
  for (i = 0; i < n; i++) {
    r = d[i * 4]; gg = d[i * 4 + 1]; b = d[i * 4 + 2];
    lum[i] = 0.299 * r + 0.587 * gg + 0.114 * b;
  }
  var levels = Math.max(3, Math.round(9 - g.painterly / 14));
  var step = 256 / levels;
  var pAmt = (g.painterly / 100) * 0.9;
  var inkAmt = g.ink / 100;
  var htAmt = g.halftone / 100;
  var skinAmt = state.faceSafe ? (g.skin / 100) : 0;
  var sat = g.sat, warm = g.warm, blueShift = g.blueShift;
  var face = null;
  var photo = PHOTOS[panel.photo];
  if (photo && photo.face && state.faceSafe) {
    var fx = (photo.face.x * crop.iw - crop.sx) / crop.sw;
    var fy = (photo.face.y * crop.ih - crop.sy) / crop.sh;
    var fw = (photo.face.w * crop.iw) / crop.sw;
    var fh = (photo.face.h * crop.ih) / crop.sh;
    face = { cx: fx * w, cy: fy * h, rx: fw * w / 2, ry: fh * h / 2 };
  }
  for (var y = 0; y < h; y++) {
    for (var xx = 0; xx < w; xx++) {
      i = y * w + xx;
      var o = i * 4;
      var or = d[o], og = d[o + 1], ob = d[o + 2];
      l = lum[i];
      r = or; gg = og; b = ob;
      /* saturation boost */
      r = l + (r - l) * sat; gg = l + (gg - l) * sat; b = l + (b - l) * sat;
      /* warm wash: lift reds, pull blues down, warm tint */
      r = r * (1 + 0.10 * warm) + 8 * warm;
      gg = gg * (1 + 0.02 * warm) + 3 * warm;
      b = b * (1 - 0.12 * warm) - 6 * warm;
      /* blues bend toward purple/magenta */
      if (b > r && b > gg) {
        var mix = (b - Math.max(r, gg)) / 255 * blueShift;
        r += mix * 120; gg += mix * 25; b -= mix * 55;
      }
      /* posterize into flat color blocks */
      var qr = Math.floor(r / step) * step + step / 2;
      var qg = Math.floor(gg / step) * step + step / 2;
      var qb = Math.floor(b / step) * step + step / 2;
      r = r * (1 - pAmt) + qr * pAmt;
      gg = gg * (1 - pAmt) + qg * pAmt;
      b = b * (1 - pAmt) + qb * pAmt;
      /* ink contours: Sobel edge darkening */
      if (inkAmt > 0.01 && xx > 0 && xx < w - 1 && y > 0 && y < h - 1) {
        var gx = (lum[i - w - 1] + 2 * lum[i - 1] + lum[i + w - 1]) -
          (lum[i - w + 1] + 2 * lum[i + 1] + lum[i + w + 1]);
        var gy = (lum[i - w - 1] + 2 * lum[i - w] + lum[i - w + 1]) -
          (lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1]);
        var edge = Math.min(1, Math.sqrt(gx * gx + gy * gy) / 1020);
        var dark = 1 - inkAmt * edge * 0.85;
        r *= dark; gg *= dark; b *= dark;
      }
      /* halftone dots: darker areas get bigger dots */
      if (htAmt > 0.01) {
        var dx = (xx % 7) - 3, dy = (y % 7) - 3;
        var dist2 = dx * dx + dy * dy;
        var thr = (255 - l) / 255 * 9;
        if (dist2 < thr) { r *= (1 - htAmt * 0.35); gg *= (1 - htAmt * 0.35); b *= (1 - htAmt * 0.35); }
      }
      /* fine deterministic grain */
      var nz = (hashNoise(xx, y, seed) - 0.5) * 12;
      r += nz; gg += nz; b += nz;
      /* face-safe: blend skin back toward the original photo */
      if (face && skinAmt > 0) {
        var ex = (xx - face.cx) / face.rx, ey = (y - face.cy) / face.ry;
        if (ex * ex + ey * ey < 1) {
          r = r * (1 - skinAmt) + or * skinAmt;
          gg = gg * (1 - skinAmt) + og * skinAmt;
          b = b * (1 - skinAmt) + ob * skinAmt;
        }
      }
      d[o] = clamp(r, 0, 255); d[o + 1] = clamp(gg, 0, 255); d[o + 2] = clamp(b, 0, 255);
    }
  }
  x.putImageData(imgData, 0, 0);
  return c;
}
function currentGrade() {
  var base = GRADES[state.grade];
  return {
    painterly: state.sliders.painterly, ink: state.sliders.ink,
    halftone: state.sliders.halftone, skin: state.sliders.skin,
    sat: base.sat, warm: base.warm, blueShift: base.blueShift
  };
}

function roundRect(x, X, Y, W, H, R) {
  x.beginPath();
  x.moveTo(X + R, Y);
  x.arcTo(X + W, Y, X + W, Y + H, R);
  x.arcTo(X + W, Y + H, X, Y + H, R);
  x.arcTo(X, Y + H, X, Y, R);
  x.arcTo(X, Y, X + W, Y, R);
  x.closePath();
}
function drawPalm(x, px, py, s, color) {
  x.save();
  x.fillStyle = color;
  x.strokeStyle = color;
  x.lineWidth = Math.max(1.5, s * 0.03);
  x.beginPath();
  x.moveTo(px, py);
  x.quadraticCurveTo(px + s * 0.08, py - s * 0.55, px + s * 0.16, py - s * 0.95);
  x.lineTo(px + s * 0.20, py - s * 0.95);
  x.quadraticCurveTo(px + s * 0.12, py - s * 0.55, px + s * 0.05, py);
  x.closePath();
  x.fill();
  var topX = px + s * 0.18, topY = py - s * 0.95;
  for (var k = -2; k <= 2; k++) {
    x.beginPath();
    x.moveTo(topX, topY);
    x.quadraticCurveTo(topX + k * s * 0.22, topY - s * 0.28, topX + k * s * 0.42, topY + s * 0.10 - Math.abs(k) * s * 0.06);
    x.quadraticCurveTo(topX + k * s * 0.24, topY - s * 0.10, topX, topY);
    x.closePath();
    x.fill();
  }
  x.restore();
}
function drawStarburst(x, cx, cy, r) {
  x.save();
  x.translate(cx, cy);
  x.beginPath();
  var spikes = 14;
  for (var i = 0; i < spikes * 2; i++) {
    var rr = (i % 2 === 0) ? r : r * 0.78;
    var a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  x.closePath();
  x.fillStyle = '#FF4D8D';
  x.fill();
  x.lineWidth = Math.max(2, r * 0.05);
  x.strokeStyle = '#2A0A2E';
  x.stroke();
  x.beginPath();
  x.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  x.fillStyle = '#FFF3C4';
  x.fill();
  x.lineWidth = Math.max(1.5, r * 0.03);
  x.strokeStyle = '#2A0A2E';
  x.stroke();
  x.fillStyle = '#2A0A2E';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.font = Math.round(r * 0.16) + 'px SansBold, sans-serif';
  x.fillText('★ ★ ★', 0, -r * 0.34);
  x.font = '900 ' + Math.round(r * 0.24) + 'px "DisplayBlack", sans-serif';
  x.fillText('ORIGINAL', 0, -r * 0.02);
  x.font = Math.round(r * 0.17) + 'px SansBold, sans-serif';
  x.fillText('COVER ART', 0, r * 0.30);
  x.restore();
}
function drawTitle(x, W, H, titleTop, titleBottom) {
  var text = state.title.toUpperCase();
  var cx = W / 2;
  var cy = (titleTop + titleBottom) / 2;
  var fs = (titleBottom - titleTop) * 0.92;
  x.save();
  x.font = '900 ' + Math.round(fs) + 'px "DisplayCond", sans-serif';
  var maxW = W * 0.96;
  var w = 0;
  for (var i = 0; i < text.length; i++) w += x.measureText(text[i]).width;
  var tracking = fs * 0.03;
  var total = w + tracking * (text.length - 1);
  if (total > maxW) {
    fs = fs * maxW / total;
    x.font = '900 ' + Math.round(fs) + 'px "DisplayCond", sans-serif';
    w = 0;
    for (var j = 0; j < text.length; j++) w += x.measureText(text[j]).width;
    tracking = fs * 0.03;
    total = w + tracking * (text.length - 1);
  }
  x.translate(cx, cy);
  x.transform(1, 0, -0.22, 1, 0, 0);
  var grad = x.createLinearGradient(0, -fs * 0.5, 0, fs * 0.5);
  grad.addColorStop(0.00, '#FFF7D6');
  grad.addColorStop(0.28, '#FFE9A8');
  grad.addColorStop(0.45, '#FFD23F');
  grad.addColorStop(0.62, '#FF9A2E');
  grad.addColorStop(0.82, '#FF6B4A');
  grad.addColorStop(1.00, '#FF4D8D');
  x.textAlign = 'left';
  x.textBaseline = 'middle';
  x.lineJoin = 'round';
  var passes = [
    { dx: fs * 0.055, dy: fs * 0.085, fill: '#4A1150', stroke: null },
    { dx: fs * 0.028, dy: fs * 0.042, fill: '#7B2D8B', stroke: null },
    { dx: 0, dy: 0, fill: null, stroke: '#2A0A2E', lw: fs * 0.05 },
    { dx: 0, dy: 0, fill: grad, stroke: null }
  ];
  for (var p = 0; p < passes.length; p++) {
    var pass = passes[p];
    var px = -total / 2 + pass.dx;
    var py = pass.dy;
    for (var k = 0; k < text.length; k++) {
      var ch = text[k];
      var cw = x.measureText(ch).width;
      if (pass.stroke) {
        x.lineWidth = pass.lw;
        x.strokeStyle = pass.stroke;
        x.strokeText(ch, px, py);
      } else {
        x.fillStyle = pass.fill;
        x.fillText(ch, px, py);
      }
      px += cw + tracking;
    }
  }
  x.restore();
  return { cx: cx, cy: cy, fs: fs, total: total, top: titleTop, bottom: titleBottom };
}
function drawScript(x, W, H, titleInfo) {
  var fs = titleInfo.fs * 0.40;
  x.save();
  x.font = Math.round(fs) + 'px Script, cursive';
  var sw = x.measureText(state.subtitle).width;
  var sx = Math.min(titleInfo.cx + titleInfo.total / 2 - sw * 0.42, W - sw - 8);
  var sy = titleInfo.bottom - titleInfo.fs * 0.10;
  x.translate(sx, sy);
  x.rotate(-0.10);
  x.shadowColor = '#FF9BD8';
  x.shadowBlur = fs * 0.25;
  x.fillStyle = '#FF5EC4';
  x.textAlign = 'left';
  x.textBaseline = 'middle';
  x.fillText(state.subtitle, 0, 0);
  x.restore();
}
function drawBarcode(x, bx, by, bw, bh) {
  var seed = 7;
  var px = bx;
  x.fillStyle = '#F2E9FF';
  while (px < bx + bw - 2) {
    var wbar = 1 + Math.floor(hashNoise(Math.round(px), 3, seed) * 4);
    if (hashNoise(Math.round(px), 9, seed) > 0.45) x.fillRect(px, by, wbar, bh);
    px += wbar + 1 + Math.floor(hashNoise(Math.round(px), 5, seed) * 3);
  }
}
function renderCover(canvas, W, H) {
  var x = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;
  x.fillStyle = '#F3E6C2';
  x.fillRect(0, 0, W, H);
  var m = Math.round(W * 0.008);
  var g = Math.max(2, Math.round(W * 0.004));
  var stripTop = H * 0.885;
  var footerTop = H * 0.955;
  var ax = m, ay = m, aw = W - 2 * m, ah = stripTop - m;
  var titleTop = H * 0.58, titleBottom = stripTop;
  var defs = LAYOUTS[state.layout];
  var rects = [];
  for (var i = 0; i < defs.length; i++) {
    var d = defs[i];
    var panel = state.panels[i];
    var px = ax + d.x * aw + g / 2;
    var py = ay + d.y * ah + g / 2;
    var pw = d.w * aw - g;
    var ph = d.h * ah - g;
    rects.push({ x: px, y: py, w: pw, h: ph });
    var photo = PHOTOS[panel.photo];
    if (photo && photo.img) {
      var graded = gradePanel(photo.img, panel, pw, ph, i * 101 + 7);
      x.drawImage(graded, px, py, pw, ph);
    } else {
      x.fillStyle = '#2A0A2E';
      x.fillRect(px, py, pw, ph);
    }
  }
  /* quote bar, measured first so labels can dodge it */
  x.font = Math.round(H * 0.020) + 'px SansBold, sans-serif';
  var quoteText = '★★★★★  PURE ADRENALINE IN EVERY FRAME';
  var quoteW = x.measureText(quoteText).width + W * 0.03;
  var quoteH = H * 0.034;
  var quoteRect = { x: W * 0.03, y: titleTop - H * 0.052, w: quoteW, h: quoteH };
  function hits(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  var titleZone = { x: 0, y: titleTop, w: W, h: titleBottom - titleTop };
  var volFs = Math.round(W * 0.020);
  x.font = '900 ' + volFs + 'px "DisplayBlack", sans-serif';
  var volW = x.measureText(state.vol).width + W * 0.03;
  var volH = volFs * 2.1;
  var volRect = { x: W * 0.018, y: H * 0.022, w: volW, h: volH };
  x.font = '900 ' + Math.round(H * 0.022) + 'px SansBold, sans-serif';
  var wW0 = x.measureText('WANTED  ' + '★'.repeat(state.stars)).width + W * 0.024;
  var wantedRect = { x: W - m - wW0, y: H * 0.018, w: wW0, h: H * 0.036 };
  var sbR = W * 0.048;
  var starRect = { x: W * 0.70 - sbR, y: H * 0.40 - sbR, w: sbR * 2, h: sbR * 2 };
  function blocked(rc) {
    return hits(rc, titleZone) || hits(rc, quoteRect) || hits(rc, volRect) || hits(rc, wantedRect) || hits(rc, starRect);
  }
  /* story labels, smaller than v3, dodging the title and the quote bar */
  for (var li = 0; li < defs.length; li++) {
    var lab = state.panels[li].label;
    var r = rects[li];
    var placeFs = Math.max(12, Math.round(W * 0.0125));
    var subFs = Math.max(9, Math.round(W * 0.0088));
    x.font = '900 ' + placeFs + 'px SansBold, sans-serif';
    var pw1 = x.measureText(lab.place).width;
    x.font = subFs + 'px SansBold, sans-serif';
    var pw2 = x.measureText(lab.sub).width;
    var chipW = Math.max(pw1, pw2) + W * 0.016;
    var chipH = placeFs + subFs + H * 0.018;
    var cand = [
      { x: r.x + W * 0.008, y: r.y + r.h - chipH - H * 0.008, w: chipW, h: chipH },
      { x: r.x + W * 0.008, y: r.y + H * 0.008, w: chipW, h: chipH },
      { x: r.x + W * 0.16, y: r.y + H * 0.008, w: chipW, h: chipH }
    ];
    var chosen = null;
    for (var c = 0; c < cand.length; c++) {
      var cd = cand[c];
      if (cd.x + cd.w > r.x + r.w + 2 || cd.y + cd.h > r.y + r.h + 2) continue;
      if (!blocked(cd)) { chosen = cd; break; }
    }
    if (!chosen) continue;
    x.save();
    x.globalAlpha = 0.86;
    x.fillStyle = '#12061C';
    roundRect(x, chosen.x, chosen.y, chosen.w, chosen.h, H * 0.006);
    x.fill();
    x.restore();
    x.fillStyle = '#FFFFFF';
    x.font = '900 ' + placeFs + 'px SansBold, sans-serif';
    x.textAlign = 'left';
    x.textBaseline = 'alphabetic';
    x.fillText(lab.place, chosen.x + W * 0.008, chosen.y + placeFs + H * 0.006);
    x.fillStyle = '#FFD23F';
    x.font = subFs + 'px SansBold, sans-serif';
    x.fillText(lab.sub, chosen.x + W * 0.008, chosen.y + placeFs + subFs + H * 0.012);
  }
  /* stars + quote bar directly above the title */
  x.save();
  x.globalAlpha = 0.92;
  x.fillStyle = '#12061C';
  roundRect(x, quoteRect.x, quoteRect.y, quoteRect.w, quoteRect.h, quoteRect.h / 2);
  x.fill();
  x.restore();
  x.font = Math.round(H * 0.020) + 'px SansBold, sans-serif';
  x.textAlign = 'left';
  x.textBaseline = 'middle';
  x.fillStyle = '#FFD23F';
  x.fillText('★★★★★', quoteRect.x + W * 0.012, quoteRect.y + quoteRect.h / 2);
  var starW = x.measureText('★★★★★  ').width;
  x.fillStyle = '#FFFFFF';
  x.fillText('PURE ADRENALINE IN EVERY FRAME', quoteRect.x + W * 0.012 + starW, quoteRect.y + quoteRect.h / 2);
  /* gold italic title with purple 3D shadow */
  var titleInfo = drawTitle(x, W, H, titleTop, titleBottom);
  drawScript(x, W, H, titleInfo);
  /* badges on the photos */
  drawStarburst(x, W * 0.70, H * 0.40, W * 0.048);
  x.save();
  x.translate(W * 0.018, H * 0.022);
  x.rotate(-0.14);
  x.fillStyle = '#FFD23F';
  roundRect(x, 0, 0, volW, volH, volH * 0.22);
  x.fill();
  x.fillStyle = '#2A0A2E';
  x.font = '900 ' + volFs + 'px "DisplayBlack", sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(state.vol, volW / 2, volH / 2);
  x.restore();
  if (state.est) {
    var er = W * 0.030;
    var ex = W * 0.945, ey = H * 0.40;
    x.save();
    x.beginPath();
    x.arc(ex, ey, er, 0, Math.PI * 2);
    x.fillStyle = '#F5B81D';
    x.fill();
    x.lineWidth = Math.max(2, er * 0.08);
    x.strokeStyle = '#2A0A2E';
    x.stroke();
    x.fillStyle = '#2A0A2E';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = '900 ' + Math.round(er * 0.34) + 'px SansBold, sans-serif';
    x.fillText('EST.', ex, ey - er * 0.22);
    x.fillText('2026', ex, ey + er * 0.26);
    x.restore();
  }
  if (state.wanted) {
    var stars = '';
    for (var s = 0; s < state.stars; s++) stars += '★';
    x.font = '900 ' + Math.round(H * 0.022) + 'px SansBold, sans-serif';
    var wText = 'WANTED  ' + stars;
    var wW = x.measureText(wText).width + W * 0.024;
    var wH = H * 0.036;
    var wx = W - m - wW, wy = H * 0.018;
    x.save();
    x.globalAlpha = 0.94;
    x.fillStyle = '#12061C';
    roundRect(x, wx, wy, wW, wH, wH / 2);
    x.fill();
    x.restore();
    x.fillStyle = '#FFFFFF';
    x.textAlign = 'left';
    x.textBaseline = 'middle';
    x.fillText('WANTED', wx + W * 0.012, wy + wH / 2);
    x.fillStyle = '#FFD23F';
    x.fillText(stars, wx + W * 0.012 + x.measureText('WANTED  ').width, wy + wH / 2);
  }
  /* bottom strip: thin, dark, small text, palms at the far edges only */
  var sg = x.createLinearGradient(0, stripTop, 0, footerTop);
  sg.addColorStop(0, '#3A1150');
  sg.addColorStop(1, '#1E0A2E');
  x.fillStyle = sg;
  x.fillRect(0, stripTop, W, footerTop - stripTop);
  drawPalm(x, W * 0.012, footerTop - H * 0.004, H * 0.055, '#0E0418');
  drawPalm(x, W * 0.965, footerTop - H * 0.004, H * 0.055, '#0E0418');
  var stripText = 'W E L C O M E   T O   L E O N I D A   —   S U M M E R   2 0 2 6';
  var stripFs = Math.round(H * 0.030);
  x.font = '900 ' + stripFs + 'px "DisplayCond", sans-serif';
  if (x.measureText(stripText).width > W * 0.88) {
    stripFs = Math.round(stripFs * W * 0.88 / x.measureText(stripText).width);
    x.font = '900 ' + stripFs + 'px "DisplayCond", sans-serif';
  }
  x.fillStyle = '#FFF3C4';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(stripText, W / 2, (stripTop + footerTop) / 2);
  /* footer microcopy + barcode */
  x.fillStyle = '#12061C';
  x.fillRect(0, footerTop, W, H - footerTop);
  var footText = 'VICE HEAT — A VICE HEAT COVER STUDIO PICTURE — STARRING YOU — SHOT ON YOUR OWN CAMERA — GRADED BY HAND — LETTERING AND SEAL ORIGINAL — CAT. VH-0626';
  var footFs = Math.round(H * 0.0115);
  x.font = footFs + 'px SansBold, sans-serif';
  var footMax = W * 0.945 - W * 0.01 - W * 0.012;
  if (x.measureText(footText).width > footMax) {
    footFs = Math.round(footFs * footMax / x.measureText(footText).width);
    x.font = footFs + 'px SansBold, sans-serif';
  }
  x.fillStyle = '#B9A8D6';
  x.textAlign = 'left';
  x.textBaseline = 'middle';
  x.fillText(footText, W * 0.012, (footerTop + H) / 2);
  drawBarcode(x, W * 0.945, footerTop + (H - footerTop) * 0.22, W * 0.042, (H - footerTop) * 0.56);
}

function layoutRects(W, H) {
  var m = Math.round(W * 0.008);
  var g = Math.max(2, Math.round(W * 0.004));
  var stripTop = H * 0.885;
  var ax = m, ay = m, aw = W - 2 * m, ah = stripTop - m;
  return LAYOUTS[state.layout].map(function (d) {
    return {
      x: ax + d.x * aw + g / 2, y: ay + d.y * ah + g / 2,
      w: d.w * aw - g, h: d.h * ah - g
    };
  });
}
function previewDims() {
  if (state.size === '1080x1350') return [648, 810];
  if (state.size === '1080x1080') return [720, 720];
  return [960, 540];
}
function renderPreview() {
  var pv = $('preview');
  var dims = previewDims();
  pv.width = dims[0];
  pv.height = dims[1];
  renderCover(pv, dims[0], dims[1]);
  positionFaceBox();
  var sel = state.panels[state.selected];
  $('panelLabel').textContent = (state.selected + 1) + ' OF ' + state.panels.length;
  $('zoom').value = sel.zoom;
  $('zoomVal').textContent = sel.zoom.toFixed(1) + '×';
  $('place').value = sel.label.place;
  $('subline').value = sel.label.sub;
  var dots = $('panelDots').children;
  for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('on', i === state.selected);
}
function positionFaceBox() {
  var box = $('faceBox');
  var sel = state.panels[state.selected];
  var photo = PHOTOS[sel.photo];
  if (!photo || !photo.face || !state.faceSafe) { box.style.display = 'none'; return; }
  var pv = $('preview');
  var W = pv.width, H = pv.height;
  var rects = layoutRects(W, H);
  var r = rects[state.selected];
  var crop = computeCrop(photo.img, sel, r.w, r.h);
  var fx = (photo.face.x * crop.iw - crop.sx) / crop.sw;
  var fy = (photo.face.y * crop.ih - crop.sy) / crop.sh;
  var fw = (photo.face.w * crop.iw) / crop.sw;
  var fh = (photo.face.h * crop.ih) / crop.sh;
  var left = (r.x + (fx - fw / 2) * r.w) / W * 100;
  var top = (r.y + (fy - fh / 2) * r.h) / H * 100;
  box.style.display = 'block';
  box.style.left = left + '%';
  box.style.top = top + '%';
  box.style.width = (fw * r.w / W * 100) + '%';
  box.style.height = (fh * r.h / H * 100) + '%';
}
function buildButtons() {
  var lg = $('layouts');
  lg.innerHTML = '';
  LAYOUT_NAMES.forEach(function (name) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = name;
    b.classList.toggle('on', name === state.layout);
    b.addEventListener('click', function () {
      state.layout = name;
      buildPanels();
      buildButtons();
      renderPreview();
    });
    lg.appendChild(b);
  });
  var gr = $('grades');
  gr.innerHTML = '';
  GRADE_NAMES.forEach(function (name) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = name;
    b.classList.toggle('on', name === state.grade);
    b.addEventListener('click', function () {
      state.grade = name;
      var base = GRADES[name];
      state.sliders.painterly = base.painterly;
      state.sliders.ink = base.ink;
      state.sliders.halftone = base.halftone;
      state.sliders.skin = base.skin;
      syncSliders();
      buildButtons();
      renderPreview();
    });
    gr.appendChild(b);
  });
  var dots = $('panelDots');
  dots.innerHTML = '';
  state.panels.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = String(i + 1);
    b.classList.toggle('on', i === state.selected);
    b.addEventListener('click', function () { state.selected = i; renderPreview(); });
    dots.appendChild(b);
  });
}
function buildThumbs() {
  var th = $('thumbs');
  th.innerHTML = '';
  PHOTOS.forEach(function (p, i) {
    var img = document.createElement('img');
    img.src = p.src;
    img.alt = 'photo ' + (i + 1);
    var sel = state.panels[state.selected];
    if (sel && sel.photo === i) img.classList.add('sel');
    img.addEventListener('click', function () {
      state.panels[state.selected].photo = i;
      state.panels[state.selected].zoom = 1;
      state.panels[state.selected].cx = 0.5;
      state.panels[state.selected].cy = 0.5;
      state.panels[state.selected].panned = false;
      buildThumbs();
      renderPreview();
    });
    th.appendChild(img);
  });
  $('photoCount').textContent = PHOTOS.length + ' LOADED';
}
function syncSliders() {
  $('slPainterly').value = state.sliders.painterly;
  $('slInk').value = state.sliders.ink;
  $('slHalftone').value = state.sliders.halftone;
  $('slSkin').value = state.sliders.skin;
  $('vPainterly').textContent = state.sliders.painterly;
  $('vInk').textContent = state.sliders.ink;
  $('vHalftone').textContent = state.sliders.halftone;
  $('vSkin').textContent = state.sliders.skin;
}
function bindSlider(id, key, vid) {
  $(id).addEventListener('input', function (e) {
    state.sliders[key] = Number(e.target.value);
    $(vid).textContent = e.target.value;
    renderPreview();
  });
}
function downloadBlob(blob, name) {
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function exportPNG(w, h, download) {
  var c = document.createElement('canvas');
  renderCover(c, w, h);
  return new Promise(function (resolve) {
    c.toBlob(function (blob) {
      if (download) downloadBlob(blob, 'vice-heat-' + w + 'x' + h + '.png');
      resolve(blob);
    }, 'image/png');
  });
}
var SURPRISES = [
  ['Hero', 'Miami Sunset'], ['Diagonal Split', 'Neon Night'], ['9 Panels', 'Golden Hour'],
  ['Comic', 'Comic Ink'], ['Hero + Strip', 'Duotone Pink/Teal'], ['3 Panels', 'Palm Noir'],
  ['Hero', 'Golden Hour'], ['Diagonal Split', 'Miami Sunset']
];
function wireEvents() {
  $('addPhotos').addEventListener('click', function () { $('fileInput').click(); });
  $('addPhotosTop').addEventListener('click', function () { $('fileInput').click(); });
  $('fileInput').addEventListener('change', function (e) { addFiles(e.target.files); e.target.value = ''; });
  var wrap = $('previewWrap');
  wrap.addEventListener('dragover', function (e) { e.preventDefault(); });
  wrap.addEventListener('drop', function (e) { e.preventDefault(); addFiles(e.dataTransfer.files); });
  $('zoom').addEventListener('input', function (e) {
    var sel = state.panels[state.selected];
    sel.zoom = Number(e.target.value);
    sel.panned = true;
    $('zoomVal').textContent = sel.zoom.toFixed(1) + '×';
    renderPreview();
  });
  $('autoCrop').addEventListener('click', function () {
    var sel = state.panels[state.selected];
    sel.zoom = 1; sel.cx = 0.5; sel.cy = 0.5; sel.panned = false;
    renderPreview();
  });
  $('replacePhoto').addEventListener('click', function () {
    var sel = state.panels[state.selected];
    sel.photo = (sel.photo + 1) % PHOTOS.length;
    sel.zoom = 1; sel.cx = 0.5; sel.cy = 0.5; sel.panned = false;
    buildThumbs();
    renderPreview();
  });
  $('fillAll').addEventListener('click', function () {
    var ph = state.panels[state.selected].photo;
    state.panels.forEach(function (p) { p.photo = ph; });
    buildThumbs();
    renderPreview();
  });
  $('spreadAll').addEventListener('click', function () {
    state.panels.forEach(function (p, i) { p.photo = i % PHOTOS.length; });
    buildThumbs();
    renderPreview();
  });
  $('faceSafe').addEventListener('change', function (e) { state.faceSafe = e.target.checked; renderPreview(); });
  $('wanted').addEventListener('change', function (e) { state.wanted = e.target.checked; renderPreview(); });
  $('stars').addEventListener('input', function (e) { state.stars = Number(e.target.value); renderPreview(); });
  $('vol').addEventListener('input', function (e) { state.vol = e.target.value.toUpperCase(); renderPreview(); });
  $('estSeal').addEventListener('change', function (e) { state.est = e.target.checked; renderPreview(); });
  $('place').addEventListener('input', function (e) { state.panels[state.selected].label.place = e.target.value.toUpperCase(); renderPreview(); });
  $('subline').addEventListener('input', function (e) { state.panels[state.selected].label.sub = e.target.value.toUpperCase(); renderPreview(); });
  $('titleInput').addEventListener('input', function (e) { state.title = e.target.value; renderPreview(); });
  $('subtitleInput').addEventListener('input', function (e) { state.subtitle = e.target.value; renderPreview(); });
  bindSlider('slPainterly', 'painterly', 'vPainterly');
  bindSlider('slInk', 'ink', 'vInk');
  bindSlider('slHalftone', 'halftone', 'vHalftone');
  bindSlider('slSkin', 'skin', 'vSkin');
  var sizes = $('sizes').querySelectorAll('.size');
  sizes.forEach(function (b) {
    b.addEventListener('click', function () {
      state.size = b.getAttribute('data-size');
      sizes.forEach(function (s) { s.classList.toggle('on', s === b); });
      var wh = SIZES[state.size];
      $('exportPng').textContent = 'EXPORT PNG ' + wh[0] + ' × ' + wh[1];
      renderPreview();
    });
  });
  $('exportPng').addEventListener('click', function () {
    var wh = SIZES[state.size];
    exportPNG(wh[0], wh[1], true);
  });
  function exportAll() {
    var list = [[1920, 1080], [1080, 1350], [1080, 1080]];
    var chain = Promise.resolve();
    list.forEach(function (wh) {
      chain = chain.then(function () { return exportPNG(wh[0], wh[1], true); });
    });
    return chain;
  }
  $('exportAll').addEventListener('click', exportAll);
  $('exportAllTop').addEventListener('click', exportAll);
  $('surprise').addEventListener('click', function () {
    var pick = SURPRISES[state.surpriseIdx % SURPRISES.length];
    state.surpriseIdx++;
    state.layout = pick[0];
    state.grade = pick[1];
    var base = GRADES[pick[1]];
    state.sliders.painterly = base.painterly;
    state.sliders.ink = base.ink;
    state.sliders.halftone = base.halftone;
    state.sliders.skin = base.skin;
    syncSliders();
    buildPanels();
    buildButtons();
    renderPreview();
  });
  wireCanvas();
}
function addFiles(files) {
  var list = Array.prototype.slice.call(files || []);
  var chain = Promise.resolve();
  list.forEach(function (f) {
    if (!f.type || f.type.indexOf('image/') !== 0) return;
    chain = chain.then(function () {
      return new Promise(function (resolve) {
        var rd = new FileReader();
        rd.onload = function () {
          loadImage(rd.result).then(function (img) {
            PHOTOS.push({ src: rd.result, img: img, face: null });
            resolve();
          }).catch(function () { resolve(); });
        };
        rd.onerror = function () { resolve(); };
        rd.readAsDataURL(f);
      });
    });
  });
  chain.then(function () { buildThumbs(); renderPreview(); });
}
function wireCanvas() {
  var pv = $('preview');
  var dragging = null;
  function canvasPos(e) {
    var r = pv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * pv.width, y: (e.clientY - r.top) / r.height * pv.height };
  }
  pv.addEventListener('pointerdown', function (e) {
    var pos = canvasPos(e);
    var rects = layoutRects(pv.width, pv.height);
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h) {
        state.selected = i;
        dragging = { x: pos.x, y: pos.y, panel: state.panels[i], rect: r };
        pv.setPointerCapture(e.pointerId);
        renderPreview();
        break;
      }
    }
  });
  pv.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var pos = canvasPos(e);
    var dx = pos.x - dragging.x, dy = pos.y - dragging.y;
    var p = dragging.panel, r = dragging.rect;
    var photo = PHOTOS[p.photo];
    if (!photo || !photo.img) return;
    var crop = computeCrop(photo.img, p, r.w, r.h);
    p.cx = clamp(p.cx - dx * crop.sw / (r.w * crop.iw), 0, 1);
    p.cy = clamp(p.cy - dy * crop.sh / (r.h * crop.ih), 0, 1);
    p.panned = true;
    dragging.x = pos.x;
    dragging.y = pos.y;
    renderPreview();
  });
  pv.addEventListener('pointerup', function () { dragging = null; });
  pv.addEventListener('wheel', function (e) {
    e.preventDefault();
    var sel = state.panels[state.selected];
    sel.zoom = clamp(sel.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 1, 2.5);
    sel.panned = true;
    renderPreview();
  }, { passive: false });
  pv.addEventListener('dblclick', function () {
    var sel = state.panels[state.selected];
    sel.zoom = 1; sel.cx = 0.5; sel.cy = 0.5; sel.panned = false;
    renderPreview();
  });
  var box = $('faceBox');
  var faceDrag = null;
  box.addEventListener('pointerdown', function (e) {
    e.stopPropagation();
    faceDrag = { x: e.clientX, y: e.clientY };
    box.setPointerCapture(e.pointerId);
  });
  box.addEventListener('pointermove', function (e) {
    if (!faceDrag) return;
    var sel = state.panels[state.selected];
    var photo = PHOTOS[sel.photo];
    if (!photo || !photo.face) return;
    var pv2 = $('preview');
    var r = pv2.getBoundingClientRect();
    var dx = (e.clientX - faceDrag.x) / r.width * pv2.width;
    var dy = (e.clientY - faceDrag.y) / r.height * pv2.height;
    var rects = layoutRects(pv2.width, pv2.height);
    var rr = rects[state.selected];
    var crop = computeCrop(photo.img, sel, rr.w, rr.h);
    photo.face.x = clamp(photo.face.x + dx * crop.sw / (rr.w * crop.iw), 0, 1);
    photo.face.y = clamp(photo.face.y + dy * crop.sh / (rr.h * crop.ih), 0, 1);
    faceDrag.x = e.clientX;
    faceDrag.y = e.clientY;
    renderPreview();
  });
  box.addEventListener('pointerup', function () { faceDrag = null; });
}
var fontsReady = Promise.resolve();
function init() {
  buildPanels();
  var loads = SAMPLES.map(function (src, i) {
    return loadImage(src).then(function (img) {
      PHOTOS[i] = { src: src, img: img, face: FACE_DEFAULTS[i] ? { x: FACE_DEFAULTS[i].x, y: FACE_DEFAULTS[i].y, w: FACE_DEFAULTS[i].w, h: FACE_DEFAULTS[i].h } : null };
    }).catch(function () { PHOTOS[i] = null; });
  });
  fontsReady = Promise.all([
    document.fonts.load('900 100px "DisplayCond"'),
    document.fonts.load('900 100px "DisplayBlack"'),
    document.fonts.load('700 20px "SansBold"'),
    document.fonts.load('100px "Script"')
  ]).catch(function () { return null; });
  Promise.all(loads).then(function () {
    PHOTOS = PHOTOS.filter(function (p) { return p; });
    return fontsReady;
  }).then(function () {
    buildButtons();
    buildThumbs();
    syncSliders();
    wireEvents();
    renderPreview();
  });
}
window.__vh = {
  state: state,
  photos: PHOTOS,
  renderPreview: renderPreview,
  exportPNG: exportPNG,
  renderCover: renderCover,
  ready: null
};
init();
window.__vh.ready = fontsReady;
