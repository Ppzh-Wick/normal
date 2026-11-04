import {defineConfig} from 'vite';
export default defineConfig({esbuild:{jsx:'automatic'},base:'./',build:{target:'es2022',assetsInlineLimit:0}});
