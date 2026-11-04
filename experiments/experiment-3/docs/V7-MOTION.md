# V7 motion direction and component provenance

This independent edition keeps V6's ultramarine, cinnabar and ivory palette and every historical record/image unchanged. It replaces the overlapping page cross-fade with a directional folio advance: the incoming page moves as one flat snapshot, with two narrow colored edges, while the old page recedes. Back navigation reverses the direction. It is a custom View Transition implementation, not a React Bits component.

## Actual React Bits implementations

All three were retrieved from the official repository at commit `4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4` on 2026-11-04. Original-file SHA-256 hashes are recorded in `react-bits-v7-sources.json`.

- [SplitText](https://github.com/DavidHDev/react-bits/blob/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4/src/content/TextAnimations/SplitText/SplitText.jsx): the three-character name rises once. Uses GSAP SplitText and ScrollTrigger. No loop or hover spring. Adaptations keep text visible if setup fails and omit unused pointer listeners. Mobile/reduced-motion render an ordinary h1.
- [AnimatedContent](https://github.com/DavidHDev/react-bits/blob/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4/src/content/Animations/AnimatedContent/AnimatedContent.jsx): finite 30–36px transform/opacity entrances for the biography text, research chapter heading and source statement. Once only, no blur, scrub or disappearance. Adapted with a disabled mode for mobile/reduced motion and progressive visible content.
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
