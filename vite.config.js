// Configuración de Vite para la tarjeta.
//
// `npm run build` → dist/minimalist-tv-control-card.js: UN solo archivo, módulo ES,
// sin dependencias externas. Es el que se instala en Home Assistant (HACS lo busca
// en dist/ por el `filename` de hacs.json).
//
// `npm run dev` → servidor de desarrollo en http://localhost:5173/dev/harness.html
// que recarga la página al guardar. (Un custom element no se puede registrar dos
// veces en la misma página, por eso no hay "reemplazo en caliente": se recarga todo.)
import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  build: {
    // "Library mode": el resultado es un módulo para que otro (HA) lo cargue, no una
    // página web. Solo formato `es`: HA carga los recursos como `type: module`.
    lib: {
      entry: 'src/index.js',
      formats: ['es'],
      fileName: () => 'minimalist-tv-control-card.js',
    },
    // Navegadores mínimos que documenta el README (color-mix, container queries).
    // Vite no traduce sintaxis que estos ya entienden.
    target: ['chrome111', 'edge111', 'safari16.4', 'firefox113'],
    outDir: 'dist',
    emptyOutDir: true,
    // Sin minificar: con gzip la diferencia es de ~11 KB (42 KB contra 31 KB) y HA lo
    // descarga una vez. A cambio, el archivo se puede leer y depurar en el HA de un
    // cliente: conserva nombres, JSDoc y marcas `// src/...` de cada módulo.
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
