# Optical spine v2 — transmission-led

Independent revision, previous sculpture files untouched.

Changes: wider main volumes; primary metalness0–0.035 and transmission0.94–1.0; thicker optical folds; stronger neutral environment; camera-invisible low-saturation cyan/lilac procedural studio card visible only in reflection and transmission. The card is not visible directly to the camera, so output retains transparent background rather than a baked rectangular backdrop. More light bounces support overlapping glass layers.

`preview.png`:256×800 small render, inspected before final render.
`sculpture-front.png`:512×1600 RGBA final master.
`sculpture-front.webp`:same dimensions and uncropped framing, high-quality alpha-preserving format conversion.
`render.py`:canonical procedural scene and render script.
`optical-sculpture.blend`:editable studio model.

Reproduce: `blender -b -t 6 -P render.py -- final`
Final uses adaptive sampling, max512samples, up to16 light bounces/12 transmission bounces. No AI-generated or historical imagery; abstract decorative mineral form only. Dimensions and framing preserve original composition for straightforward replacement. The optical response is baked offline, not real-time refraction.
