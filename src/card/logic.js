/*
 * Módulo §6, lógica pura de la tarjeta: estado de la TV, esperas, almacenamiento,
 * tiempos, ruteo y qué muestra la pantalla. No toca el DOM: se prueba en Node.
 * La clase de la tarjeta está en card/tv-control-card.js.
 */
import { KEYS, TV_ONLY_KEYS } from '../actions/keys.js';
import { SOURCES } from '../config/catalogs.js';
import { has } from '../util.js';

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
const SOURCE_ATTEMPTS = 2;           // 1 intento + 1 reintento: relanzar una app varias veces la reinicia
// Tras encender, el centro ignora OK este tiempo (ms): un doble toque a "Encender"
// no debe terminar mandando un OK a la TV recién prendida.
const CENTER_GUARD_MS = 800;
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

export { CENTER_GUARD_MS, SOURCE_ATTEMPTS, StateWaiters, TIMING, describeNow, resolveSourceName, routeAction, sourceMatches, storage, tvStatus };
