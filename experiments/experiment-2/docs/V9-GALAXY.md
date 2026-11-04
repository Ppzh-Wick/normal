# 实验2：星河学脉

## Source and licensing
- Official component: https://reactbits.dev/backgrounds/galaxy
- Original source: https://github.com/DavidHDev/react-bits/blob/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4/src/content/Backgrounds/Galaxy/Galaxy.jsx
- Retrieved 2026-11-04. React and native WebGL2, no added runtime dependency.
- MIT + Commons Clause. Full upstream notice retained in licenses/React-Bits-LICENSE.md and public/THIRD-PARTY-NOTICES.txt. This is use within a website, not a resale of the component.
- Original source and CSS retained in reference/Galaxy.* for reproducible comparison. Production VERTEX/FRAGMENT unchanged; lifecycle adapted for the exhibition.

## Art direction
Only the relationship chapter changes. Silver/dust-blue stars, sparse warm-white highlights, deep navy and visible cyan-blue auroral ribbons and violet cloud layers. The static SVG auroral cloud canopy is custom and explicitly separate from the official Galaxy starfield; it is not the React Bits Aurora component. No new animation loop or second canvas was added. No warp, flash, pulsation or suggestion that graph positions are astronomical/history coordinates. Historical images remain untouched. Main introductory material stays mineral-grained and frosted.

## Runtime budget
- disableAnimation=true, intro=false, speed=0, starSpeed=0, twinkleIntensity=0, rotationSpeed=0.
- mouseInteraction=false, mouseRepulsion=false, clickWarp=false; no pointer listeners in static mode.
- Two star layers; dpr=1 with hard 600,000-pixel backing-store ceiling; low-power context request.
- A single render after visible/active resize, then zero queued RAF. Inactive, hidden-page and offscreen modes cancel scheduled frames; hidden resize allocation is deferred. Context loss immediately restores poster. Cleanup releases programs and buffers.
- At widths <=999px or prefers-reduced-motion, Galaxy does not mount. There is no continuously running galaxy effect on any device.
- Static fallback: lossless 960×600 WebP, 45,610 bytes, rendered by the exact original shader with the wrapper parameters. A CSS background is always available before WebGL succeeds. It remains underneath browser failures.

## Verification and limitations
- 18 production JSX lifecycle tests cover actual hooks with mocked graphics/scheduling, not just text matches. They check static single draw, no pending RAF, hidden/offscreen/active gating, resizing, pointers, errors, cleanup and context loss.
- Native offscreen shader rendering compiles the real shader via already-installed Mesa EGL/llvmpipe. See galaxy-native-render.json and scripts/render-galaxy-poster.py. It is not browser GPU integration or frame-rate testing.
- This browser's official Galaxy demonstration and local WebGL2 preview cannot create a working context; browser visual review therefore verifies the exact-shader poster fallback. No hardware FPS or real-phone performance claim.
- Local browser review: 24 nodes, selection/evidence panel and focus, categories, narrow 582px CSS layout, search/list, no horizontal page overflow. Narrow mode has no Galaxy canvas. This is resized/zoomed desktop Chromium, not a physical phone.
