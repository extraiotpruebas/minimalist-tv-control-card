import { test } from 'node:test';
import assert from 'node:assert/strict';
import { removePalette, renamePalette, renameRef } from '../src/index.js';

test('renameRef: un nombre suelto', () => {
  assert.equal(renameRef('grafito', 'grafito', 'carbon'), 'carbon');
  assert.equal(renameRef('nube', 'grafito', 'carbon'), 'nube', 'otro nombre: igual');
  assert.equal(renameRef(undefined, 'grafito', 'carbon'), undefined, 'sin asignación: sigue sin asignación');
});

test('renameRef: un par claro/oscuro, cada lado por su cuenta', () => {
  assert.deepEqual(renameRef({ light: 'nube', dark: 'grafito' }, 'grafito', 'carbon'), { light: 'nube', dark: 'carbon' });
  assert.deepEqual(renameRef({ light: 'grafito', dark: 'grafito' }, 'grafito', 'carbon'), { light: 'carbon', dark: 'carbon' }, 'si coinciden los dos, cambian los dos');
  assert.deepEqual(renameRef({ light: 'nube' }, 'grafito', 'carbon'), { light: 'nube' }, 'un par de un solo lado');
  assert.deepEqual(renameRef({ dark: 'grafito' }, 'grafito', 'carbon'), { dark: 'carbon' });
});

test('renameRef: quitar el nombre (to = null)', () => {
  assert.equal(renameRef('grafito', 'grafito', null), undefined, 'si era el único nombre, no queda asignación');
  assert.equal(renameRef('nube', 'grafito', null), 'nube');
  assert.deepEqual(renameRef({ light: 'nube', dark: 'grafito' }, 'grafito', null), { light: 'nube' }, 'se quita solo el lado que lo usaba (sin dejar dark: undefined)');
  assert.deepEqual(renameRef({ light: 'grafito', dark: 'nube' }, 'grafito', null), { dark: 'nube' });
  assert.equal(renameRef({ light: 'grafito', dark: 'grafito' }, 'grafito', null), undefined, 'si no queda ningún lado, no queda asignación');
});

test('renameRef: no muta lo que recibe (HA congela la config)', () => {
  const pair = Object.freeze({ light: 'nube', dark: 'grafito' });
  assert.deepEqual(renameRef(pair, 'grafito', 'carbon'), { light: 'nube', dark: 'carbon' });
  assert.deepEqual(pair, { light: 'nube', dark: 'grafito' });
  assert.notEqual(renameRef(pair, 'otra', 'carbon'), undefined);
});

const CFG = Object.freeze({
  palettes: { mia: { base: 'dark' }, otra: { base: 'light' } },
  palette: { light: 'otra', dark: 'mia' },
  streaming: [{ source: 'netflix', palette: 'mia' }, { source: 'disney' }],
  tvs: [{ entity: 'x', companion: { palette: 'mia' }, overrides: { palette: 'mia', streaming: [{ source: 'netflix', palette: 'otra' }] } }],
});

test('renamePalette: cambia la clave (en su lugar) y TODAS las asignaciones', () => {
  const out = renamePalette(CFG, 'mia', 'nueva');
  assert.deepEqual(Object.keys(out.palettes), ['nueva', 'otra']);
  assert.deepEqual(out.palette, { light: 'otra', dark: 'nueva' });
  assert.equal(out.streaming[0].palette, 'nueva');
  assert.equal(out.tvs[0].companion.palette, 'nueva');
  assert.equal(out.tvs[0].overrides.palette, 'nueva');
  assert.equal(out.tvs[0].overrides.streaming[0].palette, 'otra', 'lo que usaba otra paleta no cambia');
  assert.equal(CFG.palette.dark, 'mia', 'no muta la original');
});

test('removePalette: quita la paleta y las asignaciones que ya no tienen a dónde apuntar', () => {
  const out = removePalette(CFG, 'mia');
  assert.deepEqual(Object.keys(out.palettes), ['otra']);
  assert.deepEqual(out.palette, { light: 'otra' });
  assert.ok(!('palette' in out.streaming[0]) && !('palette' in out.tvs[0].companion) && !('palette' in out.tvs[0].overrides));
  assert.equal(out.tvs[0].overrides.streaming[0].palette, 'otra');
});

test('removePalette: una incluida reemplazada vuelve a ser la incluida y sus asignaciones siguen válidas', () => {
  const cfg = { palettes: { grafito: { base: 'dark', background: '#000000' } }, palette: 'grafito' };
  assert.deepEqual(removePalette(cfg, 'grafito'), { palette: 'grafito' });
});
