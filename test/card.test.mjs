import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  tvStatus, StateWaiters, TvControlCard, normalizeConfig, parseAction,
  routeAction, sourceMatches, resolveSourceName, describeNow, STYLES,
} from '../src/index.js';

// Que este archivo se pueda importar ya prueba el guard de §6: en Node no existe
// HTMLElement ni customElements, y aun así la clase se declara sin error.

const hassWith = (states) => ({ states });
const st = (state, attributes = {}) => ({ state, attributes });

test('tvStatus distingue on, off y no disponible', () => {
  assert.equal(tvStatus(st('on')), 'on');
  assert.equal(tvStatus(st('playing')), 'on');
  assert.equal(tvStatus(st('off')), 'off');
  assert.equal(tvStatus(st('standby')), 'off');
  assert.equal(tvStatus(st('unavailable')), 'unavailable');
  assert.equal(tvStatus(st('unknown')), 'unavailable');
  assert.equal(tvStatus(undefined), 'unavailable', 'una entidad que no existe NO es "apagada"');
});

test('StateWaiters: resuelve de inmediato si la condición ya se cumple', async () => {
  const w = new StateWaiters();
  const ok = await w.wait(hassWith({ 'media_player.tv': st('on') }), 'media_player.tv', (s) => s.state === 'on', 1000);
  assert.equal(ok, true);
  assert.equal(w.size, 0);
});

test('StateWaiters: resuelve cuando un hass posterior cumple la condición', async () => {
  const w = new StateWaiters();
  const promise = w.wait(hassWith({ 'media_player.tv': st('off') }), 'media_player.tv', (s) => s.state === 'on', 1000);
  assert.equal(w.size, 1);
  w.check(hassWith({ 'media_player.tv': st('off') }));
  assert.equal(w.size, 1, 'sigue esperando');
  w.check(hassWith({ 'media_player.tv': st('on') }));
  assert.equal(await promise, true);
  assert.equal(w.size, 0);
});

test('StateWaiters: timeout resuelve false (nunca se queda colgada)', async () => {
  const w = new StateWaiters();
  const start = Date.now();
  const ok = await w.wait(hassWith({}), 'media_player.tv', () => true, 30);
  assert.equal(ok, false);
  assert.ok(Date.now() - start >= 25);
  assert.equal(w.size, 0);
});

test('StateWaiters: cancelAll y predicate que truena', async () => {
  const w = new StateWaiters();
  const boom = w.wait(hassWith({ 'x.y': st('on') }), 'x.y', () => { throw new Error('boom'); }, 1000);
  const other = w.wait(hassWith({}), 'x.z', () => true, 1000);
  w.check(hassWith({ 'x.y': st('on') }));   // no debe lanzar
  w.cancelAll();
  assert.deepEqual(await Promise.all([boom, other]), [false, false]);
});

test('getStubConfig usa el primer media_player y produce una config válida', () => {
  const stub = TvControlCard.getStubConfig({ states: { 'light.x': st('on'), 'media_player.sala': st('off') } });
  assert.equal(stub.tvs[0].entity, 'media_player.sala');
  const model = normalizeConfig(stub);
  assert.equal(model.format, 'v4');
  assert.deepEqual(model.warnings, []);
  assert.deepEqual(model.tvs[0].settings.modes, ['menu', 'busqueda', 'audio']);
});

// ---------------------------------------------------------------------------
// Ruteo TV / Roku
// ---------------------------------------------------------------------------
const TV_WITH_ROKU = {
  platform: 'lg', entity: 'media_player.lg',
  companion: { platform: 'roku', entity: 'media_player.roku', remote: 'remote.roku' },
};
const toRoku = (raw, ctx = {}) => routeAction(parseAction(raw), { tv: TV_WITH_ROKU, rokuMode: true, mode: null, ...ctx }).platform === 'roku';

test('routeAction: una secuencia va al Roku solo si TODOS sus pasos irían al Roku', () => {
  assert.equal(toRoku(['down', 'down', 'enter']), true, 'navegación pura del Roku');
  assert.equal(toRoku(['1', '2', '3', '4', 'enter']), false, 'un PIN (dígitos) va completo a la TV, incluido el OK');
  assert.equal(toRoku(['down', 'exit']), false, 'EXIT no existe en el Roku → toda la secuencia a la TV');
  assert.equal(toRoku(['down', 'down'], { mode: 'audio' }), false, 'en modos de la TV todo va a la TV');
});

test('routeAction: una entrada (input) siempre va a la TV, también en modo Roku', () => {
  assert.equal(toRoku('input:hdmi1'), false);
  assert.equal(toRoku(['input:hdmi1', 'down']), false, 'una secuencia con una entrada va completa a la TV');
});

test('routeAction: sin modo Roku todo va a la TV', () => {
  assert.equal(routeAction(parseAction('up'), { tv: TV_WITH_ROKU, rokuMode: false, mode: null }).entity, 'media_player.lg');
});

test('routeAction: en modo Roku van al Roku solo las teclas que el Roku tiene', () => {
  assert.equal(toRoku('up'), true);
  assert.equal(toRoku('enter'), true);
  assert.equal(toRoku('back'), true);
  assert.equal(toRoku('exit'), false, 'el Roku no tiene EXIT: va a la TV (el EXIT de abajo siempre funciona)');
  assert.equal(toRoku('menu'), false);
  assert.equal(toRoku('vol_up'), false, 'el volumen siempre lo maneja la TV');
  assert.equal(toRoku('mute'), false);
  assert.equal(toRoku('KEY_HDMI'), false, 'código crudo de TV');
  assert.equal(toRoku('source:HDMI 1'), false);
  assert.equal(toRoku('command:tv/channelUp'), false);
  assert.equal(toRoku({ type: 'platform', by: { roku: 'home', lg: 'MYAPPS' } }), true);
  assert.equal(toRoku({ type: 'platform', by: { lg: 'MYAPPS' } }), false);
});

test('routeAction: en modos audio y fuentes todo va a la TV (como producción)', () => {
  assert.equal(toRoku('up', { mode: 'audio' }), false);
  assert.equal(toRoku('up', { mode: 'fuentes' }), false);
  assert.equal(toRoku('up', { mode: 'menu' }), true);
});

test('routeAction: companion sin remote → todo a la TV', () => {
  const tv = { ...TV_WITH_ROKU, companion: { platform: 'roku', entity: 'media_player.roku', remote: null } };
  assert.equal(routeAction(parseAction('up'), { tv, rokuMode: true, mode: null }).platform, 'lg');
});

// ---------------------------------------------------------------------------
// Fuentes
// ---------------------------------------------------------------------------
test('resolveSourceName usa el nombre exacto del source_list', () => {
  const tv = st('on', { source_list: ['HDMI 1', 'ROKU', 'Netflix'] });
  assert.equal(resolveSourceName(tv, ['Roku OTT', 'Roku']), 'ROKU');
  assert.equal(resolveSourceName(tv, ['netflix']), 'Netflix');
  assert.equal(resolveSourceName(tv, ['Max']), 'Max', 'si no está en la lista, se manda el primer candidato');
  assert.equal(resolveSourceName(st('on'), ['Roku OTT', 'Roku']), 'Roku OTT', 'sin source_list');
});

test('sourceMatches compara sin mayúsculas y entiende app_name del Roku', () => {
  assert.equal(sourceMatches(st('on', { source: 'netflix' }), ['Netflix']), true);
  assert.equal(sourceMatches(st('on', { source: 'HDMI 1' }), ['Netflix']), false);
  assert.equal(sourceMatches(st('on', { app_name: 'Disney Plus', source: 'Home' }), ['Disney Plus'], true), true, 'Roku: manda app_name');
  assert.equal(sourceMatches(st('on', { source: 'Netflix' }), ['Netflix'], true), true, 'Roku sin app_name: usa source');
  assert.equal(sourceMatches(st('on', { app_name: 'Netflix', source: 'HDMI 1' }), ['Netflix']), false, 'TV: un app_name viejo no cuenta');
  assert.equal(sourceMatches(undefined, ['Netflix']), false);
});

test('aviso: TV con Roku y botón de arriba con acción propia', () => {
  const base = { tvs: [{ entity: 'media_player.lg', companion: { media_entity: 'media_player.roku', remote_entity: 'remote.roku' } }] };
  assert.deepEqual(normalizeConfig(base).warnings, [], 'con el EXIT por defecto no hay aviso');
  const custom = normalizeConfig({ ...base, buttons: { top_left: { action: 'script.frame' } } });
  assert.match(custom.warnings.join(), /selector TV \| Roku/);
});

// ---------------------------------------------------------------------------
// Estilos y temas
// ---------------------------------------------------------------------------
const ONE_TV = { tvs: [{ entity: 'media_player.tv' }] };

test('style: relieve por defecto, acepta los tres, avisa si no existe', () => {
  assert.deepEqual(STYLES, ['relieve', 'halo', 'cristal']);
  assert.equal(normalizeConfig(ONE_TV).style, 'relieve');
  assert.equal(normalizeConfig({ ...ONE_TV, style: 'Cristal ' }).style, 'cristal');
  const bad = normalizeConfig({ ...ONE_TV, style: 'neon' });
  assert.equal(bad.style, 'relieve');
  assert.match(bad.warnings.join(), /Estilo desconocido "neon"/);
});

test('theme: light, dark, auto; por defecto oscuro (como producción)', () => {
  assert.equal(normalizeConfig(ONE_TV).theme, 'dark');
  assert.equal(normalizeConfig({ ...ONE_TV, theme: 'auto' }).theme, 'auto');
  assert.equal(normalizeConfig({ ...ONE_TV, colorMode: 'light' }).theme, 'light');
});

// ---------------------------------------------------------------------------
// describeNow: qué dice la pantalla de vidrio
// ---------------------------------------------------------------------------
const slots = normalizeConfig({ ...ONE_TV, streaming: [{ source: 'netflix', accent: '#ff0000' }, { source: 'disney' }] }).tvs[0].settings.streaming;
const now = (o) => describeNow({ status: 'on', busy: null, roku: false, hasCompanion: false, tvState: null, rokuState: null, streaming: slots, ...o });

test('describeNow: estados sin fuente', () => {
  assert.equal(now({ status: 'off' }).title, 'Apagada');
  assert.equal(now({ status: 'unavailable' }).title, 'Sin conexión');
  assert.match(now({ status: 'unavailable' }).sub, /conectada a la red/);
  assert.equal(now({ status: 'off', busy: 'Encendiendo…' }).title, 'Encendiendo…');
  assert.equal(now({ status: 'off' }).accent, null, 'apagada: sin color');
});

test('describeNow: fuente del catálogo, con el color del botón si lo configuró', () => {
  const n = now({ tvState: st('on', { source: 'Netflix' }) });
  assert.deepEqual([n.title, n.sourceId, n.accent], ['Netflix', 'netflix', '#ff0000'], 'el accent del YAML gana al del catálogo');
  const d = now({ tvState: st('on', { source: 'Disney+' }) });
  assert.equal(d.accent, '#1f5bff', 'sin accent en el YAML: color del catálogo');
  const y = now({ tvState: st('on', { source: 'YouTube' }) });
  assert.equal(y.sourceId, 'YouTube', 'también reconoce fuentes que no están en los botones');
});

test('describeNow: fuente desconocida y HDMI', () => {
  const h = now({ tvState: st('on', { source: 'HDMI 1' }) });
  assert.deepEqual([h.title, h.icon, h.accent], ['HDMI 1', 'mdi:hdmi-port', null]);
  const x = now({ tvState: st('on', { source: 'Live TV' }) });
  assert.deepEqual([x.title, x.sourceId], ['Live TV', null]);
});

test('describeNow: modo Roku usa la app del Roku', () => {
  const r = now({ roku: true, hasCompanion: true, tvState: st('on', { source: 'Roku' }), rokuState: st('on', { app_name: 'Disney Plus' }) });
  assert.deepEqual([r.title, r.sub, r.sourceId], ['Disney+', 'En el Roku', 'disney']);
  const home = now({ roku: true, hasCompanion: true, rokuState: st('on', { app_name: 'Home' }) });
  assert.deepEqual([home.title, home.accent], ['Home', '#6f1ab1'], 'app sin color: morado Roku');
  assert.equal(now({ hasCompanion: true, tvState: st('on', { source: 'HDMI 2' }) }).sub, 'En la TV');
});
