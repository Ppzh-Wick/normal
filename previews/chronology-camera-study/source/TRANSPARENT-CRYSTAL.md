# Fractured optical material v2

Eight-segment geometry source is byte-identical to the previous `at-crystal` study. Only material, optical environment and baked alpha treatment changed. No website files touched.

## Material changes
- Removed broad cyan/pink-filled transmission environment. The large environment is neutral and has finer irregular dark/light detail.
- Seven small, unequal cyan/rose/violet optical reflectors create local color instead of large flat color-filled faces.
- Two-scale optical bump normals break reflections into smaller faces while retaining polished roughness.
- Reduced pigment tint in body materials.
- Enabled Cycles `film_transparent_glass` and roughness threshold. Testing showed this switch alone only modestly improved alpha because transmission sees optical environment cards.
- Added Fresnel-controlled Transparent BSDF mixing: positive-view transmission areas expose page background while glancing edges retain the baked reflection. Final mix retains0.40+0.55×Fresnel of the material, plus locally stronger small spectral reflectors. This is a baked art-direction compromise, not live scene refraction.

## Tests preserved
`preview-opaque.png`: previously approved small-facet material without alpha changes.
`preview-film-glass-only.png`: Cycles switch only.
`preview-transparent-mix.png`: successful initial view-dependent transparency test.
`preview-on-teal.png`: standard alpha compositing of that test on a dark teal background.
`render-opaque.py` and `render-film-glass-only.py` preserve comparison sources.

Initial81×256 test: only the film switch changed opaque share80.55%→76.95%. Transparent mixing changed opaque share to3.06%, with mean nonzero alpha189.8/255. Among6978 pixels that were previously fully opaque,58.9% became alpha<240 and45.1% became alpha<200: this was interior transparency, not only antialiasing at edges. Final was slightly adjusted to preserve more body volume and local cyan/rose highlights; final statistics are recorded separately after rendering.

## Final
`sculpture-front.png`:512×1600 RGBA master.
`sculpture-front.webp`:same framing/dimensions, high-quality alpha-preserving web texture.
`render.py`, `optical-sculpture.blend`: editable sources.
Reproduce with `blender -b -t 6 -P render.py -- final`.
No continuous animation, shaders or added runtime rendering required. Start with overall CSS opacity1 so the baked interior alpha performs its purpose. This remains decorative abstract art, not a historical image or mineral reconstruction.
