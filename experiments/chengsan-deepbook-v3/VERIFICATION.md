# Verification record

Date: 2026-11-03 UTC. Independent isolated React implementation, not an edit to the older compressed preview.

## Automated

- `npm ci` / `npm run build`: production Vite build succeeds.
- `npm test`: 13 Node tests pass. Dataset counts, unique IDs, source references, PDF page bounds, public image/font existence, no public PDF, six archive views/filters/sorting/URL validation, local bookmark initial states, SSR and Li-only route scope.
- Standalone builder parses serialized inline JavaScript, rejects runtime module imports and unresolved resource references, embeds all referenced images and font.
- No generated historical images or invented route geometry added.

## Actual browser checks

Chromium, desktop 1180×757 CSS pixels. Native browser zoom also exercised 944px, 590px and 393px CSS viewport widths, then restored to 100%. This is responsive/zoom checking, not a physical mobile-device test.

- Seven chapters, visible navigation, first/last disabled controls, URL chapter restore.
- Desktop wheel: one gesture advances one chapter. Expanded biography scrolls to its bottom within a gesture; a new gesture advances. Free-reading Escape and return control work.
- Long archive PageDown scrolls content rather than skipping chapters.
- Graph: category/search/no-result/reset, all 3 relation groups, zoom/reset, keyboard node selection, pointer drag, scrollable list, guided-question selection, source evidence and Escape dismissal. Graph position stays stable on selection.
- Narrow layout: chapter menu opens with focus on first link, selection focuses destination heading, evidence scrolls into view, archive keyboard End reveals the last horizontal tab. No horizontal document overflow at tested widths.
- Image viewer: accessible name, fit/2× display enlargement, scrollable enlarged image, Escape dismissal and focus return. Enlargement does not reconstruct historical detail.
- Contribution tabs: click and arrow-key selection; cross-link opens the corresponding graph evidence.
- Archive: timeline era filter and details, places navigation, bibliography empty-state/reset/type/sort, media and report views, local bookmark toggle, actual JSON download. Downloaded JSON exactly matches src/data.json.
- Archive search state persists on leaving/re-entering, reload and browser history navigation.
- Historical images load; source links retain their original destinations. Sources were not all re-fetched in this iteration.

## Limits

- Reduced-motion behavior and one-megapixel/30-fps rendering caps inspected in source, not measured hardware-performance claims. Test browser used the static background fallback; WebGL Silk animation needs a WebGL2-capable browser for its animated form.
- Direct file:// navigation was blocked by the test browser's policy. The same single-file HTML is checked over local HTTP, with embedded resource dependencies statically verified. Do not describe this as an actual double-click/file-protocol test.
- No screen-reader session, physical touchscreen, or exhaustive Safari/Firefox matrix was performed.
- Portrait remains low-resolution and its original provenance is unresolved. Publicly viewable images do not confer an open reuse license; see SOURCE-NOTES.txt.

## Final artifact check

The final self-contained HTML was loaded over local HTTP. All scripts are inline, all displayed image references are embedded data URLs, no external stylesheets remain, no broken images were observed, and no application-origin console errors were recorded. All three graph groups were checked for text-box overlap between node names and relation captions after final corrections; none remained at the tested desktop viewport.
