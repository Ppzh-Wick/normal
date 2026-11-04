# V6 palette verification

2026-11-04 UTC. Isolated palette revision of V5. No content or interaction redesign.

- 46/46 automated tests pass. Added contrast checks for ten foreground/background text pairs at WCAG AA >= 4.5:1, and checks against new image filters, persistent animation and old hardcoded copper geometry colors.
- No additional dependency, animation loop or event listener. Cached terrain geometry, inactive/hidden pause and bounded canvas backing size remain covered by behavioral tests.
- Original data and all public files are byte-identical to V5. Historical images are neither redrawn nor recolored.
- Key palette: deep ultramarine #0B1032, document wine #290F26, bright operational coral #FFB08C, ivory #FFF4DF, archive paper #F3EDE5.
- The remaining pre-existing 500 kB bundle warning is not a runtime failure. No measured FPS claim.
- Actual Chromium visual review covers opening, historical-paper chapter, graph/evidence and archive colors. 200% zoom narrow-layout list and evidence opening/closing also passed. Sources split-panel header remains readable. Responsive and reduced-motion rules are preserved; no physical-device or screen-reader test is claimed.
- Publication record and exact commit are separate. Earlier source/previews/root pages are not modified by this independent preview.
