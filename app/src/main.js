// VICE HEAT Cover Studio — editor wiring (fresh code, written for this entry).
// Photo library, 9 layouts, 7 grades, sliders, caption fields, crop/pan/zoom,
// the movable face-safe box, PNG export at 3 sizes, and the ?shot= scenes.
import { drawCover, LAYOUTS, GRADES, layoutRects } from './cover.js';
import { runShot } from './shots.js';

const PHOTOS = [
  { src: 'samples/photo1.jpg', name: 'Convertible', face: { x: 0.30, y: 0.08, w: 0.30, h: 0.45 } },
  { src: 'samples/photo2.jpg', name: 'Neon Portrait', face: { x: 0.22, y: 0.06, w: 0.52, h: 0.52 } },
  { src: 'samples/photo3.jpg', name: 'Coastal Road', face: null },
  { src: 'samples/photo4.jpg', name: 'Gas Station', face: { x: 0.52, y: 0.22, w: 0.20, h: 0.32 } },
  { src: 'samples/photo5.jpg', name: 'Motorcycle', face: null },
  { src: 'samples/photo6.jpg', name: 'Speedboat', face: null },
  { src: 'samples/photo7.jpg', name: 'Ocean Drive', face: null },
  { src: 'samples/photo8.jpg', name: 'Skyline', face: null },
];

const SIZES = [
  { w: 1920, h: 1080, label: '1920 × 1080', short: 'LANDSCAPE' },
  { w: 1080, h: 1350, label: '1080 × 1350', short: 'PORTRAIT' },
  { w: 1080, h: 1080, label: '1080 × 1080', short: 'SQUARE' },
];

const state = {
  layout: 'hero',
  grade: 'vice-sunset',
  size: { w: 1920, h: 1080 },
  title: 'VICE HEAT',
  subtitle: 'Leonida',
  tagline: 'WELCOME TO LEONIDA — SUMMER 2026',
  quote: 'PURE ADRENALINE IN EVERY FRAME',
  sliders: { strength: 0.9, contrast: 0.06, saturation: 0.06, grain: 0.28, vignette: 0.5 },
  halftone: true,
  faceAware: true,
  panels: [],
  selected: 0,
};

const loaded = new Array(PHOTOS.length).fill(null);
const canvas = document.getElementById('preview');
const statusEl = document.getElementById('status');
const PREVIEW_MAX = 960;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function panelCount() {
  return LAYOUTS[state.layout].panels;
}

function resetPanels() {
  const n = panelCount();
  state.panels = [];
  for (let i = 0; i < n; i++) {
    const photo = i % PHOTOS.length;
    state.panels.push({ photo, zoom: 1, ox: 0, oy: 0, face: PHOTOS[photo].face ? { ...PHOTOS[photo].face } : null });
  }
  state.selected = 0;
}

function previewScale() {
  return Math.min(1, PREVIEW_MAX / state.size.w);
}

// Renders the cover at preview resolution, then the editor overlays (selected
// panel outline + its face-safe box) on the same canvas.
function renderPreview() {
  const scale = previewScale();
  const pw = Math.round(state.size.w * scale);
  const ph = Math.round(state.size.h * scale);
  if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
  const ctx = canvas.getContext('2d');
  drawCover(canvas, state, loaded);
  // Overlay: selected panel + face box (editor only, never in the export).
  const stripH = Math.round(ph * 0.07), footH = Math.round(ph * 0.045);
  const collH = ph - stripH - footH;
  const rects = layoutRects(state.layout, pw, collH);
  const sel = rects[state.selected];
  if (sel && !document.body.classList.contains('shot-cover')) {
    const b = sel.poly
      ? { x: Math.min(...sel.poly.map((p) => p[0])), y: Math.min(...sel.poly.map((p) => p[1])), w: Math.max(...sel.poly.map((p) => p[0])) - Math.min(...sel.poly.map((p) => p[0])), h: Math.max(...sel.poly.map((p) => p[1])) - Math.min(...sel.poly.map((p) => p[1])) }
      : sel;
    ctx.save();
    ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = 2; ctx.setLineDash([8, 5]);
    ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    ctx.setLineDash([]);
    const face = state.panels[state.selected] && state.panels[state.selected].face;
    if (state.faceAware && face) {
      ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = 2;
      ctx.strokeRect(b.x + face.x * b.w, b.y + face.y * b.h, face.w * b.w, face.h * b.h);
      ctx.fillStyle = '#00E5FF';
      ctx.font = `700 ${Math.max(11, ph * 0.018)}px sans-serif`;
      ctx.fillText('FACE', b.x + face.x * b.w + 4, b.y + face.y * b.h + 14);
    }
    ctx.restore();
  }
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function buildPhotoGrid() {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = '';
  PHOTOS.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'thumb'; b.title = p.name;
    const img = document.createElement('img');
    img.src = p.src; img.alt = p.name;
    const n = document.createElement('span');
    n.textContent = String(i + 1);
    b.append(img, n);
    b.addEventListener('click', () => {
      state.panels[state.selected].photo = i;
      const f = PHOTOS[i].face;
      state.panels[state.selected].face = f ? { ...f } : null;
      state.panels[state.selected].zoom = 1;
      state.panels[state.selected].ox = 0;
      state.panels[state.selected].oy = 0;
      buildPanelButtons();
      renderPreview();
    });
    grid.appendChild(b);
  });
}

function buildLayoutGrid() {
  const grid = document.getElementById('layout-grid');
  grid.innerHTML = '';
  for (const [key, def] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pick' + (state.layout === key ? ' active' : '');
    b.dataset.layout = key;
    b.innerHTML = `<span class="glyph glyph-${key}"></span><span>${def.label}</span>`;
    b.addEventListener('click', () => {
      state.layout = key;
      resetPanels();
      buildLayoutGrid(); buildPanelButtons();
      renderPreview();
    });
    grid.appendChild(b);
  }
}

function buildGradeGrid() {
  const grid = document.getElementById('grade-grid');
  grid.innerHTML = '';
  for (const [key, def] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pick' + (state.grade === key ? ' active' : '');
    b.dataset.grade = key;
    const sw = document.createElement('span');
    sw.className = 'swatch sw-' + key;
    const label = document.createElement('span');
    label.textContent = def.label;
    b.append(sw, label);
    b.addEventListener('click', () => {
      state.grade = key;
      buildGradeGrid();
      renderPreview();
    });
    grid.appendChild(b);
  }
}

function buildPanelButtons() {
  const wrap = document.getElementById('panel-buttons');
  wrap.innerHTML = '';
  const n = panelCount();
  document.getElementById('panel-count').textContent = `${state.selected + 1} OF ${n}`;
  for (let i = 0; i < n; i++) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mini' + (state.selected === i ? ' active' : '');
    b.textContent = String(i + 1);
    b.addEventListener('click', () => {
      state.selected = i;
      buildPanelButtons();
      syncZoom();
      renderPreview();
    });
    wrap.appendChild(b);
  }
}

function syncZoom() {
  const z = document.getElementById('zoom');
  const p = state.panels[state.selected];
  if (!p) return;
  z.value = String(p.zoom);
  document.getElementById('zoom-val').textContent = `${p.zoom.toFixed(1)}×`;
}

function bindSlider(id, key) {
  const el = document.getElementById(id);
  const show = () => { document.getElementById(id + '-val').textContent = state.sliders[key].toFixed(2); };
  el.addEventListener('input', () => {
    state.sliders[key] = Number(el.value);
    show();
    renderPreview();
  });
  show();
}

// Renders the cover at full export size on an offscreen canvas and downloads
// it as a PNG. Returns a promise that resolves with the blob.
export function exportPNG(w, h) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const keep = state.size;
    state.size = { w, h };
    drawCover(off, state, loaded);
    state.size = keep;
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-heat-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setStatus(`SAVED vice-heat-${w}x${h}.png`);
      resolve(blob);
    }, 'image/png');
  });
}

async function exportAll() {
  for (const s of SIZES) {
    await exportPNG(s.w, s.h);
    await new Promise((r) => setTimeout(r, 250));
  }
  setStatus('SAVED all 3 sizes');
}

function surprise() {
  const layoutKeys = Object.keys(LAYOUTS);
  const gradeKeys = Object.keys(GRADES);
  state.layout = layoutKeys[Math.floor(Math.random() * layoutKeys.length)];
  state.grade = gradeKeys[Math.floor(Math.random() * gradeKeys.length)];
  resetPanels();
  for (let i = 0; i < state.panels.length; i++) {
    state.panels[i].photo = Math.floor(Math.random() * PHOTOS.length);
    const f = PHOTOS[state.panels[i].photo].face;
    state.panels[i].face = f ? { ...f } : null;
    state.panels[i].zoom = 1 + Math.random() * 0.4;
  }
  state.sliders.strength = 0.7 + Math.random() * 0.3;
  state.sliders.grain = 0.15 + Math.random() * 0.3;
  state.sliders.vignette = 0.3 + Math.random() * 0.4;
  buildLayoutGrid(); buildGradeGrid(); buildPanelButtons();
  document.querySelectorAll('#size-picker button').forEach((b) => b.classList.toggle('active', Number(b.dataset.w) === state.size.w && Number(b.dataset.h) === state.size.h));
  renderPreview();
}

function bindEvents() {
  document.getElementById('export-png').addEventListener('click', () => exportPNG(state.size.w, state.size.h));
  document.getElementById('export-all').addEventListener('click', exportAll);
  document.getElementById('export-all-top').addEventListener('click', exportAll);
  document.getElementById('surprise').addEventListener('click', surprise);

  document.querySelectorAll('#size-picker button').forEach((b) => {
    b.addEventListener('click', () => {
      state.size = { w: Number(b.dataset.w), h: Number(b.dataset.h) };
      document.querySelectorAll('#size-picker button').forEach((x) => x.classList.toggle('active', x === b));
      renderPreview();
    });
  });

  const caption = (id, key) => {
    document.getElementById(id).addEventListener('input', (e) => {
      state[key] = e.target.value;
      renderPreview();
    });
  };
  caption('in-title', 'title');
  caption('in-subtitle', 'subtitle');
  caption('in-tagline', 'tagline');
  caption('in-quote', 'quote');

  document.getElementById('zoom').addEventListener('input', (e) => {
    const p = state.panels[state.selected];
    if (!p) return;
    p.zoom = Number(e.target.value);
    document.getElementById('zoom-val').textContent = `${p.zoom.toFixed(1)}×`;
    renderPreview();
  });

  document.getElementById('btn-center').addEventListener('click', () => {
    const p = state.panels[state.selected];
    if (!p) return;
    p.zoom = 1; p.ox = 0; p.oy = 0;
    syncZoom();
    renderPreview();
  });
  document.getElementById('btn-replace').addEventListener('click', () => {
    const p = state.panels[state.selected];
    if (!p) return;
    p.photo = (p.photo + 1) % PHOTOS.length;
    const f = PHOTOS[p.photo].face;
    p.face = f ? { ...f } : null;
    buildPanelButtons();
    renderPreview();
  });
  document.getElementById('btn-fill').addEventListener('click', () => {
    const p = state.panels[state.selected];
    if (!p) return;
    for (const q of state.panels) {
      q.photo = p.photo;
      const f = PHOTOS[p.photo].face;
      q.face = f ? { ...f } : null;
    }
    renderPreview();
  });
  document.getElementById('btn-spread').addEventListener('click', () => {
    state.panels.forEach((q, i) => {
      q.photo = i % PHOTOS.length;
      const f = PHOTOS[q.photo].face;
      q.face = f ? { ...f } : null;
    });
    renderPreview();
  });
  document.getElementById('face-toggle').addEventListener('change', (e) => {
    state.faceAware = e.target.checked;
    renderPreview();
  });
  document.getElementById('halftone-toggle').addEventListener('change', (e) => {
    state.halftone = e.target.checked;
    renderPreview();
  });

  const addPhotos = () => document.getElementById('photo-input').click();
  document.getElementById('add-photo').addEventListener('click', addPhotos);
  document.getElementById('add-photos-top').addEventListener('click', addPhotos);
  document.getElementById('photo-input').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      const img = await loadImage(URL.createObjectURL(file));
      PHOTOS.push({ src: img.src, name: file.name, face: null });
      loaded.push(img);
    }
    buildPhotoGrid();
    renderPreview();
  });

  // Canvas pointer: drag inside the selected panel's face box moves the box;
  // drag elsewhere in the panel pans the photo; click another panel selects it.
  let drag = null;
  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  };
  const panelAt = (x, y) => {
    const stripH = Math.round(canvas.height * 0.07), footH = Math.round(canvas.height * 0.045);
    const collH = canvas.height - stripH - footH;
    const rects = layoutRects(state.layout, canvas.width, collH);
    for (let i = 0; i < rects.length; i++) {
      const rc = rects[i];
      const b = rc.poly
        ? { x: Math.min(...rc.poly.map((p) => p[0])), y: Math.min(...rc.poly.map((p) => p[1])), w: Math.max(...rc.poly.map((p) => p[0])) - Math.min(...rc.poly.map((p) => p[0])), h: Math.max(...rc.poly.map((p) => p[1])) - Math.min(...rc.poly.map((p) => p[1])) }
        : rc;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return { i, b };
    }
    return null;
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    const hit = panelAt(p.x, p.y);
    if (!hit) return;
    canvas.setPointerCapture(e.pointerId);
    if (hit.i !== state.selected) {
      state.selected = hit.i;
      buildPanelButtons(); syncZoom(); renderPreview();
      return;
    }
    const panel = state.panels[hit.i];
    const face = state.faceAware && panel.face
      ? { x: hit.b.x + panel.face.x * hit.b.w, y: hit.b.y + panel.face.y * hit.b.h, w: panel.face.w * hit.b.w, h: panel.face.h * hit.b.h }
      : null;
    if (face && p.x >= face.x && p.x <= face.x + face.w && p.y >= face.y && p.y <= face.y + face.h) {
      drag = { kind: 'face', startX: p.x, startY: p.y, face: { ...panel.face }, b: hit.b };
    } else {
      drag = { kind: 'pan', startX: p.x, startY: p.y, ox: panel.ox, oy: panel.oy, b: hit.b };
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toCanvas(e);
    const panel = state.panels[state.selected];
    if (drag.kind === 'face') {
      panel.face = {
        x: Math.min(0.9, Math.max(0, drag.face.x + (p.x - drag.startX) / drag.b.w)),
        y: Math.min(0.9, Math.max(0, drag.face.y + (p.y - drag.startY) / drag.b.h)),
        w: drag.face.w, h: drag.face.h,
      };
    } else {
      const spareX = Math.max(1, (drag.b.w * panel.zoom - drag.b.w) / 2);
      const spareY = Math.max(1, (drag.b.h * panel.zoom - drag.b.h) / 2);
      panel.ox = Math.min(1, Math.max(-1, drag.ox + ((p.x - drag.startX) / spareX) * 0.9));
      panel.oy = Math.min(1, Math.max(-1, drag.oy + ((p.y - drag.startY) / spareY) * 0.9));
    }
    renderPreview();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('dblclick', () => {
    const p = state.panels[state.selected];
    if (!p) return;
    p.zoom = 1; p.ox = 0; p.oy = 0;
    syncZoom();
    renderPreview();
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[state.selected];
    if (!p) return;
    p.zoom = Math.min(3, Math.max(1, p.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
    syncZoom();
    renderPreview();
  }, { passive: false });
}

async function init() {
  resetPanels();
  buildPhotoGrid();
  buildLayoutGrid();
  buildGradeGrid();
  buildPanelButtons();
  syncZoom();
  bindSlider('s-strength', 'strength');
  bindSlider('s-contrast', 'contrast');
  bindSlider('s-saturation', 'saturation');
  bindSlider('s-grain', 'grain');
  bindSlider('s-vignette', 'vignette');
  bindEvents();
  try {
    await Promise.all([
      document.fonts.load('900 100px "DisplayBlack"'),
      document.fonts.load('900 100px "DisplayCond"'),
      document.fonts.load('700 italic 60px "ScriptInk"'),
      document.fonts.load('700 40px "SansBold"'),
    ]);
    await document.fonts.ready;
  } catch (e) { /* fall back to system fonts */ }
  for (let i = 0; i < PHOTOS.length; i++) {
    try { loaded[i] = await loadImage(PHOTOS[i].src); } catch (e) { loaded[i] = null; }
  }
  renderPreview();
  window.__vhApi = { state, exportPNG, renderPreview };
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    runShot(shot, new URLSearchParams(location.search), { state, exportPNG, renderPreview, resetPanels, rebuild: () => { buildLayoutGrid(); buildGradeGrid(); buildPanelButtons(); syncZoom(); } });
  }
}

init();
