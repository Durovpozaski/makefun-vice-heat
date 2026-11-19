# VICE HEAT Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Durovpozaski/makefun-vice-heat/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Durovpozaski/makefun-vice-heat/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An entry for the [Make GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01): a
web app that turns your photos and a caption into a GTA 6-style poster cover — a multi-panel
photo collage graded like print key art, under a huge gradient title with a neon script
subtitle, a press quote, an ORIGINAL COVER ART seal, a tagline strip and a catalog footer.

- **9 layouts** (Hero, Comic, 9 Panels, 1 Panel, 2/3/4 Panels, Diagonal Split, Hero + Strip)
- **7 grades** (Miami Sunset, Neon Night, Golden Hour, Duotone Pink/Teal, Comic Ink, Natural, Palm Noir)
- **Face-aware grading**: a movable face box per panel keeps skin clean while the rest of the
  panel takes the full poster treatment — halftone and posterize never touch a face.
- Per-panel crop, zoom and pan; 5 grading sliders; halftone toggle; editable title, subtitle,
  tagline and press quote; 8 demo photos in the library plus your own uploads.
- Exports a real PNG at **1920×1080, 1080×1350 and 1080×1080**, one at a time or all three.

Run it offline: `node serve.ts`, then open http://localhost:8080. No network requests,
no external fonts — everything the app needs is bundled under `app/`.
