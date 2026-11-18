import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import {
  normalizeConfig, buildEditorView, applyFormChange, applyOp, serializeV4, actionToForm, formToAction,
  setPath, deletePath, parseAction,
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

test('applyOp convert = serializeV4', () => {
  const raw = { entity: 'media_player.lg', type: 'LG TV' };
  assert.deepEqual(applyOp(raw, { op: 'convert' }), serializeV4(raw));
  assert.ok(parseAction(serializeV4(raw).buttons?.top_left?.action ?? 'exit'));
});
