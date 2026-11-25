import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      formats: ['es'],
      fileName: () => 'minimalist-tv-control-card.js',
    },
    target: ['chrome111', 'edge111', 'safari16.4', 'firefox113'],
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    rolldownOptions: {
      output: {
        banner: `/*! Minimalist TV Control Card v${pkg.version} · MIT · https://github.com/extraiotpruebas/minimalist-tv-control-card */`,
      },
    },
  },
  server: {
    open: '/dev/harness.html',
  },
});
