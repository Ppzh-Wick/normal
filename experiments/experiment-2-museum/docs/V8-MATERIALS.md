# V8: mineral gradient and frosted exhibition labels

V8 responds to the request for React Bits backgrounds, particularly frosted materials whose colors feel refined. It preserves V7's directional folio transitions and every historical record/image. This is an independent preview.

## Real upstream components

Source revision: React Bits `4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4`, retrieved 2026-11-04. Official component source is copied and adapted, not merely named in a comment.

- [Grainient](https://reactbits.dev/backgrounds/grainient), [source](https://github.com/DavidHDev/react-bits/blob/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4/src/content/Backgrounds/Grainient/Grainient.jsx): actual native WebGL2 two-pass shader, without three.js/OGL. The original shader code and Oklab palette interpolation are preserved. Mineral colors run from deep ultramarine through blue-gray to muted warm copper. Rendering is static: speed=0, grainAnimated=false, interactive=false, clickSwirl=false, intro=false. The intent is a material, not a moving distraction.
- [Glass Surface](https://reactbits.dev/components/glass-surface), [source](https://github.com/DavidHDev/react-bits/blob/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4/src/content/Components/GlassSurface/GlassSurface.jsx): a frosted-only specialization extracted from the real official `refraction=false` render branch, used only for the small portrait label and graph introduction. Unused SVG/WebGL refraction, image tracing, displacement generation and feature probes are omitted, rather than shipping dead shader code. The original container, sheen, rim and content structure and corresponding upstream CSS remain. CSS blur is reduced from 12px to 7px, with a tinted opaque floor. It does not start a second WebGL canvas.

Both components carry MIT + Commons Clause. The full repository license remains in `licenses/React-Bits-LICENSE.md` and public third-party notices. Existing GSAP license and other notices remain. This is an integrated website, not a standalone component pack.

## Deliberate modifications

Grainient has an added active flag, 600,000-pixel output budget (field pass uses half dimensions), low-power context preference, and no drawing before intersection visibility. Resize is deferred until a visible frame. Hidden tabs, offscreen state and inactive chapters cancel RAF immediately. A stable settings signature prevents incidental React renders from waking a static background. Disabled pointer effects do not register global pointer listeners. Failed shader setup and partial resource allocation are cleaned up; context loss reveals the fallback. The initial static material takes one two-pass frame, then has no background animation loop.

A static 960×600 rendering of these exact Grainient shaders and configured parameters is always underneath the live canvas. It was generated using the existing Mesa EGL / llvmpipe software rasterizer, then encoded as WebP. This is a genuine static shader output, not a screenshot of browser GPU rendering. An original CSS gradient remains the last fallback if the image fails. Mobile and reduced-motion branches never mount Grainient. WebGL/context failures also keep the designed fallback visible. Small glass labels lose backdrop filtering on mobile/reduced-motion or unsupported browsers.

The existing geometric terrain is retained but visually reduced, and pauses while menu/image dialogs cover the opening. Historic photographs and scanned paper are not recolored, blurred, or replaced. The warm copper stays in background light and labels; body copy and primary controls keep a dark, readable floor.

## Browser observation boundary

The official Glass Surface demo was actually viewed in cloud Chrome. The official Grainient page loaded, but its canvas stayed at default dimensions and showed no rendered gradient in this cloud browser. V8 likewise correctly used its static shader-image fallback. Therefore the browser screenshots prove the static material and GlassSurface composition, not working live WebGL shader rendering on this environment. The original three shaders separately compiled and rendered without GL errors in Mesa OpenGL ES 3.2 / llvmpipe CPU software rasterization; that offscreen result is not a browser GPU benchmark. Automated lifecycle mocks do not establish real-device GPU speed or frame rate.
