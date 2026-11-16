# 生平年谱空间穿行：待审分支

This branch does not publish or update GitHub Pages. The preserved previous review is `experiment-2-hierarchy` at `da6cede70a3c7db67e1d255cf7b5045150e1a872`.

## Scope
The original `#life` section now carries the life chronology. All 29 existing chronology events are retained, from birth in May 1899 through death in May 1967, plus two separately labelled posthumous memorial records (1998, 2002). This is not just a geographical itinerary. The prior footstep modal, relationship atlas, sidebar and other chapters remain intact.

## Real implementation
- `@14islands/r3f-scroll-rig` npm 8.15.0 (its shipped runtime banner is stale 8.14.0): GlobalCanvas, useTracker, useScrollRig/requestRender.
- `@react-three/fiber` 9.8.2 and Three.js 0.183.2.
- Real world-space panels and a perspective camera advancing along a curved 3D path according to native document scroll. HTML text stays fixed, selectable, accessible and source-linked.
- No SmoothScrollbar/window-scroll hijack is added. The existing site's long-chapter navigation continues to handle its native document scrolling.
- Library is lazy-loaded only when the chapter is active on eligible desktop devices. Canvas uses demand rendering, DPR 1, max four live panels, texture/geometry disposal and visibility handling. No bloom, shadows, postprocessing or permanent animation loop.
- Mobile uses complete native document text; reduced motion, low memory/core count, data-saver, explicit lite mode and WebGL errors retain readable static content.

## Licenses
Official distributed r3f-scroll-rig LICENSE is MIT, Copyright 2023 14 Islands AB. Its package.json metadata says ISC; the actual MIT LICENSE is included unchanged. Fiber and Three MIT notices are also included under public/licenses.

## Evidence boundaries
Records derive from the existing supplied 11-page chronology and previously recorded public references. This is not an independent verification of every life event. The 1926 stopping-scope ambiguity is not adjudicated; 1965 advice from Chengdu is not depicted as travelling to Xichang. Historic photographs are not recolored or replaced; dates are distinguished from event dates. Abstract plates are explicitly not historic scenes.

## Review limits
Automated browser validation runs in CI Chromium with SwiftShader for WebGL. This demonstrates real WebGL rendering and interaction, not physical GPU or Safari performance. Screenshots and regression checks are required before proposing publication. No public main update is authorized in this iteration.
