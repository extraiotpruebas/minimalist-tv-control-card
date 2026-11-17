import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, resolveForPlatform } from '../minimalist-tv-control-card.js';

// ---------------------------------------------------------------------------
// Errores de validación
// ---------------------------------------------------------------------------
test('sin TVs ni entity → error claro', () => {
  assert.throws(() => normalizeConfig({ type: 'custom:tv-control-card' }), /al menos una TV/);
  assert.throws(() => normalizeConfig({ tvs: [{ name: 'Sala' }] }), /TV #1 no tiene "entity"/);
});

test('card_id ya no es obligatorio: se deriva de las entidades', () => {
  const m = normalizeConfig({ tvs: [{ entity: 'media_player.a' }, { entity: 'media_player.b' }] });
  assert.equal(m.cardId, 'auto:media_player.a,media_player.b');
  assert.equal(m.tvs[0].name, 'media_player.a', 'sin name, se usa la entidad');
});

// ---------------------------------------------------------------------------
// Formato viejo mínimo (README)
// ---------------------------------------------------------------------------
test('config mínima del README: una TV LG, modos por defecto y navegacion → menu', () => {
  const m = normalizeConfig({ type: 'custom:tv-control-card', entity: 'media_player.mi_tv' });
  assert.equal(m.format, 'legacy');
  assert.equal(m.theme, 'dark');
  assert.equal(m.tvs.length, 1);
  assert.deepEqual(
    { entity: m.tvs[0].entity, platform: m.tvs[0].platform, companion: m.tvs[0].companion },
    { entity: 'media_player.mi_tv', platform: 'lg', companion: null },
  );
  assert.deepEqual(m.tvs[0].settings.modes, ['menu', 'busqueda', 'audio']);
  assert.deepEqual(m.tvs[0].settings.streaming.map((s) => s.source.id), ['netflix', 'disney', 'YouTube', 'appletv']);
  assert.deepEqual(m.warnings, []);
});

test('modos reservados o desconocidos se omiten con aviso', () => {
  const m = normalizeConfig({ entity: 'media_player.tv', mode_slot_1: 'text', mode_slot_2: 'inventado', mode_slot_3: 'fuentes' });
  assert.deepEqual(m.tvs[0].settings.modes, ['fuentes']);
  assert.equal(m.warnings.length, 2);
});

test('el modo fuentes ahora usa select_source (antes LG mandaba "pendiente")', () => {
  const m = normalizeConfig({ entity: 'media_player.tv', mode_slot_1: 'fuentes' });
  assert.deepEqual(m.tvs[0].settings.modeDefs.fuentes.pad.up.action, { type: 'source', source: 'HDMI 1' });
});

test('custom mode con valores por marca que coinciden → una sola acción', () => {
  const m = normalizeConfig({
    entity: 'media_player.tv', mode_slot_1: 'custom1',
    custom1_up_value: 'VOLUMEUP', custom1_up_value_lg: 'VOLUMEUP', custom1_up_value_samsung: 'KEY_VOLUP',
  });
  assert.deepEqual(m.tvs[0].settings.modeDefs.custom1.pad.up.action, { type: 'key', key: 'vol_up' });
});

test('custom mode con valores por marca distintos → acción por plataforma', () => {
  const m = normalizeConfig({
    entity: 'media_player.tv', mode_slot_1: 'custom1',
    custom1_right_value: 'command:com.webos.surfacemanager/showInputPicker',
    custom1_right_value_lg: 'command:com.webos.surfacemanager/showInputPicker',
    custom1_right_value_samsung: 'KEY_SOURCE',
  });
  const action = m.tvs[0].settings.modeDefs.custom1.pad.right.action;
  assert.equal(action.type, 'platform');
  assert.equal(resolveForPlatform(action, 'lg').type, 'command');
  assert.deepEqual(resolveForPlatform(action, 'samsung'), { type: 'key', key: 'input_menu' });
  assert.equal(resolveForPlatform(action, 'roku').type, 'command', 'roku cae en la variante default');
});

// ---------------------------------------------------------------------------
// Formato nuevo v4
// ---------------------------------------------------------------------------
test('formato v4 completo', () => {
  const m = normalizeConfig({
    card_id: 'sala',
    theme: 'light',
    tvs: [{
      name: 'Sala', entity: 'media_player.lg', platform: 'lg',
      companion: { platform: 'roku', media_entity: 'media_player.roku', remote_entity: 'remote.roku' },
    }],
    modes: ['menu', 'custom1'],
    custom_modes: { custom1: { label: 'Ampli', icon: 'mdi:speaker', up: { icon: 'mdi:plus', action: 'script.subir' } } },
    streaming: [{ source: 'hbomax', accent: '#5822b4' }],
    buttons: { top_left: { icon: 'mdi:palette', action: 'script.frame' } },
  });
  assert.equal(m.format, 'v4');
  assert.equal(m.theme, 'light');
  const tv = m.tvs[0];
  assert.deepEqual(tv.companion, { platform: 'roku', entity: 'media_player.roku', remote: 'remote.roku' });
  assert.equal(tv.settings.modeDefs.custom1.label, 'Ampli');
  assert.equal(tv.settings.modeDefs.custom1.pad.up.action.service, 'script.turn_on');
  assert.equal(tv.settings.modeDefs.custom1.pad.down.action, null);
  assert.equal(tv.settings.streaming[0].source.id, 'hbomax');
  assert.equal(tv.settings.streaming[0].accent, '#5822b4');
  assert.equal(tv.settings.streaming[1].source.id, 'disney', 'slots no definidos usan la fuente por defecto');
  assert.equal(tv.settings.buttons.top_left.icon, 'mdi:palette');
  assert.deepEqual(tv.settings.buttons.exit.action, { type: 'key', key: 'exit' });
});

test('overrides por TV: solo la TV con overrides cambia, las demás comparten la config global', () => {
  const m = normalizeConfig({
    modes: ['menu', 'audio'],
    tvs: [
      { entity: 'media_player.a' },
      { entity: 'media_player.b', overrides: { modes: ['fuentes'] } },
      { entity: 'media_player.c', mode_slot_1: 'info' }, // variante v3: override con clave suelta
      { entity: 'media_player.d' },
    ],
  });
  assert.deepEqual(m.tvs[0].settings.modes, ['menu', 'audio']);
  assert.deepEqual(m.tvs[1].settings.modes, ['fuentes']);
  assert.strictEqual(m.tvs[0].settings, m.tvs[3].settings, 'sin overrides se reutiliza el mismo objeto');
  // Nota: en c, la clave vieja mode_slot_1 pierde contra la clave nueva global `modes`.
  assert.deepEqual(m.tvs[2].settings.modes, ['menu', 'audio']);
});

test('acentos viejos "r, g, b" se convierten a rgb()', () => {
  const m = normalizeConfig({ entity: 'media_player.tv', netflix_accent_color: '229, 9, 20' });
  assert.equal(m.tvs[0].settings.streaming[0].accent, 'rgb(229, 9, 20)');
});

// ---------------------------------------------------------------------------
// Configs reales de clientes: sus pruebas viven en test/fixtures/private/
// (gitignored) porque mencionan entidades y scripts reales. Ver *.test.mjs ahí.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Robustez (hallazgos de la revisión del agente de documentación)
// ---------------------------------------------------------------------------
test('atajos de YAML: un string como acción de pad o de botón', () => {
  const m = normalizeConfig({
    entity: 'media_player.tv', modes: ['custom1'],
    custom_modes: { custom1: { up: 'vol_up' } },
    buttons: { power: 'script.power_custom' },
  });
  const s = m.tvs[0].settings;
  assert.deepEqual(s.modeDefs.custom1.pad.up.action, { type: 'key', key: 'vol_up' });
  assert.equal(s.buttons.power.action.data.entity_id, 'script.power_custom');
  assert.equal(s.buttons.power.icon, 'mdi:power', 'conserva el ícono por defecto');
});

test('tipo de TV desconocido → LG con aviso', () => {
  const m = normalizeConfig({ tvs: [{ entity: 'media_player.x', type: 'philips' }] });
  assert.equal(m.tvs[0].platform, 'lg');
  assert.ok(m.warnings.some((w) => w.includes('philips')));
});

test('el modelo normalizado y los catálogos están congelados', () => {
  const m = normalizeConfig({ entity: 'media_player.tv' });
  assert.ok(Object.isFrozen(m) && Object.isFrozen(m.tvs[0].settings.modes));
  assert.throws(() => { m.tvs[0].settings.modes.push('info'); }, TypeError);
});

// ---------------------------------------------------------------------------
// numpad (paso 7)
// ---------------------------------------------------------------------------
test('v3: back_type/exit_type: numpad → acción numpad (antes era un aviso)', () => {
  const m = normalizeConfig({
    entity: 'media_player.lg', type: 'LG TV',
    back_type: 'numpad', back_icon: 'mdi:dialpad', back_value: 'BACK',
    exit_type: 'numpad',
  });
  const b = m.tvs[0].settings.buttons;
  assert.deepEqual(b.back.action, { type: 'numpad' });
  assert.equal(b.back.icon, 'mdi:dialpad', 'conserva el ícono');
  assert.deepEqual(b.top_left.action, { type: 'numpad' }, 'el exit de arriba de la v3 es top_left');
  assert.deepEqual(b.home.action, { type: 'key', key: 'home' }, 'los demás no cambian');
  assert.ok(!m.warnings.some((w) => /numpad/i.test(w)), 'ya no hay aviso de "se implementará"');
});

test('formato nuevo: cualquier botón puede abrir el numpad', () => {
  const m = normalizeConfig({ tvs: [{ entity: 'media_player.lg' }], buttons: { menu: { icon: 'mdi:dialpad', action: 'numpad' } } });
  assert.deepEqual(m.tvs[0].settings.buttons.menu.action, { type: 'numpad' });
});
