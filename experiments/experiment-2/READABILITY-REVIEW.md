# Experiment 2 readability correction — 2026-11-10

## Scope
Only Experiment 2 is changed. Experiment 3 remains on its separate branch and is not published by this change.

- Remove the upper cyan/blue aurora ribbon, its translucent veil, and the upper blue spotlight. Preserve the quiet stars and lower violet mist.
- Apply a complete light-paper ink theme to all six archive views, including timeline headings and descriptions, years, tabs, expanded details, search controls, source notes, and image-gallery captions.
- Preserve dark exhibit frames and their light image-opening labels. No historical image pixels or factual data are modified.
- Bust the old aurora asset cache. Previously cached upper blue artwork must not reappear with the new stylesheet.

## Verification
Source commit: fa43da37f6ad18c3c90ebd08bcd478bc82d67087.
GitHub Actions: https://github.com/Ppzh-Wick/normal/actions/runs/42786942185

- 116 Node tests passed.
- Production build passed.
- 36 actual Chromium pair-focus checks passed, including all 24 overview nodes, categories, person/school/project selection, close restoration, keyboard focus, reduced motion, and mobile behavior.
- 47 actual Chromium archive checks passed across all six views, expanded timeline text, search empty state, focus-visible, image-stage label, desktop/mobile contrast, graph count, and no browser page errors.
- Actual desktop timeline, mobile timeline, image archive, and quiet graph screenshots visually reviewed.
- Palette contrast against the paper surface: title about 10.5:1; secondary text about 5.78:1; years/actions about 5.97:1. The two gradient endpoints and control backgrounds were also checked.
- Compiled application JavaScript is byte-identical to the prior published Experiment 2 JavaScript. Changes are CSS and static decorative SVG only, with no added animation loops or JS dependencies.

## Limits
Chromium desktop and emulated 390px touch viewport were tested. This is not a physical iPhone/Safari test or a device-GPU frame-rate benchmark. Existing Vite chunk-size and vendor use-client warnings remain unchanged.

## Reproduce
From experiments/experiment-2:
npm ci
npm test
npm run build
# Install the official Playwright browser runner if absent:
npm install --no-save --package-lock=false playwright@1.64.1
npx playwright install --with-deps chromium
node scripts/verify-pair-focus.mjs
node scripts/verify-archive-readability.mjs
