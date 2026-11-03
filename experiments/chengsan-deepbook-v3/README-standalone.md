# Standalone exhibition

Run `npm run build`, then `node scripts/build-standalone.mjs`. Output: `../李承三-山川为卷-展览版.html`. Open locally with JavaScript enabled. No server, CDN, external module, image, or font request is required. Source links need network only when opened. Browser WebGL2 is optional for the decorative Silk background.

The builder reads dist and public without modifying either, inlines all referenced public images/fonts and built CSS/JS, and rejects unresolved imports/resources. Unused public files are omitted. See scripts/standalone-report.json for counts.

React Bits BlurText and Silk sources: https://github.com/DavidHDev/react-bits/tree/4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4 . Retrieved 2026-11-03 UTC; MIT + Commons Clause notice is retained in the HTML and licenses/React-Bits-LICENSE.md. Font notices are retained in the HTML and licenses/Noto-CJK-COPYRIGHT.txt. Runtime package notices are also embedded. Historical-image provenance and rights cautions remain in the application; this local preview does not grant publication/reuse rights.
