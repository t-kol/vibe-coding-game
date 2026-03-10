import { defineConfig } from 'vite';

// Post-build plugin: strip type="module" and crossorigin from the emitted
// script tag so the IIFE bundle loads correctly when served from file://
function fixIifeScriptTag() {
  return {
    name: 'fix-iife-script-tag',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<script\s+type="module"\s+crossorigin\s+src="(\.\/assets\/[^"]+)">/g,
                 '<script src="$1">')
        .replace(/<link rel="modulepreload"[^>]*>/g, '');
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [fixIifeScriptTag()],
  build: {
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
