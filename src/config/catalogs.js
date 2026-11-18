/* Módulo §5, primera parte: catálogos. La segunda parte es config/normalize.js. */
import { KEYS } from '../actions/keys.js';
import { parseAction } from '../actions/parse.js';
import { deepFreeze } from '../util.js';

/* ============================================================================
 * §5  CATÁLOGOS Y CONFIGURACIÓN
 * ----------------------------------------------------------------------------
 * normalizeConfig(raw) recibe el YAML tal como lo escribió el usuario (formato
 * nuevo v4, formato del repo v3.x, o claves de la variante "v3 multientidad") y
 * devuelve UN modelo interno limpio. La tarjeta solo lee ese modelo; nunca
 * vuelve a mirar las claves crudas del YAML.
 *
 * Beneficios:
 *   - Toda la "arqueología" de formatos viejos vive en un solo lugar.
 *   - Es una función pura (misma entrada → misma salida, sin tocar el DOM ni a
 *     HA), así que se prueba con Node sin navegador.
 *   - Lo que no se entiende queda en `warnings`, en vez de ignorarse en silencio.
 * ========================================================================== */

/** Fuentes/apps que se pueden asignar a los 4 botones de streaming. */
const SOURCES = [
  // `accent`: color de la marca. Tiñe la luz de la pantalla y el botón activo; un
  // `accent` en el YAML del botón de streaming tiene prioridad.
  { id: 'netflix',     name: 'Netflix',     icon: 'mdi:netflix',        service: 'Netflix',     rokuSource: 'Netflix',     accent: '#e50914' },
  { id: 'disney',      name: 'Disney+',     icon: 'phu:disney-plus',    service: 'Disney+',     rokuSource: 'Disney Plus', accent: '#1f5bff' },
  { id: 'prime',       name: 'Prime Video', icon: 'phu:prime-video',    service: 'Prime Video', rokuSource: 'Prime Video', accent: '#00a8e1' },
  { id: 'YouTube',     name: 'YouTube',     icon: 'mdi:youtube',        service: 'YouTube',     rokuSource: 'YouTube',     accent: '#ff0033' },
  { id: 'appletv',     name: 'Apple TV',    icon: 'phu:apple-tv',       service: 'Apple TV',    rokuSource: 'Apple TV',    accent: '#a1a6ad' },
  { id: 'hbomax',      name: 'Max',         icon: 'phu:hbo-max',        service: 'Max',         rokuSource: 'Max',         accent: '#3355ff' },
  { id: 'paramount',   name: 'Paramount+',  icon: 'phu:paramount-plus', service: 'Paramount+',  rokuSource: 'Paramount Plus', accent: '#0064ff' },
  { id: 'dazn',        name: 'DAZN',        icon: 'phu:dazn',           service: 'DAZN',        rokuSource: 'DAZN Live Sports Streaming', accent: '#e8ff1a' },
  { id: 'universal',   name: 'Universal+',  icon: 'mdi:earth',          service: 'Universal+',  rokuSource: 'Universal+',  accent: null },
  { id: 'spotify',     name: 'Spotify',     icon: 'mdi:spotify',        service: 'Spotify',     rokuSource: 'Spotify',     accent: '#1db954' },
  { id: 'crunchyroll', name: 'Crunchyroll', icon: 'mdi:alpha-c-circle', service: 'Crunchyroll', rokuSource: 'Crunchyroll', accent: '#f47521' },
  { id: 'twitch',      name: 'Twitch',      icon: 'mdi:twitch',         service: 'Twitch',      rokuSource: 'Twitch',      accent: '#9146ff' },
  { id: 'fubo',        name: 'Fubo',        icon: 'mdi:alpha-f-circle', service: null,          rokuSource: 'Fubo: Watch Live TV & Sports', accent: '#fa4616' },
  { id: 'roku',        name: 'Roku',        icon: 'phu:roku-ultra',     service: 'Roku OTT',    alternates: ['Roku OTT', 'Roku'], rokuSource: null, accent: '#6f1ab1' },
  { id: 'hdmi1',       name: 'HDMI 1',      icon: 'mdi:hdmi-port',      service: 'HDMI 1',      rokuSource: null,          accent: null },
  { id: 'hdmi2',       name: 'HDMI 2',      icon: 'mdi:hdmi-port',      service: 'HDMI 2',      rokuSource: null,          accent: null },
  { id: 'hdmi3',       name: 'HDMI 3',      icon: 'mdi:hdmi-port',      service: 'HDMI 3',      rokuSource: null,          accent: null },
  { id: 'hdmi4',       name: 'HDMI 4',      icon: 'mdi:hdmi-port',      service: 'HDMI 4',      rokuSource: null,          accent: null },
];
const SOURCES_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

/** Fuentes de los 4 botones de streaming cuando el usuario no eligió nada (igual que producción). */
const DEFAULT_STREAMING = ['netflix', 'disney', 'YouTube', 'appletv'];

const DIRECTIONS = ['up', 'left', 'right', 'down'];
const NUMPAD_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];   // el 0 va abajo al centro, entre Cerrar y OK

/**
 * Atajo para escribir los "pads" (las 4 direcciones del touchpad) de forma compacta:
 *   pad(['mdi:plus', 'ch_up'], ...)  →  { up: { icon, action }, left: ..., right: ..., down: ... }
 * El orden de los argumentos es siempre: up, left, right, down.
 */
function pad(...entries) {
  const result = {};
  DIRECTIONS.forEach((dir, i) => {
    const [icon, action] = entries[i] || [];
    result[dir] = { icon: icon || null, action: parseAction(action) };
  });
  return result;
}

/**
 * Modos "fijos": vienen con la tarjeta. `navegacion` (la maqueta deprecada) se
 * migra a `menu`, que hace lo mismo pero con íconos que corresponden a la acción.
 * `text` y `amplificador` están reservados para la Fase 4: si un YAML los trae,
 * se descartan con un aviso.
 */
const FIXED_MODES = {
  menu: {
    label: 'Menú', icon: 'mdi:menu-open',
    pad: pad(['mdi:home', 'home'], ['mdi:menu', 'menu'], ['mdi:exit-to-app', 'exit'], ['mdi:undo-variant', 'back']),
  },
  busqueda: {
    label: 'Canales', icon: 'mdi:television-classic',
    pad: pad(['mdi:plus-box', 'ch_up'], ['mdi:hdmi-port', 'input_menu'], ['mdi:format-list-numbered', 'guide'], ['mdi:minus-box', 'ch_down']),
  },
  audio: {
    label: 'Audio', icon: 'mdi:volume-high',
    pad: pad(['mdi:volume-plus', 'vol_up'], ['mdi:volume-off', 'mute'], ['mdi:surround-sound', null], ['mdi:volume-minus', 'vol_down']),
  },
  fuentes: {
    label: 'Fuentes', icon: 'mdi:television-shimmer',
    pad: pad(
      ['mdi:numeric-1-box-multiple-outline', 'source:HDMI 1'],
      ['mdi:numeric-2-box-multiple-outline', 'source:HDMI 2'],
      ['mdi:numeric-3-box-multiple-outline', 'source:HDMI 3'],
      ['mdi:numeric-4-box-multiple-outline', 'source:HDMI 4'],
    ),
  },
  info: {
    label: 'Información', icon: 'mdi:information-variant-circle-outline',
    pad: pad(['mdi:television-guide', 'guide'], ['mdi:information-slab-circle-outline', 'info'], ['mdi:apps', 'apps'], ['mdi:tools', 'asterisk']),
  },
};
const MODE_ALIASES = { navegacion: 'menu' };
const RESERVED_MODES = new Set(['text', 'amplificador']);
const CUSTOM_MODE_IDS = ['custom1', 'custom2', 'custom3'];

/** Touchpad cuando no hay modo activo: las 4 flechas (producción usaba puntos; el rediseño, chevrones). */
const DEFAULT_PAD = pad(['mdi:chevron-up', 'up'], ['mdi:chevron-left', 'left'], ['mdi:chevron-right', 'right'], ['mdi:chevron-down', 'down']);

/**
 * Botones fijos de la tarjeta.
 * `top_left` es el botón de arriba a la izquierda. En los YAML viejos se llamaba
 * "exit" (exit_icon / exit_value), aunque muchos clientes lo usan para scripts
 * (p. ej. control del Frame). Por eso en v4 se separa del EXIT de abajo.
 */
const DEFAULT_BUTTONS = {
  top_left: { icon: 'mdi:exit-to-app',  action: 'exit' },
  power:    { icon: 'mdi:power',        action: null },  // null = encender/apagar la TV (lo resuelve la tarjeta)
  center:   { icon: null,               action: 'enter' },
  back:     { icon: 'mdi:undo-variant', action: 'back' },
  home:     { icon: 'mdi:home',         action: 'home' },
  exit:     { icon: 'mdi:exit-to-app',  action: 'exit' },
  menu:     { icon: 'mdi:menu',         action: 'menu' },
};
const BOTTOM_BUTTONS = ['back', 'home', 'exit', 'menu'];

// Los catálogos son de solo lectura (deepFreeze está en util.js). KEYS viene de
// actions/keys.js, que ya agregó los dígitos al cargarse: aquí se congela completo.
[KEYS, SOURCES, FIXED_MODES, DEFAULT_PAD, DEFAULT_BUTTONS].forEach(deepFreeze);

export { BOTTOM_BUTTONS, CUSTOM_MODE_IDS, DEFAULT_BUTTONS, DEFAULT_PAD, DEFAULT_STREAMING, DIRECTIONS, FIXED_MODES, MODE_ALIASES, NUMPAD_DIGITS, RESERVED_MODES, SOURCES, SOURCES_BY_ID, pad };
