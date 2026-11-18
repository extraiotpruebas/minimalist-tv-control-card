/*
 * Módulo §5, segunda parte: normalizeConfig y sus ayudantes. Los catálogos que usa
 * están en config/catalogs.js.
 */
import { parseAction } from '../actions/parse.js';
import { CUSTOM_MODE_IDS, DEFAULT_BUTTONS, DEFAULT_PAD, DEFAULT_STREAMING, DIRECTIONS, FIXED_MODES, MODE_ALIASES, RESERVED_MODES, SOURCES_BY_ID, pad } from './catalogs.js';
import { deepFreeze, firstDefined, has } from '../util.js';

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

export { STYLES, normalizeConfig, normalizePlatform, resolveSettings };
