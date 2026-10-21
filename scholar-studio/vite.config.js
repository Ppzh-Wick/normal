import { defineConfig } from 'vite';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Keep original photography and the earlier video in source, but do not ship
// unused alternatives to the static hosting output.
const unused = new Set(['images/hero-glacier.jpg', 'images/hero-poster.jpg', 'media/hero-campus.mp4']);
for (const size of [800, 1600, 1920, 2560, 'edge']) unused.add(`images/hero-glacier-${size}.webp`);
const publicRoot = fileURLToPath(new URL('./public/', import.meta.url));
export default defineConfig({
  build: { copyPublicDir: false },
  plugins: [{
    name: 'ship-used-public-assets',
    apply: 'build',
    generateBundle() {
      const visit = (folder, prefix = '') => {
        for (const entry of readdirSync(folder, { withFileTypes: true })) {
          const name = `${prefix}${entry.name}`;
          const filename = path.join(folder, entry.name);
          if (entry.isDirectory()) visit(filename, `${name}/`);
          else if (!unused.has(name)) this.emitFile({ type: 'asset', fileName: name, source: readFileSync(filename) });
        }
      };
      visit(publicRoot);
    },
  }],
});
