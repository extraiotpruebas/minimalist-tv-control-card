/**
 * Minimalist TV Control Card — v4 (en desarrollo, rama refactor/v4)
 *
 * Mapa del archivo (en la Fase 3 cada sección se vuelve un módulo de src/):
 *   §1  Tabla de teclas semánticas (KEYS)
 *   §2  Acciones: parseAction() convierte lo que venga del YAML en un objeto
 *   §3  Plataformas (drivers): cómo habla cada marca con Home Assistant
 *   §4  executeAction(): ejecuta una acción ya normalizada sobre un dispositivo
 *   §5  Catálogos (fuentes, modos, botones) y normalizeConfig()
 *   §6  La tarjeta (custom element): ciclo de vida, render, eventos
 *   §7  (pendiente) El editor
 *
 * Este archivo se carga en HA como ES module (`type: module`), por eso puede
 * terminar con `export { ... }`. Eso permite que los tests de Node importen las
 * funciones puras sin necesidad de un navegador.
 */

const CARD_VERSION = '4.0.0-dev';

/* ============================================================================
 * §1  TECLAS SEMÁNTICAS
 * ----------------------------------------------------------------------------
 * Una sola tabla responde "¿qué código manda cada plataforma para la tecla X?".
 * La versión anterior repetía actionLG/actionSamsung/actionRoku en 4 lugares
 * distintos, y por eso había inconsistencias (p. ej. HDMI mal mapeado).
 *
 * `null` significa "esta plataforma no tiene esa tecla".
 *
 * Analogía en C: es un arreglo de structs { const char *lg, *samsung, *roku; }
 * indexado por un enum, solo que en JS el "índice" es un string.
 * ========================================================================== */
const KEYS = {
  // Navegación
  up:          { label: 'Arriba',          lg: 'UP',          samsung: 'KEY_UP',       roku: 'up' },
  down:        { label: 'Abajo',           lg: 'DOWN',        samsung: 'KEY_DOWN',     roku: 'down' },
  left:        { label: 'Izquierda',       lg: 'LEFT',        samsung: 'KEY_LEFT',     roku: 'left' },
  right:       { label: 'Derecha',         lg: 'RIGHT',       samsung: 'KEY_RIGHT',    roku: 'right' },
  enter:       { label: 'Enter / OK',      lg: 'ENTER',       samsung: 'KEY_ENTER',    roku: 'select' },
  back:        { label: 'Atrás',           lg: 'BACK',        samsung: 'KEY_RETURN',   roku: 'back' },
  exit:        { label: 'Salir',           lg: 'EXIT',        samsung: 'KEY_EXIT',     roku: null },
  home:        { label: 'Inicio',          lg: 'HOME',        samsung: 'KEY_HOME',     roku: 'home' },
  menu:        { label: 'Menú',            lg: 'MENU',        samsung: 'KEY_MENU',     roku: null },
  info:        { label: 'Info',            lg: 'INFO',        samsung: 'KEY_INFO',     roku: 'info' },
  guide:       { label: 'Guía',            lg: 'GUIDE',       samsung: 'KEY_GUIDE',    roku: null },
  apps:        { label: 'Mis apps',        lg: 'MYAPPS',      samsung: 'KEY_APP_LIST', roku: null },
  search:      { label: 'Buscar',          lg: null,          samsung: null,           roku: 'search' },
  input_menu:  { label: 'Menú de fuentes', lg: 'INPUT_HUB',   samsung: 'KEY_SOURCE',   roku: null },
  // Canales
  ch_up:       { label: 'Subir canal',     lg: 'CHANNELUP',   samsung: 'KEY_CHUP',     roku: 'channel_up' },
  ch_down:     { label: 'Bajar canal',     lg: 'CHANNELDOWN', samsung: 'KEY_CHDOWN',   roku: 'channel_down' },
  ch_prev:     { label: 'Canal anterior',  lg: null,          samsung: 'KEY_PRECH',    roku: null },
  // Volumen
  vol_up:      { label: 'Subir volumen',   lg: 'VOLUMEUP',    samsung: 'KEY_VOLUP',    roku: 'volume_up' },
  vol_down:    { label: 'Bajar volumen',   lg: 'VOLUMEDOWN',  samsung: 'KEY_VOLDOWN',  roku: 'volume_down' },
  mute:        { label: 'Silenciar',       lg: 'MUTE',        samsung: 'KEY_MUTE',     roku: 'volume_mute' },
  // Multimedia
  play:        { label: 'Play',            lg: 'PLAY',        samsung: 'KEY_PLAY',     roku: 'play' },
  pause:       { label: 'Pausa',           lg: 'PAUSE',       samsung: 'KEY_PAUSE',    roku: 'play' },
  stop:        { label: 'Stop',            lg: 'STOP',        samsung: 'KEY_STOP',     roku: null },
  rewind:      { label: 'Rebobinar',       lg: 'REWIND',      samsung: 'KEY_REWIND',   roku: 'reverse' },
  ff:          { label: 'Avance rápido',   lg: 'FASTFORWARD', samsung: 'KEY_FF',       roku: 'forward' },
  replay:      { label: 'Repetir',         lg: null,          samsung: null,           roku: 'replay' },
  record:      { label: 'Grabar',          lg: 'RECORD',      samsung: 'KEY_REC',      roku: null },
  // Otros
  cc:          { label: 'Subtítulos',      lg: 'CC',          samsung: 'KEY_CAPTION',  roku: null },
  asterisk:    { label: 'Asterisco / Herramientas', lg: 'ASTERISK', samsung: 'KEY_TOOLS', roku: null },
  screen_remote: { label: 'Control en pantalla', lg: 'SCREEN_REMOTE', samsung: null, roku: null },
  red:         { label: 'Rojo',            lg: 'RED',         samsung: 'KEY_RED',      roku: null },
  green:       { label: 'Verde',           lg: 'GREEN',       samsung: 'KEY_GREEN',    roku: null },
  yellow:      { label: 'Amarillo',        lg: 'YELLOW',      samsung: 'KEY_YELLOW',   roku: null },
  blue:        { label: 'Azul',            lg: 'BLUE',        samsung: 'KEY_CYAN',     roku: null },
};

// Dígitos 0-9: se generan en un ciclo en lugar de escribir 10 líneas iguales.
for (let d = 0; d <= 9; d++) {
  KEYS[`digit_${d}`] = { label: String(d), lg: String(d), samsung: `KEY_${d}`, roku: null };
}

// Teclas que se repiten al mantener presionado: SOLO las flechas, igual que
// producción. Todo lo demás (volumen, canal, scripts, commands, fuentes) se
// envía UNA sola vez por toque, aunque se mantenga el dedo encima.
const HOLDABLE_KEYS = new Set(['up', 'down', 'left', 'right']);

// Teclas que siempre van a la TV aunque el Roku esté activo (el Roku no maneja
// el volumen de la TV: eso lo hace la TV, igual que en producción).
const TV_ONLY_KEYS = new Set(['vol_up', 'vol_down', 'mute']);

/**
 * Índice inverso: código de plataforma → tecla semántica.
 * Ej.: 'VOLUMEUP' → 'vol_up', 'KEY_VOLUP' → 'vol_up', 'select' → 'enter'.
 *
 * Gracias a esto, un YAML viejo que dice `VOLUMEUP` funciona también en una
 * Samsung (antes se mandaba 'VOLUMEUP' a la Samsung y no pasaba nada).
 *
 * Se construye una vez al cargar el archivo (es como una tabla `static const`
 * inicializada al arrancar el programa).
 */
const CODE_TO_KEY = (() => {
  const map = new Map();
  for (const [key, def] of Object.entries(KEYS)) {
    for (const platform of ['lg', 'samsung', 'roku']) {
      const code = def[platform];
      // Si dos teclas comparten código (p. ej. roku 'play' para play y pause),
      // gana la primera que aparece en la tabla.
      if (code && !map.has(code)) map.set(code, key);
    }
  }
  return map;
})();

/* ============================================================================
 * §2  ACCIONES
 * ----------------------------------------------------------------------------
 * Toda acción, venga de donde venga (YAML viejo, editor nuevo, tabla interna),
 * se convierte en UN objeto con un campo `type`. Así el resto del código hace
 * un solo `switch (action.type)` y no anda adivinando a partir de strings.
 *
 *   { type: 'key',      key: 'up' }                    tecla semántica (§1)
 *   { type: 'button',   button: 'KEY_HDMI' }           código crudo de la plataforma
 *   { type: 'command',  command: 'tv/switchInput', payload: { inputId: 'HDMI_1' } }  (solo LG)
 *   { type: 'source',   source: 'HDMI 1' }             media_player.select_source
 *   { type: 'service',  service: 'script.turn_on', data: { entity_id: 'script.x' } }
 *   { type: 'sequence', steps: [acción, ...], delay: 500 }
 *   { type: 'platform', by: { lg: acción, samsung: acción, roku: acción } }
 *   { type: 'numpad' }                                 abre/cierra el teclado numérico (lo maneja
 *                                                      la tarjeta; no se manda a ningún dispositivo)
 *
 * En C esto sería un "tagged union": un struct con un enum `type` y un union
 * con los datos de cada variante. JS no tiene unions, pero el patrón es el mismo.
 * ========================================================================== */

const ACTION_TYPES = ['key', 'button', 'command', 'source', 'service', 'sequence', 'platform', 'numpad'];

/**
 * ¿`obj` tiene la propiedad `key` PROPIA? Un objeto normal hereda propiedades
 * como 'toString' o 'constructor', así que `KEYS['toString']` NO es undefined.
 * Object.hasOwn solo mira las propiedades escritas en el propio objeto.
 */
const has = (obj, key) => typeof key === 'string' && Object.hasOwn(obj, key);

/** Quita un `ssap://` que alguien haya escrito de más: aiowebostv ya lo agrega. */
function stripSsap(uri) {
  return String(uri).trim().replace(/^ssap:\/\//i, '');
}

/**
 * Convierte cualquier representación de acción en un objeto normalizado.
 * Devuelve `null` si no hay acción (vacío, 'pendiente', o algo inválido).
 *
 * @param {string|object|null|undefined} raw
 * @returns {object|null}
 */
function parseAction(raw) {
  if (raw === null || raw === undefined) return null;

  // --- Ya es un objeto (formato nuevo del editor o YAML escrito a mano) ---
  if (typeof raw === 'object') {
    if (Array.isArray(raw)) {
      // Atajo: una lista se interpreta como secuencia.
      return parseAction({ type: 'sequence', steps: raw });
    }
    if (!ACTION_TYPES.includes(raw.type)) return null;
    switch (raw.type) {
      case 'key':
        return has(KEYS, raw.key) ? { type: 'key', key: raw.key } : null;
      case 'button':
        return raw.button ? { type: 'button', button: String(raw.button) } : null;
      case 'command': {
        if (!raw.command) return null;
        const action = { type: 'command', command: stripSsap(raw.command) };
        if (raw.payload && typeof raw.payload === 'object') action.payload = { ...raw.payload };
        return action;
      }
      case 'source':
        return raw.source ? { type: 'source', source: String(raw.source) } : null;
      case 'service': {
        if (!raw.service || !String(raw.service).includes('.')) return null;
        return { type: 'service', service: String(raw.service), data: { ...(raw.data || {}) } };
      }
      case 'sequence': {
        if (!Array.isArray(raw.steps)) return null;
        // Abrir el numpad dentro de una secuencia no tiene sentido: ese paso se descarta.
        const steps = raw.steps.map(parseAction).filter((step) => step && step.type !== 'numpad');
        if (steps.length === 0) return null;
        const ms = Number(raw.delay); // acepta 500 y también "500"
        const delay = raw.delay !== undefined && Number.isFinite(ms) ? Math.max(0, ms) : 400;
        return { type: 'sequence', steps, delay };
      }
      case 'platform': {
        const by = {};
        for (const [platform, sub] of Object.entries(raw.by || {})) {
          const parsed = parseAction(sub);
          if (parsed) by[platform] = parsed;
        }
        return Object.keys(by).length ? { type: 'platform', by } : null;
      }
      case 'numpad':
        return { type: 'numpad' };
    }
    return null;
  }

  // --- Es un string (formato viejo) ---
  const str = String(raw).trim();
  if (str === '' || str.toLowerCase() === 'pendiente') return null;
  if (str.toLowerCase() === 'numpad') return { type: 'numpad' };

  // Entidades de HA que se "ejecutan"
  if (/^script\.[a-z0-9_]+$/i.test(str)) {
    return { type: 'service', service: 'script.turn_on', data: { entity_id: str } };
  }
  if (/^scene\.[a-z0-9_]+$/i.test(str)) {
    return { type: 'service', service: 'scene.turn_on', data: { entity_id: str } };
  }

  // Prefijos del formato viejo
  if (str.startsWith('source:')) {
    const source = str.slice('source:'.length).trim();
    return source ? { type: 'source', source } : null;
  }
  if (str.startsWith('command:')) {
    const command = stripSsap(str.slice('command:'.length));
    return command ? { type: 'command', command } : null;
  }
  if (str.startsWith('key:')) {
    return parseAction({ type: 'key', key: str.slice(4).trim() });
  }

  // ¿Es el nombre de una tecla semántica? ('up', 'vol_up', ...)
  if (has(KEYS, str)) return { type: 'key', key: str };

  // ¿Es un código conocido de alguna plataforma? ('VOLUMEUP', 'KEY_UP', 'select')
  const key = CODE_TO_KEY.get(str);
  if (key) return { type: 'key', key };

  // Cualquier otra cosa se manda tal cual como botón crudo ('KEY_HDMI', 'KEY_TV'...)
  return { type: 'button', button: str };
}

/**
 * Si la acción depende de la plataforma ({type:'platform'}), elige la variante
 * correcta: primero la de esa plataforma y, si no existe, la de `default`.
 * Si no hay ninguna de las dos, devuelve null.
 */
function resolveForPlatform(action, platformId) {
  if (!action) return null;
  if (action.type !== 'platform') return action;
  return action.by[platformId] || action.by.default || null;
}

/** ¿Se puede auto-repetir esta acción al mantener presionado? */
function isHoldable(action) {
  return !!action && action.type === 'key' && HOLDABLE_KEYS.has(action.key);
}

/* ============================================================================
 * §3  PLATAFORMAS (DRIVERS)
 * ----------------------------------------------------------------------------
 * Cada plataforma es un objeto con las MISMAS funciones. El resto del código no
 * pregunta "¿es Samsung?": solo llama `platform.sendKey(...)` y cada driver sabe
 * qué servicio de HA usar.
 *
 * En C sería:
 *   struct platform { const char *id; int (*send_code)(hass_t*, device_t*, const char*); ... };
 *   static const struct platform LG = { "lg", lg_send_code, ... };
 *
 * Todas las funciones devuelven la Promise de `hass.callService`, para que quien
 * llama pueda ESPERAR (await) a que HA conteste. Esto es la base del arreglo del
 * "hold infinito": no se manda la siguiente repetición hasta que la anterior
 * terminó.
 *
 * `device` es un objeto { platform, entity, remote? }:
 *   - TV LG/Samsung: { platform: 'lg', entity: 'media_player.tv' }
 *   - Roku:          { platform: 'roku', entity: 'media_player.roku', remote: 'remote.roku' }
 * ========================================================================== */

/** Error para "esta plataforma no soporta esa acción". */
class UnsupportedActionError extends Error {
  constructor(platformId, what) {
    super(`La plataforma "${platformId}" no soporta: ${what}`);
    this.name = 'UnsupportedActionError';
  }
}

const PLATFORMS = {
  lg: {
    id: 'lg',
    label: 'LG webOS',
    integration: 'webostv',
    supportsCommands: true,
    sendCode(hass, device, code) {
      return hass.callService('webostv', 'button', { entity_id: device.entity, button: code });
    },
    sendCommand(hass, device, command, payload) {
      const data = { entity_id: device.entity, command };
      if (payload && Object.keys(payload).length) data.payload = payload;
      return hass.callService('webostv', 'command', data);
    },
  },

  samsung: {
    id: 'samsung',
    label: 'Samsung (SamsungTV Smart)',
    integration: 'samsungtv_smart',
    supportsCommands: false,
    sendCode(hass, device, code) {
      return hass.callService('media_player', 'play_media', {
        entity_id: device.entity,
        media_content_type: 'send_key',
        media_content_id: code,
      });
    },
  },

  roku: {
    id: 'roku',
    label: 'Roku',
    integration: 'roku',
    supportsCommands: false,
    sendCode(hass, device, code) {
      // El Roku recibe teclas por su entidad remote.*, no por el media_player.
      return hass.callService('remote', 'send_command', { entity_id: device.remote, command: code });
    },
  },
};

// Lo que es igual para todas las plataformas se escribe una sola vez.
// Los drivers que lo necesiten pueden sobrescribirlo.
const PLATFORM_DEFAULTS = {
  selectSource(hass, device, source) {
    return hass.callService('media_player', 'select_source', { entity_id: device.entity, source });
  },
  turnOn(hass, device) {
    return hass.callService('media_player', 'turn_on', { entity_id: device.entity });
  },
  turnOff(hass, device) {
    return hass.callService('media_player', 'turn_off', { entity_id: device.entity });
  },
  sendCommand() {
    return Promise.reject(new UnsupportedActionError(this.id, 'commands'));
  },
};
for (const platform of Object.values(PLATFORMS)) {
  // Object.setPrototypeOf hace que, si el driver no define una función, JS la
  // busque en PLATFORM_DEFAULTS. Es la "herencia" de objetos de JS (prototipos).
  Object.setPrototypeOf(platform, PLATFORM_DEFAULTS);
}

function getPlatform(id) {
  return has(PLATFORMS, id) ? PLATFORMS[id] : null;
}

/* ============================================================================
 * §4  EJECUTAR ACCIONES
 * ----------------------------------------------------------------------------
 * executeAction(hass, action, device) → Promise
 *
 * La función es `async`: dentro se puede usar `await`. Para quien llama,
 * `executeAction(...)` devuelve inmediatamente una Promise que se "resuelve"
 * cuando HA terminó de procesar la llamada.
 *
 * Diferencia clave con C: aquí NO hay un hilo bloqueado esperando. El event loop
 * del navegador sigue atendiendo clics y redibujando mientras tanto.
 * ========================================================================== */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {object} hass    objeto hass de Home Assistant
 * @param {object} action  acción normalizada (salida de parseAction)
 * @param {object} device  { platform, entity, remote? }
 * @returns {Promise<void>}
 */
async function executeAction(hass, action, device) {
  if (!hass || !action || !device) return;
  const platform = getPlatform(device.platform);
  if (!platform) throw new Error(`Plataforma desconocida: ${device.platform}`);

  const resolved = resolveForPlatform(action, platform.id);
  if (!resolved) return; // no hay variante para esta plataforma: no se hace nada

  switch (resolved.type) {
    case 'key': {
      const code = KEYS[resolved.key]?.[platform.id];
      if (!code) throw new UnsupportedActionError(platform.id, `tecla "${resolved.key}"`);
      return platform.sendCode(hass, device, code);
    }
    case 'button':
      return platform.sendCode(hass, device, resolved.button);
    case 'command':
      return platform.sendCommand(hass, device, resolved.command, resolved.payload);
    case 'source':
      return platform.selectSource(hass, device, resolved.source);
    case 'service': {
      const [domain, service] = resolved.service.split('.');
      return hass.callService(domain, service, resolved.data);
    }
    case 'sequence':
      // Un for...of con await ejecuta los pasos EN ORDEN, uno tras otro.
      // (Con steps.forEach(async ...) se dispararían todos a la vez.)
      for (let i = 0; i < resolved.steps.length; i++) {
        if (i > 0) await delay(resolved.delay);
        await executeAction(hass, resolved.steps[i], device);
      }
      return;
    case 'numpad':
      // La tarjeta la intercepta antes (_press); llegar aquí es un error de programación.
      throw new Error('"numpad" es una acción de la tarjeta, no de la TV');
    default:
      throw new Error(`Tipo de acción desconocido: ${resolved.type}`);
  }
}

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

// Los catálogos son de solo lectura. (deepFreeze está definida más abajo: las
// declaraciones `function` se "elevan" (hoisting) y se pueden usar antes.)
[KEYS, SOURCES, FIXED_MODES, DEFAULT_PAD, DEFAULT_BUTTONS].forEach(deepFreeze);

/* ---------- helpers ---------- */

/**
 * Object.freeze impide modificar un objeto (en modo módulo, intentarlo lanza
 * TypeError). Solo congela el primer nivel, por eso se recorre recursivamente.
 * Los catálogos y el modelo normalizado se comparten por referencia entre TVs:
 * congelarlos garantiza que nadie los cambie "por accidente" desde la tarjeta.
 */
function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const value of Object.values(obj)) deepFreeze(value);
  }
  return obj;
}

/** Devuelve el primer valor "útil": ni undefined, ni null, ni string vacío. */
function firstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

/** 'LG TV' | 'lg' | 'samsung' | undefined → 'lg' | 'samsung' | 'roku' */
function normalizePlatform(value, warnings) {
  const v = String(value || '').toLowerCase();
  if (v.includes('samsung')) return 'samsung';
  if (v.includes('roku')) return 'roku';
  if (v && !v.includes('lg') && warnings) warnings.push(`Tipo de TV desconocido "${value}"; se usará LG.`);
  return 'lg';
}

/** Convierte acentos de color: '229, 9, 20' → 'rgb(229, 9, 20)'; '#e50914' se queda igual. */
function normalizeColor(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (/^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}$/.test(str)) return `rgb(${str})`;
  return str;
}

/** Normaliza un companion (dispositivo extra conectado a la TV, hoy solo Roku). */
function normalizeCompanion(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const entity = raw.media_entity || raw.entity;
  const remote = raw.remote_entity || raw.remote;
  if (!entity && !remote) return null;
  return { platform: normalizePlatform(raw.platform || 'roku'), entity: entity || null, remote: remote || null };
}

/**
 * Lee una acción de un custom mode del formato viejo. Si hay valores distintos por
 * marca (`_value_lg` / `_value_samsung`), arma una acción {type:'platform'}.
 * Como parseAction ya traduce 'VOLUMEUP' y 'KEY_VOLUP' a la misma tecla, en la
 * mayoría de los casos las variantes coinciden y queda una acción simple.
 */
function legacyPerBrandAction(generic, lg, samsung) {
  const a = parseAction(generic);
  const aLg = parseAction(lg);
  const aSamsung = parseAction(samsung);
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  if (!aLg && !aSamsung) return a;
  if ((!aLg || same(aLg, a)) && (!aSamsung || same(aSamsung, a))) return a;
  const by = {};
  if (aLg) by.lg = aLg;
  if (aSamsung) by.samsung = aSamsung;
  if (a) by.default = a;
  return { type: 'platform', by };
}

/** Lee un pad del formato nuevo: { up: { icon, action }, ... } */
function readPad(rawPad, fallback) {
  const result = {};
  for (const dir of DIRECTIONS) {
    let entry = rawPad?.[dir];
    // Atajo en YAML: `up: vol_up` equivale a `up: { action: vol_up }`.
    if (entry !== undefined && entry !== null && typeof entry !== 'object') entry = { action: entry };
    result[dir] = {
      icon: firstDefined(entry?.icon, fallback?.[dir]?.icon) ?? null,
      action: entry && 'action' in entry ? parseAction(entry.action) : (fallback?.[dir]?.action ?? null),
    };
  }
  return result;
}

/* ---------- partes de la configuración ---------- */

function resolveModes(raw, warnings) {
  let ids = Array.isArray(raw.modes)
    ? raw.modes
    : [firstDefined(raw.mode_slot_1, 'navegacion'), firstDefined(raw.mode_slot_2, 'busqueda'), firstDefined(raw.mode_slot_3, 'audio')];

  ids = ids.map((id) => (has(MODE_ALIASES, id) ? MODE_ALIASES[id] : id)).filter((id) => {
    if (has(FIXED_MODES, id) || CUSTOM_MODE_IDS.includes(id)) return true;
    warnings.push(RESERVED_MODES.has(id)
      ? `El modo "${id}" todavía no está implementado y se omitió.`
      : `Modo desconocido "${id}", se omitió.`);
    return false;
  });
  return ids;
}

function resolveCustomMode(raw, id, warnings) {
  const n = id.replace('custom', '');
  const fromNew = raw.custom_modes?.[id];
  if (fromNew) {
    return {
      label: firstDefined(fromNew.label, `Personalizado ${n}`),
      icon: firstDefined(fromNew.icon, `mdi:numeric-${n}-circle-outline`),
      pad: readPad(fromNew, pad()),
    };
  }
  // Formato viejo: custom1_label, custom1_up_icon, custom1_up_value(_lg|_samsung)...
  const legacyPad = {};
  for (const dir of DIRECTIONS) {
    const base = `${id}_${dir}`;
    legacyPad[dir] = {
      icon: firstDefined(raw[`${base}_icon`]) ?? 'mdi:help',
      action: legacyPerBrandAction(raw[`${base}_value`], raw[`${base}_value_lg`], raw[`${base}_value_samsung`]),
    };
  }
  return {
    label: firstDefined(raw[`${id}_label`], `Personalizado ${n}`),
    icon: firstDefined(raw[`${id}_mode_icon`], `mdi:numeric-${n}-circle-outline`),
    pad: legacyPad,
  };
}

function resolveDefaultPad(raw) {
  if (raw.default_pad) return readPad(raw.default_pad, DEFAULT_PAD);
  // Variante v3: default_up_icon / default_up_value ...
  const result = {};
  for (const dir of DIRECTIONS) {
    const value = raw[`default_${dir}_value`];
    result[dir] = {
      icon: firstDefined(raw[`default_${dir}_icon`], DEFAULT_PAD[dir].icon),
      action: firstDefined(value) !== undefined ? parseAction(value) : DEFAULT_PAD[dir].action,
    };
  }
  return result;
}

function makeStreamingSlot(index, sourceId, icon, action, accent, warnings) {
  let source = SOURCES_BY_ID.get(sourceId);
  if (!source) {
    if (sourceId) warnings.push(`Fuente desconocida "${sourceId}" en el botón de streaming ${index + 1}; se usó la predeterminada.`);
    source = SOURCES_BY_ID.get(DEFAULT_STREAMING[index]);
  }
  return {
    index,
    source,
    icon: firstDefined(icon, source.icon),
    action: parseAction(action),   // null = comportamiento normal: seleccionar la fuente
    accent: normalizeColor(accent),
  };
}

function resolveStreaming(raw, warnings) {
  if (Array.isArray(raw.streaming)) {
    return DEFAULT_STREAMING.map((defaultId, i) => {
      const entry = raw.streaming[i] || {};
      return makeStreamingSlot(i, firstDefined(entry.source, defaultId), entry.icon, entry.action, entry.accent, warnings);
    });
  }

  // Formato viejo. Los slots se identifican por un prefijo de clave:
  //   repo (producción): netflix_, disney_, YouTube_, appletv_  (+ <slot>_source)
  //   variante v3:       netflix_, disney_, YouTube_, prime_    (fuentes fijas)
  // Si hay cualquier clave appletv_* o *_source, manda el formato del repo y las
  // claves prime_* se ignoran (así se comporta hoy producción).
  const keys = Object.keys(raw);
  const repoFlavor = keys.some((k) => k.startsWith('appletv_') || /^(netflix|disney|YouTube|appletv)_source$/.test(k));
  const hasPrime = keys.some((k) => k.startsWith('prime_'));
  const lastPrefix = repoFlavor || !hasPrime ? 'appletv' : 'prime';
  if (repoFlavor && hasPrime) warnings.push('Se ignoraron las claves prime_* porque la configuración usa appletv_* para el 4º botón de streaming.');
  if (raw.selected_sources) warnings.push('La clave selected_sources ya no se usa y se ignoró.');

  const prefixes = ['netflix', 'disney', 'YouTube', lastPrefix];
  return prefixes.map((prefix, i) => {
    const defaultId = prefix === 'prime' ? 'prime' : DEFAULT_STREAMING[i];
    return makeStreamingSlot(
      i,
      firstDefined(raw[`${prefix}_source`], defaultId),
      raw[`${prefix}_icon`],
      raw[`${prefix}_value`],
      firstDefined(raw[`${prefix}_accent_color`], raw[`${prefix}_accent_hex`]),
      warnings,
    );
  });
}

function resolveButtons(raw, warnings) {
  const fromNew = raw.buttons || {};
  // Claves viejas: el "exit" viejo es el botón top_left de la v4.
  // En la v3, `back_type: numpad` (o home/menu/exit) hacía que ese botón abriera el
  // teclado numérico. En la v4 eso es la acción `numpad`.
  const legacyAction = (prefix) => (raw[`${prefix}_type`] === 'numpad' ? 'numpad' : raw[`${prefix}_value`]);
  const legacy = {
    top_left: { icon: raw.exit_icon, action: legacyAction('exit') },
    power:    { icon: raw.power_icon, action: raw.power_value },
    center:   { icon: raw.center_icon, action: raw.center_value },
    back:     { icon: raw.back_icon, action: legacyAction('back') },
    home:     { icon: raw.home_icon, action: legacyAction('home') },
    menu:     { icon: raw.menu_icon, action: legacyAction('menu') },
    exit:     {},
  };

  const result = {};
  for (const [id, def] of Object.entries(DEFAULT_BUTTONS)) {
    let n = fromNew[id] || {};
    // Atajo en YAML: `power: script.x` equivale a `power: { action: script.x }`.
    if (typeof n !== 'object') n = { action: n };
    const l = legacy[id] || {};
    const actionRaw = 'action' in n ? n.action : firstDefined(l.action, def.action);
    result[id] = {
      icon: firstDefined(n.icon, l.icon, def.icon) ?? null,
      action: parseAction(actionRaw),
    };
  }
  return result;
}

/**
 * Resuelve todo lo que puede variar por TV (modos, pads, streaming, botones).
 * Se llama una vez con la config global y otra por cada TV que tenga overrides.
 */
function resolveSettings(raw, warnings) {
  const modes = resolveModes(raw, warnings);
  const modeDefs = {};
  for (const id of modes) {
    modeDefs[id] = has(FIXED_MODES, id)
      ? { id, ...FIXED_MODES[id] }
      : { id, ...resolveCustomMode(raw, id, warnings) };
  }
  return {
    modes,
    modeDefs,
    defaultPad: resolveDefaultPad(raw),
    streaming: resolveStreaming(raw, warnings),
    buttons: resolveButtons(raw, warnings),
  };
}

/**
 * Estilos visuales. Los tres usan el mismo HTML y los mismos nombres de tokens;
 * solo cambia el CSS (§6). El primero es el predeterminado.
 */
const STYLES = ['relieve', 'halo', 'cristal'];

function resolveStyle(value, warnings) {
  if (value === undefined || value === null || value === '') return STYLES[0];
  const v = String(value).trim().toLowerCase();
  if (STYLES.includes(v)) return v;
  warnings.push(`Estilo desconocido "${value}"; se usará "${STYLES[0]}". Opciones: ${STYLES.join(', ')}.`);
  return STYLES[0];
}

/** 'light' | 'dark' | 'auto' (auto = sigue el modo oscuro de HA). Por defecto oscuro, como producción. */
function resolveTheme(value) {
  const v = String(value ?? '').trim().toLowerCase();
  return v === 'light' || v === 'auto' ? v : 'dark';
}

/* Claves de una entrada de `tvs` que NO son overrides. */
const TV_OWN_KEYS = new Set(['name', 'entity', 'type', 'platform', 'roku', 'companion', 'overrides']);

/**
 * Punto de entrada. Lanza un Error si la config no se puede usar; HA lo muestra
 * como tarjeta roja con el mensaje.
 *
 * @param {object} raw  config tal como viene de setConfig()
 * @returns {{
 *   format: 'v4'|'legacy', cardId: string, theme: 'light'|'dark'|'auto', style: string,
 *   controlModeEntity: string|null,
 *   tvs: Array<{ name, entity, platform, companion, settings }>, warnings: string[]
 * }}
 */
function normalizeConfig(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Configuración inválida.');
  const warnings = [];

  // ¿Formato nuevo? Lo detectamos por claves que solo existen en v4.
  const isV4 = ['modes', 'buttons', 'streaming', 'custom_modes', 'default_pad', 'theme'].some((k) => k in raw)
    || (Array.isArray(raw.tvs) && raw.tvs.some((tv) => tv && ('platform' in tv || 'companion' in tv)));

  // 1. Lista de TVs: `tvs` (multi) o `entity` (formato viejo de una sola TV).
  let rawTvs;
  if (Array.isArray(raw.tvs) && raw.tvs.length > 0) {
    rawTvs = raw.tvs;
  } else if (raw.entity) {
    rawTvs = [{ name: raw.name || raw.entity, entity: raw.entity, type: raw.modelConfig, roku: raw.roku }];
  } else {
    throw new Error('Define al menos una TV: usa "tvs" (lista) o "entity".');
  }

  // 2. Lo global (sirve de base para todas las TVs).
  const globalSettings = resolveSettings(raw, warnings);

  // 3. Cada TV, con sus overrides si los tiene.
  const tvs = rawTvs.map((tv, i) => {
    if (!tv || !tv.entity) throw new Error(`La TV #${i + 1} no tiene "entity".`);

    // Overrides: formato nuevo (`overrides: {...}`) o claves sueltas (variante v3).
    const overrides = { ...(tv.overrides || {}) };
    for (const [k, v] of Object.entries(tv)) {
      if (!TV_OWN_KEYS.has(k)) overrides[k] = v;
    }
    const hasOverrides = Object.keys(overrides).length > 0;
    const name = String(firstDefined(tv.name, tv.entity)).trim();
    const companion = normalizeCompanion(tv.companion || tv.roku);
    // Si no hay overrides se reutiliza el MISMO objeto global (no se copia).
    const settings = hasOverrides ? resolveSettings({ ...raw, ...overrides }, warnings) : globalSettings;

    // Con Roku, el botón de arriba a la izquierda es el selector TV ↔ Roku. Si
    // tenía otra acción (p. ej. un script), se avisa en lugar de perderla en silencio.
    const topLeft = settings.buttons.top_left.action;
    if (companion && topLeft && !(topLeft.type === 'key' && topLeft.key === 'exit')) {
      warnings.push(`"${name}": con Roku, el botón propio del encabezado se reemplaza por el selector TV | Roku; su acción configurada se ignora.`);
    }

    return {
      name,
      entity: tv.entity,
      platform: normalizePlatform(firstDefined(tv.platform, tv.type), warnings),
      companion,
      settings,
    };
  });

  // 4. card_id: identifica la tarjeta para recordar la TV elegida por usuario.
  //    Antes era obligatorio con `tvs`; ahora, si falta, se deriva de las entidades.
  const cardId = firstDefined(raw.card_id, `auto:${tvs.map((t) => t.entity).join(',')}`);

  return deepFreeze({
    format: isV4 ? 'v4' : 'legacy',
    cardId: String(cardId),
    theme: resolveTheme(firstDefined(raw.theme, raw.colorMode)),
    style: resolveStyle(raw.style, warnings),
    controlModeEntity: firstDefined(raw.control_mode_entity) ?? null,
    tvs,
    // Set elimina avisos repetidos (p. ej. el mismo aviso por cada TV con overrides).
    warnings: [...new Set(warnings)],
  });
}

/* ============================================================================
 * §6  LA TARJETA (custom element)
 * ----------------------------------------------------------------------------
 * Ciclo de vida que sigue HA con cualquier tarjeta:
 *
 *   new TvControlCard()   constructor: crea el shadowRoot y UN listener de clic
 *   setConfig(config)     cada vez que cambia el YAML  → normalizeConfig + rebuild
 *   set hass(hass)        cada vez que cambia CUALQUIER entidad de HA (¡muy seguido!)
 *   connectedCallback     la tarjeta entra a la página
 *   disconnectedCallback  la tarjeta sale (cambio de vista, modo edición...)
 *
 * El método de render (la parte nueva respecto a v3.x):
 *
 *   _build()          crea el DOM UNA vez (por config). Sin datos del usuario en
 *                     el HTML: los textos e íconos se ponen después con
 *                     textContent/setAttribute, así que no hay que escapar nada.
 *   _applySettings()  cuando cambian los settings de la TV activa (otra TV con
 *                     overrides): cambia íconos y reconstruye solo la fila de modos.
 *   _update()         parcha: clases, textos, atributos y variables CSS. Es
 *                     "idempotente": calcula todo a partir del estado actual, así
 *                     que llamarlo dos veces da el mismo resultado (y por eso el
 *                     bug del "tema pegado" de la v3 ya no puede ocurrir).
 *
 *   set hass solo agenda un _update si cambió alguna entidad que nos importa, y
 *   varios cambios dentro del mismo frame se juntan en uno (requestAnimationFrame).
 *
 * Como el DOM ya no se reemplaza, los nodos (y los listeners) sobreviven a los
 * updates de hass: esa es la base del arreglo del hold infinito (paso 4).
 * ========================================================================== */

/*
 * Nombre del elemento. Por defecto 'tv-control-card'. Para probar la v4 en un HA
 * que YA tiene instalada otra versión, se carga el recurso con ?tag=…:
 *   /local/minimalist-tv-control-card.js?tag=tv-control-card-v4
 * y en el dashboard se usa `type: custom:tv-control-card-v4`. Así conviven las
 * dos versiones sin chocar (dos define() con el mismo nombre no pueden coexistir).
 */
const DEFAULT_CARD_TAG = 'tv-control-card';
const CARD_TAG = (() => {
  try {
    const tag = new URL(import.meta.url).searchParams.get('tag');
    return tag && /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(tag) ? tag : DEFAULT_CARD_TAG;
  } catch {
    return DEFAULT_CARD_TAG;
  }
})();

/**
 * Estado de la TV en 3 valores. Antes 'unavailable' se trataba como 'off' y un
 * "encender" podía terminar en un toggle que APAGABA la TV (bug B2).
 */
function tvStatus(stateObj) {
  if (!stateObj || stateObj.state === 'unavailable' || stateObj.state === 'unknown') return 'unavailable';
  return stateObj.state === 'off' || stateObj.state === 'standby' ? 'off' : 'on';
}

/**
 * Esperas del tipo "avísame cuando la entidad X cumpla tal condición, o cuando
 * pasen N ms". Reemplaza al `delay(5000)` + "revisar una vez" de
 * selectSourceWithRetry: en vez de adivinar cuánto esperar, se espera a que HA
 * avise (cada `set hass` llama a check()).
 *
 *   const ok = await waiters.wait(hass, 'media_player.tv', (s) => s.state === 'on', 20000);
 *   // ok === true si se cumplió, false si se acabó el tiempo
 *
 * Es una clase aparte (no un método de la tarjeta) para poder probarla en Node.
 */
class StateWaiters {
  constructor() {
    this._pending = new Set();
  }

  wait(hass, entityId, predicate, timeoutMs) {
    const test = (h) => {
      const st = h?.states?.[entityId];
      try {
        return !!st && !!predicate(st);
      } catch {
        return false; // un predicate que truena no debe romper el set hass
      }
    };
    if (test(hass)) return Promise.resolve(true);

    // new Promise((resolve) => ...) crea una Promise que se resuelve cuando
    // NOSOTROS llamemos resolve(). Aquí guardamos esa función en `waiter` para
    // llamarla después, desde check() o desde el timeout.
    return new Promise((resolve) => {
      const waiter = {
        test,
        finish: (ok) => {
          clearTimeout(waiter.timer);
          this._pending.delete(waiter);
          resolve(ok);
        },
      };
      waiter.timer = setTimeout(() => waiter.finish(false), timeoutMs);
      this._pending.add(waiter);
    });
  }

  /** Se llama con cada hass nuevo. Copiamos a un arreglo porque finish() borra del Set. */
  check(hass) {
    for (const waiter of [...this._pending]) {
      if (waiter.test(hass)) waiter.finish(true);
    }
  }

  cancelAll() {
    for (const waiter of [...this._pending]) waiter.finish(false);
  }

  get size() {
    return this._pending.size;
  }
}

/**
 * localStorage puede lanzar excepciones (modo privado, storage lleno o bloqueado
 * en algunos WebViews). Nunca debe tumbar la tarjeta por eso.
 */
const storage = {
  get(key) {
    try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
  },
  set(key, value) {
    try { globalThis.localStorage?.setItem(key, String(value)); } catch { /* sin storage: no se recuerda, y ya */ }
  },
};

/* ---------- tiempos y reglas de los flujos ---------- */

/*
 * Mantener presionado (arreglo del bug B1):
 *   - el primer envío sale en cuanto se toca;
 *   - si se sigue presionando `holdDelay` ms, se repite cada `holdInterval` ms, pero
 *     SOLO después de que HA contestó el envío anterior (nunca se acumulan);
 *   - tope de `holdMaxRepeats` repeticiones (10 s): aunque todo lo demás fallara,
 *     la tarjeta deja de mandar sola.
 */
const TIMING = Object.freeze({
  holdDelay: 400,
  holdInterval: 250,
  holdMaxRepeats: 40,
  powerOn: 20000,        // cuánto esperar a que la TV reporte 'on'
  powerOff: 10000,
  sourceConfirm: 6000,   // cuánto esperar a que la TV reporte la fuente pedida
});
const SOURCE_ATTEMPTS = 2;
// Tras encender, el centro ignora OK este tiempo (ms): un doble toque a "Encender"
// no debe terminar mandando un OK a la TV recién prendida.
const CENTER_GUARD_MS = 800;        // 1 intento + 1 reintento: relanzar una app varias veces la reinicia
const ROKU_ACCENT = '#6f1ab1';

/* En estos modos todo va a la TV aunque el modo Roku esté activo (igual que producción). */
const TV_MODES = new Set(['audio', 'fuentes']);

/**
 * ¿A qué dispositivo va una acción? Función pura (se prueba en Node).
 *
 * Con el modo Roku activo, al Roku solo van:
 *   - teclas que el Roku SÍ tiene (KEYS[x].roku), excepto volumen/mute;
 *   - acciones por plataforma que traen variante `roku`.
 * Todo lo demás va a la TV: teclas sin código Roku (EXIT, MENU, GUIDE...),
 * códigos crudos, commands, fuentes y secuencias. Producción mandaba 'EXIT' o
 * 'MENU' al remote del Roku, donde no hacen nada; así el EXIT siempre funciona.
 *
 * @returns {{platform, entity, remote?}}
 */
function routeAction(action, { tv, rokuMode, mode }) {
  const tvDevice = { platform: tv.platform, entity: tv.entity };
  const companion = tv.companion;
  if (!action || !rokuMode || !companion?.remote || TV_MODES.has(mode)) return tvDevice;
  const companionDevice = { platform: companion.platform, entity: companion.entity, remote: companion.remote };
  if (action.type === 'platform') return has(action.by, companion.platform) ? companionDevice : tvDevice;
  // Una secuencia va a UN solo dispositivo: al Roku solo si TODOS sus pasos irían
  // al Roku (p. ej. abajo, abajo, OK). Si alguno es de la TV (un PIN con dígitos,
  // que el Roku no tiene), toda la secuencia va a la TV: partirla entre los dos
  // dispositivos dejaría la mitad de las teclas en el lugar equivocado.
  if (action.type === 'sequence') {
    const ctx = { tv, rokuMode, mode };
    return action.steps.every((step) => routeAction(step, ctx).entity === companion.entity) ? companionDevice : tvDevice;
  }
  if (action.type === 'key' && !TV_ONLY_KEYS.has(action.key) && KEYS[action.key][companion.platform]) return companionDevice;
  return tvDevice;
}

const normSource = (s) => String(s ?? '').trim().toLowerCase();

/**
 * ¿La entidad ya está en alguna de esas fuentes?
 * El Roku reporta la app en `app_name`: con `preferAppName` se usa ese atributo
 * y, si no existe, `source` (igual que producción). Para las TVs se mira solo
 * `source`: un `app_name` viejo no debe hacer creer que sigue en Netflix.
 */
function sourceMatches(stateObj, candidates, preferAppName = false) {
  const attrs = stateObj?.attributes ?? {};
  const current = normSource(preferAppName ? (attrs.app_name || attrs.source) : attrs.source);
  return current !== '' && candidates.some((c) => normSource(c) === current);
}

/**
 * Nombre exacto que hay que mandar a select_source: el que aparece en el
 * source_list de la TV (sin importar mayúsculas), probando los candidatos en
 * orden. Si la TV no publica source_list, se usa el primer candidato.
 * Ej.: candidatos ['Roku OTT', 'Roku'] y source_list [..., 'ROKU'] → 'ROKU'.
 */
function resolveSourceName(stateObj, candidates) {
  const list = stateObj?.attributes?.source_list;
  if (Array.isArray(list)) {
    for (const candidate of candidates) {
      const match = list.find((s) => normSource(s) === normSource(candidate));
      if (match) return match;
    }
  }
  return candidates[0];
}

/**
 * Qué muestra la pantalla de vidrio: título, subtítulo, ícono, color y qué
 * fuente del catálogo está activa (para marcar el botón de streaming).
 * Función pura: recibe estados de HA y settings, no toca el DOM (se prueba en Node).
 *
 * @returns {{ title: string, sub: string, icon: string, accent: string|null, sourceId: string|null }}
 */
function describeNow({ status, busy, roku, hasCompanion, tvState, rokuState, streaming }) {
  const blank = { sub: '', accent: null, sourceId: null };
  if (busy) return { ...blank, title: busy, icon: 'mdi:television' };
  if (status === 'unavailable') return { ...blank, title: 'Sin conexión', sub: 'Revisa que la TV esté conectada a la red.', icon: 'mdi:wifi-off' };
  if (status === 'off') return { ...blank, title: 'Apagada', icon: 'mdi:television-off' };

  const sub = hasCompanion ? (roku ? 'En el Roku' : 'En la TV') : '';
  // Fuente del catálogo que coincide con lo que reporta HA.
  const source = roku
    ? SOURCES.find((s) => s.rokuSource && sourceMatches(rokuState, [s.rokuSource], true))
    : SOURCES.find((s) => s.service && sourceMatches(tvState, s.alternates ?? [s.service]));

  if (source) {
    // Si un botón de streaming tiene esa fuente, manda su ícono y su color.
    const slot = streaming.find((sl) => sl.source.id === source.id);
    return {
      title: source.name,
      sub,
      icon: slot?.icon ?? source.icon,
      accent: slot?.accent ?? source.accent ?? (roku ? ROKU_ACCENT : null),
      sourceId: source.id,
    };
  }
  // Fuente que no está en el catálogo: se muestra tal cual la reporta HA.
  const attrs = (roku ? rokuState : tvState)?.attributes ?? {};
  const raw = roku ? (attrs.app_name || attrs.source) : attrs.source;
  return {
    title: raw || (roku ? 'Roku' : 'Encendida'),
    sub,
    icon: roku ? 'mdi:remote-tv' : /hdmi/i.test(raw ?? '') ? 'mdi:hdmi-port' : 'mdi:television-play',
    accent: roku ? ROKU_ACCENT : null,
    sourceId: null,
  };
}

/* ---------- estilos ---------- */

/*
 * El CSS está en TRES capas:
 *   1. Estructura común: layout, pantalla de vidrio, touchpad, responsivo. Igual
 *      para los tres estilos.
 *   2. Tokens: colores y sombras con nombres COMPARTIDOS (--tv-surface, --tv-ink,
 *      --tv-accent...). Cada estilo y tema les da valores propios. El editor de
 *      paletas de la Fase 4 solo tendrá que cambiar estos tokens.
 *   3. Forma de cada estilo (relieve / halo / cristal): losetas o círculos, bisel o
 *      halo, paneles de vidrio. Es lo único que difiere entre estilos.
 *
 * JS solo pone atributos (data-style, data-theme, data-status...) y dos variables
 * (--tv-accent, --tv-glow). Nunca escribe colores ni sombras.
 *
 * `container-type` está en ha-card: un contenedor no puede consultarse a sí mismo,
 * así que el layout que cambia con @container vive en .body (su hijo).
 */
const CARD_CSS = `
:host { display: block; }
* { box-sizing: border-box; }
.card [hidden] { display: none !important; }

/* ===================== 1. ESTRUCTURA COMÚN ===================== */
ha-card.card {
  display: block; height: 100%; overflow: hidden; container-type: inline-size;
  border: none; border-radius: 28px;
  background: var(--tv-bg); color: var(--tv-ink); box-shadow: var(--tv-card-shadow);
  font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, Roboto, system-ui, sans-serif));
  user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
  --tv-accent: var(--tv-accent-default);   /* acento de la interfaz (JS lo cambia por el de la app) */
  --tv-glow: #dce6f5;                      /* luz de la pantalla: blanco 6500 K si no hay app */
  transition: background 0.8s;
}
/* :where() tiene especificidad 0: este reset nunca le gana a una clase. */
:where(.card) button {
  appearance: none; border: 0; margin: 0; padding: 0; background: none; color: inherit; font: inherit;
  cursor: pointer; -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; touch-action: manipulation;
}
.card button:focus-visible { outline: 2px solid var(--tv-accent); outline-offset: 2px; }
.card button:disabled { cursor: default; }

.body {
  position: relative; isolation: isolate; display: grid; gap: 18px; padding: 22px;
  grid-template-areas: "head" "screen" "apps" "pad" "modes" "keys";
}

.head { grid-area: head; display: grid; grid-auto-flow: column; grid-template-columns: minmax(0, 1fr); grid-auto-columns: auto; align-items: center; gap: 10px; }
.tv-name { display: flex; align-items: center; gap: 2px; min-width: 0; justify-self: start; font-size: 19px; font-weight: 600; letter-spacing: -0.015em; cursor: default; }
.tv-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chevron { display: none; --mdc-icon-size: 18px; opacity: 0.5; }
.card.multi .tv-name { cursor: pointer; }
.card.multi .chevron { display: block; }
.switch { display: grid; grid-template-columns: 1fr 1fr; padding: 3px; border-radius: 999px; font-size: 13px; font-weight: 500; }
.switch button { height: 32px; padding: 0 13px; border-radius: 999px; color: var(--tv-ink-2); }
.switch button[aria-pressed="true"] { color: var(--tv-ink); }
.round { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; color: var(--tv-ink-2); --mdc-icon-size: 21px; }

/* Selector de TVs: sale debajo del nombre. La forma (fondo, sombras, cómo se
   marca la TV activa) la pone cada estilo en la capa 3. */
.picker {
  position: absolute; z-index: 5; top: 70px; left: 14px; width: min(calc(100% - 28px), 320px);
  display: grid; gap: 2px; padding: 6px; max-height: 60%; overflow: auto;
  border-radius: 20px; transform-origin: 28px 0;
  animation: tv-pop 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.15);
}
.picker-item {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px;
  min-height: 48px; padding: 6px 12px 6px 6px; border-radius: 14px; text-align: start;
  font-size: 15px; font-weight: 500; color: var(--tv-ink-2); transition: background 0.15s, color 0.15s;
}
.picker-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.picker-item .tv-ico { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; --mdc-icon-size: 20px; }
.picker-item .check { visibility: hidden; --mdc-icon-size: 18px; }
.picker-item.active { color: var(--tv-ink); }
.picker-item.active .check { visibility: visible; }
@media (hover: hover) { .picker-item:not(.active):hover { color: var(--tv-ink); background: color-mix(in srgb, var(--tv-ink) 5%, transparent); } }

/* La pantalla de vidrio: dice qué se está viendo. Detrás, la luz de la app
   (como el bias light de una TV). Es igual en los tres estilos. */
.screen { grid-area: screen; position: relative; isolation: isolate; margin-bottom: 6px; }
.screen::before {
  content: ""; position: absolute; inset: 18% 6% -16%; z-index: -1; border-radius: 40%;
  background: var(--tv-glow); filter: blur(30px); opacity: 0.5;
  transition: opacity 0.8s ease, background-color 0.8s ease;
}
.card:not([data-status="on"]) .screen::before { opacity: 0; }
.glass {
  position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 16px;
  min-height: 108px; padding: 18px 22px; border-radius: 20px; color: #f3f5f8; overflow: hidden;
  background: linear-gradient(160deg, #171a1f, #050608 58%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.07), inset 0 1px 0 rgb(255 255 255 / 0.1), 0 14px 30px -16px rgb(0 0 0 / 0.55);
}
.glass::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(115deg, transparent 40%, rgb(255 255 255 / 0.055) 41%, transparent 64%); }
.now-icon { --mdc-icon-size: 36px; color: var(--tv-glow); transition: color 0.8s; }
.card:not([data-status="on"]) .now-icon { color: rgb(243 245 248 / 0.35); }
.now-text { min-width: 0; display: grid; justify-items: start; }
.now-title { max-width: 100%; font-size: 23px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.now-sub { font-size: 13px; color: rgb(243 245 248 / 0.55); margin-top: 3px; }
.now-sub:empty { display: none; }
.card[data-busy="true"] .now-title { animation: tv-pulse 1.4s ease-in-out infinite; }

.apps { grid-area: apps; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.app { position: relative; display: grid; place-items: center; height: 54px; color: var(--tv-ink-2); --mdc-icon-size: 28px; }
.app.active { color: var(--tv-accent); }
.app.loading ha-icon { animation: tv-spin 0.9s linear infinite; }

/* Touchpad: 4 cuñas (clip-path) que cubren todo el círculo, así toda el área es
   tocable, y el OK encima. */
.pad { grid-area: pad; position: relative; justify-self: center; width: min(100%, 280px); aspect-ratio: 1; border-radius: 50%; overflow: hidden; }
.dir { position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; color: var(--tv-ink-2); --mdc-icon-size: 26px; transition: background 0.2s, color 0.2s, box-shadow 0.2s; }
.dir.up    { clip-path: polygon(0 0, 100% 0, 50% 50%);       align-items: flex-start; padding-top: 11%; }
.dir.down  { clip-path: polygon(0 100%, 100% 100%, 50% 50%); align-items: flex-end; padding-bottom: 11%; }
.dir.left  { clip-path: polygon(0 0, 0 100%, 50% 50%);       justify-content: flex-start; padding-left: 11%; }
.dir.right { clip-path: polygon(100% 0, 100% 100%, 50% 50%); justify-content: flex-end; padding-right: 11%; }
.dir.empty { pointer-events: none; }
.dir.empty ha-icon { opacity: 0.35; }
.dir:is(.pressed, :active) { color: var(--tv-ink); }
/* Dónde nace el brillo al presionar (lo usan Relieve y Cristal). La elipse es
   chica a propósito: queda DENTRO de la cuña sin tocar sus lados y se apaga antes
   del OK, así nunca se ve la forma de triángulo, solo luz que entra desde el borde. */
.dir.up    { --tv-press-at: 50% 0%;   --tv-press-size: 40% 29%; }
.dir.down  { --tv-press-at: 50% 100%; --tv-press-size: 40% 29%; }
.dir.left  { --tv-press-at: 0% 50%;   --tv-press-size: 29% 40%; }
.dir.right { --tv-press-at: 100% 50%; --tv-press-size: 29% 40%; }
.ok { position: absolute; z-index: 2; inset: 31%; border-radius: 50%; display: grid; place-items: center; font-size: 15px; font-weight: 600; color: var(--tv-ink-2); --mdc-icon-size: 26px; transition: color 0.3s, transform 0.12s; }
/* El centro tiene DOS caras apiladas en la misma celda del grid: OK y Encender.
   Con la TV apagada se cruzan (opacidad + escala), así se nota que el botón cambió
   de función en lugar de cambiar de golpe. */
.ok > span { grid-area: 1 / 1; position: relative; display: grid; place-items: center; transition: opacity 0.3s ease, transform 0.3s ease; }
.ok-face ha-icon:not([icon]) { display: none; }
.ok-face ha-icon[icon] + span { display: none; }
.ok-power { --mdc-icon-size: 32px; opacity: 0; transform: scale(0.7); }
/* Fondo de "botón principal" en una capa aparte: así aparece con un fundido
   también en los estilos cuyo fondo es un degradado (los degradados no se animan). */
.ok::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--tv-cta-bg); box-shadow: var(--tv-cta-shadow); opacity: 0; transition: opacity 0.3s ease; }

.modes { grid-area: modes; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; }
.modes:empty { display: none; }
.mode { display: flex; align-items: center; justify-content: center; gap: 7px; height: 44px; min-width: 0; font-size: 14px; font-weight: 500; color: var(--tv-ink-2); --mdc-icon-size: 19px; }
.mode span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mode[aria-checked="true"] { color: var(--tv-ink); }

.keys { grid-area: keys; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.key { display: grid; place-items: center; height: 50px; color: var(--tv-ink-2); --mdc-icon-size: 24px; }

/* Numpad: mientras está abierto ocupa el lugar del touchpad (misma área del grid).
   Sus teclas son .key, así que cada estilo les da la misma forma que a la fila de abajo. */
/* aspect-ratio: 1 = la misma huella cuadrada que el touchpad: abrirlo no cambia la
   altura de la tarjeta (en Masonry, eso movería las tarjetas de abajo). */
.numpad { grid-area: pad; display: none; justify-self: center; width: min(100%, 280px); aspect-ratio: 1; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(4, minmax(0, 1fr)); gap: 10px; }
.card[data-numpad="true"] .numpad { display: grid; animation: tv-pop 0.18s ease-out; }
.card[data-numpad="true"] .pad { display: none; }
/* Sin alto fijo: las 4 filas se reparten el cuadro (en una tarjeta angosta las
   teclas se achican en lugar de hacer crecer la tarjeta). */
.num { height: auto; min-height: 0; font-size: 22px; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--tv-ink); }

.toast {
  position: absolute; left: 16px; right: 16px; bottom: 16px; z-index: 6;
  padding: 10px 14px; border-radius: 12px; background: rgb(10 12 16 / 0.88); color: #fff;
  font-size: 0.85rem; text-align: center;
  opacity: 0; transform: translateY(8px); transition: opacity 0.2s, transform 0.2s; pointer-events: none;
}
.toast.show { opacity: 1; transform: none; }

/* Celular angosto: modos solo con ícono. */
@container (max-width: 340px) {
  .body { padding: 16px; gap: 14px; }
  .mode span { display: none; }
  .round { width: 38px; height: 38px; }
  .picker { top: 60px; left: 10px; width: calc(100% - 20px); }
}
/* Tablet / columna ancha: dos columnas, el touchpad a la derecha. */
@container (min-width: 600px) {
  .body {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 36px; align-items: center; padding: 26px;
    grid-template-areas: "head pad" "screen pad" "apps pad" "modes pad" "keys pad";
    grid-template-rows: auto auto auto auto 1fr;
  }
  .pad, .numpad { width: min(100%, 310px); }
  .keys { align-self: end; }
}
@container (min-width: 860px) { .pad, .numpad { width: min(100%, 360px); } }

/* ===================== 2 y 3. ESTILOS ===================== */

/* ---------- A · RELIEVE (predeterminado): losetas con elevación suave y bisel ---------- */
.card[data-style="relieve"] {
  --tv-surface: #eef1f5; --tv-surface-top: #f5f7fa; --tv-raised: #ffffff; --tv-raised-2: #f6f8fa; --tv-thumb: #ffffff;
  --tv-ink: #1b1f25; --tv-ink-2: #565e69; --tv-line: #d9dee5; --tv-track: #e1e5eb; --tv-hi: #ffffff;
  --tv-shadow: rgb(25 35 55 / 0.16); --tv-shadow-2: rgb(25 35 55 / 0.07); --tv-on: #1f9d63; --tv-accent-default: var(--tv-ink);
  --tv-bg: linear-gradient(180deg, var(--tv-surface-top), var(--tv-surface) 45%);
  --tv-card-shadow: 0 1px 2px var(--tv-shadow-2), 0 24px 48px -28px var(--tv-shadow), inset 0 1px 0 var(--tv-hi);
}
.card[data-style="relieve"][data-theme="dark"] {
  --tv-surface: #16181c; --tv-surface-top: #1c1f24; --tv-raised: rgb(255 255 255 / 0.075); --tv-raised-2: rgb(255 255 255 / 0.03); --tv-thumb: rgb(255 255 255 / 0.14);
  --tv-ink: #eef0f3; --tv-ink-2: #9aa1ab; --tv-line: rgb(255 255 255 / 0.09); --tv-track: rgb(0 0 0 / 0.35); --tv-hi: rgb(255 255 255 / 0.12);
  --tv-shadow: rgb(0 0 0 / 0.6); --tv-shadow-2: rgb(0 0 0 / 0.4); --tv-on: #64e3a6; --tv-accent-default: #dce6f5;
  --tv-bg: radial-gradient(120% 50% at 50% 0%, color-mix(in srgb, var(--tv-glow) 9%, transparent), transparent 70%), linear-gradient(180deg, var(--tv-surface-top), var(--tv-surface) 50%);
}
.card[data-style="relieve"] :is(.round, .app, .key) {
  background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2)); border-radius: 16px;
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 6px 14px -8px var(--tv-shadow);
  transition: transform 0.12s, box-shadow 0.12s;
}
.card[data-style="relieve"] .round { border-radius: 50%; }
.card[data-style="relieve"][data-theme="dark"] :is(.round, .app, .key, .pad) { -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
.card[data-style="relieve"] :is(.round, .app, .key):is(.pressed, :active) { transform: scale(0.97); box-shadow: inset 0 1px 3px var(--tv-shadow), 0 0 0 1px var(--tv-line); }
.card[data-style="relieve"] .app.active { box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1.5px currentColor, 0 8px 18px -8px currentColor; }
.card[data-style="relieve"] .switch { background: var(--tv-track); box-shadow: inset 0 1px 2px var(--tv-shadow-2); }
.card[data-style="relieve"] .switch button[aria-pressed="true"] { background: var(--tv-thumb); box-shadow: inset 0 1px 0 var(--tv-hi), 0 2px 6px -2px var(--tv-shadow); }
.card[data-style="relieve"] .pad {
  background: radial-gradient(circle at 50% 30%, var(--tv-raised), var(--tv-raised-2) 75%);
  box-shadow: inset 0 0 0 1px var(--tv-line), inset 0 -10px 24px -14px var(--tv-shadow), 0 16px 32px -18px var(--tv-shadow), inset 0 1px 0 var(--tv-hi);
}
/* Las 4 marcas del bisel. */
.card[data-style="relieve"] .pad::before {
  content: ""; position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  --tick: color-mix(in srgb, var(--tv-ink-2) 45%, transparent);
  background:
    linear-gradient(var(--tick), var(--tick)) 50% 3.5% / 2px 10px no-repeat,
    linear-gradient(var(--tick), var(--tick)) 50% 96.5% / 2px 10px no-repeat,
    linear-gradient(var(--tick), var(--tick)) 3.5% 50% / 10px 2px no-repeat,
    linear-gradient(var(--tick), var(--tick)) 96.5% 50% / 10px 2px no-repeat;
}
.card[data-style="relieve"] .dir::after { content: ""; position: absolute; background: var(--tv-accent); border-radius: 2px; opacity: 0; transition: opacity 0.25s; box-shadow: 0 0 10px 1px var(--tv-accent); }
.card[data-style="relieve"] .dir.up::after    { top: 3.5%; left: calc(50% - 1px); width: 2px; height: 10px; }
.card[data-style="relieve"] .dir.down::after  { bottom: 3.5%; left: calc(50% - 1px); width: 2px; height: 10px; }
.card[data-style="relieve"] .dir.left::after  { left: 3.5%; top: calc(50% - 1px); width: 10px; height: 2px; }
.card[data-style="relieve"] .dir.right::after { right: 3.5%; top: calc(50% - 1px); width: 10px; height: 2px; }
.card[data-style="relieve"] .dir:is(.pressed, :active)::after { opacity: 1; }
.card[data-style="relieve"] .dir { --tv-press: 26%; --tv-press-mid: 10%; }
.card[data-style="relieve"] .ok { background: linear-gradient(180deg, var(--tv-raised-2), var(--tv-raised)); box-shadow: inset 0 2px 6px -2px var(--tv-shadow), 0 0 0 1px var(--tv-line), 0 1px 0 var(--tv-hi); }
.card[data-style="relieve"] .ok:is(.pressed, :active) { box-shadow: inset 0 0 0 1.5px var(--tv-accent), inset 0 3px 8px -2px var(--tv-shadow); color: var(--tv-ink); }
.card[data-style="relieve"] .modes { background: var(--tv-track); border-radius: 16px; padding: 4px; box-shadow: inset 0 1px 2px var(--tv-shadow-2); }
.card[data-style="relieve"] .mode { border-radius: 12px; height: 40px; }
.card[data-style="relieve"] .mode[aria-checked="true"] { background: var(--tv-thumb); box-shadow: inset 0 1px 0 var(--tv-hi), 0 2px 8px -3px var(--tv-shadow); }
/* Selector: una loseta elevada; la TV activa queda "hundida" en el riel y su ícono
   es la perilla, igual que el modo activo. */
.card[data-style="relieve"] .picker {
  background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2)), var(--tv-surface-top);
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 4px 10px -6px var(--tv-shadow-2), 0 22px 44px -18px var(--tv-shadow);
}
.card[data-style="relieve"] .picker-item .tv-ico { background: var(--tv-track); box-shadow: inset 0 1px 2px var(--tv-shadow-2); }
.card[data-style="relieve"] .picker-item.active { background: var(--tv-track); box-shadow: inset 0 1px 2px var(--tv-shadow-2); }
.card[data-style="relieve"] .picker-item.active .tv-ico { background: var(--tv-thumb); box-shadow: inset 0 1px 0 var(--tv-hi), 0 2px 6px -2px var(--tv-shadow); }

/* ---------- B · HALO: la luz de la app llega al touchpad como un anillo ---------- */
.card[data-style="halo"] {
  --tv-surface: #f0f2f6; --tv-raised: #ffffff; --tv-ink: #1b1f25; --tv-ink-2: #555d68; --tv-line: #d8dde4;
  --tv-hi: #ffffff; --tv-shadow: rgb(25 35 55 / 0.15); --tv-shadow-2: rgb(25 35 55 / 0.05); --tv-on: #1f9d63; --tv-accent-default: var(--tv-ink);
  --tv-bg: var(--tv-surface);
  --tv-card-shadow: 0 1px 2px var(--tv-shadow-2), 0 24px 48px -30px var(--tv-shadow), inset 0 1px 0 var(--tv-hi);
}
.card[data-style="halo"][data-theme="dark"] {
  --tv-surface: #121418; --tv-raised: rgb(255 255 255 / 0.06); --tv-ink: #eef0f3; --tv-ink-2: #99a0aa; --tv-line: rgb(255 255 255 / 0.1);
  --tv-hi: rgb(255 255 255 / 0.14); --tv-shadow: rgb(0 0 0 / 0.7); --tv-shadow-2: rgb(0 0 0 / 0.4); --tv-on: #64e3a6; --tv-accent-default: #dce6f5;
  --tv-bg:
    radial-gradient(70% 40% at 75% 55%, color-mix(in srgb, var(--tv-glow) 10%, transparent), transparent 70%),
    radial-gradient(90% 45% at 20% 0%, color-mix(in srgb, var(--tv-glow) 8%, transparent), transparent 70%),
    var(--tv-surface);
}
.card[data-style="halo"] :is(.round, .key, .app) {
  background: var(--tv-raised);
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 8px 18px -10px var(--tv-shadow);
  transition: transform 0.12s, box-shadow 0.12s;
}
.card[data-style="halo"] .key { width: 52px; height: 52px; justify-self: center; border-radius: 50%; }
.card[data-style="halo"] .num { width: auto; height: 100%; aspect-ratio: 1; }
.card[data-style="halo"] .app { border-radius: 18px; }
.card[data-style="halo"] .app.active::after { content: ""; position: absolute; bottom: 7px; width: 16px; height: 3px; border-radius: 3px; background: currentColor; }
.card[data-style="halo"][data-theme="dark"] :is(.round, .key, .app, .switch, .modes) { -webkit-backdrop-filter: blur(14px) saturate(140%); backdrop-filter: blur(14px) saturate(140%); }
.card[data-style="halo"] :is(.round, .key, .app):is(.pressed, :active) { transform: scale(0.95); }
.card[data-style="halo"] .switch { background: var(--tv-raised); box-shadow: 0 0 0 1px var(--tv-line), inset 0 1px 0 var(--tv-hi); }
.card[data-style="halo"] .switch button[aria-pressed="true"] { background: var(--tv-ink); color: var(--tv-surface); }
.card[data-style="halo"] .pad {
  background: radial-gradient(circle at 50% 40%, var(--tv-raised), transparent 80%), var(--tv-raised);
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 18px 40px -22px var(--tv-shadow);
}
/* El halo: anillo del color de la app, solo con la TV prendida. */
.card[data-style="halo"] .pad::before {
  content: ""; position: absolute; inset: 0; z-index: 1; border-radius: 50%; pointer-events: none;
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--tv-accent) 55%, transparent), inset 0 0 22px -6px color-mix(in srgb, var(--tv-accent) 60%, transparent);
  opacity: 0; transition: opacity 0.8s ease;
}
.card[data-style="halo"][data-status="on"] .pad::before { opacity: 1; }
/* Truco: un anillo de círculo completo recortado por la cuña deja ver solo el arco de esa dirección. */
.card[data-style="halo"] .dir { border-radius: 50%; }
.card[data-style="halo"] .dir:is(.pressed, :active) { box-shadow: inset 0 0 0 4px var(--tv-accent), inset 0 0 30px -4px var(--tv-accent); }
.card[data-style="halo"] .ok { background: var(--tv-surface); box-shadow: 0 0 0 1px var(--tv-line), inset 0 2px 8px -3px var(--tv-shadow); }
.card[data-style="halo"][data-theme="dark"] .ok { background: rgb(0 0 0 / 0.25); }
.card[data-style="halo"] .ok:is(.pressed, :active) { box-shadow: 0 0 0 2px var(--tv-accent), inset 0 2px 8px -3px var(--tv-shadow); color: var(--tv-ink); }
.card[data-style="halo"] .modes { background: var(--tv-raised); border-radius: 999px; padding: 4px; box-shadow: 0 0 0 1px var(--tv-line), inset 0 1px 0 var(--tv-hi); }
.card[data-style="halo"] .mode { border-radius: 999px; height: 40px; }
.card[data-style="halo"] .mode[aria-checked="true"] { background: var(--tv-ink); color: var(--tv-surface); }
/* Selector: cápsula plana con aro fino; la TV activa se invierte como el modo activo. */
.card[data-style="halo"] .picker {
  border-radius: 26px;
  background: linear-gradient(var(--tv-raised), var(--tv-raised)), var(--tv-surface);
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 22px 44px -18px var(--tv-shadow);
}
.card[data-style="halo"] .picker-item { border-radius: 999px; }
.card[data-style="halo"] .picker-item .tv-ico { box-shadow: inset 0 0 0 1px var(--tv-line); }
.card[data-style="halo"] .picker-item.active { background: var(--tv-ink); color: var(--tv-surface); }
.card[data-style="halo"] .picker-item.active .tv-ico { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tv-surface) 30%, transparent); }
.card[data-style="halo"][data-theme="dark"] .picker { -webkit-backdrop-filter: blur(14px) saturate(140%); backdrop-filter: blur(14px) saturate(140%); }

/* ---------- C · CRISTAL: la luz de la app en el fondo y paneles de vidrio ---------- */
.card[data-style="cristal"] {
  --tv-surface: #e9edf3; --tv-raised: rgb(255 255 255 / 0.62); --tv-raised-2: rgb(255 255 255 / 0.35); --tv-hi: rgb(255 255 255 / 0.95);
  --tv-ink: #1b1f25; --tv-ink-2: #545c67; --tv-line: rgb(30 45 70 / 0.1); --tv-shadow: rgb(30 45 70 / 0.22); --tv-on: #1f9d63;
  --tv-accent-default: var(--tv-ink); --tv-blob: #9fb7ff;
  --tv-bg:
    radial-gradient(55% 38% at 18% 8%, color-mix(in srgb, var(--tv-glow) 22%, transparent), transparent 72%),
    radial-gradient(50% 45% at 92% 92%, color-mix(in srgb, var(--tv-blob) 28%, transparent), transparent 72%),
    radial-gradient(45% 35% at 85% 30%, color-mix(in srgb, var(--tv-glow) 12%, transparent), transparent 70%),
    var(--tv-surface);
  --tv-card-shadow: 0 1px 2px rgb(30 45 70 / 0.06), 0 28px 56px -32px var(--tv-shadow);
}
.card[data-style="cristal"][data-theme="dark"] {
  --tv-surface: #0d0f13; --tv-raised: rgb(255 255 255 / 0.07); --tv-raised-2: rgb(255 255 255 / 0.025); --tv-hi: rgb(255 255 255 / 0.2);
  --tv-ink: #f0f2f5; --tv-ink-2: #a1a8b2; --tv-line: rgb(255 255 255 / 0.08); --tv-shadow: rgb(0 0 0 / 0.75); --tv-on: #64e3a6;
  --tv-accent-default: #dce6f5; --tv-blob: color-mix(in srgb, var(--tv-glow) 45%, #3d5cff);
  --tv-card-shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 28px 56px -32px var(--tv-shadow);
}
/* El vidrio: translúcido, desenfoca lo de atrás, brillo en la arista superior.
   Se aplica a pocos paneles grandes (no a cada botón) para no cargar tablets viejas. */
.card[data-style="cristal"] :is(.round, .switch, .apps, .pad, .modes, .keys, .numpad) {
  background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2));
  -webkit-backdrop-filter: blur(20px) saturate(160%); backdrop-filter: blur(20px) saturate(160%);
  box-shadow: inset 0 1px 0 var(--tv-hi), inset 0 0 0 1px var(--tv-line), 0 12px 28px -16px var(--tv-shadow);
}
.card[data-style="cristal"] .round { transition: transform 0.12s; }
.card[data-style="cristal"] .round:is(.pressed, :active) { transform: scale(0.95); }
.card[data-style="cristal"] .switch button[aria-pressed="true"] { background: var(--tv-ink); color: var(--tv-surface); }
.card[data-style="cristal"] :is(.apps, .keys, .numpad) { border-radius: 22px; padding: 6px; gap: 4px; }
.card[data-style="cristal"] :is(.app, .key) { border-radius: 16px; transition: background 0.2s; }
.card[data-style="cristal"] .key { height: 46px; }
.card[data-style="cristal"] .app.active { background: color-mix(in srgb, currentColor 12%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 30%, transparent); }
.card[data-style="cristal"] :is(.app, .key):is(.pressed, :active) { background: color-mix(in srgb, var(--tv-ink) 8%, transparent); }
.card[data-style="cristal"] .dir { --tv-press: 34%; --tv-press-mid: 13%; }
.card:is([data-style="relieve"], [data-style="cristal"]) .dir:is(.pressed, :active) {
  background: radial-gradient(var(--tv-press-size) at var(--tv-press-at),
    color-mix(in srgb, var(--tv-accent) var(--tv-press), transparent),
    color-mix(in srgb, var(--tv-accent) var(--tv-press-mid), transparent) 45%,
    transparent);
}
.card[data-style="cristal"] .ok { background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2)); box-shadow: inset 0 1px 0 var(--tv-hi), inset 0 0 0 1px var(--tv-line), 0 8px 18px -10px var(--tv-shadow); }
.card[data-style="cristal"] .ok:is(.pressed, :active) { box-shadow: inset 0 0 0 1.5px var(--tv-accent), inset 0 0 16px -4px var(--tv-accent); color: var(--tv-ink); }
.card[data-style="cristal"] .modes { border-radius: 18px; padding: 4px; }
.card[data-style="cristal"] .mode { border-radius: 14px; height: 40px; }
.card[data-style="cristal"] .mode[aria-checked="true"] { background: var(--tv-raised); box-shadow: inset 0 1px 0 var(--tv-hi), 0 4px 12px -6px var(--tv-shadow); }
.card[data-style="cristal"][data-theme="dark"] .mode[aria-checked="true"] { background: rgb(255 255 255 / 0.13); }
/* Selector: un panel de vidrio más denso que el resto (flota encima de la pantalla). */
.card[data-style="cristal"] .picker {
  border-radius: 22px;
  background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2)), color-mix(in srgb, var(--tv-surface) 80%, transparent);
  -webkit-backdrop-filter: blur(24px) saturate(170%); backdrop-filter: blur(24px) saturate(170%);
  box-shadow: inset 0 1px 0 var(--tv-hi), inset 0 0 0 1px var(--tv-line), 0 24px 48px -20px var(--tv-shadow);
}
.card[data-style="cristal"] .picker-item .tv-ico { background: var(--tv-raised); box-shadow: inset 0 1px 0 var(--tv-hi), inset 0 0 0 1px var(--tv-line); }
.card[data-style="cristal"] .picker-item.active { background: var(--tv-raised); box-shadow: inset 0 1px 0 var(--tv-hi), 0 4px 12px -6px var(--tv-shadow); }
.card[data-style="cristal"][data-theme="dark"] .picker-item.active { background: rgb(255 255 255 / 0.13); }
/* Sin backdrop-filter (navegadores viejos): paneles opacos, sigue siendo legible. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .card[data-style="cristal"] :is(.round, .switch, .apps, .pad, .modes, .keys, .picker, .numpad) { background: color-mix(in srgb, var(--tv-surface) 75%, #ffffff); }
  .card[data-style="cristal"][data-theme="dark"] :is(.round, .switch, .apps, .pad, .modes, .keys, .picker, .numpad) { background: #1b1e24; }
}

/* ===================== ESTADOS (comunes; van al final para ganar a los estilos) ===================== */
/* Botón principal (el centro como Encender). En oscuro, un círculo claro que brilla
   sobre el fondo. En claro, un círculo oscuro gritaba demasiado sobre tanto blanco:
   ahí resalta por ELEVACIÓN (blanco con sombra marcada), no por contraste. */
.card { --tv-cta-bg: var(--tv-ink); --tv-cta-ink: var(--tv-surface); --tv-cta-shadow: 0 10px 24px -10px var(--tv-shadow); }
.card[data-theme="light"] {
  --tv-cta-bg: linear-gradient(180deg, #ffffff, #f1f4f8); --tv-cta-ink: var(--tv-ink);
  --tv-cta-shadow: 0 0 0 1px var(--tv-line), 0 14px 26px -12px rgb(25 35 55 / 0.38), 0 2px 5px -2px rgb(25 35 55 / 0.18), inset 0 1px 0 #ffffff;
}
.card[data-status="on"] .power { color: var(--tv-on); }
/* TV apagada o sin conexión: se atenúa todo menos el centro del touchpad, que se
   vuelve el botón Encender (por eso se atenúan las cuñas y no el .pad entero: la
   opacidad de un padre se multiplica en sus hijos y no se puede "deshacer"). */
.card:is([data-status="off"], [data-status="unavailable"]) :is(.apps, .pad .dir, .modes, .keys) { opacity: 0.4; transition: opacity 0.5s; }
.card:is([data-status="off"], [data-status="unavailable"]) .ok { color: var(--tv-cta-ink); }
.card:is([data-status="off"], [data-status="unavailable"]) .ok::before { opacity: 1; }
.card:is([data-status="off"], [data-status="unavailable"]) .ok-face { opacity: 0; transform: scale(0.7); }
.card:is([data-status="off"], [data-status="unavailable"]) .ok-power { opacity: 1; transform: none; }
.card:is([data-status="off"], [data-status="unavailable"]) .ok:is(.pressed, :active) { transform: scale(0.96); }
.card[data-busy="true"] .ok-power ha-icon { animation: tv-spin 0.9s linear infinite; }
/* El botón que abre el numpad se queda "hundido" mientras está abierto. */
.card [aria-expanded="true"]:is(.key, .round, .dir) { color: var(--tv-ink); box-shadow: inset 0 1px 3px var(--tv-shadow), 0 0 0 1.5px var(--tv-ink-2); }

@keyframes tv-pulse { 50% { opacity: 0.45; } }
@keyframes tv-spin { to { transform: rotate(360deg); } }
@keyframes tv-pop { from { opacity: 0; transform: translateY(-6px) scale(0.97); } }
@media (prefers-reduced-motion: reduce) {
  .card, .card * { transition: none !important; animation: none !important; }
}
`;

/*
 * Una sola hoja de estilos para TODAS las tarjetas de la página: el navegador
 * parsea el CSS una vez y cada shadowRoot solo guarda una referencia
 * (adoptedStyleSheets). La v3 reinsertaba un <style> de 733 líneas en cada render.
 * Navegadores viejos (iOS < 16.4, p. ej. una tablet de pared antigua) no tienen
 * CSSStyleSheet construible: ahí se usa un <style> normal, una sola vez.
 */
let sharedSheet = null;
function adoptStyles(root) {
  const supported = 'adoptedStyleSheets' in Document.prototype && 'replaceSync' in CSSStyleSheet.prototype;
  if (supported) {
    if (!sharedSheet) {
      sharedSheet = new CSSStyleSheet();
      sharedSheet.replaceSync(CARD_CSS);
    }
    root.adoptedStyleSheets = [sharedSheet];
  } else {
    const style = document.createElement('style');
    style.textContent = CARD_CSS;
    root.append(style);
  }
}

/* ---------- esqueleto del DOM ---------- */

/*
 * HTML 100% estático: no contiene NADA del YAML del usuario. Por eso puede vivir
 * en un <template> que el navegador parsea una vez; cada tarjeta lo clona con
 * cloneNode(true), que es más rápido que volver a parsear texto con innerHTML.
 *
 * data-act  = qué hace el botón (lo lee el único listener de clic: delegación).
 * data-ref  = nodos que _update necesita encontrar rápido (se guardan en this._refs).
 */
const SKELETON = `
<ha-card class="card" data-ref="card">
  <div class="body">
    <header class="head">
      <button type="button" class="tv-name" data-act="picker" data-ref="status" aria-haspopup="listbox" aria-expanded="false">
        <span data-ref="name"></span><ha-icon class="chevron" icon="mdi:chevron-down"></ha-icon>
      </button>
      <div class="switch" data-ref="switch" role="group" aria-label="Controlar">
        <button type="button" data-act="target" data-id="tv">TV</button>
        <button type="button" data-act="target" data-id="roku">Roku</button>
      </div>
      <button type="button" class="round" data-act="top_left" data-ref="topLeft"><ha-icon></ha-icon></button>
      <button type="button" class="round power" data-act="power" data-ref="power" aria-label="Encender o apagar"><ha-icon></ha-icon></button>
    </header>
    <div class="picker" data-ref="picker" role="listbox" hidden></div>
    <div class="screen" aria-live="polite">
      <div class="glass">
        <ha-icon class="now-icon" data-ref="nowIcon"></ha-icon>
        <div class="now-text">
          <div class="now-title" data-ref="state"></div>
          <div class="now-sub" data-ref="nowSub"></div>
        </div>
      </div>
    </div>
    <section class="apps">
      ${DEFAULT_STREAMING.map((_, i) => `<button type="button" class="app" data-act="stream" data-index="${i}"><ha-icon></ha-icon></button>`).join('')}
    </section>
    <section class="pad">
      ${DIRECTIONS.map((dir) => `<button type="button" class="dir ${dir}" data-act="pad" data-dir="${dir}" aria-label="${KEYS[dir].label}"><ha-icon></ha-icon></button>`).join('')}
      <button type="button" class="ok" data-act="center" data-ref="center" aria-label="OK">
        <span class="ok-face"><ha-icon data-ref="centerIcon"></ha-icon><span>OK</span></span>
        <span class="ok-power" aria-hidden="true"><ha-icon data-ref="centerPower"></ha-icon></span>
      </button>
    </section>
    <section class="numpad" data-ref="numpad" role="group" aria-label="Teclado numérico">
      ${NUMPAD_DIGITS.map((d) => `<button type="button" class="key num" data-act="digit" data-digit="${d}">${d}</button>`).join('')}
      <button type="button" class="key num" data-act="numpad_close" aria-label="Cerrar teclado"><ha-icon icon="mdi:close"></ha-icon></button>
      <button type="button" class="key num" data-act="digit" data-digit="0">0</button>
      <button type="button" class="key num" data-act="numpad_ok" aria-label="OK"><ha-icon icon="mdi:keyboard-return"></ha-icon></button>
    </section>
    <nav class="modes" data-ref="modes" role="radiogroup" aria-label="Modo del touchpad"></nav>
    <footer class="keys">
      ${BOTTOM_BUTTONS.map((id) => `<button type="button" class="key" data-act="bottom" data-id="${id}" aria-label="${KEYS[id].label}"><ha-icon></ha-icon></button>`).join('')}
    </footer>
    <div class="toast" data-ref="toast" role="status" aria-live="polite"></div>
  </div>
</ha-card>`;

let skeletonTemplate = null;
function cloneSkeleton() {
  if (!skeletonTemplate) {
    skeletonTemplate = document.createElement('template');
    skeletonTemplate.innerHTML = SKELETON;
  }
  return skeletonTemplate.content.cloneNode(true);
}

/* ---------- helpers de DOM: solo escriben si el valor cambió ---------- */

function setAttr(el, name, value) {
  if (value === null || value === undefined || value === '') {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== value) {
    el.setAttribute(name, value);
  }
}
function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}
function setVar(el, name, value) {
  if (value) el.style.setProperty(name, value);
  else el.style.removeProperty(name);
}
function makeIcon(icon, className) {
  const el = document.createElement('ha-icon');
  if (icon) el.setAttribute('icon', icon);
  if (className) el.className = className;
  return el;
}

/*
 * En Node (los tests) no existe HTMLElement. Con `?? class {}` la clase se puede
 * declarar igual y los tests siguen importando el archivo sin navegador.
 * (?? = "si lo de la izquierda es null/undefined, usa lo de la derecha".)
 */
const BaseElement = globalThis.HTMLElement ?? class {};

class TvControlCard extends BaseElement {
  constructor() {
    super();
    this._model = null;              // salida de normalizeConfig (congelada)
    this._hass = null;
    this._ui = { tvIndex: 0, mode: null, roku: false, numpad: false };  // estado PROPIO de la tarjeta
    this._refs = null;               // nodos creados en _build
    this._appliedSettings = null;    // settings que _applySettings ya pintó
    this._watched = [];              // objetos de estado vistos en el último set hass
    this._modeEntityState = undefined;
    this._restored = false;          // ¿ya se leyó la TV guardada en localStorage?
    this._frame = 0;                 // id del requestAnimationFrame pendiente (0 = ninguno)
    this._toastTimer = 0;
    this._waiters = new StateWaiters();
    this._hold = null;               // presión en curso: { el, action, device, pointerId, active }
    this._timing = TIMING;           // la autoprueba del navegador lo reemplaza por tiempos cortos
    this._suppressClick = null;      // { el, until }: el click que sigue a un hold no debe re-enviar
    this._sequenceRunning = false;   // una secuencia a la vez (un doble toque no mezcla dos PINs)
    this._centerPress = null;        // { power, at }: qué cara tenía el centro al tocarlo
    this._centerGuardUntil = 0;      // hasta cuándo el centro ignora OK tras encender
    this._lastStatus = null;
    this._busy = new Map();          // entity → 'Encendiendo…' / 'Apagando…'
    this._loading = new Map();       // entity → índice del botón de streaming en curso
    this._stats = { builds: 0, applies: 0, updates: 0 };  // lo muestra el harness

    this.attachShadow({ mode: 'open' });
    adoptStyles(this.shadowRoot);
    // Delegación de eventos: un listener por TIPO de evento para todos los
    // botones, presentes y futuros. Como el DOM no se reemplaza, nunca hay que
    // volver a registrarlos.
    const root = this.shadowRoot;
    root.addEventListener('click', (e) => this._onClick(e));
    root.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    // Cualquiera de estos termina una presión. Se escucha en el shadowRoot (no
    // en el botón), así que da igual dónde se suelte el dedo.
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      root.addEventListener(type, () => this._stopHold());
    }
    // Escape cierra lo que esté abierto (numpad o selector de TVs).
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (this._ui.numpad) this._toggleNumpad(false);
      this._togglePicker(false);
    });
    // Mantener presionado en móvil abre el menú contextual: en los botones no.
    root.addEventListener('contextmenu', (e) => {
      if (e.target.closest?.('[data-act]')) e.preventDefault();
    });
  }

  /* ----- API que usa Home Assistant ----- */

  setConfig(config) {
    // Si normalizeConfig lanza un Error, HA muestra la tarjeta roja con el mensaje.
    const model = normalizeConfig(config);
    if (model.warnings.length) console.warn(`[${CARD_TAG}] ${model.cardId}:`, model.warnings);
    this._stopHold();
    this._model = model;
    this._ui = { tvIndex: 0, mode: null, roku: false, numpad: false };
    this._restored = false;
    this._refs = null;               // fuerza _build en el próximo render
    this._appliedSettings = null;
    this._watched = [];
    this._modeEntityState = undefined;
    this._schedule();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._model) return;
    this._restoreTv();
    this._waiters.check(hass);       // primero las esperas: no dependen de qué cambió
    this._syncModeEntity(hass);
    if (this._watchedChanged(hass)) this._schedule();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    this._watched = [];              // al volver a la página, repintar sí o sí
    document.addEventListener('visibilitychange', this._onVisibility);
    this._schedule();
  }

  disconnectedCallback() {
    // Si la tarjeta sale de la página con un dedo encima, la presión termina aquí.
    this._stopHold();
    document.removeEventListener('visibilitychange', this._onVisibility);
    if (this._frame) cancelAnimationFrame(this._frame);
    this._frame = 0;
    if (this._refs) this._togglePicker(false);
    clearTimeout(this._toastTimer);
    // Las esperas de _waitFor NO se cancelan: HA desconecta y reconecta tarjetas
    // al cambiar de vista, y un flujo de "encender + elegir fuente" debe seguir.
    // Todas tienen timeout, así que no quedan colgadas.
  }

  getCardSize() {
    return 9;
  }

  // Dashboards de "secciones": la tarjeta ocupa 6 de 12 columnas por defecto y la
  // altura la decide su contenido (no se define `rows`).
  getGridOptions() {
    return { columns: 6, min_columns: 4 };
  }

  /** HA pide el editor visual al abrir "Editar tarjeta". */
  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig(hass) {
    const entity = Object.keys(hass?.states ?? {}).find((id) => id.startsWith('media_player.')) ?? 'media_player.tv';
    return {
      card_id: 'mi_tv',
      tvs: [{ name: 'Mi TV', entity, platform: 'lg' }],
      modes: ['menu', 'busqueda', 'audio'],
    };
  }

  /* ----- estado derivado ----- */

  get _tv() {
    return this._model.tvs[this._ui.tvIndex] ?? this._model.tvs[0];
  }

  /** Pad del touchpad según el modo activo (o el default si no hay modo). */
  get _pad() {
    const settings = this._tv.settings;
    return (this._ui.mode && settings.modeDefs[this._ui.mode]?.pad) || settings.defaultPad;
  }

  get _storageKey() {
    // Misma clave que producción, para que el cliente conserve su TV elegida al actualizar.
    return `tv-card__${this._model.cardId}__${this._hass?.user?.id || 'default'}`;
  }

  /* ----- reacción a hass ----- */

  _restoreTv() {
    if (this._restored || !this._hass) return;
    this._restored = true;
    const saved = Number.parseInt(storage.get(this._storageKey), 10);
    if (saved >= 0 && saved < this._model.tvs.length) this._ui.tvIndex = saved;
    this._ui.roku = this._loadRokuMode();
  }

  /** Clave de producción: el modo Roku se recuerda por TV y por usuario. */
  get _rokuKey() {
    return `tv-card__roku__${this._model.cardId}__${this._hass?.user?.id || 'default'}__${this._tv.entity}`;
  }

  /** Igual que producción: si nunca se eligió, una TV con Roku arranca en modo Roku. */
  _loadRokuMode() {
    if (!this._tv.companion) return false;
    return storage.get(this._rokuKey) !== '0';
  }

  /** Entidades cuyo cambio debe repintar la tarjeta. Cualquier otra se ignora. */
  _watchedEntities() {
    const tv = this._tv;
    return [tv.entity, tv.companion?.entity, this._model.controlModeEntity].filter(Boolean);
  }

  /**
   * HA nunca modifica un objeto de estado: cuando una entidad cambia, crea un
   * objeto NUEVO. Entonces basta comparar referencias (===), sin revisar campo
   * por campo. Es como comparar punteros en C en vez de hacer memcmp.
   */
  _watchedChanged(hass) {
    const next = this._watchedEntities().map((id) => hass.states[id]);
    // Con theme: auto, también importa si HA cambió entre claro y oscuro.
    next.push(this._model.theme === 'auto' ? !!hass.themes?.darkMode : null);
    const changed = next.length !== this._watched.length || next.some((st, i) => st !== this._watched[i]);
    this._watched = next;
    return changed;
  }

  /** control_mode_entity (p. ej. un input_select) fija el modo desde HA, igual que en producción. */
  _syncModeEntity(hass) {
    const id = this._model.controlModeEntity;
    const st = id ? hass.states[id] : undefined;
    if (!st || st === this._modeEntityState) return;
    this._modeEntityState = st;
    const value = has(MODE_ALIASES, st.state) ? MODE_ALIASES[st.state] : st.state;
    this._ui.mode = this._tv.settings.modes.includes(value) ? value : null;
  }

  /** Espera a que `entityId` cumpla `predicate`. Resuelve true, o false si pasa `timeoutMs`. */
  _waitFor(entityId, predicate, timeoutMs) {
    return this._waiters.wait(this._hass, entityId, predicate, timeoutMs);
  }

  /* ----- render ----- */

  /**
   * Junta varios pedidos de render en uno solo por frame (~16 ms). Si llegan 5
   * updates de hass seguidos, se pinta una vez, justo antes de dibujar.
   */
  _schedule() {
    if (this._frame || !this.isConnected) return;
    this._frame = requestAnimationFrame(() => {
      this._frame = 0;
      this._render();
    });
  }

  _render() {
    if (!this._model) return;
    if (!this._refs) this._build();
    this._update();
  }

  _build() {
    this._stats.builds++;
    const fragment = cloneSkeleton();
    const refs = {};
    for (const el of fragment.querySelectorAll('[data-ref]')) refs[el.dataset.ref] = el;
    refs.pad = {};
    for (const el of fragment.querySelectorAll('[data-act="pad"]')) refs.pad[el.dataset.dir] = el;
    refs.stream = [...fragment.querySelectorAll('[data-act="stream"]')];
    refs.bottom = {};
    for (const el of fragment.querySelectorAll('[data-act="bottom"]')) refs.bottom[el.dataset.id] = el;

    // Lista de TVs del selector: depende solo de la config, se arma aquí.
    refs.picker.replaceChildren(...this._model.tvs.map((tv, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'picker-item';
      item.dataset.act = 'tv';
      item.dataset.index = String(i);
      item.setAttribute('role', 'option');
      const name = document.createElement('span');
      name.textContent = tv.name;   // textContent: el nombre se muestra tal cual, nunca se interpreta como HTML
      item.append(makeIcon(tv.platform === 'samsung' ? 'mdi:television' : 'mdi:television-play', 'tv-ico'), name, makeIcon('mdi:check', 'check'));
      return item;
    }));

    // Se quita solo el <ha-card> de un build anterior (si setConfig se llamó
    // otra vez). Un innerHTML = '' borraría también el <style> de respaldo.
    this.shadowRoot.querySelector('ha-card')?.remove();
    this.shadowRoot.append(fragment);
    this._refs = refs;
    this._appliedSettings = null;
  }

  /** Lo que depende de los settings de la TV activa (cambia solo al cambiar de TV). */
  _applySettings(settings) {
    this._stats.applies++;
    const refs = this._refs;
    const { buttons, streaming } = settings;

    // (Los íconos de streaming cambian con el estado (spinner): van en _update.)
    setAttr(refs.power.firstElementChild, 'icon', buttons.power.icon);
    setAttr(refs.centerIcon, 'icon', buttons.center.icon);
    for (const id of BOTTOM_BUTTONS) setAttr(refs.bottom[id].firstElementChild, 'icon', buttons[id].icon);
    streaming.forEach((slot, i) => refs.stream[i].setAttribute('aria-label', slot.source.name));

    // Botón propio del encabezado (el "exit" de arriba de los YAML viejos). Si solo
    // repite el EXIT de abajo, se oculta: era un duplicado. Con Roku, su lugar lo
    // ocupa el selector TV | Roku.
    const topLeft = buttons.top_left;
    const isPlainExit = topLeft.action?.type === 'key' && topLeft.action.key === 'exit';
    refs.topLeft.hidden = !topLeft.action || isPlainExit;
    setAttr(refs.topLeft.firstElementChild, 'icon', topLeft.icon);
    setAttr(refs.topLeft, 'aria-label', topLeft.action?.type === 'service' ? topLeft.action.data?.entity_id : 'Acción');

    // Modos: un grupo de "radio" (solo uno activo a la vez).
    const modeButtons = settings.modes.map((id) => {
      const def = settings.modeDefs[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mode';
      btn.dataset.act = 'mode';
      btn.dataset.id = id;
      btn.setAttribute('role', 'radio');
      const label = document.createElement('span');
      label.textContent = def.label;
      btn.append(makeIcon(def.icon), label);
      return btn;
    });
    refs.modes.replaceChildren(...modeButtons);

    if (this._ui.mode && !settings.modes.includes(this._ui.mode)) this._ui.mode = null;
    this._appliedSettings = settings;
  }

  /** 'light' | 'dark'. Con theme: auto se sigue el modo oscuro de HA. */
  get _theme() {
    if (this._model.theme !== 'auto') return this._model.theme;
    return this._hass?.themes?.darkMode ? 'dark' : 'light';
  }

  _update() {
    this._stats.updates++;
    const refs = this._refs;
    const tv = this._tv;
    const settings = tv.settings;
    if (this._appliedSettings !== settings) this._applySettings(settings);

    const st = this._hass?.states?.[tv.entity];
    const status = tvStatus(st);
    const roku = this._ui.roku && !!tv.companion;
    const busy = this._busy.get(tv.entity);
    const card = refs.card;

    // Atributos data-* en .card: el CSS decide cómo se ve cada caso con
    // selectores como .card[data-status="on"] .power. JS dice QUÉ pasa; CSS, CÓMO.
    card.dataset.style = this._model.style;
    card.dataset.theme = this._theme;
    card.dataset.status = status;
    card.dataset.mode = this._ui.mode ?? 'default';
    card.dataset.roku = String(roku);
    card.dataset.busy = String(!!busy);
    card.classList.toggle('multi', this._model.tvs.length > 1);

    // Con la TV apagada o sin conexión, los controles que le hablan a la TV se
    // BLOQUEAN (disabled), no solo se atenúan: antes se veían apagados pero seguían
    // mandando teclas. `disabled` también lo anuncia a los lectores de pantalla.
    // El centro (Encender), el power y el streaming (enciende y abre la app) siguen activos.
    const locked = status !== 'on';
    if (locked && this._hold) this._stopHold();
    for (const el of [...Object.values(refs.pad), ...Object.values(refs.bottom), ...refs.modes.children]) {
      if (el.disabled !== locked) el.disabled = locked;
    }

    // El numpad solo tiene sentido con la TV prendida. Si se apaga con el numpad
    // abierto, se cierra: así el centro "Encender" siempre está a la vista.
    if (this._ui.numpad && status !== 'on') this._ui.numpad = false;
    card.dataset.numpad = String(this._ui.numpad);
    // Los botones que abren el numpad dicen si está abierto (aria-expanded).
    for (const [el, act] of this._numpadOpeners(settings)) setAttr(el, 'aria-expanded', act ? String(this._ui.numpad) : null);

    // Centro del touchpad: con la TV apagada o sin conexión es el botón Encender.
    // Justo cuando la TV pasa a 'on', el centro ignora OK un momento: un doble toque
    // a "Encender" no debe terminar mandando un OK a la TV recién prendida.
    const centerIsPower = status !== 'on';
    if (status === 'on' && this._lastStatus !== null && this._lastStatus !== 'on') {
      this._centerGuardUntil = performance.now() + CENTER_GUARD_MS;
    }
    this._lastStatus = status;
    setAttr(refs.center, 'aria-label', centerIsPower ? 'Encender' : 'OK');
    setAttr(refs.centerPower, 'icon', busy && centerIsPower ? 'mdi:loading' : settings.buttons.power.icon);

    setText(refs.name, tv.name);

    // Selector TV | Roku: solo si la TV tiene Roku.
    refs.switch.hidden = !tv.companion;
    for (const btn of refs.switch.children) btn.setAttribute('aria-pressed', String((btn.dataset.id === 'roku') === roku));
    if (tv.companion) refs.topLeft.hidden = true;

    // La pantalla de vidrio y el color de la app.
    const now = describeNow({
      status, busy, roku,
      hasCompanion: !!tv.companion,
      tvState: st,
      rokuState: roku ? this._hass?.states?.[tv.companion.entity] : null,
      streaming: settings.streaming,
    });
    setText(refs.state, now.title);
    setText(refs.nowSub, now.sub);
    setAttr(refs.nowIcon, 'icon', now.icon);
    // Se recalcula desde cero en cada update: si no hay color, la variable se BORRA
    // (por eso el "tema pegado" de la v3 ya no puede ocurrir).
    setVar(card, '--tv-accent', now.accent);
    setVar(card, '--tv-glow', now.accent);

    const pad = this._pad;
    for (const dir of DIRECTIONS) {
      setAttr(refs.pad[dir].firstElementChild, 'icon', pad[dir].icon);
      refs.pad[dir].classList.toggle('empty', !pad[dir].action);
    }

    for (const btn of refs.modes.children) btn.setAttribute('aria-checked', String(btn.dataset.id === this._ui.mode));

    const loadingIndex = this._loading.get(tv.entity);
    settings.streaming.forEach((slot, i) => {
      const loading = loadingIndex === i;
      refs.stream[i].classList.toggle('active', !!now.sourceId && slot.source.id === now.sourceId);
      refs.stream[i].classList.toggle('loading', loading);
      setAttr(refs.stream[i].firstElementChild, 'icon', loading ? 'mdi:loading' : slot.icon);
    });

    for (const item of refs.picker.children) {
      const active = Number(item.dataset.index) === this._ui.tvIndex;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    }
  }

  /* ----- eventos ----- */

  /** La acción "de teclado" de un botón (pad, centro, abajo), o null si no aplica. */
  _actionFor(el) {
    const buttons = this._tv.settings.buttons;
    switch (el.dataset.act) {
      case 'pad':    return this._pad[el.dataset.dir]?.action ?? null;
      case 'center': return buttons.center.action;
      case 'bottom': return buttons[el.dataset.id]?.action ?? null;
      case 'top_left': return this._tv.companion ? null : buttons.top_left.action;
      default:       return null;
    }
  }

  _onClick(e) {
    // closest() sube desde el nodo tocado hasta encontrar un [data-act]. Así un
    // toque sobre el <ha-icon> de dentro cuenta como toque al botón.
    const el = e.target.closest?.('[data-act]');
    if (!el || !this._model || !this._refs) return;

    // Un hold ya envió la acción en el pointerdown: el click que el navegador
    // dispara al soltar no debe mandarla otra vez.
    const suppress = this._suppressClick;
    if (suppress?.el === el && performance.now() < suppress.until) {
      this._suppressClick = null;
      return;
    }

    if (el.disabled) return;   // bloqueado (TV apagada)
    switch (el.dataset.act) {
      case 'center':   return this._onCenter();
      case 'pad':
      case 'bottom':   return this._press(this._actionFor(el));
      case 'top_left': return this._press(this._actionFor(el));
      case 'target':   return this._setRoku(el.dataset.id === 'roku');
      case 'power':    return this._power();
      case 'stream':   return this._stream(Number(el.dataset.index));
      case 'mode':     return this._toggleMode(el.dataset.id);
      case 'digit':    return this._numpadKey({ type: 'key', key: `digit_${el.dataset.digit}` });
      case 'numpad_ok':    return this._numpadKey({ type: 'key', key: 'enter' });
      case 'numpad_close': return this._toggleNumpad(false);
      case 'picker':   return this._togglePicker();
      case 'tv':       return this._selectTv(Number(el.dataset.index));
    }
  }

  /**
   * Las teclas repetibles (flechas, volumen, canal) se manejan en pointerdown
   * para responder al instante y poder repetir. Todo lo demás sigue en click.
   */
  _onPointerDown(e) {
    if (e.button !== 0 || !this._model || !this._refs) return;   // solo botón principal / dedo
    const el = e.target.closest?.('[data-act]');
    if (!el || el.disabled) return;
    if (el.dataset.act === 'center') {
      // Lo que cuenta es la cara que se VEÍA al tocar, no la que haya al soltar:
      // un toque que empezó como "Encender" nunca termina mandando un OK.
      this._centerPress = { power: this._refs.card.dataset.status !== 'on', at: performance.now() };
      if (this._centerPress.power) return;   // como Encender no hay hold
    }
    const action = this._actionFor(el);
    if (!isHoldable(action)) return;
    this._suppressClick = { el, until: Infinity };
    this._startHold(el, action, e.pointerId);
  }

  _onVisibility = () => {
    if (document.hidden) this._stopHold();   // la app pasó a segundo plano
  };

  /**
   * Bucle del hold. Diferencia clave con producción/v3: NO hay setInterval.
   * Es un bucle `async` que hace await de cada envío, así que nunca hay dos
   * llamadas en vuelo, y que revisa `hold.active` en cada vuelta. Para pararlo
   * basta con poner active = false (eso hace _stopHold); no hay ningún timer
   * huérfano que pueda seguir mandando teclas.
   */
  async _startHold(el, action, pointerId) {
    this._stopHold();
    const device = this._route(action);
    const hold = { el, pointerId, active: true };
    this._hold = hold;
    el.classList.add('pressed');
    // La captura hace que el pointerup llegue a este botón aunque el dedo se
    // haya movido fuera. (En eventos sintéticos de prueba lanza: no importa.)
    try { el.setPointerCapture(pointerId); } catch { /* sin captura */ }
    this._haptic();

    const { holdDelay, holdInterval, holdMaxRepeats } = this._timing;
    try {
      await executeAction(this._hass, action, device);
      await delay(holdDelay);
      for (let i = 0; i < holdMaxRepeats && hold.active; i++) {
        const started = performance.now();
        await executeAction(this._hass, action, device);
        // Si HA tardó más que el intervalo, la siguiente sale de inmediato; si
        // tardó menos, se espera lo que falta. Nunca hay envíos en paralelo.
        const rest = holdInterval - (performance.now() - started);
        if (rest > 0 && hold.active) await delay(rest);
      }
    } catch (err) {
      this._showError(err);
    } finally {
      if (this._hold === hold) this._stopHold();
    }
  }

  _stopHold() {
    const hold = this._hold;
    if (!hold) return;
    hold.active = false;
    this._hold = null;
    hold.el.classList.remove('pressed');
    try {
      if (hold.el.hasPointerCapture?.(hold.pointerId)) hold.el.releasePointerCapture(hold.pointerId);
    } catch { /* ya no había captura */ }
    // El click que viene justo después de soltar se ignora (ver _onClick).
    if (this._suppressClick?.el === hold.el) this._suppressClick.until = performance.now() + 600;
  }

  /** Un toque, un evento háptico (antes había casos con dos). */
  _haptic(type = 'light') {
    this.dispatchEvent(new CustomEvent('haptic', { detail: type, bubbles: true, composed: true }));
  }

  _press(action) {
    if (!action) return;
    if (action.type === 'numpad') return this._toggleNumpad();
    if (action.type === 'sequence') return this._runSequence(action);
    this._haptic();
    this._run(action);
  }

  /**
   * Una secuencia (p. ej. un PIN) tarda: N pasos con `delay` entre ellos. Si se
   * vuelve a tocar el botón mientras corre, el segundo toque se ignora; si no,
   * las dos secuencias se intercalarían en la TV (1-1-2-2-3-3-4-4).
   */
  async _runSequence(action) {
    if (this._sequenceRunning) return;
    this._sequenceRunning = true;
    this._haptic();
    try {
      await this._run(action);
    } finally {
      this._sequenceRunning = false;
    }
  }

  /**
   * Teclas del numpad: SIEMPRE van a la TV, también en modo Roku. El Roku no tiene
   * dígitos, así que los números ya irían a la TV; el OK del numpad debe ir al
   * mismo lugar que los números (si no, un PIN escrito en la TV se confirmaría en el Roku).
   */
  _numpadKey(action) {
    this._haptic();
    const tv = this._tv;
    this._run(action, { platform: tv.platform, entity: tv.entity });
  }

  _toggleNumpad(force) {
    const open = force ?? !this._ui.numpad;
    if (open === this._ui.numpad) return;
    if (open && tvStatus(this._hass?.states?.[this._tv.entity]) !== 'on') {
      this._toast('Enciende la TV para usar el teclado numérico.');
      return;
    }
    this._haptic();
    this._stopHold();
    this._ui.numpad = open;
    this._schedule();
  }

  /** Pares [botón, ¿abre el numpad?] de los botones que pueden tener la acción numpad. */
  _numpadOpeners(settings) {
    const refs = this._refs;
    const isNumpad = (button) => button?.action?.type === 'numpad';
    const pairs = BOTTOM_BUTTONS.map((id) => [refs.bottom[id], isNumpad(settings.buttons[id])]);
    pairs.push([refs.topLeft, isNumpad(settings.buttons.top_left)]);
    for (const dir of DIRECTIONS) pairs.push([refs.pad[dir], isNumpad(this._pad[dir])]);
    return pairs;
  }

  _route(action) {
    return routeAction(action, { tv: this._tv, rokuMode: this._ui.roku, mode: this._ui.mode });
  }

  _run(action, device = this._route(action)) {
    return executeAction(this._hass, action, device).catch((err) => this._showError(err));
  }

  /* ----- flujos de encendido y fuentes ----- */

  _setBusy(entity, label) {
    if (label) this._busy.set(entity, label);
    else this._busy.delete(entity);
    this._schedule();
  }

  _setLoading(entity, index) {
    if (index === null) this._loading.delete(entity);
    else this._loading.set(entity, index);
    this._schedule();
  }

  /**
   * Garantiza que la TV esté prendida. Nunca usa toggle. Devuelve true si HA
   * confirmó 'on' dentro del tiempo límite.
   */
  async _ensureOn(tv) {
    if (tvStatus(this._hass?.states?.[tv.entity]) === 'on') return true;
    this._setBusy(tv.entity, 'Encendiendo…');
    try {
      await getPlatform(tv.platform).turnOn(this._hass, { platform: tv.platform, entity: tv.entity });
      return await this._waitFor(tv.entity, (s) => tvStatus(s) === 'on', this._timing.powerOn);
    } finally {
      this._setBusy(tv.entity, null);
    }
  }

  /**
   * Encender/apagar. NUNCA usa media_player.toggle: con un estado viejo o
   * 'unavailable', un toggle puede apagar una TV que en realidad está prendida.
   *   on → turn_off      off / unavailable → turn_on
   * Mientras se espera la confirmación, más toques se ignoran (antes cada toque
   * extra era otro toggle).
   */
  async _power() {
    const tv = this._tv;
    if (this._busy.has(tv.entity)) return;
    if (tvStatus(this._hass?.states?.[tv.entity]) !== 'on') return this._turnOn();
    this._haptic();
    const custom = tv.settings.buttons.power.action;
    if (custom) return this._run(custom);
    this._setBusy(tv.entity, 'Apagando…');
    try {
      await getPlatform(tv.platform).turnOff(this._hass, { platform: tv.platform, entity: tv.entity });
      await this._waitFor(tv.entity, (s) => tvStatus(s) !== 'on', this._timing.powerOff);
    } catch (err) {
      this._showError(err);
    } finally {
      this._setBusy(tv.entity, null);
    }
  }

  /**
   * Solo enciende; NUNCA apaga. Si la TV ya está prendida no hace nada. Lo usan el
   * power (cuando la TV no está on) y el centro del touchpad en su cara "Encender":
   * así, aunque HA tenga un estado viejo, tocar el centro no puede apagar la TV.
   */
  async _turnOn() {
    const tv = this._tv;
    if (this._busy.has(tv.entity)) return;
    if (tvStatus(this._hass?.states?.[tv.entity]) === 'on') return;
    this._haptic();
    const custom = tv.settings.buttons.power.action;
    if (custom) return this._run(custom);
    try {
      if (!(await this._ensureOn(tv))) {
        this._toast(tv.platform === 'lg'
          ? 'La TV no confirmó el encendido. En LG, revisa que el encendido (Wake on LAN) esté configurado en HA.'
          : 'La TV no confirmó el encendido.');
      }
    } catch (err) {
      this._showError(err);
    }
  }

  /** Centro del touchpad: OK con la TV prendida, Encender con la TV apagada. */
  _onCenter() {
    // Si el click viene de un toque reciente, manda la cara que se veía al tocar;
    // si viene del teclado (click sin pointerdown), la que se ve ahora.
    const press = this._centerPress;
    this._centerPress = null;
    const recent = press && performance.now() - press.at < 1500;
    const asPower = recent ? press.power : this._refs.card.dataset.status !== 'on';
    if (asPower) return this._turnOn();
    if (performance.now() < this._centerGuardUntil) return;
    return this._press(this._actionFor(this._refs.center));
  }

  /**
   * select_source + esperar a que HA reporte esa fuente. Arreglo del bug B3:
   * antes se esperaban 5 s ANTES de mandar y se revisaba el estado una sola vez.
   * Ahora se manda de inmediato y se espera la confirmación (máx. 6 s), con un
   * reintento.
   */
  async _selectSourceConfirmed(device, candidates) {
    const platform = getPlatform(device.platform);
    const preferAppName = device.platform === 'roku';
    const name = resolveSourceName(this._hass?.states?.[device.entity], candidates);
    for (let attempt = 1; attempt <= SOURCE_ATTEMPTS; attempt++) {
      await platform.selectSource(this._hass, device, name);
      if (await this._waitFor(device.entity, (s) => sourceMatches(s, candidates, preferAppName), this._timing.sourceConfirm)) return true;
    }
    return false;
  }

  /**
   * Botón de streaming:
   *   1. Si la TV no está prendida, la enciende y espera a que HA lo confirme.
   *      (Si no se confirma, sigue igual: el estado de HA puede ir atrasado.)
   *   2. Con acción propia configurada → la ejecuta.
   *   3. En modo Roku, o si la app solo existe en el Roku (p. ej. Fubo) → abre la
   *      app en el Roku. En el segundo caso antes pone la TV en la entrada del Roku.
   *   4. Si no → select_source en la TV, con confirmación.
   */
  async _stream(index) {
    // `tv` se captura AHORA: si el usuario cambia de TV a mitad del flujo, este
    // flujo sigue trabajando con la TV original (closure).
    const tv = this._tv;
    const slot = tv.settings.streaming[index];
    if (!slot || this._loading.has(tv.entity)) return;   // ya hay un cambio de fuente en curso
    const { source } = slot;
    const companion = tv.companion;
    const viaRoku = !slot.action && !!source.rokuSource && !!companion?.entity && (this._ui.roku || !source.service);
    if (!slot.action && !viaRoku && !source.service) {
      this._toast(`${source.name} solo está disponible a través de un Roku.`);
      return;
    }

    this._haptic();
    this._setLoading(tv.entity, index);
    const tvDevice = { platform: tv.platform, entity: tv.entity };
    try {
      await this._ensureOn(tv);
      let ok = true;
      if (slot.action) {
        await executeAction(this._hass, slot.action, this._route(slot.action));
      } else if (viaRoku) {
        if (!this._ui.roku) await this._selectSourceConfirmed(tvDevice, SOURCES_BY_ID.get('roku').alternates);
        ok = await this._selectSourceConfirmed({ platform: companion.platform, entity: companion.entity }, [source.rokuSource]);
      } else {
        ok = await this._selectSourceConfirmed(tvDevice, source.alternates ?? [source.service]);
      }
      if (!ok) this._toast(`No se pudo confirmar el cambio a ${source.name}.`);
    } catch (err) {
      this._showError(err);
    } finally {
      this._setLoading(tv.entity, null);
    }
  }

  /** Selector TV | Roku del encabezado: a quién se controla. */
  _setRoku(on) {
    if (!this._tv.companion || this._ui.roku === on) return;
    this._haptic();
    this._stopHold();
    this._ui.roku = on;
    storage.set(this._rokuKey, on ? '1' : '0');
    this._schedule();
  }

  /** Igual que producción: tocar el modo activo lo desactiva (vuelve al pad default). */
  _toggleMode(id) {
    this._haptic();
    this._stopHold();
    this._ui.numpad = false;
    this._ui.mode = this._ui.mode === id ? null : id;
    this._schedule();
  }

  _togglePicker(force) {
    const refs = this._refs;
    if (!refs || this._model.tvs.length < 2) return;
    const open = force ?? refs.picker.hidden;
    if (open === !refs.picker.hidden) return;
    refs.picker.hidden = !open;
    refs.status.setAttribute('aria-expanded', String(open));
    // El listener en document existe SOLO mientras el popup está abierto
    // (la v3 agregaba uno nuevo en cada render y nunca los quitaba).
    if (open) document.addEventListener('pointerdown', this._onOutsidePointer, true);
    else document.removeEventListener('pointerdown', this._onOutsidePointer, true);
  }

  /*
   * Campo de clase con arrow function: `this` queda fijo a la tarjeta, y la
   * referencia es siempre la misma, así que removeEventListener la encuentra.
   *
   * composedPath() es la ruta real del evento, incluidos los nodos dentro del
   * shadowRoot. e.target no sirve aquí: desde document, el navegador "disfraza"
   * el target como la tarjeta completa (retargeting), y por eso la condición de
   * la v3 siempre daba lo mismo.
   */
  _onOutsidePointer = (e) => {
    const path = e.composedPath();
    if (!path.includes(this._refs?.picker) && !path.includes(this._refs?.status)) this._togglePicker(false);
  };

  _selectTv(index) {
    if (!(index >= 0 && index < this._model.tvs.length)) return;
    this._togglePicker(false);
    if (index === this._ui.tvIndex) return;
    this._haptic();
    this._stopHold();
    this._ui.tvIndex = index;
    this._ui.mode = null;
    this._ui.numpad = false;
    this._ui.roku = this._loadRokuMode();
    this._watched = [];
    storage.set(this._storageKey, index);
    this._schedule();
  }

  _toast(message) {
    const toast = this._refs?.toast;
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  }

  _showError(err) {
    console.warn(`[${CARD_TAG}]`, err);
    const message = err instanceof UnsupportedActionError ? err.message : `Error: ${err?.message ?? err}`;
    this._toast(message);
  }
}

/* ============================================================================
 * §7  EDITOR VISUAL
 * ----------------------------------------------------------------------------
 * Lo usan los programadores de ExtraIoT (los clientes no). Una sola regla:
 *
 *   LO QUE ESTÁ EN EL YAML SE MUESTRA. Lo que no, aparece como "+ Agregar…" o
 *   "Personalizar". Quitarlo lo borra del YAML. El editor nunca escribe valores
 *   por defecto, así el YAML queda mínimo y "activo" = "presente en la config".
 *
 * Igual que la tarjeta, se divide en dos:
 *   - Lógica PURA (se prueba en Node, sin DOM):
 *       buildEditorView(config, ctx)  QUÉ se muestra: una lista plana de "nodos"
 *                                     (títulos, formularios, botones, avisos).
 *       applyFormChange / applyOp     la config NUEVA tras un cambio. Nunca mutan
 *                                     la original (HA congela la config que pasa).
 *       serializeV4(raw)              YAML viejo → YAML v4 con el mismo resultado.
 *   - DOM delgado (TvControlCardEditor): pinta los nodos reutilizando cada
 *     elemento por su `key`. Un <ha-form> que ya existe solo recibe datos nuevos,
 *     no se vuelve a crear: por eso no se pierde el foco mientras se escribe
 *     (el editor de producción rehacía todo con innerHTML en cada tecla).
 * ========================================================================== */

/* ---------- utilidades de rutas (inmutables) ---------- */

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Lee obj[path[0]][path[1]]... ; undefined si algo del camino no existe. */
function getPath(obj, path) {
  let cur = obj;
  for (const k of path) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[k];
  }
  return cur;
}

/**
 * Devuelve una COPIA de `obj` con `value` en `path`; crea objetos/arrays
 * intermedios. Con value === undefined borra esa clave. Solo copia los niveles
 * que están en el camino; el resto se comparte (igual que hace Lit o Redux).
 */
function setPath(obj, path, value) {
  if (path.length === 0) return value;
  const [k, ...rest] = path;
  const base = Array.isArray(obj) ? [...obj] : isPlainObject(obj) ? { ...obj } : (typeof k === 'number' ? [] : {});
  const next = setPath(base[k], rest, value);
  if (next === undefined) {
    if (Array.isArray(base)) base.splice(k, 1);
    else delete base[k];
  } else {
    base[k] = next;
  }
  return base;
}

/** Borra `path` y, si su padre queda como objeto vacío, también lo quita (hacia arriba). */
function deletePath(obj, path) {
  let out = setPath(obj, path, undefined);
  for (let i = path.length - 1; i > 0; i--) {
    const parent = getPath(out, path.slice(0, i));
    if (!isPlainObject(parent) || Object.keys(parent).length > 0) break;
    out = setPath(out, path.slice(0, i), undefined);
  }
  return out;
}

/** Nombres de campo de un schema de ha-form (entrando a los grupos 'grid'/'expandable'). */
function fieldNames(schema) {
  return schema.flatMap((item) => (Array.isArray(item.schema) && !item.name ? fieldNames(item.schema) : [item.name]));
}

/**
 * Atajos de YAML → forma objeto, para poder editarlos por partes:
 *   buttons: { power: script.x }   → { power: { action: script.x } }
 *   custom_modes.custom1.up: mute  → up: { action: mute }
 * Así, al cambiar solo el ícono no se pierde la acción.
 */
function expandShortcuts(config) {
  if (!isPlainObject(config)) return {};
  const toEntry = (v) => (v !== null && v !== undefined && !isPlainObject(v) ? { action: v } : v);
  const fixPad = (p) => (isPlainObject(p)
    ? Object.fromEntries(Object.entries(p).map(([k, v]) => [k, DIRECTIONS.includes(k) ? toEntry(v) : v]))
    : p);
  const fixSettings = (s) => {
    const out = { ...s };
    if (isPlainObject(s.buttons)) out.buttons = Object.fromEntries(Object.entries(s.buttons).map(([k, v]) => [k, toEntry(v)]));
    if (isPlainObject(s.custom_modes)) out.custom_modes = Object.fromEntries(Object.entries(s.custom_modes).map(([k, v]) => [k, fixPad(v)]));
    if (isPlainObject(s.default_pad)) out.default_pad = fixPad(s.default_pad);
    return out;
  };
  const out = fixSettings(config);
  if (Array.isArray(out.tvs)) {
    out.tvs = out.tvs.map((tv) => (isPlainObject(tv) && isPlainObject(tv.overrides) ? { ...tv, overrides: fixSettings(tv.overrides) } : tv));
  }
  return out;
}

/* ---------- catálogos para los selectores ---------- */

const ACTION_UI_TYPES = {
  default: 'Predeterminada',
  none: 'Ninguna',
  key: 'Tecla',
  source: 'Fuente (select_source)',
  script: 'Script o escena',
  service: 'Servicio de HA',
  command: 'Command LG (webOS)',
  button: 'Botón crudo (código)',
  sequence: 'Secuencia de pasos (p. ej. un PIN)',
  numpad: 'Abrir teclado numérico',
  platform: 'Distinta por marca',
};
const ALL_ACTION_TYPES = ['key', 'source', 'script', 'service', 'command', 'button', 'sequence', 'numpad', 'platform'];
const STEP_ACTION_TYPES = ['key', 'button', 'command', 'source', 'script', 'service'];
const BRAND_ACTION_TYPES = ['key', 'source', 'script', 'service', 'command', 'button', 'sequence'];
const BRANDS = [['lg', 'LG'], ['samsung', 'Samsung'], ['roku', 'Roku'], ['default', 'Otras marcas']];

const PLATFORM_NAMES = { lg: 'LG', samsung: 'Samsung', roku: 'Roku' };
/** Teclas para el selector: "Subir volumen (vol_up) · LG, Samsung, Roku". */
const KEY_OPTIONS = Object.entries(KEYS).map(([id, def]) => {
  const brands = ['lg', 'samsung', 'roku'].filter((p) => def[p]).map((p) => PLATFORM_NAMES[p]);
  return { value: id, label: `${def.label} (${id}) · ${brands.join(', ') || 'ninguna'}` };
});

/**
 * Commands de webOS más útiles (webostv.command). Los URIs vienen de aiowebostv y
 * de la documentación de HA; los que se marcan con payload necesitan datos.
 * POR VERIFICAR en una TV real antes de usarlos con clientes.
 */
const LG_COMMANDS = [
  { value: 'system.launcher/launch', label: 'Abrir app · payload: { id: "netflix" }' },
  { value: 'tv/switchInput', label: 'Cambiar entrada · payload: { inputId: "HDMI_1" }' },
  { value: 'com.webos.service.tvpower/power/turnOffScreen', label: 'Apagar la pantalla (el audio sigue)' },
  { value: 'com.webos.service.tvpower/power/turnOnScreen', label: 'Encender la pantalla' },
  { value: 'system.notifications/createToast', label: 'Mostrar un mensaje · payload: { message: "Hola" }' },
  { value: 'media.controls/play', label: 'Play' },
  { value: 'media.controls/pause', label: 'Pausa' },
  { value: 'media.controls/stop', label: 'Stop' },
  { value: 'media.controls/rewind', label: 'Rebobinar' },
  { value: 'media.controls/fastForward', label: 'Avance rápido' },
  { value: 'com.webos.service.ime/insertText', label: 'Escribir texto · payload: { text: "abc", replace: 0 }' },
  { value: 'system.launcher/open', label: 'Abrir URL en el navegador · payload: { target: "https://…" }' },
];

const SOURCE_OPTIONS = SOURCES.map((s) => ({ value: s.id, label: s.service ? s.name : `${s.name} (solo por Roku)` }));
const STYLE_OPTIONS = [
  { value: 'relieve', label: 'Relieve (predeterminado)' },
  { value: 'halo', label: 'Halo' },
  { value: 'cristal', label: 'Cristal' },
];
const THEME_OPTIONS = [
  { value: 'dark', label: 'Oscuro (predeterminado)' },
  { value: 'light', label: 'Claro' },
  { value: 'auto', label: 'Automático (sigue a HA)' },
];
const TV_PLATFORM_OPTIONS = [{ value: 'lg', label: 'LG (webOS)' }, { value: 'samsung', label: 'Samsung' }];
const DIRECTION_LABELS = { up: 'Arriba', left: 'Izquierda', right: 'Derecha', down: 'Abajo' };
const BUTTON_LABELS = {
  top_left: 'Botón del encabezado (izquierda)',
  power: 'Encender / apagar',
  center: 'Centro del touchpad (OK)',
  back: 'Atrás',
  home: 'Inicio',
  exit: 'Salir',
  menu: 'Menú',
};
const DEFAULT_MODES = ['menu', 'busqueda', 'audio'];

/* ---------- acciones: config ↔ formulario ---------- */

/**
 * Acción tal como está en el YAML → datos del formulario { type, ...campos }.
 * Lee la forma CRUDA (no parseAction) para no perder lo que está a medio
 * escribir: { type: 'key', key: '' } sigue siendo "Tecla" aunque aún no sirva.
 */
function actionToForm(raw) {
  if (raw === undefined) return { type: 'default' };
  if (raw === null) return { type: 'none' };
  if (Array.isArray(raw)) return { type: 'sequence', delay: 400 };
  const a = isPlainObject(raw) ? raw : parseAction(raw);
  if (!isPlainObject(a)) return { type: 'none' };
  switch (a.type) {
    case 'key': return { type: 'key', key: a.key ?? '' };
    case 'source': return { type: 'source', source: a.source ?? '' };
    case 'service': {
      const data = isPlainObject(a.data) ? a.data : {};
      const entity = data.entity_id;
      const onlyEntity = Object.keys(data).every((k) => k === 'entity_id') && (entity === undefined || typeof entity === 'string');
      if ((a.service === 'script.turn_on' || a.service === 'scene.turn_on') && onlyEntity) return { type: 'script', entity: entity ?? '' };
      return { type: 'service', service: a.service ?? '', data };
    }
    case 'command': return { type: 'command', command: a.command ?? '', payload: isPlainObject(a.payload) ? a.payload : {} };
    case 'button': return { type: 'button', button: a.button ?? '' };
    case 'sequence': return { type: 'sequence', delay: a.delay ?? 400 };
    case 'numpad':
    case 'platform': return { type: a.type };
    default: return { type: 'none' };
  }
}

/**
 * Datos del formulario → acción para el YAML (la forma más legible que
 * parseAction entiende). undefined = quitar la clave (usar la predeterminada).
 * Si cambió el tipo, los campos del tipo anterior se descartan.
 */
function formToAction(data, prevRaw) {
  const prev = actionToForm(prevRaw);
  const changed = data.type !== prev.type;
  const v = changed ? {} : data;
  switch (data.type) {
    case 'default': return undefined;
    case 'none': return null;
    case 'key': return v.key ? v.key : { type: 'key', key: '' };
    case 'source': return { type: 'source', source: v.source ?? '' };
    case 'script': return v.entity ? v.entity : { type: 'service', service: 'script.turn_on', data: {} };
    case 'service': return { type: 'service', service: v.service ?? '', data: isPlainObject(v.data) ? v.data : {} };
    case 'command': {
      const out = { type: 'command', command: v.command ?? '' };
      if (isPlainObject(v.payload) && Object.keys(v.payload).length) out.payload = v.payload;
      return out;
    }
    case 'button': return { type: 'button', button: v.button ?? '' };
    case 'sequence': {
      let steps = [];
      if (Array.isArray(prevRaw)) steps = prevRaw;
      else if (isPlainObject(prevRaw) && prevRaw.type === 'sequence' && Array.isArray(prevRaw.steps)) steps = prevRaw.steps;
      const ms = Number(v.delay);
      return { type: 'sequence', steps, delay: v.delay !== undefined && v.delay !== '' && Number.isFinite(ms) ? Math.max(0, ms) : 400 };
    }
    case 'numpad': return 'numpad';
    case 'platform': return { type: 'platform', by: !changed && isPlainObject(prevRaw?.by) ? prevRaw.by : {} };
    default: return undefined;
  }
}

/** Schema del formulario de una acción: el tipo y SOLO los campos de ese tipo. */
function actionSchema(form, { allowDefault = false, allowNone = true, types = ALL_ACTION_TYPES, defaultLabel } = {}) {
  const options = [];
  if (allowDefault) options.push({ value: 'default', label: defaultLabel ?? ACTION_UI_TYPES.default });
  if (allowNone) options.push({ value: 'none', label: ACTION_UI_TYPES.none });
  for (const t of types) options.push({ value: t, label: ACTION_UI_TYPES[t] });
  const schema = [{ name: 'type', label: 'Acción', selector: { select: { mode: 'dropdown', options } } }];
  switch (form.type) {
    case 'key':
      schema.push({ name: 'key', label: 'Tecla', selector: { select: { mode: 'dropdown', options: KEY_OPTIONS } } });
      break;
    case 'source':
      schema.push({ name: 'source', label: 'Fuente', helper: 'Como aparece en la lista de fuentes de la TV, p. ej. "HDMI 1".', selector: { text: {} } });
      break;
    case 'script':
      schema.push({ name: 'entity', label: 'Script o escena', selector: { entity: { filter: { domain: ['script', 'scene'] } } } });
      break;
    case 'service':
      schema.push(
        { name: 'service', label: 'Servicio', helper: 'dominio.servicio, p. ej. light.turn_on', selector: { text: {} } },
        { name: 'data', label: 'Datos del servicio', selector: { object: {} } },
      );
      break;
    case 'command':
      schema.push(
        { name: 'command', label: 'Command', helper: 'Elige uno de la lista o escribe otro URI (sin ssap://).', selector: { select: { mode: 'dropdown', custom_value: true, options: LG_COMMANDS } } },
        { name: 'payload', label: 'Payload', selector: { object: {} } },
      );
      break;
    case 'button':
      schema.push({ name: 'button', label: 'Código', helper: 'Se manda tal cual: KEY_HDMI (Samsung), INPUT_HUB (LG)…', selector: { text: {} } });
      break;
    case 'sequence':
      schema.push({ name: 'delay', label: 'Pausa entre pasos (ms)', selector: { number: { min: 0, max: 5000, step: 50, mode: 'box' } } });
      break;
  }
  return schema;
}

/* ---------- vista: config → nodos ---------- */

/** Botones ↑ ↓ ✕ de un elemento de una lista. */
function listActions(arrayPath, index, length, { canRemove = true } = {}) {
  return [
    { label: '↑', title: 'Subir', op: { op: 'move', path: arrayPath, index, delta: -1 }, disabled: index === 0 },
    { label: '↓', title: 'Bajar', op: { op: 'move', path: arrayPath, index, delta: 1 }, disabled: index === length - 1 },
    { label: '✕', title: 'Quitar', op: { op: 'remove', path: arrayPath, index }, disabled: !canRemove },
  ];
}

/** Nodos del editor de UNA acción (se llama a sí misma para secuencias y "por marca"). */
function actionNodes(config, path, key, depth, opts = {}) {
  const raw = getPath(config, path);
  const form = actionToForm(raw);
  if (!opts.allowDefault && form.type === 'default') form.type = 'none';
  const nodes = [{ kind: 'form', key, depth, path, codec: 'action', schema: actionSchema(form, opts), data: form }];

  if (form.type === 'sequence') {
    const stepsPath = Array.isArray(raw) ? path : [...path, 'steps'];
    const steps = getPath(config, stepsPath) ?? [];
    steps.forEach((_, j) => {
      nodes.push({ kind: 'heading', key: `${key}.s${j}`, depth: depth + 1, level: 3, text: `Paso ${j + 1}`, actions: listActions(stepsPath, j, steps.length) });
      nodes.push(...actionNodes(config, [...stepsPath, j], `${key}.s${j}.a`, depth + 1, { types: STEP_ACTION_TYPES, allowNone: false }));
    });
    nodes.push({ kind: 'buttons', key: `${key}.addstep`, depth: depth + 1, items: [{ label: '+ Agregar paso', op: { op: 'push', path: stepsPath, value: { type: 'key', key: '' } } }] });
  }

  if (form.type === 'platform') {
    const by = isPlainObject(raw?.by) ? raw.by : {};
    for (const [brand, label] of BRANDS) {
      if (!(brand in by)) continue;
      nodes.push({ kind: 'heading', key: `${key}.b.${brand}`, depth: depth + 1, level: 3, text: label,
        actions: [{ label: '✕', title: 'Quitar', op: { op: 'delete', path: [...path, 'by', brand] } }] });
      nodes.push(...actionNodes(config, [...path, 'by', brand], `${key}.b.${brand}.a`, depth + 1, { types: BRAND_ACTION_TYPES }));
    }
    const missing = BRANDS.filter(([brand]) => !(brand in by));
    if (missing.length) {
      nodes.push({ kind: 'buttons', key: `${key}.addbrand`, depth: depth + 1,
        items: missing.map(([brand, label]) => ({ label: `+ ${label}`, op: { op: 'set', path: [...path, 'by', brand], value: { type: 'key', key: '' } } })) });
    }
  }
  return nodes;
}

/** Las 4 direcciones de un pad: ícono + acción de cada una. */
function padNodes(config, basePath, key, depth, { allowDefault }) {
  const nodes = [];
  for (const dir of DIRECTIONS) {
    const entry = getPath(config, [...basePath, dir]);
    const defaultLabel = allowDefault ? `Predeterminada (${KEYS[DEFAULT_PAD[dir].action.key].label})` : undefined;
    nodes.push({ kind: 'heading', key: `${key}.${dir}`, depth, level: 3, text: DIRECTION_LABELS[dir] });
    nodes.push({ kind: 'form', key: `${key}.${dir}.i`, depth, path: [...basePath, dir],
      schema: [{ name: 'icon', label: 'Ícono', selector: { icon: {} } }], data: { icon: entry?.icon ?? '' } });
    nodes.push(...actionNodes(config, [...basePath, dir, 'action'], `${key}.${dir}.a`, depth, { allowDefault, defaultLabel }));
  }
  return nodes;
}

/** Descripción corta de la acción por defecto de un botón ("tecla Atrás"). */
function describeDefaultButton(id) {
  const action = parseAction(DEFAULT_BUTTONS[id].action);
  if (id === 'power') return 'encender/apagar la TV';
  return action?.type === 'key' ? `tecla ${KEYS[action.key].label}` : 'sin acción';
}

/**
 * Secciones que pueden ser globales o propias de una TV (overrides): modos,
 * modos personalizados, touchpad sin modo, streaming y botones.
 *
 * Ojo con los overrides: se aplican con un merge SUPERFICIAL
 * (`{ ...global, ...overrides }`), así que `overrides.buttons` reemplaza TODOS
 * los botones globales, no solo los que cambian. Por eso, al activar una
 * categoría propia se copia la global como punto de partida.
 */
function settingsNodes(config, base, kp, depth, ctx, override) {
  const nodes = [];
  const here = getPath(config, base) ?? {};
  const present = (k) => here[k] !== undefined;

  // --- Modos ---
  const effectiveModes = (present('modes') ? here.modes : config.modes) ?? DEFAULT_MODES;
  if (!override || present('modes')) {
    const customDefs = (override && here.custom_modes) || config.custom_modes || {};
    const modeOptions = [
      ...Object.entries(FIXED_MODES).map(([id, def]) => ({ value: id, label: id === 'fuentes' || id === 'info' ? `${def.label} (experimental)` : def.label })),
      ...CUSTOM_MODE_IDS.map((id) => ({ value: id, label: customDefs[id]?.label ? `${customDefs[id].label} (${id})` : `Personalizado ${id.slice(-1)} (${id})` })),
    ];
    const modes = present('modes') ? here.modes : (config.modes ?? DEFAULT_MODES);
    nodes.push({ kind: 'heading', key: `${kp}modes`, depth, level: override ? 2 : 1, text: override ? 'Modos propios' : 'Modos del touchpad',
      actions: override ? [{ label: '✕', title: 'Usar los modos globales', op: { op: 'delete', path: [...base, 'modes'] } }] : undefined });
    nodes.push({ kind: 'form', key: `${kp}modes.f`, depth, path: base, codec: 'modes',
      schema: [{ name: '', type: 'grid', schema: ['m1', 'm2', 'm3'].map((name, i) => ({ name, label: `Modo ${i + 1}`, required: true, selector: { select: { mode: 'dropdown', options: modeOptions } } })) }],
      data: { m1: modes[0], m2: modes[1], m3: modes[2] } });
  } else {
    nodes.push({ kind: 'buttons', key: `${kp}modes.add`, depth, items: [{ label: '+ Modos propios', op: { op: 'set', path: [...base, 'modes'], value: [...(config.modes ?? DEFAULT_MODES)] } }] });
  }

  // --- Modos personalizados: solo los que están asignados a un modo ---
  const usedCustom = CUSTOM_MODE_IDS.filter((id) => effectiveModes.includes(id));
  if (usedCustom.length) {
    const cmBase = override ? [...base, 'custom_modes'] : ['custom_modes'];
    if (override && !present('custom_modes')) {
      nodes.push({ kind: 'note', key: `${kp}cm.note`, depth, text: `${usedCustom.join(', ')}: usa la definición global.` });
      nodes.push({ kind: 'buttons', key: `${kp}cm.add`, depth, items: [{ label: '+ Definición propia de los modos personalizados', op: { op: 'set', path: cmBase, value: clone(config.custom_modes ?? {}) } }] });
    } else {
      if (override) {
        nodes.push({ kind: 'heading', key: `${kp}cm`, depth, level: 2, text: 'Modos personalizados propios',
          actions: [{ label: '✕', title: 'Usar la definición global', op: { op: 'delete', path: cmBase } }] });
      }
      for (const id of usedCustom) {
        const n = id.slice(-1);
        const def = getPath(config, [...cmBase, id]) ?? {};
        nodes.push({ kind: 'heading', key: `${kp}cm.${id}`, depth, level: 2, text: `Modo ${def.label || `Personalizado ${n}`} (${id})` });
        nodes.push({ kind: 'form', key: `${kp}cm.${id}.f`, depth, path: [...cmBase, id],
          schema: [{ name: '', type: 'grid', schema: [
            { name: 'label', label: 'Nombre', selector: { text: {} } },
            { name: 'icon', label: 'Ícono del modo', selector: { icon: {} } },
          ] }],
          data: { label: def.label ?? '', icon: def.icon ?? '' } });
        nodes.push(...padNodes(config, [...cmBase, id], `${kp}cm.${id}.pad`, depth + 1, { allowDefault: false }));
      }
    }
  }

  // --- Touchpad sin modo (default_pad) ---
  if (present('default_pad')) {
    nodes.push({ kind: 'heading', key: `${kp}dp`, depth, level: override ? 2 : 1, text: 'Touchpad sin modo',
      actions: [{ label: '✕', title: 'Volver al predeterminado (flechas)', op: { op: 'delete', path: [...base, 'default_pad'] } }] });
    nodes.push(...padNodes(config, [...base, 'default_pad'], `${kp}dp.pad`, depth + 1, { allowDefault: true }));
  } else {
    nodes.push({ kind: 'buttons', key: `${kp}dp.add`, depth,
      items: [{ label: '+ Personalizar touchpad sin modo', op: { op: 'set', path: [...base, 'default_pad'], value: override ? clone(config.default_pad ?? {}) : {} } }] });
  }

  // --- Streaming ---
  if (!override || present('streaming')) {
    nodes.push({ kind: 'heading', key: `${kp}st`, depth, level: override ? 2 : 1, text: override ? 'Streaming propio' : 'Botones de streaming',
      actions: override ? [{ label: '✕', title: 'Usar el streaming global', op: { op: 'delete', path: [...base, 'streaming'] } }] : undefined });
    const streamingPath = [...base, 'streaming'];
    const slots = getPath(config, streamingPath) ?? [];
    const defaults = DEFAULT_STREAMING.map((source) => ({ source }));
    DEFAULT_STREAMING.forEach((defaultId, i) => {
      const entry = isPlainObject(slots[i]) ? slots[i] : {};
      const slotKey = `${kp}st.${i}`;
      const custom = ['icon', 'action', 'accent'].some((k) => entry[k] !== undefined) || ctx.expanded?.has(slotKey);
      const schema = [{ name: 'source', label: `Botón ${i + 1}`, selector: { select: { mode: 'dropdown', options: SOURCE_OPTIONS } } }];
      if (custom) {
        schema.push(
          { name: 'icon', label: 'Ícono', selector: { icon: {} } },
          { name: 'accent', label: 'Color', helper: '#e50914 o 229, 9, 20. Vacío = el color de la app.', selector: { text: {} } },
        );
      }
      nodes.push({ kind: 'form', key: `${slotKey}.f`, depth, path: [...streamingPath, i], init: { path: streamingPath, value: defaults }, schema,
        data: { source: entry.source ?? defaultId, icon: entry.icon ?? '', accent: entry.accent ?? '' } });
      if (custom) {
        nodes.push(...actionNodes(config, [...streamingPath, i, 'action'], `${slotKey}.a`, depth + 1,
          { allowDefault: true, defaultLabel: 'Predeterminada (abrir la fuente)', types: ALL_ACTION_TYPES.filter((t) => t !== 'numpad') }));
        nodes.push({ kind: 'buttons', key: `${slotKey}.b`, depth: depth + 1,
          items: [{ label: 'Quitar personalización', op: { op: 'unset', path: [...streamingPath, i], keys: ['icon', 'action', 'accent'], collapse: slotKey } }] });
      } else {
        nodes.push({ kind: 'buttons', key: `${slotKey}.b`, depth: depth + 1, items: [{ label: 'Personalizar ícono, color o acción', op: { op: 'expand', key: slotKey } }] });
      }
    });
  } else {
    nodes.push({ kind: 'buttons', key: `${kp}st.add`, depth,
      items: [{ label: '+ Streaming propio', op: { op: 'set', path: [...base, 'streaming'], value: clone(config.streaming ?? DEFAULT_STREAMING.map((source) => ({ source }))) } }] });
  }

  // --- Botones ---
  if (!override || present('buttons')) {
    nodes.push({ kind: 'heading', key: `${kp}bt`, depth, level: override ? 2 : 1, text: override ? 'Botones propios' : 'Botones',
      actions: override ? [{ label: '✕', title: 'Usar los botones globales', op: { op: 'delete', path: [...base, 'buttons'] } }] : undefined });
    const buttons = getPath(config, [...base, 'buttons']) ?? {};
    for (const id of Object.keys(DEFAULT_BUTTONS)) {
      const bKey = `${kp}bt.${id}`;
      const entry = buttons[id];
      if (entry === undefined) {
        nodes.push({ kind: 'heading', key: bKey, depth, level: 'item', text: `${BUTTON_LABELS[id]}: ${describeDefaultButton(id)}`,
          actions: [{ label: 'Personalizar', op: { op: 'set', path: [...base, 'buttons', id], value: {} } }] });
        continue;
      }
      nodes.push({ kind: 'heading', key: bKey, depth, level: 2, text: BUTTON_LABELS[id],
        actions: [{ label: 'Restablecer', title: 'Volver al predeterminado', op: { op: 'delete', path: [...base, 'buttons', id] } }] });
      if (id === 'top_left') nodes.push({ kind: 'note', key: `${bKey}.n`, depth, text: 'Si solo manda Salir se oculta (ya está abajo). Con Roku, su lugar lo ocupa el selector TV | Roku.' });
      nodes.push({ kind: 'form', key: `${bKey}.i`, depth, path: [...base, 'buttons', id],
        schema: [{ name: 'icon', label: 'Ícono', selector: { icon: {} } }], data: { icon: entry?.icon ?? '' } });
      nodes.push(...actionNodes(config, [...base, 'buttons', id, 'action'], `${bKey}.a`, depth,
        { allowDefault: true, defaultLabel: `Predeterminada (${describeDefaultButton(id)})` }));
    }
  } else {
    nodes.push({ kind: 'buttons', key: `${kp}bt.add`, depth,
      items: [{ label: '+ Botones propios', op: { op: 'set', path: [...base, 'buttons'], value: clone(config.buttons ?? {}) } }] });
  }
  return nodes;
}

/**
 * QUÉ muestra el editor para esta config. Pura: misma entrada → mismos nodos.
 *
 * @param {object} rawConfig  la config tal como la tiene HA
 * @param {{ model?: object, error?: string, expanded?: Set<string>, mediaPlayers?: string[] }} ctx
 * @returns {Array<object>} nodos: { kind: 'alert'|'heading'|'note'|'buttons'|'form', key, ... }
 */
function buildEditorView(rawConfig, ctx = {}) {
  const config = expandShortcuts(rawConfig);
  const nodes = [];
  if (ctx.error) nodes.push({ kind: 'alert', key: 'error', level: 'error', text: ctx.error });
  if (ctx.model?.format === 'legacy') {
    nodes.push({ kind: 'alert', key: 'legacy', level: 'warning',
      text: 'Esta tarjeta usa el formato viejo (v3). El editor visual solo edita el formato v4. Convertirla reescribe el YAML en el formato nuevo con la misma configuración; la tarjeta se comporta igual.',
      actions: [{ label: 'Convertir a formato v4', op: { op: 'convert' } }] });
    return nodes;
  }
  (ctx.model?.warnings ?? []).forEach((text, i) => nodes.push({ kind: 'alert', key: `warn${i}`, level: 'info', text }));

  // --- General ---
  nodes.push({ kind: 'heading', key: 'general', depth: 0, level: 1, text: 'General' });
  nodes.push({ kind: 'form', key: 'general.f', depth: 0, path: [], defaults: { style: 'relieve', theme: 'dark' },
    schema: [
      { name: 'card_id', label: 'ID de la tarjeta', helper: 'Para recordar la TV elegida por cada usuario. Único por tarjeta.', selector: { text: {} } },
      { name: '', type: 'grid', schema: [
        { name: 'style', label: 'Estilo', selector: { select: { mode: 'dropdown', options: STYLE_OPTIONS } } },
        { name: 'theme', label: 'Tema', selector: { select: { mode: 'dropdown', options: THEME_OPTIONS } } },
      ] },
    ],
    data: { card_id: config.card_id ?? '', style: config.style ?? 'relieve', theme: config.theme ?? 'dark' } });
  if (config.control_mode_entity !== undefined || ctx.expanded?.has('cme')) {
    nodes.push({ kind: 'heading', key: 'cme', depth: 0, level: 3, text: 'Entidad de modo',
      actions: [{ label: '✕', title: 'Quitar', op: { op: 'delete', path: ['control_mode_entity'], collapse: 'cme' } }] });
    nodes.push({ kind: 'form', key: 'cme.f', depth: 0, path: [],
      schema: [{ name: 'control_mode_entity', label: 'input_select', helper: 'Sincroniza el modo activo con un input_select (sus opciones: menu, audio, custom1…).', selector: { entity: { filter: { domain: 'input_select' } } } }],
      data: { control_mode_entity: config.control_mode_entity ?? '' } });
  } else {
    nodes.push({ kind: 'buttons', key: 'cme.add', depth: 0, items: [{ label: '+ Entidad de modo (input_select)', op: { op: 'expand', key: 'cme' } }] });
  }

  // --- TVs ---
  nodes.push({ kind: 'heading', key: 'tvs', depth: 0, level: 1, text: 'Televisores' });
  const tvs = Array.isArray(config.tvs) ? config.tvs : [];
  tvs.forEach((tv, i) => {
    const t = isPlainObject(tv) ? tv : {};
    const kp = `tv${i}.`;
    nodes.push({ kind: 'heading', key: `${kp}h`, depth: 0, level: 2, text: `TV ${i + 1}${t.name ? ` · ${t.name}` : ''}`,
      actions: listActions(['tvs'], i, tvs.length, { canRemove: tvs.length > 1 }) });
    // El selector de entidad de HA dibuja su etiqueta ARRIBA de la caja, y los campos
    // de texto/select la llevan DENTRO: si comparten fila del grid quedan a distinta
    // altura. Por eso la entidad va sola, a todo el ancho, y Nombre+Marca comparten fila.
    nodes.push({ kind: 'form', key: `${kp}f`, depth: 1, path: ['tvs', i],
      schema: [
        { name: '', type: 'grid', schema: [
          { name: 'name', label: 'Nombre', selector: { text: {} } },
          { name: 'platform', label: 'Marca', selector: { select: { mode: 'dropdown', options: TV_PLATFORM_OPTIONS } } },
        ] },
        { name: 'entity', label: 'Entidad de la TV', required: true, selector: { entity: { filter: { domain: 'media_player' } } } },
      ],
      data: { name: t.name ?? '', entity: t.entity ?? '', platform: t.platform ?? normalizePlatform(t.type) } });

    // Lo que falta activar va justo debajo de los datos de la TV (no al final del bloque).
    const adds = [];
    if (t.companion === undefined) adds.push({ label: '+ Roku conectado', op: { op: 'set', path: ['tvs', i, 'companion'], value: {} } });
    if (t.overrides === undefined) adds.push({ label: '+ Configuración propia de esta TV', op: { op: 'set', path: ['tvs', i, 'overrides'], value: {} } });
    if (adds.length) nodes.push({ kind: 'buttons', key: `${kp}add`, depth: 1, items: adds });
    if (t.companion !== undefined) {
      nodes.push({ kind: 'heading', key: `${kp}rk`, depth: 1, level: 3, text: 'Roku conectado',
        actions: [{ label: '✕', title: 'Quitar el Roku', op: { op: 'delete', path: ['tvs', i, 'companion'] } }] });
      const c = isPlainObject(t.companion) ? t.companion : {};
      nodes.push({ kind: 'form', key: `${kp}rk.f`, depth: 1, path: ['tvs', i, 'companion'],
        schema: [{ name: '', type: 'grid', schema: [
          { name: 'media_entity', label: 'media_player del Roku', selector: { entity: { filter: { domain: 'media_player' } } } },
          { name: 'remote_entity', label: 'remote del Roku', selector: { entity: { filter: { domain: 'remote' } } } },
        ] }],
        data: { media_entity: c.media_entity ?? c.entity ?? '', remote_entity: c.remote_entity ?? c.remote ?? '' } });
    }
    if (t.overrides !== undefined) {
      nodes.push({ kind: 'heading', key: `${kp}ov`, depth: 1, level: 2, text: 'Configuración propia de esta TV',
        actions: [{ label: '✕', title: 'Quitar: usar la configuración global', op: { op: 'delete', path: ['tvs', i, 'overrides'] } }] });
      nodes.push({ kind: 'note', key: `${kp}ov.n`, depth: 1, text: 'Lo que agregues aquí reemplaza a la configuración global solo para esta TV.' });
      nodes.push(...settingsNodes(config, ['tvs', i, 'overrides'], `${kp}ov.`, 1, ctx, true));
    }
  });
  const used = new Set(tvs.map((tv) => tv?.entity));
  const suggestion = (ctx.mediaPlayers ?? []).find((id) => !used.has(id)) ?? '';
  nodes.push({ kind: 'buttons', key: 'tvs.add', depth: 0,
    items: [{ label: '+ Agregar TV', op: { op: 'push', path: ['tvs'], value: { name: '', entity: suggestion, platform: 'lg' } } }] });

  nodes.push(...settingsNodes(config, [], '', 0, ctx, false));
  return nodes;
}

/* ---------- cambios: nodo + datos → config nueva ---------- */

/** Un formulario cambió: devuelve la config nueva (no toca la original). */
function applyFormChange(rawConfig, node, data) {
  let config = expandShortcuts(rawConfig);
  // Algunos formularios necesitan que exista su contenedor completo (p. ej. los 4
  // botones de streaming): se crea con los valores por defecto antes de escribir.
  if (node.init && getPath(config, node.init.path) === undefined) config = setPath(config, node.init.path, clone(node.init.value));

  switch (node.codec) {
    case 'action':
      return setPath(config, node.path, formToAction(data, getPath(config, node.path)));
    case 'modes': {
      const modes = ['m1', 'm2', 'm3'].map((k) => data[k] ?? node.data[k]).filter(Boolean);
      return setPath(config, [...node.path, 'modes'], modes);
    }
    default: {
      let out = config;
      for (const name of fieldNames(node.schema)) {
        const value = data[name];
        if (sameJson(value, node.data[name])) continue;   // solo lo que cambió
        const empty = value === undefined || value === null || value === '' || node.defaults?.[name] === value;
        out = setPath(out, [...node.path, name], empty ? undefined : value);
      }
      return out;
    }
  }
}

/** Un botón del editor (agregar, quitar, mover, convertir…): devuelve la config nueva. */
function applyOp(rawConfig, op) {
  const config = expandShortcuts(rawConfig);
  switch (op.op) {
    case 'set': return setPath(config, op.path, clone(op.value));
    case 'delete': return deletePath(config, op.path);
    case 'unset':
      if (getPath(config, op.path) === undefined) return config;
      return op.keys.reduce((c, k) => setPath(c, [...op.path, k], undefined), config);
    case 'push': {
      const arr = getPath(config, op.path);
      return setPath(config, op.path, [...(Array.isArray(arr) ? arr : []), clone(op.value)]);
    }
    case 'remove': {
      const arr = [...(getPath(config, op.path) ?? [])];
      arr.splice(op.index, 1);
      return setPath(config, op.path, arr);
    }
    case 'move': {
      const arr = [...(getPath(config, op.path) ?? [])];
      const j = op.index + op.delta;
      if (j < 0 || j >= arr.length) return config;
      [arr[op.index], arr[j]] = [arr[j], arr[op.index]];
      return setPath(config, op.path, arr);
    }
    case 'convert': return serializeV4(rawConfig);
    default: return config;
  }
}

/* ---------- convertir YAML viejo → v4 ---------- */

/** Acción normalizada → la forma más corta que parseAction vuelve a entender igual. */
function serializeAction(a) {
  if (!a) return null;
  switch (a.type) {
    case 'key': return a.key;
    case 'numpad': return 'numpad';
    case 'service': {
      const keys = Object.keys(a.data ?? {});
      const domain = a.service.split('.')[0];
      const entity = a.data?.entity_id;
      if ((a.service === 'script.turn_on' || a.service === 'scene.turn_on') && keys.length === 1 && keys[0] === 'entity_id'
        && typeof entity === 'string' && new RegExp(`^${domain}\\.[a-z0-9_]+$`, 'i').test(entity)) return entity;
      return { type: 'service', service: a.service, data: clone(a.data) };
    }
    case 'sequence': return { type: 'sequence', steps: a.steps.map(serializeAction), delay: a.delay };
    case 'platform': return { type: 'platform', by: Object.fromEntries(Object.entries(a.by).map(([k, v]) => [k, serializeAction(v)])) };
    default: return clone(a);   // button, command, source
  }
}

/** Pad → YAML, escribiendo solo lo que difiere de `fallback` (lo que readPad rellena solo). */
function serializePad(padObj, fallback) {
  const out = {};
  for (const dir of DIRECTIONS) {
    const entry = {};
    const { icon, action } = padObj[dir];
    if (icon !== (fallback?.[dir]?.icon ?? null) && icon !== null) entry.icon = icon;
    if (!sameJson(action, fallback?.[dir]?.action ?? null)) entry.action = serializeAction(action);
    if (Object.keys(entry).length) out[dir] = entry;
  }
  return out;
}

/** Settings normalizados → las 5 categorías en YAML v4, completas (sirven para comparar TVs). */
function serializeSettings(s) {
  const customModes = {};
  for (const id of s.modes) {
    if (!CUSTOM_MODE_IDS.includes(id)) continue;
    const def = s.modeDefs[id];
    const n = id.slice(-1);
    const entry = {};
    if (def.label !== `Personalizado ${n}`) entry.label = def.label;
    if (def.icon !== `mdi:numeric-${n}-circle-outline`) entry.icon = def.icon;
    // Siempre se escribe (aunque quede {}): sin la clave, normalizeConfig buscaría
    // las claves viejas customN_* y pondría 'mdi:help' en cada dirección.
    customModes[id] = { ...entry, ...serializePad(def.pad, pad()) };
  }
  const buttons = {};
  for (const [id, def] of Object.entries(DEFAULT_BUTTONS)) {
    const b = s.buttons[id];
    const entry = {};
    if (b.icon !== (def.icon ?? null) && b.icon !== null) entry.icon = b.icon;
    if (!sameJson(b.action, parseAction(def.action))) entry.action = serializeAction(b.action);
    if (Object.keys(entry).length) buttons[id] = entry;
  }
  return {
    modes: [...s.modes],
    custom_modes: customModes,
    default_pad: serializePad(s.defaultPad, DEFAULT_PAD),
    streaming: s.streaming.map((slot) => {
      const entry = { source: slot.source.id };
      if (slot.icon !== slot.source.icon) entry.icon = slot.icon;
      if (slot.action) entry.action = serializeAction(slot.action);
      if (slot.accent) entry.accent = slot.accent;
      return entry;
    }),
    buttons,
  };
}

/**
 * Cualquier YAML que la tarjeta entiende (v3 del repo, variante multientidad, v4)
 * → YAML v4 mínimo con EXACTAMENTE el mismo resultado. Lo garantiza un test de
 * ida y vuelta: normalizeConfig(serializeV4(x)) equivale a normalizeConfig(x).
 */
function serializeV4(raw) {
  const model = normalizeConfig(raw);
  const global = serializeSettings(resolveSettings(raw, []));
  const isDefaultStreaming = global.streaming.every((e, i) => sameJson(e, { source: DEFAULT_STREAMING[i] }));

  const out = {};
  if (!model.cardId.startsWith('auto:')) out.card_id = model.cardId;
  if (model.style !== STYLES[0]) out.style = model.style;
  if (model.theme !== 'dark') out.theme = model.theme;
  if (model.controlModeEntity) out.control_mode_entity = model.controlModeEntity;
  out.tvs = model.tvs.map((tv) => {
    const entry = { name: tv.name, entity: tv.entity, platform: tv.platform };
    if (tv.companion) {
      entry.companion = {};
      if (tv.companion.platform !== 'roku') entry.companion.platform = tv.companion.platform;
      if (tv.companion.entity) entry.companion.media_entity = tv.companion.entity;
      if (tv.companion.remote) entry.companion.remote_entity = tv.companion.remote;
    }
    // Overrides: solo las categorías que difieren de la global, completas (el
    // merge es superficial: una categoría propia reemplaza a la global entera).
    const own = serializeSettings(tv.settings);
    const overrides = {};
    for (const k of Object.keys(own)) if (!sameJson(own[k], global[k])) overrides[k] = own[k];
    if (Object.keys(overrides).length) entry.overrides = overrides;
    return entry;
  });
  out.modes = global.modes;
  if (Object.keys(global.custom_modes).length) out.custom_modes = global.custom_modes;
  if (Object.keys(global.default_pad).length) out.default_pad = global.default_pad;
  if (!isDefaultStreaming) out.streaming = global.streaming;
  if (Object.keys(global.buttons).length) out.buttons = global.buttons;
  return out;
}

/* ---------- el elemento del editor (DOM) ---------- */

const EDITOR_TAG = `${CARD_TAG}-editor`;

const EDITOR_CSS = `
:host { display: block; }
.ed { display: grid; gap: 8px; padding-bottom: 16px; }
.ed-h { display: flex; align-items: center; gap: 6px; font-weight: 600; }
.ed-h span { flex: 1; min-width: 0; }
.ed-h.l1 { font-size: 1.05rem; margin-top: 18px; padding-bottom: 6px; border-bottom: 1px solid var(--divider-color, rgb(127 127 127 / 0.3)); }
.ed-h.l2 { font-size: 0.95rem; margin-top: 10px; }
.ed-h.l3 { font-size: 0.85rem; font-weight: 500; opacity: 0.8; margin-top: 4px; }
.ed-h.litem { font-weight: 400; font-size: 0.9rem; }
.ed-note { font-size: 0.8rem; opacity: 0.7; }
.ed-btns { display: flex; flex-wrap: wrap; gap: 6px; }
.ed button {
  font: inherit; font-size: 0.82rem; padding: 5px 10px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--divider-color, rgb(127 127 127 / 0.4));
  background: var(--secondary-background-color, transparent); color: var(--primary-text-color, inherit);
}
.ed button:disabled { opacity: 0.35; cursor: default; }
.ed-h button { padding: 2px 9px; }
.ed-alert { padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; border-inline-start: 4px solid; background: rgb(127 127 127 / 0.08); }
.ed-alert.error { border-color: var(--error-color, #db4437); }
.ed-alert.warning { border-color: var(--warning-color, #ffa600); }
.ed-alert.info { border-color: var(--info-color, #039be5); }
.ed-alert .ed-btns { margin-top: 8px; }
`;

/**
 * HA carga <ha-form> bajo demanda. Si nuestro editor se abre antes, se fuerza la
 * carga pidiendo el editor de una tarjeta nativa (truco estándar de las tarjetas
 * custom). Se hace una sola vez para todas las instancias.
 */
let haFormReady = null;
function ensureHaForm() {
  if (globalThis.customElements?.get('ha-form')) return Promise.resolve();
  haFormReady ??= (async () => {
    try {
      const helpers = await window.loadCardHelpers?.();
      const card = await helpers?.createCardElement({ type: 'entities', entities: [] });
      await card?.constructor?.getConfigElement?.();
    } catch { /* si falla, se espera a que HA lo defina por su cuenta */ }
    await customElements.whenDefined('ha-form');
  })();
  return haFormReady;
}

class TvControlCardEditor extends BaseElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${EDITOR_CSS}</style><div class="ed"></div>`;
    this._root = this.shadowRoot.querySelector('.ed');
    this._els = new Map();          // key → elemento: así se reutilizan entre renders
    this._expanded = new Set();     // "Personalizar" abierto pero aún sin datos (no va al YAML)
    this._config = null;
    this._hass = null;
    this.shadowRoot.addEventListener('click', (e) => {
      const btn = e.target.closest?.('button[data-op]');
      if (btn) this._onButton(btn);
    });
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    for (const el of this._els.values()) if (el._kind === 'form') el.hass = hass;
    if (first) this._render();
  }

  connectedCallback() {
    ensureHaForm().then(() => this._render());
  }

  _render() {
    if (!this._config || !globalThis.customElements?.get('ha-form')) return;
    let model = null;
    let error = null;
    try {
      model = normalizeConfig(this._config);
    } catch (err) {
      error = err.message;
    }
    const mediaPlayers = Object.keys(this._hass?.states ?? {}).filter((id) => id.startsWith('media_player.'));
    this._reconcile(buildEditorView(this._config, { model, error, expanded: this._expanded, mediaPlayers }));
  }

  /** Pinta los nodos en orden, reutilizando por `key` y quitando los que ya no están. */
  _reconcile(nodes) {
    const keep = new Set();
    nodes.forEach((node, i) => {
      let el = this._els.get(node.key);
      if (!el || el._kind !== node.kind) {
        el = this._create(node);
        this._els.set(node.key, el);
      }
      keep.add(node.key);
      this._fill(el, node);
      if (this._root.children[i] !== el) this._root.insertBefore(el, this._root.children[i] ?? null);
    });
    for (const [key, el] of this._els) {
      if (!keep.has(key)) {
        el.remove();
        this._els.delete(key);
      }
    }
  }

  _create(node) {
    let el;
    if (node.kind === 'form') {
      el = document.createElement('ha-form');
      el.computeLabel = (s) => s.label ?? s.name;
      el.computeHelper = (s) => s.helper;
      el.addEventListener('value-changed', (e) => {
        e.stopPropagation();   // el editor solo avisa a HA con config-changed
        this._commit(applyFormChange(this._config, el._node, e.detail.value));
      });
    } else {
      el = document.createElement('div');
    }
    el._kind = node.kind;
    return el;
  }

  _fill(el, node) {
    el._node = node;
    el.dataset.key = node.key;
    el.style.marginInlineStart = `${(node.depth ?? 0) * 16}px`;
    if (node.kind === 'form') {
      el.hass = this._hass;
      const schemaJson = JSON.stringify(node.schema);
      if (el._schemaJson !== schemaJson) {
        el._schemaJson = schemaJson;
        el.schema = node.schema;
      }
      el.data = node.data;
      return;
    }
    // Títulos, notas, botones y avisos: se rehacen (no tienen foco que cuidar).
    el.className = node.kind === 'heading' ? `ed-h l${node.level}` : node.kind === 'alert' ? `ed-alert ${node.level}` : `ed-${node.kind === 'buttons' ? 'btns' : node.kind}`;
    const ops = [];
    const button = (item) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = item.label;
      if (item.title) b.title = item.title;
      b.disabled = !!item.disabled;
      b.dataset.op = String(ops.push(item.op) - 1);
      return b;
    };
    el._ops = ops;
    if (node.kind === 'buttons') {
      el.replaceChildren(...node.items.map(button));
    } else if (node.kind === 'heading') {
      const span = document.createElement('span');
      span.textContent = node.text;
      el.replaceChildren(span, ...(node.actions ?? []).map(button));
    } else if (node.kind === 'alert') {
      const text = document.createElement('div');
      text.textContent = node.text;
      const children = [text];
      if (node.actions?.length) {
        const row = document.createElement('div');
        row.className = 'ed-btns';
        row.append(...node.actions.map(button));
        children.push(row);
      }
      el.replaceChildren(...children);
    } else {
      el.textContent = node.text;
    }
  }

  _onButton(btn) {
    const host = btn.closest('[data-key]');
    const op = host?._ops?.[Number(btn.dataset.op)];
    if (!op) return;
    if (op.op === 'expand') {
      this._expanded.add(op.key);
      this._render();
      return;
    }
    if (op.collapse) this._expanded.delete(op.collapse);
    this._commit(applyOp(this._config, op));
  }

  /** Guarda la config nueva, avisa a HA (que repinta la vista previa) y repinta el editor. */
  _commit(next) {
    if (sameJson(next, this._config)) {
      this._render();
      return;
    }
    this._config = next;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: next }, bubbles: true, composed: true }));
    this._render();
  }
}

/*
 * Registro. Se protege por dos razones:
 *   - En Node no existe customElements (los tests importan este archivo).
 *   - Si HA carga el recurso dos veces (p. ej. con ?v=1 y ?v=2), un segundo
 *     define() con el mismo nombre lanzaría un error y rompería el dashboard.
 */
if (globalThis.customElements && !customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, TvControlCardEditor);
if (globalThis.customElements && !customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, TvControlCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === CARD_TAG)) {
    window.customCards.push({
      type: CARD_TAG,
      name: CARD_TAG === DEFAULT_CARD_TAG ? 'Minimalist TV Control Card' : `Minimalist TV Control Card (${CARD_TAG})`,
      description: 'Control para TVs LG y Samsung, con Roku opcional.',
      preview: false,
      documentationURL: 'https://github.com/extraiotpruebas/minimalist-tv-control-card',
    });
  }
  console.info(`%c TV-CONTROL-CARD %c ${CARD_VERSION} `, 'background:#0a84ff;color:#fff;border-radius:3px 0 0 3px', 'background:#333;color:#fff;border-radius:0 3px 3px 0');
}

/* ============================================================================
 * EXPORTS (para los tests de Node; HA los ignora)
 * ========================================================================== */
export {
  CARD_VERSION,
  buildEditorView,
  applyFormChange,
  applyOp,
  serializeV4,
  actionToForm,
  formToAction,
  setPath,
  deletePath,
  getPath,
  KEYS,
  HOLDABLE_KEYS,
  TV_ONLY_KEYS,
  CODE_TO_KEY,
  PLATFORMS,
  UnsupportedActionError,
  parseAction,
  resolveForPlatform,
  isHoldable,
  getPlatform,
  executeAction,
  stripSsap,
  SOURCES,
  FIXED_MODES,
  DEFAULT_BUTTONS,
  normalizeConfig,
  tvStatus,
  StateWaiters,
  describeNow,
  STYLES,
  routeAction,
  sourceMatches,
  resolveSourceName,
  TvControlCard,
};
