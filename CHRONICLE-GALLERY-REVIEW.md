# Archive chronology gallery: desktop review only

This independent branch preserves the previous `experiment-2-spatial-journey` commit eca53755755a82f785255f65aa55025351abeb2b and the earlier Dot branch da6cede70a3c7db67e1d255cf7b5045150e1a872. It does not publish or overwrite the main site or the Codex chronology-spiral preview.

## Scope correction
Only the original ArchiveRoom timeline is enhanced. The original #life introduction and the original ArchiveRoom places/FootprintJourney remain. The earlier experimental LifeChronicle component is no longer mounted. Existing phone view is preserved; this review's work and visual checks are desktop-only.

## Reference actually inspected
The user supplied a 49.33 second 1280x720 recording of Active Theory. It was decoded and visually reviewed across the whole duration at 2-second intervals; motion sections 10–26 and 29–44 seconds were reviewed at half-second intervals. No copy of the private recording is included in this repository.
- At 14–26 seconds: successive panels follow an arc with depth, height differences and orientation changes; the next approaches from the right/back and the previous leaves left/up.
- Around 29–30 seconds: the RACER board expands into a closer project view; around 43–44 it returns to the larger exhibition.
- The user clarified that return is scrolling, not a button. The implementation uses one reversible native-scroll route, not click-only entry/exit.
- Actual website access in the cloud browser led to /unsupported. We do not claim to have directly interacted with the supported original website.

## Implementation
One plate per sourced chronology record. Native scroll continuously maps to approach → front reading → withdrawal → orbit toward the next year. Reverse scroll retraces the same route. Buttons/year links remain keyboard alternatives.
DOM/CSS perspective plates keep historical images and readable/selectable HTML. An original, geological, faceted core and bounded dust field use real r3f-scroll-rig GlobalCanvas and Three.js, demand rendered. No copied Active Theory models, textures, videos, shaders, logos or code. No synthetic historical imagery.
GPU canvas lazily mounts only for eligible desktop, active tab, sufficient hardware and non-reduced-motion. DPR 1, 1,300 points, 24 layered fragments, no shadows/bloom, no idle RAF loop. Max five DOM plates. Reduced motion, context failure and manual lite mode retain a flat readable timeline. The text view retains all 29 entries. Two posthumous entries remain explicitly labelled.

Sources retain original chronology references and image/date caveats; 1926 stoppage scope and 1965 advice-from-home wording remain cautious.
