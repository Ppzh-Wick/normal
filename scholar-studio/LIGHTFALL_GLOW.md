# Scholar gallery overhead light

The top-center of the scholar gallery now emits warm champagne light (#d5b68b), fading down into the existing #171114 ground. This is a focused overhead light rather than a change to the meteor brightness.

`backgroundColor` in the existing Lightfall API feeds `uTopColor`; it does not paint the container. `backgroundGlow` is 0.48. `headGlow` remains 0.45 and `bloom` remains 0.24. The composite shader uses a compact bright core and broader soft falloff below it.

The existing 30 fps / 1,000,000 pixel budget, offscreen pausing and reduced-motion handling remain in place. No additional render passes or dependencies were added.

Validation: Vite production build; desktop browser visual check. Reference: https://reactbits.dev/backgrounds/lightfall .
