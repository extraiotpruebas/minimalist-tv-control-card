import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import {
  normalizeConfig, buildEditorView, childrenByParent, applyFormChange, applyOp, serializeV4, actionToForm, formToAction,
  setPath, deletePath, parseAction, mapPaletteRefs, BUILTIN_PALETTES,
} from '../src/index.js';

/** Configs reales de clientes (test/fixtures/private/, gitignored). Sin la carpeta → lista vacía. */
const PRIVATE_DIR = new URL('./fixtures/private/', import.meta.url);
function privateFixtures() {
  if (!existsSync(PRIVATE_DIR)) return [];
  return readdirSync(PRIVATE_DIR).filter((f) => f.endsWith('.json'))
    .map((f) => ({ name: f.slice(0, -5), config: JSON.parse(readFileSync(new URL(f, PRIVATE_DIR), 'utf8')) }));
}

const view = (config, ctx = {}) => {
  let model = null;
  let error = null;
  try { model = normalizeConfig(config); } catch (e) { error = e.message; }
  return buildEditorView(config, { model, error, ...ctx });
};
const keys = (nodes) => nodes.map((n) => n.key);
const node = (nodes, key) => nodes.find((n) => n.key === key);
const labels = (nodes) => nodes.flatMap((n) => [...(n.items ?? []), ...(n.actions ?? [])].map((i) => i.label));

const V4 = { card_id: 'sala', tvs: [{ name: 'Sala', entity: 'media_player.lg', platform: 'lg' }], modes: ['menu', 'busqueda', 'audio'] };

// ---------------------------------------------------------------------------
// Utilidades inmutables
// ---------------------------------------------------------------------------
test('setPath/deletePath no mutan el original y crean/podan lo necesario', () => {
  const orig = Object.freeze({ a: Object.freeze({ b: 1 }) });
  assert.deepEqual(setPath(orig, ['a', 'c'], 2), { a: { b: 1, c: 2 } });
  assert.deepEqual(setPath(orig, ['x', 0, 'y'], 1), { a: { b: 1 }, x: [{ y: 1 }] });
  assert.deepEqual(deletePath(orig, ['a', 'b']), {}, 'el padre vacío también se quita');
  assert.deepEqual(orig, { a: { b: 1 } });
});

// ---------------------------------------------------------------------------
// La regla: solo se muestra lo activo
// ---------------------------------------------------------------------------
test('YAML viejo: solo el aviso con "Convertir a formato v4"', () => {
  const nodes = view({ entity: 'media_player.lg', type: 'LG TV', exit_value: 'EXIT' });
  assert.deepEqual(keys(nodes), ['legacy']);
  assert.deepEqual(nodes[0].actions[0].op, { op: 'convert' });
});

test('sin Roku ni overrides: solo los botones para agregarlos', () => {
  const nodes = view(V4);
  assert.ok(!node(nodes, 'tv0.rk.f') && !node(nodes, 'tv0.ov'), 'no hay formulario de Roku ni de overrides');
  assert.ok(labels(nodes).includes('+ Roku conectado') && labels(nodes).includes('+ Configuración propia de esta TV'));
  assert.ok(labels(nodes).includes('+ Entidad de modo (input_select)'));
  assert.ok(labels(nodes).includes('+ Personalizar touchpad sin modo'));
});

test('con Roku: aparece su formulario y desaparece el botón de agregar', () => {
  const nodes = view({ ...V4, tvs: [{ ...V4.tvs[0], companion: { media_entity: 'media_player.roku', remote_entity: 'remote.roku' } }] });
  assert.deepEqual(node(nodes, 'tv0.rk.f').data, { media_entity: 'media_player.roku', remote_entity: 'remote.roku' });
  assert.ok(!labels(nodes).includes('+ Roku conectado'));
});

test('modos personalizados: solo aparecen los asignados a un modo', () => {
  const nodes = view({ ...V4, modes: ['menu', 'custom2', 'audio'], custom_modes: { custom1: { label: 'X' }, custom2: { label: 'PIN' } } });
  assert.ok(node(nodes, 'cm.custom2.f'), 'custom2 está asignado → se edita');
  assert.ok(!node(nodes, 'cm.custom1.f'), 'custom1 no está asignado → oculto');
  assert.deepEqual(node(nodes, 'modes.f').data, { m1: 'menu', m2: 'custom2', m3: 'audio' });
});

test('botones: una línea con "Personalizar" hasta que se personalizan', () => {
  let nodes = view(V4);
  assert.equal(node(nodes, 'bt.back').level, 'item');
  assert.ok(!node(nodes, 'bt.back.a'));
  nodes = view({ ...V4, buttons: { back: { action: 'numpad' } } });
  assert.deepEqual(node(nodes, 'bt.back.a').data, { type: 'numpad' });
});

test('streaming: "Personalizar" abre ícono/color/acción sin escribir nada al YAML', () => {
  assert.ok(!node(view(V4), 'st.0.a'));
  assert.ok(node(view(V4, { expanded: new Set(['st.0']) }), 'st.0.a'), 'abierto por estado de UI');
});

test('avisos de normalizeConfig arriba del editor', () => {
  const nodes = view({ ...V4, streaming: [{ source: 'no_existe' }] });
  assert.equal(nodes[0].kind, 'alert');
  assert.match(nodes[0].text, /no_existe/);
});

// ---------------------------------------------------------------------------
// Cambios
// ---------------------------------------------------------------------------
test('formulario general: escribe solo lo que cambió y nunca los valores por defecto', () => {
  const n = node(view(V4), 'general.f');
  assert.equal(applyFormChange(V4, n, { ...n.data, style: 'halo' }).style, 'halo');
  const back = applyFormChange({ ...V4, style: 'halo' }, node(view({ ...V4, style: 'halo' }), 'general.f'), { card_id: 'sala', style: 'relieve', theme: 'dark' });
  assert.ok(!('style' in back), 'volver a relieve (default) borra la clave');
  assert.ok(!('theme' in back), 'el tema por defecto no se escribe');
});

test('modos: siempre 3, se guardan como lista', () => {
  const n = node(view(V4), 'modes.f');
  assert.deepEqual(applyFormChange(V4, n, { m1: 'audio', m2: 'menu', m3: 'custom1' }).modes, ['audio', 'menu', 'custom1']);
});

test('streaming: editar un botón crea los 4 con sus valores por defecto', () => {
  const n = node(view(V4), 'st.2.f');
  const out = applyFormChange(V4, n, { ...n.data, source: 'prime' });
  assert.deepEqual(out.streaming, [{ source: 'netflix' }, { source: 'disney' }, { source: 'prime' }, { source: 'appletv' }]);
});

test('acción: forma más legible, reinicio al cambiar de tipo, predeterminada = sin clave', () => {
  assert.equal(formToAction({ type: 'key', key: 'vol_up' }, { type: 'key', key: '' }), 'vol_up');
  assert.deepEqual(formToAction({ type: 'key', key: 'vol_up' }, undefined), { type: 'key', key: '' }, 'recién elegido el tipo, la tecla empieza vacía');
  assert.equal(formToAction({ type: 'script', entity: 'script.pin' }, { type: 'service', service: 'script.turn_on', data: {} }), 'script.pin');
  assert.equal(formToAction({ type: 'numpad' }, 'back'), 'numpad');
  assert.equal(formToAction({ type: 'default' }, 'back'), undefined);
  assert.equal(formToAction({ type: 'none' }, 'back'), null);
  assert.deepEqual(formToAction({ type: 'source', key: 'vol_up' }, 'vol_up'), { type: 'source', source: '' }, 'no arrastra campos del tipo anterior');
  const seq = { type: 'sequence', steps: ['1', '2'], delay: 300 };
  assert.deepEqual(formToAction({ type: 'sequence', delay: 500 }, seq), { type: 'sequence', steps: ['1', '2'], delay: 500 }, 'conserva los pasos');
});

test('acción: actionToForm entiende todas las formas del YAML', () => {
  assert.deepEqual(actionToForm('KEY_VOLUP'), { type: 'key', key: 'vol_up' });
  assert.deepEqual(actionToForm('scene.cine'), { type: 'script', entity: 'scene.cine' });
  assert.deepEqual(actionToForm('KEY_HDMI'), { type: 'button', button: 'KEY_HDMI' });
  assert.deepEqual(actionToForm(['1', '2']), { type: 'sequence', delay: 400 });
  assert.deepEqual(actionToForm({ type: 'key', key: '' }), { type: 'key', key: '' }, 'a medio escribir sigue siendo "Tecla"');
  assert.deepEqual(actionToForm(undefined), { type: 'default' });
  assert.deepEqual(actionToForm(null), { type: 'none' });
});

test('secuencia: pasos editables con agregar/mover/quitar', () => {
  const cfg = { ...V4, buttons: { menu: { action: { type: 'sequence', steps: ['1', '2'], delay: 300 } } } };
  const nodes = view(cfg);
  assert.ok(node(nodes, 'bt.menu.a.s0.a') && node(nodes, 'bt.menu.a.s1.a'));
  const add = node(nodes, 'bt.menu.a.addstep').items[0].op;
  assert.equal(applyOp(cfg, add).buttons.menu.action.steps.length, 3);
  const moved = applyOp(cfg, { op: 'move', path: ['buttons', 'menu', 'action', 'steps'], index: 0, delta: 1 });
  assert.deepEqual(moved.buttons.menu.action.steps, ['2', '1']);
});

test('por marca: una sub-acción por cada marca agregada', () => {
  const cfg = { ...V4, buttons: { home: { action: { type: 'platform', by: { lg: 'HOME' } } } } };
  const nodes = view(cfg);
  assert.ok(node(nodes, 'bt.home.a.b.lg.a'));
  assert.ok(labels(nodes).includes('+ Samsung'));
});

test('atajos de YAML: cambiar el ícono no pierde la acción', () => {
  const cfg = { ...V4, buttons: { power: 'script.tv_power' } };
  const n = node(view(cfg), 'bt.power.i');
  const out = applyFormChange(cfg, n, { icon: 'mdi:power-plug' });
  assert.deepEqual(out.buttons.power, { action: 'script.tv_power', icon: 'mdi:power-plug' });
});

test('overrides: al activar una categoría se copia la global como punto de partida', () => {
  const cfg = { ...V4, buttons: { back: { icon: 'mdi:arrow-left' } }, tvs: [{ ...V4.tvs[0], overrides: {} }] };
  const nodes = view(cfg);
  const add = nodes.flatMap((n) => n.items ?? []).find((i) => i.label === '+ Botones propios').op;
  assert.deepEqual(applyOp(cfg, add).tvs[0].overrides.buttons, { back: { icon: 'mdi:arrow-left' } });
});

test('quitar la única TV no está permitido; agregar sugiere una entidad libre', () => {
  const nodes = view(V4, { mediaPlayers: ['media_player.lg', 'media_player.samsung'] });
  assert.equal(node(nodes, 'tv0.h').actions.find((a) => a.label === '✕').disabled, true);
  const add = node(nodes, 'tvs.add').items[0].op;
  assert.equal(applyOp(V4, add).tvs[1].entity, 'media_player.samsung');
});

// ---------------------------------------------------------------------------
// Acordeón: paneles plegables con resumen
// ---------------------------------------------------------------------------
const folds = (nodes) => nodes.filter((n) => n.fold);
const BIG = {
  ...V4,
  style: 'halo', theme: 'light',
  modes: ['menu', 'custom1', 'audio'],
  custom_modes: { custom1: { label: 'Luces', up: { icon: 'mdi:plus', action: 'ch_up' } } },
  streaming: [{ source: 'netflix', accent: '#e50914' }, { source: 'disney' }],
  buttons: { back: { action: 'home' }, menu: { icon: 'mdi:cog' } },
  default_pad: { up: { action: 'vol_up' } },
  tvs: [
    { name: 'Sala', entity: 'media_player.lg', platform: 'lg', companion: { media_entity: 'media_player.roku' }, overrides: { modes: ['menu', 'audio', 'busqueda'], buttons: { exit: {} } } },
    { name: 'Cuarto', entity: 'media_player.samsung', platform: 'samsung' },
  ],
};

/** Reglas que debe cumplir CUALQUIER config: si fallan, el DOM perdería nodos o los pintaría mal. */
function assertFoldIntegrity(nodes, label = '') {
  const all = new Set(keys(nodes));
  assert.equal(all.size, nodes.length, `${label} claves únicas`);
  const heads = new Set(folds(nodes).map((n) => n.key));
  for (const n of nodes) {
    if (n.parent === undefined) continue;
    assert.ok(heads.has(n.parent), `${label} ${n.key}: su parent "${n.parent}" no es un panel`);
    assert.ok(keys(nodes).indexOf(n.parent) < keys(nodes).indexOf(n.key), `${label} ${n.key}: el panel va antes que sus hijos`);
  }
  for (const f of folds(nodes)) {
    assert.equal(f.kind, 'heading');
    assert.equal(typeof f.fold.summary, 'string');
    assert.equal(typeof f.fold.open, 'boolean');
    assert.ok(Number.isFinite(f.fold.base));
  }
  // Todo nodo llega a la raíz (sin ciclos): así childrenByParent no deja nada sin pintar.
  const tree = childrenByParent(nodes);
  const seen = new Set();
  const walk = (parent) => (tree.get(parent) ?? []).forEach((n) => { seen.add(n.key); if (n.fold) walk(n.key); });
  walk('');
  assert.equal(seen.size, nodes.length, `${label} el árbol alcanza todos los nodos`);
}

test('acordeón: arrancan abiertos General, Televisores y la primera TV; el resto cerrado', () => {
  const nodes = view(BIG);
  const open = folds(nodes).filter((n) => n.fold.open).map((n) => n.key);
  assert.deepEqual(open, ['general', 'tvs', 'tv0.h']);
  for (const key of ['modes', 'cm.custom1', 'dp', 'st', 'bt', 'bt.back', 'tv1.h', 'tv0.ov']) {
    assert.ok(node(nodes, key)?.fold, `${key} es un panel`);
  }
});

test('acordeón: la estructura es válida con configs mínimas, grandes y con errores', () => {
  assertFoldIntegrity(view(V4), 'mínima');
  assertFoldIntegrity(view(BIG), 'grande');
  assertFoldIntegrity(view({ ...BIG, tvs: [] }), 'sin TVs');
  assertFoldIntegrity(view({ ...BIG, tvs: [{ entity: 'media_player.x', overrides: { custom_modes: {}, default_pad: {}, streaming: [], buttons: {} } }] }), 'overrides vacíos');
  for (const { name, config } of privateFixtures()) assertFoldIntegrity(view(config), `cliente ${name}`);
});

test('acordeón: los hijos cuelgan de su panel y la sangría se mide desde él', () => {
  const nodes = view(BIG);
  assert.equal(node(nodes, 'general.f').parent, 'general');
  assert.equal(node(nodes, 'tv0.h').parent, 'tvs');
  assert.equal(node(nodes, 'tvs.add').parent, 'tvs');
  assert.equal(node(nodes, 'tv0.f').parent, 'tv0.h');
  assert.equal(node(nodes, 'tv0.ov').parent, 'tv0.h');
  assert.equal(node(nodes, 'tv0.ov.modes').parent, 'tv0.ov');
  assert.equal(node(nodes, 'cm.custom1').parent, 'modes', 'el modo personalizado vive dentro de "Modos"');
  assert.equal(node(nodes, 'cm.custom1.pad.up').parent, 'cm.custom1');
  assert.equal(node(nodes, 'bt.back.a').parent, 'bt.back');
  assert.equal(node(nodes, 'bt.home').parent, 'bt', 'un botón sin personalizar es una fila dentro de "Botones"');
  assert.equal(node(nodes, 'general').parent, undefined, 'los paneles de primer nivel están en la raíz');
  assert.equal(node(nodes, 'tv0.f').depth - node(nodes, 'tv0.h').fold.base, 0, 'los campos de la TV no se sangran de más');
});

test('acordeón: el resumen dice qué hay dentro sin abrir el panel', () => {
  const nodes = view(BIG);
  const sum = (key) => node(nodes, key).fold.summary;
  assert.equal(sum('general'), 'sala · Halo · Claro');
  assert.equal(sum('tvs'), '2 TVs');
  assert.equal(sum('tv0.h'), 'LG · media_player.lg · con Roku · config. propia');
  assert.equal(sum('tv1.h'), 'Samsung · media_player.samsung');
  assert.equal(sum('tv0.ov'), 'modos, botones');
  assert.equal(sum('modes'), 'Menú, Luces, Audio');
  assert.equal(sum('cm.custom1'), '1 de 4 direcciones definidas');
  assert.equal(sum('dp'), 'personalizado');
  assert.equal(sum('st'), 'Netflix, Disney+, YouTube, Apple TV · 1 personalizado');
  assert.equal(sum('bt'), '2 personalizados: Atrás, Menú');
  assert.equal(sum('bt.back'), 'tecla Inicio');
  assert.equal(sum('cm.custom1.pad.up'), 'tecla Subir canal');
  assert.equal(node(view(V4), 'dp').fold.summary, 'predeterminado (flechas)');
  assert.equal(node(view(V4), 'bt').fold.summary, 'todos predeterminados');
  assert.equal(node(view(V4), 'tvs').fold.summary, '1 TV');
  assert.equal(node(view({ ...V4, tvs: [{ name: 'X', overrides: {} }] }), 'tv0.ov').fold.summary, 'sin cambios todavía');
});

test('acordeón: cada botón "+ Agregar" abre un panel que existe en la vista siguiente', () => {
  const cfg = { ...V4, tvs: [{ ...V4.tvs[0], overrides: {} }] };
  const nodes = view(cfg, { mediaPlayers: ['media_player.lg', 'media_player.x'] });
  const withOpen = nodes.flatMap((n) => [...(n.items ?? []), ...(n.actions ?? [])]).filter((i) => i.op?.open);
  assert.ok(withOpen.length >= 5, 'hay varios botones que abren un panel');
  for (const item of withOpen) {
    const next = view(applyOp(cfg, item.op), { mediaPlayers: ['media_player.lg', 'media_player.x'] });
    assert.ok(node(next, item.op.open)?.fold, `"${item.label}" abre "${item.op.open}", que debe existir como panel`);
  }
  const personalizar = node(view(V4), 'bt.back').actions[0];
  assert.equal(personalizar.op.open, 'bt.back');
  assert.ok(node(view(applyOp(V4, personalizar.op)), 'bt.back').fold);
});

// ---------------------------------------------------------------------------
// Paletas: el panel y los selectores de asignación
// ---------------------------------------------------------------------------
const NONE = '__none__';
const withPalettes = (extra = {}) => ({ ...V4, palettes: { mia: { base: 'light', background: '#ffffff' } }, ...extra });
const optionValues = (formNode, fieldName = 'value') => {
  const field = formNode.schema.flatMap((f) => (f.schema ?? [f])).find((f) => f.name === fieldName);
  return field.selector.select.options.map((o) => o.value);
};

test('paletas: sin paletas propias el panel existe y ofrece crear o copiar', () => {
  const nodes = view(V4);
  assert.equal(node(nodes, 'pal').fold.summary, `ninguna propia · ${Object.keys(BUILTIN_PALETTES).length} incluidas`);
  assert.equal(node(nodes, 'pal').fold.open, false);
  const add = node(nodes, 'pal.add').items[0];
  const created = applyOp(V4, add.op);
  assert.deepEqual(Object.keys(created.palettes), ['paleta']);
  assert.equal(created.palettes.paleta.base, 'dark');
  assert.ok(PALETTE_COLORS.every((c) => /^#[0-9a-f]{6}$/.test(created.palettes.paleta[c])), 'nace con los 5 colores');
  assert.ok(node(view(created), add.op.open)?.fold, 'abre la paleta recién creada');
  assertFoldIntegrity(view(created), 'tras crear');
});
const PALETTE_COLORS = ['background', 'button', 'text', 'accent', 'on'];

test('paletas: cada paleta muestra sus colores, lo que le falta y el contraste', () => {
  const nodes = view(withPalettes());
  assert.equal(node(nodes, 'pal.0').fold.summary, 'clara · 1 de 5 colores');
  const sw = node(nodes, 'pal.0.s').colors;
  assert.deepEqual(sw.map((c) => c.field), PALETTE_COLORS);
  assert.deepEqual(sw.map((c) => c.base), [false, true, true, true, true], 'solo el fondo es de la paleta; el resto de la base');
  assert.deepEqual(node(nodes, 'pal.0.c.background.f').data, { color: [255, 255, 255] });
  assert.ok(!node(nodes, 'pal.0.c.text.f'), 'un color que no está en el YAML no tiene selector');
  assert.deepEqual(node(nodes, 'pal.0.add').items.map((i) => i.label), ['+ Botones', '+ Texto', '+ Acento', '+ Encendido']);
  assert.match(node(nodes, 'pal.0.n').text, /texto\/fondo \d+\.\d:1/);
  assert.doesNotMatch(node(nodes, 'pal.0.n').text, /⚠/, 'texto oscuro sobre fondo blanco: contraste de sobra');
});

test('paletas: el aviso de contraste advierte cuando el texto no se lee', () => {
  const bad = view(withPalettes({ palettes: { mia: { base: 'light', background: '#ffffff', text: '#eeeeee' } } }));
  assert.match(node(bad, 'pal.0.n').text, /⚠ texto\/fondo 1\.\d:1/);
});

test('paletas: editar colores guarda #rrggbb y quitar o agregar sigue la regla del YAML mínimo', () => {
  const cfg = withPalettes();
  const form = node(view(cfg), 'pal.0.c.background.f');
  assert.equal(applyFormChange(cfg, form, { color: [10, 20, 30] }).palettes.mia.background, '#0a141e');
  assert.deepEqual(applyFormChange(cfg, form, { color: 'nada' }), cfg, 'un color inválido no cambia nada');
  const add = node(view(cfg), 'pal.0.add').items.find((i) => i.label === '+ Texto').op;
  assert.equal(applyOp(cfg, add).palettes.mia.text, '#1b1f25', 'parte del texto de la base clara');
  const del = node(view(cfg), 'pal.0.c.background').actions[0].op;
  assert.deepEqual(applyOp(cfg, del).palettes.mia, { base: 'light' });
});

test('paletas: cambiar la base y renombrar (sin referencias que actualizar)', () => {
  const cfg = withPalettes({ palettes: { a: { base: 'dark' }, mia: { base: 'light', background: '#ffffff' }, z: { base: 'dark' } } });
  const meta = node(view(cfg), 'pal.1.f');
  assert.deepEqual(meta.data, { name: 'mia', base: 'light' });
  assert.equal(applyFormChange(cfg, meta, { name: 'mia', base: 'dark' }).palettes.mia.base, 'dark');
  assert.deepEqual(Object.keys(applyFormChange(cfg, meta, { name: 'nueva', base: 'light' }).palettes), ['a', 'nueva', 'z'], 'conserva el lugar');
  for (const name of ['', '  ', 'a', 'z']) assert.deepEqual(applyFormChange(cfg, meta, { name, base: 'light' }), cfg, `"${name}" no es un nombre válido o ya existe`);
  assert.deepEqual(Object.keys(applyFormChange(cfg, meta, { name: ' nueva ', base: 'dark' }).palettes), ['a', 'nueva', 'z']);
  assert.equal(applyFormChange(cfg, meta, { name: 'nueva', base: 'dark' }).palettes.nueva.base, 'dark', 'renombrar y cambiar la base a la vez');
  const renamed = view(applyFormChange(cfg, meta, { name: 'nueva', base: 'light' }));
  assert.ok(node(renamed, 'pal.1.f') && node(renamed, 'pal.1').text === 'nueva', 'la key no cambia al renombrar: el campo conserva el foco y el panel sigue abierto');
});

test('paletas: copiar una incluida crea una paleta propia editable', () => {
  const copy = node(view(V4), 'pal.copy');
  const next = applyFormChange(V4, copy, { from: 'grafito' });
  assert.deepEqual(next.palettes[copy.newName], BUILTIN_PALETTES.grafito);
  assert.ok(node(view(next), copy.open)?.fold, 'su panel existe para abrirlo');
  assert.deepEqual(applyFormChange(V4, copy, { from: '' }), V4);
  assert.deepEqual(applyFormChange(V4, copy, { from: 'no-existe' }), V4);
  assert.equal(Object.keys(applyFormChange(next, node(view(next), 'pal.copy'), { from: 'nube' }).palettes).join(), 'paleta,paleta-2', 'nombres sin repetir');
});

test('paletas: borrar una propia la quita (una incluida reemplazada vuelve a ser la incluida)', () => {
  const cfg = withPalettes({ palettes: { mia: { base: 'light' }, grafito: { base: 'dark', background: '#000000' } } });
  const del = (name) => node(view(cfg), `pal.${Object.keys(cfg.palettes).indexOf(name)}`).actions[0].op;
  assert.deepEqual(Object.keys(applyOp(cfg, del('mia')).palettes), ['grafito']);
  assert.equal(applyOp(applyOp(cfg, del('mia')), del('grafito')).palettes, undefined, 'sin paletas propias no queda la clave');
});

test('paletas: selectores de asignación (tarjeta, TV, Roku y botón de streaming)', () => {
  const cfg = withPalettes({ tvs: [{ ...V4.tvs[0], companion: { media_entity: 'media_player.roku' } }] });
  const nodes = view(cfg);
  const general = node(nodes, 'general.pal');
  assert.deepEqual(general.data, { value: NONE });
  assert.deepEqual(optionValues(general), [NONE, ...Object.keys(BUILTIN_PALETTES), 'mia']);
  assert.equal(applyFormChange(cfg, general, { value: 'mia' }).palette, 'mia');
  assert.ok(!('palette' in applyFormChange({ ...cfg, palette: 'mia' }, node(view({ ...cfg, palette: 'mia' }), 'general.pal'), { value: NONE })), 'Ninguna quita la clave');

  assert.equal(applyFormChange(cfg, node(nodes, 'tv0.pal'), { value: 'nube' }).tvs[0].overrides.palette, 'nube', 'la paleta de una TV va en overrides');
  const withTv = applyFormChange(cfg, node(nodes, 'tv0.pal'), { value: 'nube' });
  assert.ok(!('overrides' in applyFormChange(withTv, node(view(withTv), 'tv0.pal'), { value: NONE }).tvs[0]), 'quitarla poda overrides vacío');
  assert.equal(applyFormChange(cfg, node(nodes, 'tv0.rk.pal'), { value: 'oled' }).tvs[0].companion.palette, 'oled');
  assert.ok(!node(view(V4), 'tv0.rk.pal'), 'sin Roku no hay selector del Roku');

  assert.ok(!node(nodes, 'st.0.pal'), 'el selector del botón aparece al personalizarlo');
  const open = view(cfg, { expanded: new Set(['st.0']) });
  const slot = applyFormChange(cfg, node(open, 'st.0.pal'), { value: 'medianoche' });
  assert.deepEqual(slot.streaming[0], { source: 'netflix', palette: 'medianoche' });
  assert.equal(slot.streaming.length, 4, 'se crean los 4 botones con sus valores por defecto');
  assert.ok(node(view(slot), 'st.0.pal'), 'con palette el botón cuenta como personalizado');
  const unset = node(view(slot), 'st.0.b').items[0].op;
  assert.ok(!('palette' in applyOp(slot, unset).streaming[0]), 'Quitar personalización también quita la paleta');
});

test('paletas: par claro/oscuro, y un nombre que no existe se muestra como tal', () => {
  const cfg = withPalettes({ palette: 'mia' });
  const toPair = node(view(cfg), 'general.pal.b').items[0].op;
  const pair = applyOp(cfg, toPair);
  assert.deepEqual(pair.palette, { light: 'mia', dark: 'mia' });
  const form = node(view(pair), 'general.pal');
  assert.deepEqual(form.data, { light: 'mia', dark: 'mia' });
  assert.deepEqual(applyFormChange(pair, form, { light: 'nube', dark: NONE }).palette, { light: 'nube' }, 'un solo lado es válido');
  assert.ok(!('palette' in applyFormChange(pair, form, { light: NONE, dark: NONE })), 'sin ningún lado se quita');
  assert.equal(applyOp(pair, node(view(pair), 'general.pal.b').items[0].op).palette, 'mia', 'volver a una sola');
  assert.ok(optionValues(node(view({ ...V4, palette: 'fantasma' }), 'general.pal')).includes('fantasma'), 'no oculta un nombre mal escrito: lo muestra');
});

test('paletas: mapPaletteRefs recorre los 6 lugares donde puede haber una asignación', () => {
  const cfg = {
    palette: 'a', streaming: [{ source: 'netflix', palette: 'b' }, { source: 'disney' }],
    tvs: [{ entity: 'x', companion: { palette: 'c' }, overrides: { palette: 'd', streaming: [{ source: 'netflix', palette: 'e' }] } }, 'no-es-un-objeto'],
  };
  const seen = [];
  const same = mapPaletteRefs(cfg, (ref) => { seen.push(ref); return ref; });
  assert.deepEqual(seen.sort(), ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(same, cfg);
  const gone = mapPaletteRefs(Object.freeze(cfg), () => undefined);
  assert.ok(!('palette' in gone) && !('palette' in gone.streaming[0]) && !('palette' in gone.tvs[0].companion) && !('palette' in gone.tvs[0].overrides));
  assert.equal(cfg.palette, 'a', 'no muta la original');
});

test('paletas: la estructura del acordeón sigue válida con paletas y asignaciones', () => {
  const cfg = withPalettes({ palette: { light: 'mia', dark: 'oled' }, tvs: [{ ...V4.tvs[0], companion: { palette: 'nube' }, overrides: { palette: 'arena' } }] });
  assertFoldIntegrity(view(cfg), 'con paletas');
  assertFoldIntegrity(view({ ...cfg, palettes: 'mal' }), 'palettes inválido');
  assertFoldIntegrity(view({ ...cfg, palettes: { x: 'no-es-un-bloque' } }), 'paleta inválida');
});

// ---------------------------------------------------------------------------
// Convertir a v4: ida y vuelta sin cambiar el comportamiento
// ---------------------------------------------------------------------------
function assertSameBehavior(raw) {
  const a = normalizeConfig(raw);
  const v4 = serializeV4(raw);
  const b = normalizeConfig(v4);
  assert.equal(b.format, 'v4');
  assert.deepEqual(JSON.parse(JSON.stringify(b.tvs)), JSON.parse(JSON.stringify(a.tvs)));
  for (const k of ['theme', 'style', 'controlModeEntity']) assert.equal(b[k], a[k], k);
  if (!a.cardId.startsWith('auto:')) assert.equal(b.cardId, a.cardId);
  assert.deepEqual(serializeV4(v4), v4, 'convertir dos veces da lo mismo');
  return v4;
}

test('conversión: formato del repo (producción) con acciones por marca y Roku', () => {
  const v4 = assertSameBehavior({
    card_id: 'sala', entity: 'media_player.lg', type: 'LG TV', colorMode: 'light',
    roku: { media_entity: 'media_player.roku', remote_entity: 'remote.roku' },
    mode_slot_1: 'custom1', mode_slot_2: 'busqueda', mode_slot_3: 'audio',
    custom1_label: 'Luces', custom1_up_icon: 'mdi:lightbulb', custom1_up_value: 'script.luces',
    custom1_left_value_lg: 'HDMI', custom1_left_value_samsung: 'KEY_HDMI',
    appletv_source: 'hdmi2', netflix_icon: 'mdi:netflix', exit_value: 'script.salir',
  });
  assert.equal(v4.theme, 'light');
  assert.equal(v4.tvs[0].companion.media_entity, 'media_player.roku');
});

test('conversión: variante v3 con overrides sueltos por TV y default_*', () => {
  assertSameBehavior({
    card_id: 'v3',
    tvs: [
      { name: 'A', entity: 'media_player.a', type: 'LG TV', mode_slot_1: 'audio' },
      { name: 'B', entity: 'media_player.b', type: 'samsung' },
    ],
    default_up_value: 'CHANNELUP', default_up_icon: 'mdi:plus', back_type: 'numpad', prime_icon: 'mdi:amazon',
  });
});

test('conversión: un YAML v4 completo se queda igual en comportamiento', () => {
  assertSameBehavior({
    card_id: 'x', style: 'cristal', theme: 'auto', control_mode_entity: 'input_select.modo',
    modes: ['menu', 'custom1', 'audio'],
    custom_modes: { custom1: { label: 'PIN', up: { icon: 'mdi:numeric', action: { type: 'sequence', steps: ['1', '2', 'enter'], delay: 300 } } } },
    streaming: [{ source: 'netflix', accent: '#e50914' }, { source: 'fubo' }, { source: 'roku' }, { source: 'hdmi2', action: 'script.hdmi' }],
    buttons: { menu: { icon: 'mdi:dialpad', action: 'numpad' }, home: { action: { type: 'platform', by: { lg: 'HOME', samsung: 'KEY_HOME', default: 'home' } } } },
    tvs: [
      { name: 'Sala', entity: 'media_player.sala', platform: 'lg', companion: { media_entity: 'media_player.roku', remote_entity: 'remote.roku' } },
      { name: 'Rec', entity: 'media_player.rec', platform: 'samsung', overrides: { modes: ['audio', 'menu', 'busqueda'], buttons: {} } },
    ],
  });
});

// Los nombres de los clientes no se escriben aquí: se descubren en la carpeta privada.
for (const { name, config } of privateFixtures()) {
  test(`conversión: config real "${name}" (fixture privado)`, () => assertSameBehavior(config));
}

test('conversión: conserva type (primero) y las claves de HA; nunca una marca como type', () => {
  const grid = { columns: 6, rows: 'auto' };
  const v4 = serializeV4({
    type: 'custom:tv-control-card-v4', card_id: 'prueba_v4', entity: 'media_player.lg', modelConfig: 'LG TV',
    grid_options: grid, visibility: [{ condition: 'screen', media_query: '(min-width: 0px)' }],
  });
  assert.equal(Object.keys(v4)[0], 'type', 'type va en la línea 1, como lo escribe HA');
  assert.equal(v4.type, 'custom:tv-control-card-v4');
  assert.deepEqual(v4.grid_options, grid);
  assert.notEqual(v4.grid_options, grid, 'copia, no la misma referencia');
  assert.equal(v4.visibility.length, 1);
  assert.equal(applyOp({ type: 'custom:tv-control-card', entity: 'media_player.lg' }, { op: 'convert' }).type, 'custom:tv-control-card');
  assert.equal(serializeV4({ type: 'LG TV', entity: 'media_player.lg' }).type, undefined);
});

test('applyOp convert = serializeV4', () => {
  const raw = { entity: 'media_player.lg', type: 'LG TV' };
  assert.deepEqual(applyOp(raw, { op: 'convert' }), serializeV4(raw));
  assert.ok(parseAction(serializeV4(raw).buttons?.top_left?.action ?? 'exit'));
});

test('acción input: formulario ↔ YAML corto y conversión a v4', () => {
  assert.deepEqual(actionToForm('input:hdmi2'), { type: 'input', input: 'hdmi2' });
  assert.equal(formToAction({ type: 'input', input: 'hdmi3' }, 'input:hdmi2'), 'input:hdmi3');
  assert.deepEqual(formToAction({ type: 'input' }, 'up'), { type: 'input', input: '' }, 'recién elegido: incompleto pero sigue siendo "Entrada"');
  const v4 = assertSameBehavior({
    card_id: 'in', modes: ['custom1', 'fuentes', 'audio'],
    custom_modes: { custom1: { label: 'Consolas', up: { icon: 'mdi:sony-playstation', action: 'input:hdmi2' } } },
    tvs: [{ name: 'Sala', entity: 'media_player.sala', platform: 'samsung' }],
  });
  assert.equal(v4.custom_modes.custom1.up.action, 'input:hdmi2');
});
