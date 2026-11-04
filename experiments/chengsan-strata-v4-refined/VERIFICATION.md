# V4 verification record

2026-11-03 UTC. Separate `山河之间` experimental exhibition. V3 and other scholar pages are not edited.

## Automated checks

- `npm test`: 30/30 Node tests pass. Covers dataset IDs/counts, source references and PDF page bounds, public asset existence, no public PDF, six archive views and filter/URL behavior, storage-failure handling, semantic landmarks, 24 default radial nodes/list entries, category controls, source attribution, reduced-motion branches, navigation logic, focus/camera callback restoration, and the optional four-step evidence trail.
- `npm run build`: production Vite build succeeds. Dependency `use client` directives are ignored by this client-only bundler; these are build warnings, not runtime server-component support.
- Standalone builder parses inline JavaScript, rejects remaining runtime imports and unresolved resource references, and embeds all 18 referenced image/font assets. Source links intentionally remain external.
- The original historical sketch file SHA256 is unchanged: `dd56fd0e38f67eff592e9321b67cff028c76a5a85e1f6146073fb719c755e5fa`.
- No visible edition suffix in source/code/public metadata, no generated historical image, and no private PDF in public assets.

## Browser checks performed

Chromium on the managed cloud desktop, 1180×757 CSS pixels; native browser zoom 200% also checked at 590×378 CSS pixels. This is a responsive/zoom check, not a physical-phone test.

- All seven chapter compositions rendered and reviewed through multiple critique/revision passes.
- Opening, substantial profile, original-sketch viewing/three annotations, relationship scene, all three long teaching panels, six-entry archive index, and source endpaper inspected visually.
- Chapter menu, explicit previous/next, one-gesture chapter transitions, ordinary reading within long chapters, and next gesture at the long-chapter boundary checked. Zoom/narrow mode uses natural scrolling with the complete chapter menu.
- Default graph has all 24 circular nodes. Their bounds fit the desktop graph viewport; category view retains 8+5 people paging. Relation-label toggle, category changes, and paging maintain chapter position after fixes.
- Complete relation list contains 24 entries and scrolls to the final record without changing chapter. Search/category and node-evidence behavior checked during the iteration.
- Native relation dialog, nested image dialog, Escape dismissal, and return focus checked. The component-level callback tests additionally check exact pre-selection camera restoration and a disconnected-opener fallback.
- Optional evidence path opens the actual Jialing survey record, then the single matching 1946 bibliography record, with focus placed on its title. Completion closes the bookmark and returns focus to the source heading.
- Archive timeline/works/places/images/reports and source controls were exercised during the V4 iteration. Bibliography filtering to 嘉陵江 yields 1/19 records and retains the actual page-293 source link.
- At 200% zoom, profile reading and menu navigation remain usable, without horizontal document overflow.
- Self-contained HTML opened successfully over local HTTP. It has no external application scripts or stylesheets, all displayed image/SVG-image URLs are embedded, and no broken images were observed. The local preview server injects its own live-reload helper; that helper is not part of the exported file.

## Fixed during review

List-mode CSS specificity initially prevented scrolling; an explicit override restores it. Graph label/category/paging updates now align the stage after rendering, and browser scroll anchoring is disabled for the exhibition. Label placement reserves portrait/name boxes and uses small leader lines where a caption must move off its relationship line. Tiny utility text and the source-header contrast were improved. The portrait's low resolution is preserved rather than reconstructed.

## Limits

- Browser DevTools preference emulation is prohibited by the environment. Real reduced-motion preference emulation was not performed and the restriction was not bypassed. The preference branches and CSS are inspected/tested; no claim of a screen-reader or OS-accessibility session is made.
- Direct `file://` testing is unavailable under the existing browser policy. The exported HTML is tested over local HTTP and statically verified as self-contained; this is not an actual double-click/file-protocol test.
- No physical touchscreen, exhaustive Safari/Firefox matrix, or measured hardware performance benchmark. Canvas resolution is capped to approximately 1.8 million backing pixels and its opening animation is finite, but this is a source-level design constraint, not a measured frame-rate claim.
- Public source links were not all fetched again in this final visual pass. Historical source disagreements and image-rights qualifications remain visible.
- Publication status and exact commit belong to the separate deployment record, not this local verification report.


## Reading-refinement candidate, 2026-11-03 16:15 UTC

This section applies to the isolated refinement of the frozen V4 checkpoint. It does not itself certify a new deployment.

- 36/36 automated tests pass, including gallery entry/source contracts, actual-pixel magnifier implementation, unchanged historical-sketch hash, and native image-reader/focus/reduced-motion contracts. These are static or callback tests, not browser interaction tests.
- Production build and standalone export pass: 18 image/font assets embedded, zero unresolved runtime imports. Bundle-size warning remains; no measured performance benchmark claimed.
- Actual desktop browser: split relation folio exposes first paragraph; selected camera155%, full-map toggle100%, close restores prior130% camera and exact opening control. Default24 retained; category people still8+5.
- Nested image reader opened from relation evidence. Escape closes only image reader, preserves selected relation, returns focus to that image control.
- Image gallery keyboard End reaches17th record. Selected image and source record change together. Original image files are unchanged.
- Actual browser zoom200%:590×378CSS pixels, no horizontal document overflow; category list and modal evidence work; original-map reader, zoom control and source text remain available; Escape restores gallery image trigger. This is not a physical-phone test.
- View Transition choreography is implemented and opening/return states visually checked. No frame-by-frame timing or performance claim is made.
- Remaining baseline limitations above still apply: no real reduced-motion preference emulation, direct file:// run, screen-reader session, or cross-browser/physical-device matrix.

- Independent refinement audit identified and fixed two regressions: nonmodal folio no longer blocks guided navigation elsewhere, and keyboard traversal instantly reveals each compact-graph node. Actual browser Tab/Shift-Tab traversal checked all24 focused node bounds inside the graph viewport; chapter stayed aligned. With a nonmodal folio still open, opening→PageDown correctly reached biography.
- Original-pixel magnifier ArrowRight changes inspected region; Escape removes lens and restores toggle focus without leaving the chapter.
- Final chrome pass separates graph camera from its toolbar (measured8.2CSS-pixel gap) and docks chapter navigation in the masthead during object/folio/archive reading. Gallery arrow indicators are SVG rather than font glyphs.
- Final browser pass exercised all six archive tabs with nonempty panels and matching URL view state; search found5 relationship records for 嘉陵江; relation captions/list expose24 entries; people paging remains8+5.

## Performance update, 2026-11-04 UTC

Only the refined experimental source/preview is updated. Earlier submission, V3,
frozen V4, root site, data and original archival images remain unchanged.

- 40/40 tests pass. New behavioral tests cover cached terrain geometry/final
  projection, inactive/hidden pause and resume, canvas pixel budget, fixed wheel
  lock, one graph update for 20 pointer events, and final drag-position flushing.
- Build and standalone export pass (18 embedded assets, zero runtime imports).
- Chapter wheel suppression: 950 ms with momentum extending it indefinitely
  becomes a fixed 380 ms. Instant internal alignment uses 100 ms.
- Chapter transitions: 720 ms clip-path/brightness animation becomes 320 ms
  opacity/translation. Graph layout no longer animates grid widths or padding;
  its camera and paper keep short 320 ms entrances. Image/object transitions
  remain, at 340/360 ms. Fixed header/menu/navigation no longer blur the backdrop.
- Terrain caches 11,376 original sample triples. Each animated frame previously
  recomputed heights plus rotation per vertex; it now uses two rotation trig
  calls, reuses gradient/geometry, and does no RAF work when inactive/hidden.
  Completed reveal does not restart when returning to the opening.
- Graph drag caches its coordinate ratio at pointerdown and batches pointer
  updates into one RAF. Root changes no longer rerender a memoized graph with a
  fresh callback; decorative registration marks are memoized too. Lens/tilt and
  scroll-state synchronization are RAF-coalesced.
- Node-only geometry microbenchmark: 50 warmups / 400 draws, original mean
  0.743 ms and p95 0.928 ms, cached-height/rotation mean 0.211 ms and p95 0.395 ms.
  This isolates math only, not Canvas paint, GPU, live FPS, or user-device speed.
- Bundle size is not the principal issue: JS 504,376 to 506,056 bytes; CSS
  132,804 to 132,515 bytes (production build). No feature or original image was
  removed merely to reduce transfer size.
- Local browser connection to the executor HTTP server was unavailable. Public
  preview interaction verification is recorded separately after publication.
  No claim of measured FPS, physical trackpad/mobile, or Safari/Firefox coverage.
