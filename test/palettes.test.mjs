import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILTIN_PALETTES, PALETTE_FIELDS, contrastRatio, normalizeConfig, normalizeHex, paletteRef, paletteTokens, resolvePalette,
} from '../src/index.js';

const ONE_TV = { tvs: [{ name: 'Sala', entity: 'media_player.tv' }] };

test('normalizeHex: acepta #rrggbb, sin #, #rgb, "r, g, b" y [r, g, b]', () => {
  assert.equal(normalizeHex('#1A2B3C'), '#1a2b3c');
  assert.equal(normalizeHex('1a2b3c'), '#1a2b3c');
  assert.equal(normalizeHex('#abc'), '#aabbcc');
  assert.equal(normalizeHex('229, 9, 20'), '#e50914');
  assert.equal(normalizeHex([229, 9, 20]), '#e50914', 'el selector color_rgb de HA entrega un arreglo');
  for (const bad of ['red', '#12345', '300, 0, 0', '', null, undefined]) assert.equal(normalizeHex(bad), null, String(bad));
});

test('paletas incluidas: siempre disponibles, con los 5 colores y buen contraste', () => {
  const m = normalizeConfig(ONE_TV);
  assert.deepEqual(Object.keys(m.palettes), Object.keys(BUILTIN_PALETTES));
  for (const [name, p] of Object.entries(BUILTIN_PALETTES)) {
    assert.ok(['light', 'dark'].includes(p.base), name);
    for (const f of PALETTE_FIELDS) assert.equal(normalizeHex(p[f]), p[f], `${name}.${f}`);
    assert.ok(contrastRatio(p.text, p.background) >= 4.5, `${name}: texto sobre fondo`);
    assert.ok(contrastRatio(p.text, p.button) >= 4.5, `${name}: texto sobre botones`);
  }
});

test('contrastRatio: negro/blanco = 21, iguales = 1, el orden no importa', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#ffffff')), 21);
  assert.equal(contrastRatio('#777777', '#777777'), 1);
  assert.equal(contrastRatio('#1b1f25', '#eef1f5'), contrastRatio('#eef1f5', '#1b1f25'));
});

test('palettes del YAML: colores normalizados, inválidos avisados, reemplazan a una incluida', () => {
  const m = normalizeConfig({
    ...ONE_TV,
    palettes: {
      cine: { base: 'dark', background: '#170D0E', text: '246, 237, 237', accent: 'rojo' },
      grafito: { base: 'light', accent: '#ff6a00' },
      rara: { base: 'sepia' },
      mala: 'azul',
    },
  });
  assert.deepEqual(m.palettes.cine, { base: 'dark', background: '#170d0e', text: '#f6eded' });
  assert.deepEqual(m.palettes.grafito, { base: 'light', accent: '#ff6a00' }, 'la propia reemplaza a la incluida');
  assert.equal(m.palettes.rara.base, 'dark');
  assert.equal(m.palettes.mala, undefined);
  assert.ok(m.warnings.some((w) => /cine.*accent "rojo"/.test(w)));
  assert.ok(m.warnings.some((w) => /base "sepia"/.test(w)));
  assert.ok(m.warnings.some((w) => /"mala" no es un bloque/.test(w)));
  assert.equal(m.format, 'v4', '`palettes` solo existe en v4');
});

test('paletteRef: un nombre o { light, dark } → { light, dark }', () => {
  assert.deepEqual(paletteRef('grafito'), { light: 'grafito', dark: 'grafito' });
  assert.deepEqual(paletteRef({ light: 'nube', dark: 'grafito' }), { light: 'nube', dark: 'grafito' });
  assert.deepEqual(paletteRef({ dark: 'oled' }), { light: null, dark: 'oled' });
  for (const none of [undefined, null, '', '  ', {}, ['grafito']]) assert.equal(paletteRef(none), null, JSON.stringify(none));
});

test('asignaciones: tarjeta, TV (overrides), modo Roku y botón de streaming', () => {
  const m = normalizeConfig({
    palette: 'nube',
    tvs: [
      { name: 'Sala', entity: 'media_player.sala', companion: { media_entity: 'media_player.roku', remote_entity: 'remote.roku', palette: 'medianoche' } },
      { name: 'Recámara', entity: 'media_player.rec', overrides: { palette: { light: 'arena', dark: 'bosque' } } },
    ],
    streaming: [{ source: 'netflix', palette: 'grafito' }],
  });
  const [sala, rec] = m.tvs;
  assert.deepEqual(sala.settings.palette, { light: 'nube', dark: 'nube' });
  assert.deepEqual(sala.companion.palette, { light: 'medianoche', dark: 'medianoche' });
  assert.deepEqual(sala.settings.streaming[0].palette, { light: 'grafito', dark: 'grafito' });
  assert.equal(sala.settings.streaming[1].palette, null);
  assert.deepEqual(rec.settings.palette, { light: 'arena', dark: 'bosque' }, 'la TV con overrides tiene la suya');
  assert.deepEqual(m.warnings, []);
});

test('nombre de paleta que no existe → aviso claro con las incluidas', () => {
  const m = normalizeConfig({ ...ONE_TV, palette: 'grafitto', streaming: [{ source: 'netflix', palette: 'cine' }] });
  assert.ok(m.warnings.some((w) => /"Sala": la paleta "grafitto" no existe\. Incluidas: grafito/.test(w)));
  assert.ok(m.warnings.some((w) => /streaming 1: la paleta "cine" no existe/.test(w)));
});

const PALETTES = { ...BUILTIN_PALETTES, cine: { base: 'dark', background: '#170d0e' } };
const ref = (name) => paletteRef(name);
const pick = (o) => resolvePalette({ palettes: PALETTES, theme: 'dark', roku: false, ...o });

test('resolvePalette: la app activa gana a la tarjeta', () => {
  assert.equal(pick({ appRef: ref('cine'), cardRef: ref('nube') }), PALETTES.cine);
  assert.equal(pick({ cardRef: ref('nube') }), PALETTES.nube, 'sin app con paleta: la de la tarjeta');
});

test('resolvePalette: la del modo Roku solo cuenta con el modo Roku activo', () => {
  const o = { rokuRef: ref('medianoche'), cardRef: ref('nube') };
  assert.equal(pick({ ...o, roku: true }), PALETTES.medianoche);
  assert.equal(pick({ ...o, roku: false }), PALETTES.nube);
  assert.equal(pick({ ...o, roku: true, appRef: ref('cine') }), PALETTES.cine, 'Netflix en el Roku: gana la app');
});

test('resolvePalette: { light, dark } toma el nombre del tema actual', () => {
  const cardRef = paletteRef({ light: 'nube', dark: 'grafito' });
  assert.equal(pick({ cardRef, theme: 'light' }), PALETTES.nube);
  assert.equal(pick({ cardRef, theme: 'dark' }), PALETTES.grafito);
  assert.equal(pick({ cardRef: paletteRef({ dark: 'oled' }), theme: 'light' }), null, 'sin paleta para claro: estilo de siempre');
});

test('resolvePalette: un nombre que no existe se salta (pasa al siguiente nivel)', () => {
  assert.equal(pick({ appRef: ref('no_existe'), cardRef: ref('nube') }), PALETTES.nube);
  assert.equal(pick({ cardRef: ref('toString') }), null, 'ni siquiera propiedades heredadas de Object');
  assert.equal(pick({}), null, 'nada asignado: estilo de siempre');
});

test('paletteTokens: sin paleta, nada; solo escribe los tokens de los campos definidos', () => {
  assert.deepEqual(paletteTokens(null), {});
  assert.deepEqual(Object.keys(paletteTokens({ base: 'light', accent: '#0a8fb8' })).sort(), ['--tv-accent-default', '--tv-blob']);
  assert.deepEqual(paletteTokens({ base: 'dark', on: '#00ff00' }), { '--tv-on': '#00ff00' });
});

test('paletteTokens: el texto secundario y las líneas se derivan del texto', () => {
  const t = paletteTokens({ base: 'dark', text: '#eeeeee' });
  assert.equal(t['--tv-ink'], '#eeeeee');
  assert.match(t['--tv-ink-2'], /^color-mix\(in srgb, #eeeeee 64%, var\(--tv-surface\)\)$/);
  assert.match(t['--tv-line'], /#eeeeee 10%, transparent/);
});

test('paletteTokens: en oscuro los botones quedan translúcidos (vidrio); en claro, sólidos', () => {
  assert.match(paletteTokens({ base: 'dark', button: '#222222' })['--tv-raised'], /#222222 75%, transparent/);
  assert.equal(paletteTokens({ base: 'light', button: '#ffffff' })['--tv-raised'], '#ffffff');
});
