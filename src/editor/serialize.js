/* Módulo §7: convertir cualquier YAML que entiende la tarjeta → YAML v4 mínimo. */
import { parseAction } from '../actions/parse.js';
import { CUSTOM_MODE_IDS, DEFAULT_BUTTONS, DEFAULT_PAD, DEFAULT_STREAMING, DIRECTIONS, pad } from '../config/catalogs.js';
import { STYLES, normalizeConfig, resolveSettings } from '../config/normalize.js';
import { clone, sameJson } from './paths.js';

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

export { serializeV4 };
