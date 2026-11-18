# V5 contour narrative verification

2026-11-04 UTC. Isolated from frozen V4, refined V4/performance, submission and root site.

## Automated and preservation checks
- 44/44 Node tests pass. New tests cover fixed decorative geometry, actual historical image and named entry action, seven real fragment links/current state, and mobile/reduced-motion fallbacks.
- Production Vite build passes. JavaScript 509,094 bytes; CSS 150,946 bytes. A pre-existing 500 kB chunk-size warning remains. No measured device FPS claim is made.
- Standalone export passes: 18 embedded image/font assets, zero unresolved runtime imports or external runtime dependencies. Independent filename prevents overwriting earlier HTML.
- All 23 data/public files match the optimized baseline byte for byte. No generated historical imagery, rewritten original map or new biographical claim.
- New contour geometry consists of 19 static SVG paths, generated at module load. No added RAF/timer/scroll listeners. Two finite desktop entrances (650/700 ms) are disabled for mobile/reduced motion.
- Existing performance contracts retained: cached terrain samples, inactive/hidden pause, bounded canvas backing budget, RAF-coalesced drag, short chapter transitions and fixed wheel lock.

## Actual browser checks
Managed Chromium, 1180 x 757 CSS-pixel desktop viewport.
- Opening composition, biography, historical-paper display, reading sheet, all 24 circular records, split source-backed relationship folio and six archive doors visually reviewed.
- Chapter ruler navigates and focuses target heading.
- Original paper reading opens all three detail controls and source link. The new opening paper button enters the optional 第24号图 trail and selects the original figure-number annotation.
- Selecting 嘉陵江流域考察 opens real source-backed evidence. Closing restores 100% view and the original node focus. No dataset/relationship change.
- Native browser 200% zoom is checked as responsive layout, not a physical-device test.

## Limits
No physical touchscreen, Safari/Firefox matrix, screen-reader session, measured FPS or real reduced-motion OS session. Reduced-motion behavior has static/callback test coverage; real preference emulation is not claimed. Standalone is statically validated; direct file:// execution has not been tested. Publication and post-publication checks are recorded separately.
