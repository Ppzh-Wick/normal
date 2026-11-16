# Recording-aligned chronology, review only

Preserved branch: experiment-2-chronicle-gallery @ b355107c278f55929c1bb4ba5d4cc13bd229f04c. This branch does not publish to Pages or update main.

## Observed reference and uncertainty
The user's 49.33-second, 1280×720, 30-fps recording photographs a physical monitor. Camera shake, perspective and browser chrome must not be treated as webpage movement. The live official site returned an unsupported-browser page in the available cloud browser; this analysis uses the actual provided video.

Manual measurement (about ±2 percentage points after page-boundary normalization):
- At 16.0 s the front PROMETHEUS board covers approximately 47% of page width and 61% of height. Its center is roughly (38%, 43%). Incoming board is smaller at lower-right; the previous thin rear board remains on the left.
- At 15.0 s the outgoing CHILE20 board and incoming PROMETHEUS board occupy approximately 38% and 41% of width. Their centers are around (24%, 39%) and (70%, 61%). This is the important two-board composition.
- At 14.5–16.0 s old board travels left/up and turns away; new board comes in from right/below, turns toward the viewer and grows. Several partial rear surfaces remain in view.
- Around 29–30 s the scene approaches a closer project presentation; around 43–44 s it returns. The user explicitly identifies this return as scroll-driven. Input method for entering cannot be inferred from pixels alone.
- Project-to-project intervals vary with the user's scrolling. Wheel-event distances and exact camera FOV/yaw cannot be recovered from this handheld recording. A claimed exact input-speed or degree match would be false precision.

## Differences corrected from b355107
- 62vw front plate to 46vw; reference height about 60vh.
- Previously 72% of every year forced approach/read/withdraw and only 28% changed orbit. Now the entire main-scroll distance continuously advances the orbit, with reversible native scrolling and bounded 115-ms settling.
- Seven physical plates rather than five; rear faces remain visible. Half-step includes two similarly sized, oppositely yawed boards (implementation ±31°, not a recovered reference angle).
- Vertical offset, tangential yaw and small camera-space drift follow the observed incoming lower-right/outgoing upper-left relation.
- A generated glass-like layered column plus 14,000 colored particles replaces 24 opaque low-poly rings. Three draw calls, no constant clock or postprocessing. Original shader/geometry, no copied source assets.
- Near reading is an optional explicit control; it can be exited by upward native scrolling, with a keyboard/button fallback. This entry is not asserted to be an exact copy of the source's unknown input.

## Scope and rights
Only Dot archive's original 生平年谱 is changed. All 29 source entries remain: 27 life events, two explicitly posthumous. Mountain/footprint module, graph and navigation remain unchanged. Original public preview is not updated. Reference video is used for private measurement only, not bundled. No Active Theory project logos, footage, meshes, shaders or source code are redistributed. Historical assets keep their existing disclosures and provenance; abstract material is not a historical reconstruction.

## Checks
Desktop-only as requested. Unit/static suite, build, Chromium runner at 1280×720 / 1440×900 / 1920×1080, forward/reverse sub-year projections, actual wheel recording, close-reading reverse scroll, reduced-motion and context-failure paths, idle render count, unchanged footprints and cold-entry regression. A headless SwiftShader pass is not a physical-GPU FPS benchmark or Safari validation.
