// El archivo que se instala en HA (dist/) debe comportarse EXACTAMENTE igual que src/.
// Las demás pruebas usan src/; esta compara las dos versiones con las mismas entradas.
// Requiere `npm run build` antes (sin dist/ la prueba se salta con un aviso).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import * as src from '../src/index.js';

const DIST_URL = new URL('../dist/minimalist-tv-control-card.js', import.meta.url);

// dist/ trae la versión de Lit para NAVEGADOR: al cargarse extiende HTMLElement y
// prepara un TreeWalker de `document`. Node no tiene ninguno de los dos, así que se
// simulan lo mínimo para poder importarlo (aquí no se pinta nada: solo se compara la
// lógica). node --test corre cada archivo en su propio proceso: estos globales no
// llegan a las demás pruebas.
globalThis.HTMLElement ??= class {};
globalThis.document ??= { createTreeWalker: () => ({}), createComment: () => ({}) };

const dist = existsSync(DIST_URL) ? await import(DIST_URL.href) : null;
const skip = !dist && 'no existe dist/: corre `npm run build`';

// Copia "plana" para comparar solo datos (las clases y funciones de cada copia son
// objetos distintos aunque hagan lo mismo).
const plain = (x) => JSON.parse(JSON.stringify(x));

const CONFIGS = [
  { entity: 'media_player.tv' },
  { entity: 'media_player.tv', modelConfig: 'samsung', mode_slot_1: 'navegacion', custom1_up_value: 'VOLUMEUP', exit_value: 'script.x' },
  {
    card_id: 'sala', style: 'halo', theme: 'auto', control_mode_entity: 'input_select.modo',
    tvs: [
      { name: 'Sala', entity: 'media_player.sala', platform: 'lg', companion: { media_entity: 'media_player.roku', remote_entity: 'remote.roku' } },
      { name: 'Rec', entity: 'media_player.rec', platform: 'samsung', overrides: { modes: ['audio', 'menu', 'busqueda'] } },
    ],
    modes: ['menu', 'busqueda', 'custom1'],
    custom_modes: { custom1: { label: 'PIN', up: { icon: 'mdi:lock', action: ['digit_1', 'digit_2', 'enter'] } } },
    streaming: [{ source: 'netflix' }, { source: 'fubo' }, { source: 'roku' }, { source: 'hdmi2', action: 'script.hdmi', accent: '229, 9, 20' }],
    buttons: { menu: { icon: 'mdi:dialpad', action: 'numpad' }, home: { action: { type: 'platform', by: { lg: 'HOME', samsung: 'KEY_HOME' } } } },
  },
];
// Configs reales de clientes (test/fixtures/private/, gitignored), si existen.
const PRIVATE_DIR = new URL('./fixtures/private/', import.meta.url);
if (existsSync(PRIVATE_DIR)) {
  for (const f of readdirSync(PRIVATE_DIR).filter((n) => n.endsWith('.json'))) {
    CONFIGS.push(JSON.parse(readFileSync(new URL(f, PRIVATE_DIR), 'utf8')));
  }
}

test('dist/ exporta lo mismo que src/', { skip }, () => {
  assert.deepEqual(Object.keys(dist).sort(), Object.keys(src).sort());
  assert.equal(dist.CARD_VERSION, src.CARD_VERSION);
});

test('dist/: mismos catálogos', { skip }, () => {
  for (const name of ['KEYS', 'SOURCES', 'FIXED_MODES', 'DEFAULT_BUTTONS', 'STYLES']) {
    assert.deepEqual(plain(dist[name]), plain(src[name]), name);
  }
  assert.deepEqual([...dist.CODE_TO_KEY], [...src.CODE_TO_KEY]);
});

test('dist/: mismo parseAction', { skip }, () => {
  const inputs = [...Object.keys(src.KEYS), 'VOLUMEUP', 'KEY_HDMI', 'script.x', 'source:HDMI 1', 'command:ssap://tv/channelUp',
    'numpad', 'pendiente', '', ['up', 'enter'], { type: 'platform', by: { lg: 'HOME', default: 'home' } }];
  for (const input of inputs) assert.deepEqual(dist.parseAction(input), src.parseAction(input), JSON.stringify(input));
});

test('dist/: mismo normalizeConfig, serializeV4 y vista del editor', { skip }, () => {
  for (const config of CONFIGS) {
    assert.deepEqual(plain(dist.normalizeConfig(config)), plain(src.normalizeConfig(config)));
    assert.deepEqual(dist.serializeV4(config), src.serializeV4(config));
    const ctx = { model: src.normalizeConfig(config), error: null };
    assert.deepEqual(plain(dist.buildEditorView(config, ctx)), plain(src.buildEditorView(config, ctx)));
  }
});

test('dist/: mismo ruteo con Roku', { skip }, () => {
  const tv = { platform: 'lg', entity: 'media_player.tv', companion: { platform: 'roku', entity: 'media_player.roku', remote: 'remote.roku' } };
  for (const key of Object.keys(src.KEYS)) {
    for (const rokuMode of [false, true]) {
      const action = { type: 'key', key };
      assert.deepEqual(dist.routeAction(action, { tv, rokuMode, mode: null }), src.routeAction(action, { tv, rokuMode, mode: null }), key);
    }
  }
});
