# Fractured optical column — recording-led study

Original modeled geometry rendered offline in Blender; no historical imagery or third-party source assets copied. Reference is the user's Active Theory recording, particularly15/16-second frames. This is a decorative optical structure, not a reconstructed mineral specimen.

## Geometry
Eight separate thick, short, irregular glass solids with unequal height, radial outline, bevel, off-center position, tilt and spacing. Two solids include a through-hole. Top and side fragments are sparse. A former continuous twisting ribbon was explicitly rejected and removed. No continuous axial rod remains. There are a few black gaps but most of the stack visually overlaps, avoiding an even string of beads.

## Material
Mostly clear/light silver glass with cyan, rose and pink-violet internal refractors. A camera-invisible colored optical environment is visible to transmission/reflection rays only. Neutral front environment is reduced so internal color is not washed into pastel white; deep sapphire-blue pigments were replaced with brighter cyan and pink-purple after small-render review.

## Deliverables
- `sculpture-front.png` and `sculpture-turn.png`: final512×1600 RGBA masters, same camera/framing; second angle+0.30rad(17.2degrees).
- Same names`.webp`: uncropped alpha-preserving high-quality web versions.
- `preview-cylinders.png`: early separate-solid geometry study.
- `preview-fractured.png`: final irregular/offset geometry small test, before final blue→cyan color adjustment.
- `render.py`: canonical scene-generation source.
- `optical-sculpture.blend`: editable Blender scene.

Reproduce: `blender -b -t 6 -P render.py -- final all`.
Final uses384max adaptive samples, min64; preview is approximately163×512. For smooth browser performance, use static images with scroll-driven opacity/transform and no idle animation. The image does not compute real-time refraction; reflections are baked. Two-angle crossfade approximates changing optical faces, not physically correct continuous3D rotation.

## Verified final outputs
Both final masters viewed at full resolution. Front alpha bounds `(27,121)–(455,1539)`: visible width428/512=83.6%. For a visible18vw spine, display entire image at about21.5vw; retain the full image aspect ratio. This corresponds to image height about67.2vw, so a modest vertical crop is expected at desktop aspect ratios. Keep both images registered without crop or independent scaling.
Front WebP167568bytes; turn WebP listed by file size. Both are quality94, alpha-preserving, no resize/crop. Surfaces are intentionally bright optical cyan/rose/violet with dark internal gaps; the material is not a dark metallic ribbon. Earlier continuous-ribbon render script and rejected previews remain for comparison but should not be used on the site.
