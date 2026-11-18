/* Módulo §2. */
import { CODE_TO_KEY, HOLDABLE_KEYS, KEYS } from './keys.js';
import { has } from '../util.js';

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

export { isHoldable, parseAction, resolveForPlatform, stripSsap };
