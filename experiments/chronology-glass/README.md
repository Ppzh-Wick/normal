# Chronology glass study

Based on the preserved Codex chronology and Active reference study. No changes to its scroll input, camera transforms, event handling, milestones or reading views.

Actual React Bits GlassSurface component from:
https://github.com/DavidHDev/react-bits/tree/main/src/content/Components/GlassSurface
Fetched 2026-11-17. Source is retained under src/vendor and license alongside it.

Each visible plate gets an isolated React root containing GlassSurface as its optical backing. The original photo/text DOM stays above it, so text is not distorted. Browser support selects SVG refraction or CSS backdrop-filter fallback; no claim of guaranteed WebGL.

Additional visual layers: wide optical border, recessed sharp photo, inner bevel, foreground label, exterior depth shadow. Existing gallery, crystal-column and directory mechanics preserved.

Build: npm install then npm run build. Public files: previews/chronology-glass. This directory is independent; older previews are untouched.
