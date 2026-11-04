# 实验2 (V8) verification — 2026-11-04

## Independent identity

Page title and masthead explicitly say “实验2”. Source lives in `experiments/experiment-2/`; the public preview lives in `previews/experiment-2/`. All earlier editions are retained.

## Tests and build

- `npm test`: 86/86 passed. This includes the previous 68 tests, 15 executed Grainient/Atmosphere lifecycle tests and 3 material/provenance/identity tests.
- Lifecycle tests run production JSX with mock React hooks, WebGL, RAF and observers. They cover a single static two-pass render followed by idle, 600,000 output pixels, inactive/offscreen/hidden cancellation, deferred resize, no disabled pointer listeners, stable re-render behavior, mobile/reduced-motion zero WebGL mounts, dynamic qualification, shader failure cleanup and context-loss fallback.
- `npm run build`: passed. JS 534,082 bytes, CSS 179,943 bytes. V7 was 517,004 / 169,962 bytes. Same-compressor gzip JS increases by 6,303 bytes. No new animation or WebGL library dependency.
- Static shader material image: 36,676-byte WebP. It is decorative, never a substitute for an archival image.
- `node scripts/build-standalone.mjs`: passed, 19 embedded image/font assets, zero runtime imports or external runtime dependencies, 4,153,615-byte HTML. Static validation only; the single-file output was not separately opened in a browser.
- Vite warnings remain: upstream `use client` directives ignored and a >500KB JS chunk warning. No claim that all bundles are split.

## Native shader render

The exact VERTEX, FIELD and COMPOSITE shader strings were compiled and rendered with the existing Mesa EGL / llvmpipe CPU software rasterizer, OpenGL ES 3.2. Field pass 480×300, final pass 960×600, no GL errors. The actual wrapper parameters were used. The image was visually inspected: deep blue on the left, steel blue through the center, warm copper on the right with fine grain. It was encoded as the static material fallback.

This proves shader compilation/output in that native software context, not browser GPU support, frame rate, mobile performance or final browser shader compositing. Method, shader hashes and parameters are in `docs/grainient-native-render.json`. Optional repro script: `python scripts/render-grainient-poster.py`; requires existing EGL/GLES and Pillow, not npm dependencies.

## Actual cloud Chrome observations

- Official Glass Surface demo visually inspected. Official Grainient page loaded but displayed a default-sized empty canvas; this cloud browser did not provide working WebGL2 for either the official demo or this preview.
- Experiment 2 therefore visibly used its static rendering fallback, which was inspected in the actual page alongside the real frosted-only GlassSurface specialization. The historical paper, large title, color fields and portrait label remain legible.
- The default 24-node graph and frosted intro label were visually inspected. Existing chapter navigation reached the graph and returned to the opening with heading focus.
- Responsive test at native Chrome 200% zoom: no horizontal page overflow; Grainient canvas count is zero; both glass labels have `backdrop-filter: none`; natural scrolling is preserved. This is a narrow-layout test, not a physical phone test.
- Final title, masthead and opening identifier show “实验2”. The background loads the actual shader-derived poster.

## Preservation and limits

All 21 prior public files other than updated third-party notices remain byte-identical, as do data.json, TerrainStage.jsx, mineral.css, useExhibition.js and transitionCoordinator.js: 26 unchanged-file checks. All 24 relationships and historical-image checks still pass. Only new material assets are added.

No live browser GPU success, physical touch-device, Safari/Firefox, OS reduced-motion toggle, measured FPS, CPU-throttling or Lighthouse claim. Mobile/reduced branches are tested and inspected as described above. Unsupported WebGL still has the designed static material. Glass is limited to small labels; no full-screen backdrop blur and no continuous new background animation.
