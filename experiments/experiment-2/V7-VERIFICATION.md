# V7 verification — 2026-11-04

## Scope

Independent `chengsan-motion-v7` source and preview. V6's ultramarine/cinnabar/ivory palette, 24 relationships, historical text and image files are preserved. No existing edition is overwritten.

## Automated checks

- `npm test`: 68/68 passed. Includes 18 transition reliability cases and 4 actual-component/provenance contracts, alongside historical data, 24-node graph, accessibility, archive and terrain regression tests.
- `npm run build`: passed. Production JS 517,004 bytes and CSS 169,962 bytes. V6 was 509,094 / 163,994 bytes. Raw JS increase is 7,910 bytes; gzip comparison using the same Python compressor is 173,141 versus 161,128 bytes. This is a modest download increase, not a measured frame-rate improvement.
- `node scripts/build-standalone.mjs`: passed. 18 embedded image/font assets, zero runtime imports or external runtime dependencies. Standalone HTML 4,077,687 bytes. The standalone artifact was statically validated, not separately opened in a browser.
- Byte comparison: all 21 public files other than updated third-party notices, plus data.json, mineral.css and TerrainStage.jsx, are identical to V6.
- Build warnings: the copied upstream `use client` directives are ignored by Vite; a >500KB single JS chunk warning remains. Neither stops the build. No claim that the app is fully code-split.

## Actual cloud Chrome checks

- Readable three-character SplitText opening, authentic paper artwork, final desktop StaggeredMenu composition and a captured intermediate menu animation.
- Forward and reverse chapter snapshots: clean directional folio, narrow cinnabar/blue page edges, persistent navigation. No whole-screen blur or overlapping chapter text.
- Menu link closes native dialog and focuses the destination heading. A timing issue between menu closure and heading focus was found, fixed and regression-tested.
- Rapid chapter changes end at the newest requested chapter; browser Back/Forward restore the chapter; wheel chapter navigation works; Escape returns to natural/free reading.
- Historical map details, full-image dialog, Escape close and opener focus restoration.
- Narrow responsive branch at native Chrome 200% zoom: static readable heading, scrollable single-column menu, link navigation and menu closure. This is a responsive layout check, not a physical phone test.
- Updated map-dialog snapshot exclusions prevent the chapter's paper from being independently captured during full-image transitions. This final CSS exclusion is source/build-checked; no separate final screenshot was captured for that exact exclusion.

## Motion and access boundaries

Reduced-motion and mobile branches are covered by tests and code inspection; reduced-motion OS settings were not toggled in a real device/browser. Native View Transitions are optional: unsupported browsers get immediate navigation. No Safari/Firefox, physical touch-device, CPU-throttling, Lighthouse or measured FPS claim. Font and image availability depend on the final host.

Only finite transform/opacity React Bits effects are used. No looping title, pointer springs, perpetual WebGL background or additional animation engine. The fixed 380ms wheel lock and cached/paused terrain remain.

See `docs/V7-MOTION.md` for official source revisions, adaptations and license links. The custom folio transition is not presented as a React Bits component.
