# V7 motion direction and component provenance

This independent edition keeps V6's ultramarine, cinnabar and ivory palette and every historical record/image unchanged. It replaces the overlapping page cross-fade with a directional folio advance: the incoming page moves as one flat snapshot, with two narrow colored edges, while the old page recedes. Back navigation reverses the direction. It is a custom View Transition implementation, not a React Bits component.

## Actual React Bits implementations

All three were retrieved from the official repository at commit `4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4` on 2026-11-04. Original-file SHA-256 hashes are recorded in `react-bits-v7-sources.json`.

- [SplitText](https://github.com/DavidHDev/react-bits/blob/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4/src/content/TextAnimations/SplitText/SplitText.jsx): the three-character name rises once. Uses GSAP SplitText. In Experiment 3, the entrance trigger is event-driven IntersectionObserver rather than ScrollTrigger. No loop or hover spring. Adaptations keep text visible if setup fails and omit unused pointer listeners. Mobile/reduced-motion render an ordinary h1.
- [AnimatedContent](https://github.com/DavidHDev/react-bits/blob/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4/src/content/Animations/AnimatedContent/AnimatedContent.jsx): finite 30–36px transform/opacity entrances for the biography text, research chapter heading and source statement. Once only, no blur, scrub or disappearance. Adapted with a disabled mode for mobile/reduced motion and progressive visible content. Experiment 3 retains the GSAP animation and replaces its entrance trigger with the same observer helper.
- [StaggeredMenu](https://github.com/DavidHDev/react-bits/blob/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4/src/content/Components/StaggeredMenu/StaggeredMenu.jsx): its layerStates/panelInsertTime/itemsStart GSAP timeline is adapted into a controlled native dialog. The original sliding prelayers, offset panel and rising item stagger are retained. Application-specific semantic links, Escape, native focus containment and immediate cancellation replace the original logo/social/text-cycle controls. Closing never waits for an animation.

React Bits is MIT + Commons Clause, not unrestricted MIT. The notice is preserved in `licenses/React-Bits-LICENSE.md`. These implementations are integrated into this website; this is not a standalone component pack.

## Engine and performance boundaries

GSAP 3.15.0 + @gsap/react 2.1.2 replace the previous Motion runtime. No second animation engine is loaded. GSAP uses its Standard No-Charge License; the preserved notice links to its official terms. The site is not a visual animation builder.

- The folio lasts 560ms visually, but the wheel-input lock remains a fixed 380ms. Fresh explicit navigation interrupts immediately. Momentum does not extend the lock.
- Native transitions are progressive enhancement. Unsupported browsers navigate without a snapshot; free reading and mobile keep natural scrolling.
- The synchronous transition callback only commits state, URL and scroll. It does not fetch or decode images.
- A shared owner guards chapter/artifact/media updates, handles every native transition promise and cancels stale focus or scroll work. Reduced motion, mobile changes, free reading and unmount cancel pending navigation.
- No added WebGL, full-screen blur, autoplay background, perpetual page animation or replay-on-every-scroll behavior. The original cached terrain and bounded canvas are retained.
- No numeric frame-rate or real-device performance claim is made.

## References consulted

- [React Bits AnimatedContent](https://reactbits.dev/animations/animated-content)
- [React Bits StaggeredMenu](https://reactbits.dev/components/staggered-menu)
- [Chrome same-document View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document)
- [GSAP license](https://gsap.com/community/standard-license/)

## Experiment 3: idle entrance adaptation

This edition retains the React Bits GSAP timelines, SplitText splitting/masks/eases, and StaggeredMenu animation. It changes only how finite entrances start. The local AnimatedContent adapter omits the unused `scrub` prop/path; this exhibit never enables scroll scrubbing. Mount triggers, once/reverse entrance behavior, stagger, wipe, and finite disappearance remain. Do not add a top-level ScrollTrigger import to restore an unused API.

The project locks GSAP 3.15.0. Source inspection confirms that registering ScrollTrigger calls `enable()`, starts a self-rescheduling animation-frame callback, and installs a 250ms synchronization interval. Those plugin-wide mechanisms do not stop merely because an individual once-only entrance completes. Importing and registering the plugin at module scope therefore has an idle cost even when a component is disabled for mobile or reduced motion.

- [ScrollTrigger 3.15.0 source](https://github.com/greensock/GSAP/blob/3.15.0/src/ScrollTrigger.js): the callback is defined near line 26; registration/enable and the interval are near lines 1298–1401.
- [GSAP core 3.15.0 source](https://github.com/greensock/GSAP/blob/3.15.0/src/gsap-core.js): the core ticker has an automatic idle-sleep check. The application does not force it asleep, remove its root listener, or disable future menus/chapters.
- [GSAP SplitText 3.15.0 source](https://github.com/greensock/GSAP/blob/3.15.0/src/SplitText.ts): the retained splitter does not import ScrollTrigger.

`observeEntrance.mjs` uses IntersectionObserver plus passive scroll events. The scroll event handles instant chapter jumps that skip an intersection; it is not a frame loop. A once-only entry removes its observers and listeners before playing the existing GSAP timeline. Resize events rebuild the trigger margin; custom roots use their content box. Margins passed to IntersectionObserver are pixels because percentage observer margins resolve against width, unlike the original viewport-height entrance threshold. Missing IntersectionObserver falls back to the same event-driven check.

The helper adds no animation frame, interval, or timer. Cleanup prevents stale observer callbacks from starting an unmounted animation. SplitText disconnects its old entrance before re-splitting. No changes to GSAP core, global ticker behavior, menu timing, source records, or images are needed.

The helper regression suite covers thresholds, negative and relative margins, initial deep links, instant jumps, viewport/custom-root resize, repeated entrances, missing observer support, and cancellation. Browser verification must additionally establish that the actual full page settles to no queued/requested frames and that later chapter/menu interactions still animate. Unit/source checks alone are not evidence of a real-device frame rate.
