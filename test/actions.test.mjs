import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAction, executeAction, isHoldable, resolveForPlatform, KEYS, UnsupportedActionError,
} from '../src/index.js';
import { createFakeHass, LG_TV, SAMSUNG_TV, ROKU } from './helpers.mjs';

test('vacío, null y "pendiente" no son acciones', () => {
  for (const raw of [null, undefined, '', '   ', 'pendiente', 'PENDIENTE']) {
    assert.equal(parseAction(raw), null, `raw=${JSON.stringify(raw)}`);
  }
});

test('códigos de LG, Samsung y Roku se traducen a la misma tecla semántica', () => {
  assert.deepEqual(parseAction('VOLUMEUP'), { type: 'key', key: 'vol_up' });
  assert.deepEqual(parseAction('KEY_VOLUP'), { type: 'key', key: 'vol_up' });
  assert.deepEqual(parseAction('volume_up'), { type: 'key', key: 'vol_up' });
  assert.deepEqual(parseAction('KEY_RETURN'), { type: 'key', key: 'back' });
  assert.deepEqual(parseAction('select'), { type: 'key', key: 'enter' });
  assert.deepEqual(parseAction('1'), { type: 'key', key: 'digit_1' });
});

test('nombres semánticos y prefijo key:', () => {
  assert.deepEqual(parseAction('up'), { type: 'key', key: 'up' });
  assert.deepEqual(parseAction('key:mute'), { type: 'key', key: 'mute' });
  assert.equal(parseAction('key:no_existe'), null);
});

test('códigos desconocidos se mandan como botón crudo', () => {
  assert.deepEqual(parseAction('KEY_HDMI'), { type: 'button', button: 'KEY_HDMI' });
});

test('script. y scene. se vuelven llamadas a servicio', () => {
  assert.deepEqual(parseAction('script.art_mode'), {
    type: 'service', service: 'script.turn_on', data: { entity_id: 'script.art_mode' },
  });
  assert.deepEqual(parseAction('scene.cine'), {
    type: 'service', service: 'scene.turn_on', data: { entity_id: 'scene.cine' },
  });
});

test('source: y command: (con o sin ssap://)', () => {
  assert.deepEqual(parseAction('source:HDMI 1'), { type: 'source', source: 'HDMI 1' });
  assert.deepEqual(parseAction('command:com.webos.surfacemanager/showInputPicker'), {
    type: 'command', command: 'com.webos.surfacemanager/showInputPicker',
  });
  assert.deepEqual(parseAction('command:ssap://tv/channelUp'), { type: 'command', command: 'tv/channelUp' });
});

test('objetos válidos se copian y los inválidos dan null', () => {
  const cmd = { type: 'command', command: 'system.launcher/launch', payload: { id: 'netflix' } };
  const parsed = parseAction(cmd);
  assert.deepEqual(parsed, cmd);
  assert.notEqual(parsed.payload, cmd.payload, 'el payload debe ser una copia, no la misma referencia');

  assert.equal(parseAction({ type: 'inventado' }), null);
  assert.equal(parseAction({ type: 'service', service: 'sin_punto' }), null);
  assert.equal(parseAction({ type: 'key', key: 'no_existe' }), null);
});

test('secuencias: lista corta, pasos inválidos descartados, delay por defecto', () => {
  const seq = parseAction(['1', '1', 'pendiente', '0', '2']);
  assert.equal(seq.type, 'sequence');
  assert.equal(seq.steps.length, 4);
  assert.equal(seq.delay, 400);
  assert.equal(parseAction({ type: 'sequence', steps: [] }), null);
});

test('acción por plataforma', () => {
  const a = parseAction({ type: 'platform', by: { lg: 'command:com.webos.surfacemanager/showInputPicker', samsung: 'KEY_SOURCE' } });
  assert.deepEqual(resolveForPlatform(a, 'lg'), { type: 'command', command: 'com.webos.surfacemanager/showInputPicker' });
  assert.deepEqual(resolveForPlatform(a, 'samsung'), { type: 'key', key: 'input_menu' });
  assert.equal(resolveForPlatform(a, 'roku'), null);
});

test('isHoldable solo permite las flechas (como producción)', () => {
  assert.equal(isHoldable(parseAction('UP')), true);
  assert.equal(isHoldable(parseAction('KEY_LEFT')), true);
  assert.equal(isHoldable(parseAction('KEY_VOLDOWN')), false, 'el volumen no se repite');
  assert.equal(isHoldable(parseAction('vol_up')), false);
  assert.equal(isHoldable(parseAction('CHANNELUP')), false, 'el canal no se repite');
  assert.equal(isHoldable(parseAction('ENTER')), false);
  assert.equal(isHoldable(parseAction('script.x')), false);
  assert.equal(isHoldable(parseAction('command:tv/channelUp')), false);
});

test('la tabla KEYS no tiene códigos duplicados dentro de una misma plataforma (salvo excepciones conocidas)', () => {
  const allowed = new Set(['roku:play']);
  for (const platform of ['lg', 'samsung', 'roku']) {
    const seen = new Map();
    for (const [key, def] of Object.entries(KEYS)) {
      const code = def[platform];
      if (!code) continue;
      if (seen.has(code) && !allowed.has(`${platform}:${code}`)) {
        assert.fail(`${platform}: "${code}" está en ${seen.get(code)} y en ${key}`);
      }
      seen.set(code, key);
    }
  }
});

test('la misma tecla genera la llamada correcta en cada plataforma', async () => {
  const hass = createFakeHass();
  const up = parseAction('up');
  await executeAction(hass, up, LG_TV);
  await executeAction(hass, up, SAMSUNG_TV);
  await executeAction(hass, up, ROKU);
  assert.deepEqual(hass.calls, [
    { domain: 'webostv', service: 'button', data: { entity_id: 'media_player.lg', button: 'UP' } },
    { domain: 'media_player', service: 'play_media', data: { entity_id: 'media_player.samsung', media_content_type: 'send_key', media_content_id: 'KEY_UP' } },
    { domain: 'remote', service: 'send_command', data: { entity_id: 'remote.roku', command: 'up' } },
  ]);
});

test('el VOLUMEUP de un YAML viejo ahora funciona en Samsung', async () => {
  const hass = createFakeHass();
  await executeAction(hass, parseAction('VOLUMEUP'), SAMSUNG_TV);
  assert.equal(hass.calls[0].data.media_content_id, 'KEY_VOLUP');
});

test('LG command usa webostv.command, sin ssap:// y con payload opcional', async () => {
  const hass = createFakeHass();
  await executeAction(hass, parseAction('command:ssap://com.webos.surfacemanager/showInputPicker'), LG_TV);
  await executeAction(hass, parseAction({ type: 'command', command: 'tv/switchInput', payload: { inputId: 'HDMI_2' } }), LG_TV);
  assert.deepEqual(hass.calls, [
    { domain: 'webostv', service: 'command', data: { entity_id: 'media_player.lg', command: 'com.webos.surfacemanager/showInputPicker' } },
    { domain: 'webostv', service: 'command', data: { entity_id: 'media_player.lg', command: 'tv/switchInput', payload: { inputId: 'HDMI_2' } } },
  ]);
});

test('command en Samsung es rechazado sin llamar a HA', async () => {
  const hass = createFakeHass();
  await assert.rejects(executeAction(hass, parseAction('command:tv/channelUp'), SAMSUNG_TV), UnsupportedActionError);
  assert.equal(hass.calls.length, 0);
});

test('tecla sin código en la plataforma es rechazada (exit en Roku)', async () => {
  const hass = createFakeHass();
  await assert.rejects(executeAction(hass, parseAction('exit'), ROKU), UnsupportedActionError);
  assert.equal(hass.calls.length, 0);
});

test('source y service', async () => {
  const hass = createFakeHass();
  await executeAction(hass, parseAction('source:HDMI 1'), ROKU);
  await executeAction(hass, parseAction('script.surround_mode'), LG_TV);
  assert.deepEqual(hass.calls, [
    { domain: 'media_player', service: 'select_source', data: { entity_id: 'media_player.roku', source: 'HDMI 1' } },
    { domain: 'script', service: 'turn_on', data: { entity_id: 'script.surround_mode' } },
  ]);
});

test('una secuencia se ejecuta en orden y espera entre pasos', async () => {
  const hass = createFakeHass({ latency: 5 });
  const seq = parseAction({ type: 'sequence', steps: ['1', '1', '0', '2'], delay: 20 });
  const start = Date.now();
  await executeAction(hass, seq, LG_TV);
  const elapsed = Date.now() - start;
  assert.deepEqual(hass.calls.map((c) => c.data.button), ['1', '1', '0', '2']);
  assert.ok(elapsed >= 60, `debió esperar ~3×20ms, tardó ${elapsed}ms`);
});

test('si HA falla, la Promise se rechaza (para poder mostrar el error)', async () => {
  const hass = createFakeHass({ fail: 'device_off' });
  await assert.rejects(executeAction(hass, parseAction('up'), LG_TV), /device_off/);
});

test('propiedades heredadas no se confunden con teclas ni plataformas', () => {
  assert.deepEqual(parseAction('toString'), { type: 'button', button: 'toString' });
  assert.equal(parseAction({ type: 'key', key: 'constructor' }), null);
});

test('secuencias mal formadas no truenan; delay acepta string numérico', () => {
  assert.equal(parseAction({ type: 'sequence', steps: 'up' }), null);
  assert.equal(parseAction({ type: 'sequence', steps: ['up'], delay: '500' }).delay, 500);
});

test('"numpad" es una acción de la tarjeta (string u objeto)', () => {
  assert.deepEqual(parseAction('numpad'), { type: 'numpad' });
  assert.deepEqual(parseAction('NUMPAD'), { type: 'numpad' });
  assert.deepEqual(parseAction({ type: 'numpad' }), { type: 'numpad' });
});

test('un paso "numpad" dentro de una secuencia se descarta', () => {
  assert.deepEqual(parseAction(['1', 'numpad', '2']).steps, [{ type: 'key', key: 'digit_1' }, { type: 'key', key: 'digit_2' }]);
  assert.equal(parseAction(['numpad']), null, 'si solo quedaba ese paso, no hay acción');
});

test('executeAction nunca manda "numpad" a un dispositivo', async () => {
  const hass = createFakeHass();
  await assert.rejects(executeAction(hass, { type: 'numpad' }, LG_TV), /acción de la tarjeta/);
  assert.equal(hass.calls.length, 0);
});

test('input: forma corta, objeto, inválidos y dentro de secuencias', () => {
  assert.deepEqual(parseAction('input:hdmi2'), { type: 'input', input: 'hdmi2' });
  assert.deepEqual(parseAction({ type: 'input', input: 'tv' }), { type: 'input', input: 'tv' });
  assert.equal(parseAction('input:hdmi9'), null);
  assert.equal(parseAction({ type: 'input' }), null);
  assert.equal(parseAction('input:'), null);
  assert.deepEqual(parseAction(['input:hdmi1', 'enter']).steps[0], { type: 'input', input: 'hdmi1' });
});

test('input en LG: tv/switchInput por puerto; la TV en vivo abre la app livetv', async () => {
  const hass = createFakeHass();
  await executeAction(hass, parseAction('input:hdmi2'), LG_TV);
  await executeAction(hass, parseAction('input:tv'), LG_TV);
  assert.deepEqual(hass.calls, [
    { domain: 'webostv', service: 'command', data: { entity_id: 'media_player.lg', command: 'tv/switchInput', payload: { inputId: 'HDMI_2' } } },
    { domain: 'webostv', service: 'command', data: { entity_id: 'media_player.lg', command: 'system.launcher/launch', payload: { id: 'com.webos.app.livetv' } } },
  ]);
});

test('input en Samsung: clave ST_ por send_key', async () => {
  const hass = createFakeHass();
  await executeAction(hass, parseAction('input:hdmi3'), SAMSUNG_TV);
  await executeAction(hass, parseAction('input:tv'), SAMSUNG_TV);
  assert.deepEqual(hass.calls.map((c) => [c.service, c.data.media_content_type, c.data.media_content_id]), [
    ['play_media', 'send_key', 'ST_HDMI3'],
    ['play_media', 'send_key', 'ST_TV'],
  ]);
});

test('input en Roku es rechazado sin llamar a HA', async () => {
  const hass = createFakeHass();
  await assert.rejects(executeAction(hass, parseAction('input:hdmi1'), ROKU), UnsupportedActionError);
  assert.equal(hass.calls.length, 0);
});

test('input por marca: cada TV recibe su variante', async () => {
  const action = parseAction({ type: 'platform', by: { lg: 'input:hdmi1', samsung: 'input:hdmi2' } });
  assert.deepEqual(resolveForPlatform(action, 'samsung'), { type: 'input', input: 'hdmi2' });
});

test('input: variantes escritas a mano se normalizan; lo que no está en el catálogo da null', () => {
  for (const v of ['HDMI 2', 'HDMI_2', 'hdmi-2', ' Hdmi2 ']) assert.deepEqual(parseAction(`input:${v}`), { type: 'input', input: 'hdmi2' }, v);
  assert.deepEqual(parseAction({ type: 'input', input: 'TV' }), { type: 'input', input: 'tv' });
  for (const v of ['hdmi5', 'HDMI 9', 'antena']) assert.equal(parseAction(`input:${v}`), null, v);
});
