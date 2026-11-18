# Independent live-material chronology experiment

This preview extends chronology-camera-study without modifying that preview or
any original address. Historical content, chronology navigation, relationship
chart, and 山川足迹 are byte-identical to the preceding runtime.

## Reference research and scope
Readable Work / WorkItems / GazeCamera classes, Work UIL configuration, and the
WorkItem / FlowerParticle / Spine / Chain / WorkComposite / GlobalComposite /
MouseFluid dependencies were inspected in the unofficial educational archive
https://github.com/Abdulhadi446/activetheory.net . The shader collection named
compiled.vs contains real vertex and fragment shaders; compiled.fs is an HTML
fallback and must not be mistaken for proof that all shaders are unavailable.
The archive is not an official complete MIT release. None of its runtime code,
shaders, textures, models, point clouds, fonts, or original videos is shipped here.

## Implemented independently
1. Original procedural environment and 7600 clustered petal/spine particles.
2. One environment FBO; transparent, independently generated curved fragments
   sample that environment into a second scene FBO.
3. Chronology glass cards sample the scene FBO in screen space, with smooth
   rounded edges, mild blur, normal-wave offset, and local pointer refraction.
4. Historical images are uploaded once and retain their existing contain/crop
   composition. Titles and dates stay in the existing sharp DOM layer.
5. Mouse interaction changes refraction sampling and local reflected colour;
   scene particles/fragments respond to a damped pointer impulse. This is not a
   claim to reproduce the original Navier–Stokes fluid simulation.
6. The recovered camera math and FOV/local-position constants remain in use.
   Unknown original mesh bounds remain independently calibrated, not copied.

## Resource limits and fallback
The background has no private animation loop. One controller renders at up to
30Hz while idle and refreshes with camera changes. DPR is capped at1.25 and the
scene at1.8M pixels. There are two reusable FBOs, one point draw, and no runtime
GPU readback. Hidden/offscreen views stop rendering; reduced motion freezes
material time. If WebGL/shader/FBO setup fails or the context is lost, the prior
software background and DOM images remain available. Original pointer geometry
supplies correct card-local UV while its old CSS glow is hidden in live mode.

## Verified, 18 November 2026
- JS syntax checks passed; unchanged bundled chronology/other-page runtime and
  historical text/image data compared byte-for-byte.
- Mesa surfaceless EGL GLES2 compiled/linked and executed the actual procedural
  shaders. Scene-only execution:255 GL calls, zero GL errors.
- A simulated-DOM recorder replayed the actual scene and card GL calls with two
  historical-image textures:10 shader compiles,5 program links,1013 GL calls,
  zero GL errors. The resulting native GL frames were visually inspected.
- Two pointer positions changed pixels only inside the targeted card, confirming
  shader UV/reflection response rather than a separate CSS spotlight.
- Native rendering caught and corrected a real mediump-noise overflow causing a
  black corner. This goes beyond text-only syntax verification.

## Explicitly not verified
These are native GL tests, NOT screenshots or FPS tests from the browser.
The CDP browser could not read requirements; native input reported an unavailable
AT-SPI provider. Reattaching the cloud environment did not resolve either.
Real DOM composition, actual pointer events, repeated details/back navigation,
end-to-end scrolling, and target-machine frame rate are therefore not certified.
No claim of perfect Active Theory reproduction or tested browser smoothness is
made. Original assets, fluid solver, postprocessing and details transition are
not replicated exactly. This is a separate testable implementation of the
rendering chain, not a completed replacement for the original exhibition.
