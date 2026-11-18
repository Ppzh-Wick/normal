# AT reference particle cloud layers

Original deterministic offline render, composition studied from the user's recording at 15.0/16.0 seconds. No reference pixels copied. These are abstract decorative particles, not historical imagery.

## Assets
All three layers: 1600 × 1000, transparent RGBA, matched canvas coordinates.
- particles-far.webp / .png: fine low-contrast outer wisps, slightly expanded depth.
- particles-body.webp / .png: main irregular curled granular volumes.
- particles-near.webp / .png: sparse larger grains and tiny faceted flakes.
- preview-dark.jpg: combined inspection only on #141A20; do NOT use as a transparent layer.

## Composition
Left violet clusters x≈23–40%, primarily y≈67–100%.
Right upper/middle blue-violet x≈65–84%, primarily y≈18–68%.
Right lower rose-magenta x≈63–81%, primarily y≈70–100%.
Center and top-left are empty. No central sculpture, smoke-glass terrain, portal, uniformly scattered starfield, text, or broad glow overlay.

## Integration guidance
Composite behind the historical panels and independent central sculpture. Each full-size layer must share the same container/aspect mapping. Use opacity/body≈0.85–1, far≈0.7–1, near≈0.7–1 to tune against scene. Optional tiny transform-only parallax (far2px/body4px/near7px) must not run a per-particle canvas loop. No CSS blur or screen blend needed. The runtime cost is only 3 static image textures; no particle rasterization in browser.

## Reproduction
`python render.py`; seeded Pillow2× supersampling, ellipse/faceted grain rendering, transparent downsampling; WebP q89. PNG originals supplied for further compositing. The written reference is not a claim of pixel-perfect fidelity: motion and occlusion come from the site's scene layers.

## Brightness pass and single-texture option
`particles-combined.webp` / `.png` are the transparent composite of all three layers, recommended for the first low-cost integration. The composition is unchanged. Body grains have higher opacity, sparse pale-cyan/white glints are8.5% of local grains, and a2px halo exists only in dense cloud areas. No fullscreen haze or opaque background is baked in. All layers are still supplied separately if transform-only depth is later desired.
