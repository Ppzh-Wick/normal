# Source-led camera experiment, 18 November 2026

This is a separate preview. Existing URLs and 山川足迹 are unchanged.

## Verified reference
Unofficial source archive: https://github.com/Abdulhadi446/activetheory.net
JS blob: 1d5400fe9069db12190154e7c04c002cb32bbbd1.
`WorkItems.positionViews`, `handleCameraScroll`, `GazeCamera`, and Work settings in
`assets/data/uil.1746999829739.json` were read. This is not an official complete
open-source release. No original runtime, shaders, media, font or binary geometry
has been imported into this experiment.

## Independent implementation
- Panel group radius 3.8, angular step -50 degrees; Y step .12*min(7,count).
- Camera group targets at 2x radius. Interpolation is along target chords, not a
  circular orbit. Yaw-only target rotations use equivalent shortest-arc SLERP.
- Whole-exhibition smoothstep(.06,.94), then adjacent-year interpolation.
- Frame-rate-normalized .2 camera following; old progress smoothing removed.
- Actual entrance/exit Y offsets, using raw exhibition scroll (including plateaus).
- Camera local Z +2, vertical FOV35, forward lookAt [0,0,-4].
- Source pane scale 4x2.6. The binary mesh bounds cannot be verified; our flat
  geometry uses .78 normalized bounds calibrated against the supplied recording.
  On narrower-than-16:9 viewports these bounds reduce to avoid lateral clipping.
- Source pane rotationZ180 relates to its mesh/UV. Our own DOM text and images stay
  upright; the original shader's small surface wobble/shear is not reproduced.
- Pointer light and all historical text/images remain from the existing preview.

## Limits
This is a camera experiment, not a pixel-perfect or shader-complete clone.
Central glass remains a static render. It does not use original real-time
refraction, volumetric particle simulation, or original work/videos.

Node syntax, mathematical tests, and byte-scope checks pass. Browser visual and
performance verification is blocked in this run: CDP requirements unavailable,
AT-SPI provider disconnected, and standalone Chromium fails OS socket EPERM even
on an approved elevated retry. Do not interpret prior previews' timing metrics as
measurements of this build. No claim of validated frame rate or exact visual match.
