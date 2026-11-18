# Sculptural background study

Separate preview, built after feedback that particles existed but the background
was still unlike the reference. The published camera and live-material previews
are retained. Chronology data, route/detail logic, camera, graph and 山川足迹 are
unchanged.

## Corrected interpretation
The actual SpineShader and ChainShader output opaque colour (alpha1). Their
sculptural appearance comes from volume, normals, reflected lighting and warped
scene samples, not low-alpha floating leaves. Read-only analysis of the source
geometry revealed a vertebra-like unit with a central hole and three processes.
Original assets were inspected as reference only; no vertex arrays, original
textures, shaders or runtime were copied into this preview.

## Independent reconstruction
- Asymmetric, thick vertebral units: broader flattened front body, rear-shifted
  hole, lateral processes and a tapered posterior process. Each layer has small
  deterministic variation rather than an identical inflated ring.
- Source-observed .65 layer spacing and .4-radian progressive turn.54 independent
  layers instead of the original40 extend across this longer chronology.
- A thin rounded-link secondary chain crosses behind/in front of the column.
- Opaque depth-tested geometry; broad neutral silver shading with local cyan,
  violet and pink reflection bands plus the existing environment FBO sample.
- Particle budget remains7600.80% are concentrated into six primary clusters,
  with20% dispersed. This is redistribution, not more stars.
- Existing real-time glass and mouse refraction remain. Archival-image blending
  is raised modestly to protect portraits from the much brighter sculpture.

## Cost controls
Indexed geometry shares34926 vertices instead of182016 duplicated vertices.
Only the scene-output FBO has a depth attachment. DPR is capped at1 and total
pixels at1.8M. DOM text stays sharp. Existing hidden/offscreen suspension,
reduced-motion handling and WebGL failure fallback remain.

## Verification
- Node syntax checks passed.
- Native Mesa EGL/GLES2 early/middle/late frames were rendered and inspected;
  the sculpture/chain remain present near the end of the chronology.
- Full scene + historical-image card pass after readability adjustment:
  10 shader compiles,5 program links,1080 real GL calls, zero GL errors.
- Actual renderer: llvmpipe (LLVM19.1.7,256 bits), software GL.
- Scene draw replay including Python overhead was commonly21–32ms, with runs
  showing40–75ms variation. These are NOT browser FPS results and do not certify
  smoothness on the user's computer.
- The original browser/CDP and native-input provider remain unavailable; native
  GL frames do not validate DOM composition, real mouse events or browser scroll.

This is an independent visual study of the source's structural/material logic,
not a claim of identical geometry, textures, fluid solver or complete original
rendering. The prior thin-leaf interpretation was materially wrong; this version
addresses form and lighting rather than hiding that problem with more particles.
