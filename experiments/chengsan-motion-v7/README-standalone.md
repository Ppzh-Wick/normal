# Standalone exhibition

Run `npm run build`, then `node scripts/build-standalone.mjs`. Output: `../李承三-山河之间-翻页叙事实验.html`. Open locally with JavaScript enabled. No server, CDN, external module, image, or font request is required. Source links need network only when opened. The decorative abstract terrain uses Canvas 2D, not WebGL or historical map reconstruction.

The builder reads dist and public without modifying either, inlines all referenced public images/fonts and built CSS/JS, and rejects unresolved imports/resources. Unused public files are omitted. See scripts/standalone-report.json for counts.

React Bits SplitText, AnimatedContent and adapted StaggeredMenu source: https://github.com/DavidHDev/react-bits/tree/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4 . Retrieved 2026-11-04 UTC; MIT + Commons Clause notice is retained in the HTML and licenses/React-Bits-LICENSE.md. Font notices are retained in the HTML and licenses/Noto-CJK-COPYRIGHT.txt. Runtime package notices are also embedded. Historical-image provenance and rights cautions remain in the application; this local preview does not grant publication/reuse rights.
