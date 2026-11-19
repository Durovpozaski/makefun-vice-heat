// Fixed scenes for screenshots: ?shot=editor shows the studio with a sample
// cover loaded; ?shot=cover shows the cover alone. Query params pick the
// layout, grade, size and caption; &export=1 downloads the app's own PNG
// export. window.__shotReady is set once painted (or once the export blob
// exists, for the cover shots).
import { LAYOUTS, GRADES } from './cover.js';

const SIZES = { '1920x1080': [1920, 1080], '1080x1350': [1080, 1350], '1080x1080': [1080, 1080] };

export function runShot(shot, query, api) {
  const { state } = api;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = query.get('layout');
  if (layout && LAYOUTS[layout]) { state.layout = layout; api.resetPanels(); }
  const grade = query.get('grade');
  if (grade && GRADES[grade]) state.grade = grade;
  const size = query.get('size');
  if (size && SIZES[size]) state.size = { w: SIZES[size][0], h: SIZES[size][1] };
  const title = query.get('title');
  if (title) state.title = title;
  const subtitle = query.get('subtitle');
  if (subtitle) state.subtitle = subtitle;
  const tagline = query.get('tagline');
  if (tagline) state.tagline = tagline;
  const quote = query.get('quote');
  if (quote) state.quote = quote;
  api.rebuild();
  api.renderPreview();
  const done = () => requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
  if (shot === 'cover' && query.get('export') === '1') {
    api.exportPNG(state.size.w, state.size.h).then(done);
  } else {
    done();
  }
}
