// VICE HEAT Cover Studio — cover renderer (fresh code, written for this entry).
// Draws a GTA-style poster cover onto a canvas: a multi-panel photo collage
// graded like print key art, then the title lockup, badge, tagline strip and
// footer. Everything is drawn with the 2D canvas API; no network, no library.

export const LAYOUTS = {
  hero:      { label: 'Hero', panels: 6 },
  comic:     { label: 'Comic', panels: 6 },
  nine:      { label: '9 Panels', panels: 9 },
  one:       { label: '1 Panel', panels: 1 },
  two:       { label: '2 Panels', panels: 2 },
  three:     { label: '3 Panels', panels: 3 },
  four:      { label: '4 Panels', panels: 4 },
  diagonal:  { label: 'Diagonal Split', panels: 4 },
  herostrip: { label: 'Hero + Strip', panels: 5 },
};

// Panel rects as fractions of the collage area [x, y, w, h]; diagonal panels
// use polygons (fractions of the collage area, [x, y] points).
export function layoutRects(layout, cw, ch) {
  const r = (x, y, w, h) => ({ x: x * cw, y: y * ch, w: w * cw, h: h * ch });
  switch (layout) {
    case 'hero': return [
      r(0, 0, 0.56, 1.0), r(0.56, 0, 0.22, 0.33), r(0.78, 0, 0.22, 0.33),
      r(0.56, 0.33, 0.44, 0.33), r(0.56, 0.66, 0.22, 0.34), r(0.78, 0.66, 0.22, 0.34)];
    case 'comic': return [
      r(0, 0, 0.34, 0.6), r(0.34, 0, 0.33, 0.6), r(0.67, 0, 0.33, 0.6),
      r(0, 0.6, 0.34, 0.4), r(0.34, 0.6, 0.33, 0.4), r(0.67, 0.6, 0.33, 0.4)];
    case 'nine': { const out = []; for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) out.push(r(col / 3, row / 3, 1 / 3, 1 / 3)); return out; }
    case 'one': return [r(0, 0, 1, 1)];
    case 'two': return [r(0, 0, 0.6, 1), r(0.6, 0, 0.4, 1)];
    case 'three': return [r(0, 0, 0.5, 1), r(0.5, 0, 0.5, 0.5), r(0.5, 0.5, 0.5, 0.5)];
    case 'four': return [r(0, 0, 0.5, 0.5), r(0.5, 0, 0.5, 0.5), r(0, 0.5, 0.5, 0.5), r(0.5, 0.5, 0.5, 0.5)];
    case 'diagonal': {
      const p = (pts) => ({ poly: pts.map(([x, y]) => [x * cw, y * ch]) });
      return [
        p([[0, 0], [0.62, 0], [0.42, 0.5], [0, 0.5]]),
        p([[0.62, 0], [1, 0], [1, 0.5], [0.42, 0.5]]),
        p([[0, 0.5], [0.42, 0.5], [0.62, 1], [0, 1]]),
        p([[0.42, 0.5], [1, 0.5], [1, 1], [0.62, 1]])];
    }
    case 'herostrip': return [
      r(0, 0, 1, 0.6), r(0, 0.6, 0.25, 0.4), r(0.25, 0.6, 0.25, 0.4),
      r(0.5, 0.6, 0.25, 0.4), r(0.75, 0.6, 0.25, 0.4)];
    default: return [r(0, 0, 1, 1)];
  }
}

export const GRADES = {
  'vice-sunset': { label: 'Vice Sunset', filter: 'saturate(1.4) contrast(1.1) brightness(1.03)', overlay: 'sunset', posterize: 0, halftone: false },
  'neon-night':  { label: 'Neon Night', filter: 'saturate(1.45) contrast(1.12) brightness(0.94) hue-rotate(-12deg)', overlay: 'neon', posterize: 0, halftone: false },
  'golden-hour': { label: 'Golden Hour', filter: 'sepia(0.32) saturate(1.55) contrast(1.06) brightness(1.02)', overlay: 'warm', posterize: 0, halftone: false },
  'duotone':     { label: 'Duotone Pink/Teal', filter: 'grayscale(0.85) contrast(1.12) brightness(1.0)', overlay: 'duotone', posterize: 0, halftone: false },
  'comic-ink':   { label: 'Comic Ink', filter: 'contrast(1.55) saturate(1.5) brightness(1.06)', overlay: 'ink', posterize: 4, halftone: true },
  'natural':     { label: 'Natural', filter: 'saturate(1.06) contrast(1.02)', overlay: 'none', posterize: 0, halftone: false },
  'palm-noir':   { label: 'Palm Noir', filter: 'grayscale(1) contrast(1.35) brightness(0.92)', overlay: 'noir', posterize: 0, halftone: false },
};

const HALFTONE_GAP = 7;
let halftonePattern = null;
let grainPattern = null;

function getHalftone(ctx) {
  if (halftonePattern) return halftonePattern;
  const c = document.createElement('canvas');
  c.width = HALFTONE_GAP; c.height = HALFTONE_GAP;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.9)';
  g.beginPath(); g.arc(HALFTONE_GAP / 2, HALFTONE_GAP / 2, 1.5, 0, Math.PI * 2); g.fill();
  halftonePattern = ctx.createPattern(c, 'repeat');
  return halftonePattern;
}

function getGrain(ctx) {
  if (grainPattern) return grainPattern;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + Math.floor(Math.random() * 40);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainPattern = ctx.createPattern(c, 'repeat');
  return grainPattern;
}

// Cover-fit transform: maps a photo into rect (x, y, w, h) with zoom and pan.
// zoom 1 fills; ox/oy are fractions of the photo's spare room (-1..1).
function coverTransform(photo, rect, zoom, ox, oy) {
  const iw = photo.naturalWidth, ih = photo.naturalHeight;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (zoom || 1);
  const pw = iw * scale, ph = ih * scale;
  const dx = rect.x + (rect.w - pw) / 2 + (ox || 0) * Math.max(0, (pw - rect.w) / 2);
  const dy = rect.y + (rect.h - ph) / 2 + (oy || 0) * Math.max(0, (ph - rect.h) / 2);
  return { dx, dy, pw, ph };
}

function drawCoverFit(ctx, photo, rect, zoom, ox, oy) {
  const t = coverTransform(photo, rect, zoom, ox, oy);
  ctx.drawImage(photo, t.dx, t.dy, t.pw, t.ph);
}

// Quantize an offscreen canvas to `levels` steps per channel (poster print feel).
function posterizeCanvas(c, levels) {
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data, step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.round(d[i] / step) * step;
    d[i + 1] = Math.round(d[i + 1] / step) * step;
    d[i + 2] = Math.round(d[i + 2] / step) * step;
  }
  ctx.putImageData(img, 0, 0);
}

function applyOverlay(ctx, w, h, kind, strength) {
  if (kind === 'none' || strength <= 0.01) return;
  const a = 0.38 * strength;
  if (kind === 'sunset') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(255,120,40,${a})`);
    g.addColorStop(1, `rgba(255,40,120,${a * 1.1})`);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  } else if (kind === 'neon') {
    const g = ctx.createRadialGradient(w * 0.8, 0, 10, w * 0.8, 0, w * 0.9);
    g.addColorStop(0, `rgba(255,45,149,${a})`);
    g.addColorStop(1, 'rgba(255,45,149,0)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const g2 = ctx.createLinearGradient(0, h, w, 0);
    g2.addColorStop(0, `rgba(0,229,255,${a * 0.8})`);
    g2.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
  } else if (kind === 'warm') {
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = `rgba(255,170,60,${a})`; ctx.fillRect(0, 0, w, h);
  } else if (kind === 'duotone') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(255,45,149,${0.35 * strength})`; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(0,229,255,${0.3 * strength})`; ctx.fillRect(0, 0, w, h);
  } else if (kind === 'ink') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(40,0,60,${0.12 * strength})`; ctx.fillRect(0, 0, w, h);
  } else if (kind === 'noir') {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${0.35 * strength})`);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = 'source-over';
}

// Re-draws the face-box region of a panel from the raw photo with only a mild
// filter, feathered at the edges, so skin never takes the poster's halftone or
// posterize. `panel` is the panel rect on the main canvas, `face` the box in
// panel fractions, `transform` the panel's cover-fit (zoom/ox/oy).
function drawFaceSafe(ctx, panel, face, photo, transform) {
  const fx = panel.x + face.x * panel.w;
  const fy = panel.y + face.y * panel.h;
  const fw = Math.max(2, face.w * panel.w);
  const fh = Math.max(2, face.h * panel.h);
  const tmp = document.createElement('canvas');
  tmp.width = Math.ceil(fw); tmp.height = Math.ceil(fh);
  const t = tmp.getContext('2d');
  t.filter = 'saturate(1.05) contrast(1.02) brightness(1.02)';
  const tr = coverTransform(photo, panel, transform.zoom, transform.ox, transform.oy);
  t.drawImage(photo, tr.dx - fx, tr.dy - fy, tr.pw, tr.ph);
  t.filter = 'none';
  t.globalCompositeOperation = 'destination-in';
  const g = t.createRadialGradient(fw / 2, fh / 2, Math.min(fw, fh) * 0.30, fw / 2, fh / 2, Math.max(fw, fh) * 0.72);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  t.fillStyle = g; t.fillRect(0, 0, fw, fh);
  ctx.drawImage(tmp, fx, fy);
}

// Renders one panel (photo + grade) onto `ctx` at `rect`, then the face-safe
// pass on top when the panel has a face box and face-aware grading is on.
function drawPanel(ctx, rect, photo, transform, grade, sliders, halftoneOn) {
  if (!photo) { ctx.fillStyle = '#241533'; ctx.fillRect(rect.x, rect.y, rect.w, rect.h); return; }
  const off = document.createElement('canvas');
  off.width = Math.max(2, Math.round(rect.w));
  off.height = Math.max(2, Math.round(rect.h));
  const o = off.getContext('2d');
  const contrast = 0.94 + 0.18 * sliders.contrast;
  const saturation = 0.85 + 0.5 * sliders.saturation;
  o.filter = `${grade.filter} contrast(${contrast.toFixed(3)}) saturate(${saturation.toFixed(3)})`;
  drawCoverFit(o, photo, { x: 0, y: 0, w: off.width, h: off.height }, transform.zoom, transform.ox, transform.oy);
  o.filter = 'none';
  if (grade.posterize > 0) posterizeCanvas(off, grade.posterize);
  applyOverlay(o, off.width, off.height, grade.overlay, sliders.strength);
  if (grade.halftone && halftoneOn) {
    o.globalAlpha = 0.16 * sliders.strength + 0.06;
    o.fillStyle = getHalftone(o);
    o.fillRect(0, 0, off.width, off.height);
    o.globalAlpha = 1;
  }
  ctx.drawImage(off, rect.x, rect.y);
  if (transform.face) {
    // face-safe pass happens on the main canvas, after halftone, so the face
    // stays clean. It is skipped when the panel has no face box.
    drawFaceSafe(ctx, rect, transform.face, photo, transform);
  }
}

function panelBounds(rect) {
  if (rect.poly) {
    const xs = rect.poly.map((p) => p[0]), ys = rect.poly.map((p) => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  return rect;
}

function clipPanel(ctx, rect) {
  ctx.beginPath();
  if (rect.poly) {
    ctx.moveTo(rect.poly[0][0], rect.poly[0][1]);
    for (let i = 1; i < rect.poly.length; i++) ctx.lineTo(rect.poly[i][0], rect.poly[i][1]);
    ctx.closePath();
  } else {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.clip();
}

function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(2, -14, 6, -26); ctx.stroke();
  for (let i = -2; i <= 2; i++) {
    const a = -Math.PI / 2 + i * 0.42;
    ctx.beginPath(); ctx.moveTo(6, -26);
    ctx.quadraticCurveTo(6 + Math.cos(a) * 12, -26 + Math.sin(a) * 10 - 4, 6 + Math.cos(a) * 17, -26 + Math.sin(a) * 12 + 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStarburst(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const points = 16;
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.78;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = '#FFD23C'; ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.05); ctx.strokeStyle = '#160A24'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF3D6'; ctx.fill();
  ctx.fillStyle = '#160A24'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `900 ${r * 0.16}px "SansBold", sans-serif`;
  ctx.fillText('★★★', 0, -r * 0.26);
  ctx.font = `900 ${r * 0.20}px "SansBold", sans-serif`;
  ctx.fillText('ORIGINAL', 0, -r * 0.02);
  ctx.fillText('COVER ART', 0, r * 0.20);
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h) {
  const bars = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1];
  let bx = x;
  const unit = w / bars.reduce((a, b) => a + b + 1, 0);
  ctx.fillStyle = '#FFFFFF';
  for (const b of bars) {
    ctx.fillRect(bx, y, b * unit, h);
    bx += (b + 1) * unit;
  }
}

// The full cover. `state` carries layout, grade, sliders, caption text and the
// per-panel transforms; `photos` are loaded images in library order.
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const stripH = Math.round(H * 0.07);
  const footH = Math.round(H * 0.045);
  const collH = H - stripH - footH;
  const gutter = Math.max(2, Math.round(W * 0.004));
  ctx.fillStyle = '#160A24';
  ctx.fillRect(0, 0, W, H);

  const grade = GRADES[state.grade] || GRADES['vice-sunset'];
  const rects = layoutRects(state.layout, W, collH);
  rects.forEach((rect, i) => {
    const p = state.panels[i];
    if (!p) return;
    const photo = photos[p.photo] || null;
    const bounds = panelBounds(rect);
    ctx.save();
    clipPanel(ctx, rect);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    const inner = { x: bounds.x + gutter / 2, y: bounds.y + gutter / 2, w: bounds.w - gutter, h: bounds.h - gutter };
    const transform = { zoom: p.zoom, ox: p.ox, oy: p.oy, face: state.faceAware ? p.face : null };
    if (rect.poly) {
      // Diagonal panels: draw into the polygon's bounds, clipped by it.
      drawPanel(ctx, inner, photo, transform, grade, state.sliders, state.halftone);
    } else {
      drawPanel(ctx, inner, photo, transform, grade, state.sliders, state.halftone);
    }
    ctx.restore();
  });
  // White diagonal seams for the diagonal layout.
  if (state.layout === 'diagonal') {
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = gutter;
    ctx.beginPath(); ctx.moveTo(W * 0.62, 0); ctx.lineTo(W * 0.42, collH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, collH * 0.5); ctx.lineTo(W, collH * 0.5); ctx.stroke();
  }

  // Vignette + grain over the whole collage.
  if (state.sliders.vignette > 0.01) {
    const v = ctx.createRadialGradient(W / 2, collH / 2, Math.min(W, collH) * 0.35, W / 2, collH / 2, Math.max(W, collH) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, `rgba(0,0,0,${(0.45 * state.sliders.vignette).toFixed(3)})`);
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, collH);
  }
  if (state.sliders.grain > 0.01) {
    ctx.save();
    ctx.globalAlpha = 0.30 * state.sliders.grain;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = getGrain(ctx);
    ctx.fillRect(0, 0, W, collH);
    ctx.restore();
  }

  drawTitleLockup(ctx, W, collH, state);
  drawStrip(ctx, W, collH, stripH, state);
  drawFooter(ctx, W, collH + stripH, footH, state);
}

function drawTitleLockup(ctx, W, collH, state) {
  const cx = W / 2;
  const title = (state.title || 'VICE HEAT').toUpperCase();
  let size = collH * 0.30;
  ctx.font = `900 ${size}px "DisplayBlack", "SansBold", sans-serif`;
  const tw = ctx.measureText(title).width;
  if (tw > W * 0.94) size *= (W * 0.94) / tw;
  const baseY = collH * 0.68;
  const grad = ctx.createLinearGradient(0, -size, 0, 0);
  grad.addColorStop(0, '#FFF6D8');
  grad.addColorStop(0.45, '#FFB347');
  grad.addColorStop(1, '#FF5E8A');
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.scale(0.86, 1);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.font = `900 ${size}px "DisplayBlack", "SansBold", sans-serif`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.055;
  ctx.strokeStyle = '#160A24';
  ctx.shadowColor = 'rgba(10,2,20,0.55)';
  ctx.shadowBlur = size * 0.06; ctx.shadowOffsetY = size * 0.03;
  ctx.strokeText(title, 0, 0);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  ctx.restore();

  // Script subtitle, overlapping the title's lower right, tilted.
  const sub = state.subtitle || '';
  if (sub) {
    const ss = size * 0.42;
    ctx.save();
    ctx.translate(cx + W * 0.13, baseY + size * 0.16);
    ctx.rotate(-0.07);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 italic ${ss}px "ScriptInk", Georgia, serif`;
    ctx.shadowColor = '#FF5DA2'; ctx.shadowBlur = ss * 0.35;
    ctx.fillStyle = '#FF5DA2';
    ctx.fillText(sub, 0, 0);
    ctx.restore();
  }

  // Stars + press quote on a black bar above the title.
  const q = state.quote || '';
  const qSize = Math.max(10, collH * 0.026);
  ctx.font = `700 ${qSize}px "SansBold", sans-serif`;
  const qText = `★★★★★  ${q}`;
  const qW = ctx.measureText(qText).width;
  const barX = cx - (W * 0.94) / 2, barY = baseY - size - qSize * 1.9, barW = qW + qSize * 1.6, barH = qSize * 1.9;
  ctx.fillStyle = 'rgba(10,2,20,0.85)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#FFC93C';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${qSize}px "SansBold", sans-serif`;
  ctx.fillText('★★★★★', barX + qSize * 0.8, barY + barH / 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(q, barX + qSize * 0.8 + ctx.measureText('★★★★★ ').width, barY + barH / 2);

  drawStarburst(ctx, W * 0.85, collH * 0.52, W * 0.052);
}

function drawStrip(ctx, W, collH, stripH, state) {
  const y = collH;
  const g = ctx.createLinearGradient(0, y, W, y);
  g.addColorStop(0, '#FF2D95');
  g.addColorStop(0.5, '#7B2FF7');
  g.addColorStop(1, '#FF7A18');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, W, stripH);
  const ps = stripH * 0.62;
  for (let i = 0; i < 3; i++) drawPalm(ctx, W * 0.02 + i * ps * 0.9, y + stripH * 0.92, ps / 26, '#160A24');
  for (let i = 0; i < 3; i++) drawPalm(ctx, W * 0.98 - i * ps * 0.9, y + stripH * 0.92, ps / 26, '#160A24');
  const tag = (state.tagline || '').toUpperCase();
  if (tag) {
    const ts = stripH * 0.40;
    ctx.font = `900 ${ts}px "SansBold", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    try { ctx.letterSpacing = `${Math.max(2, ts * 0.18)}px`; } catch (e) { /* older canvas: no letter spacing */ }
    ctx.fillText(tag, W / 2, y + stripH / 2);
    try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }
  }
}

function drawFooter(ctx, W, y, footH, state) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, y, W, footH);
  const fs = Math.max(8, footH * 0.34);
  ctx.fillStyle = '#FF2D95';
  ctx.fillRect(8, y + footH * 0.2, footH * 0.6, footH * 0.6);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${footH * 0.42}px "SansBold", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('VH', 8 + footH * 0.3, y + footH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.font = `700 ${fs}px "SansBold", sans-serif`;
  ctx.fillStyle = '#E8E0F0';
  const micro = 'VICE HEAT — A VICE HEAT COVER STUDIO PICTURE — STARRING YOU — SHOT ON YOUR OWN CAMERA — GRADED BY HAND — LETTERING AND SEAL ORIGINAL — CAT. VH-0626';
  ctx.fillText(micro, 8 + footH * 0.6 + 8, y + footH / 2 + 1, W * 0.78);
  drawBarcode(ctx, W * 0.86, y + footH * 0.22, W * 0.11, footH * 0.56);
}
