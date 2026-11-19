[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Durovpozaski/makefun-vice-heat/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Durovpozaski/makefun-vice-heat/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# VICE HEAT Cover Studio

Turn a photo and a caption into GTA 6 style poster cover art, in your browser, offline. Pick one of 9 layouts, one of 7 grades (Miami Sunset by default: light posterize mosaic, warm wash, blues pushed to purple and magenta), tune the painterly, ink, halftone and skin-keep sliders, drag the face box so the lead stays clear of the title, then export a PNG in 1920×1080, 1080×1350 or 1080×1080.

The cover is full-bleed photos with a huge italic gold title over the lower photos, stars and a press quote above it, a starburst, VOL. 06 and EST. 2026 stickers, a WANTED badge, story labels on every panel and a thin bottom strip with its own barcode zone.

v6 rebuild notes: the title now fits the frame with room for its skew and purple 3D shadow, and the quote pill is skipped on the nine-panels grid so no story label is ever covered.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Everything is local: the eight demo photos live in `app/samples/`, the four fonts in `app/fonts/`, no network is used.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory, checks every screenshot against the bounty caps (long side at most 1280 px, short side at least 480 px, at most 256 KiB) and writes `dossier.json`.

## Entry

- Competition: [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01)
- License: MIT
