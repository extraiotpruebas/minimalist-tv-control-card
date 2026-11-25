import { parseAction } from '../actions/parse.js';
import { CUSTOM_MODE_IDS, DEFAULT_BUTTONS, DEFAULT_PAD, DEFAULT_STREAMING, DIRECTIONS, FIXED_MODES, MODE_ALIASES, RESERVED_MODES, SOURCES_BY_ID, pad } from './catalogs.js';
import { checkPaletteRef, normalizePalettes, paletteRef } from './palettes.js';
import { deepFreeze, firstDefined, has } from '../util.js';

function normalizePlatform(value, warnings) {
  const v = String(value || '').toLowerCase();
  if (v.includes('samsung')) return 'samsung';
  if (v.includes('roku')) return 'roku';
  if (v && !v.includes('lg') && warnings) warnings.push(`Tipo de TV desconocido "${value}"; se usará LG.`);
  return 'lg';
}

function normalizeColor(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (/^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}$/.test(str)) return `rgb(${str})`;
  return str;
}

function normalizeCompanion(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const entity = raw.media_entity || raw.entity;
  const remote = raw.remote_entity || raw.remote;
  if (!entity && !remote) return null;
  return {
    platform: normalizePlatform(raw.platform || 'roku'),
    entity: entity || null,
    remote: remote || null,
    palette: paletteRef(raw.palette),
  };
}

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

function readPad(rawPad, fallback) {
  const result = {};
  for (const dir of DIRECTIONS) {
    let entry = rawPad?.[dir];
    if (entry !== undefined && entry !== null && typeof entry !== 'object') entry = { action: entry };
    result[dir] = {
      icon: firstDefined(entry?.icon, fallback?.[dir]?.icon) ?? null,
      action: entry && 'action' in entry ? parseAction(entry.action) : (fallback?.[dir]?.action ?? null),
    };
  }
  return result;
}

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

function makeStreamingSlot(index, sourceId, icon, action, accent, palette, warnings) {
  let source = SOURCES_BY_ID.get(sourceId);
  if (!source) {
    if (sourceId) warnings.push(`Fuente desconocida "${sourceId}" en el botón de streaming ${index + 1}; se usó la predeterminada.`);
    source = SOURCES_BY_ID.get(DEFAULT_STREAMING[index]);
  }
  return {
    index,
    source,
    icon: firstDefined(icon, source.icon),
    action: parseAction(action),
    accent: normalizeColor(accent),
    palette: paletteRef(palette),
  };
}

function resolveStreaming(raw, warnings) {
  if (Array.isArray(raw.streaming)) {
    return DEFAULT_STREAMING.map((defaultId, i) => {
      const entry = raw.streaming[i] || {};
      return makeStreamingSlot(i, firstDefined(entry.source, defaultId), entry.icon, entry.action, entry.accent, entry.palette, warnings);
    });
  }

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
      null,
      warnings,
    );
  });
}

function resolveButtons(raw, warnings) {
  const fromNew = raw.buttons || {};
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
    palette: paletteRef(raw.palette),
  };
}

const STYLES = ['relieve', 'halo', 'cristal'];

function resolveStyle(value, warnings) {
  if (value === undefined || value === null || value === '') return STYLES[0];
  const v = String(value).trim().toLowerCase();
  if (STYLES.includes(v)) return v;
  warnings.push(`Estilo desconocido "${value}"; se usará "${STYLES[0]}". Opciones: ${STYLES.join(', ')}.`);
  return STYLES[0];
}

function resolveTheme(value) {
  const v = String(value ?? '').trim().toLowerCase();
  return v === 'light' || v === 'auto' ? v : 'dark';
}

const TV_OWN_KEYS = new Set(['name', 'entity', 'type', 'platform', 'roku', 'companion', 'overrides']);

function normalizeConfig(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Configuración inválida.');
  const warnings = [];

  const isV4 = ['modes', 'buttons', 'streaming', 'custom_modes', 'default_pad', 'theme', 'palette', 'palettes'].some((k) => k in raw)
    || (Array.isArray(raw.tvs) && raw.tvs.some((tv) => tv && ('platform' in tv || 'companion' in tv)));

  let rawTvs;
  if (Array.isArray(raw.tvs) && raw.tvs.length > 0) {
    rawTvs = raw.tvs;
  } else if (raw.entity) {
    rawTvs = [{ name: raw.name || raw.entity, entity: raw.entity, type: raw.modelConfig, roku: raw.roku }];
  } else {
    throw new Error('Define al menos una TV: usa "tvs" (lista) o "entity".');
  }

  const globalSettings = resolveSettings(raw, warnings);

  const tvs = rawTvs.map((tv, i) => {
    if (!tv || !tv.entity) throw new Error(`La TV #${i + 1} no tiene "entity".`);

    const overrides = { ...(tv.overrides || {}) };
    for (const [k, v] of Object.entries(tv)) {
      if (!TV_OWN_KEYS.has(k)) overrides[k] = v;
    }
    const hasOverrides = Object.keys(overrides).length > 0;
    const name = String(firstDefined(tv.name, tv.entity)).trim();
    const companion = normalizeCompanion(tv.companion || tv.roku);
    const settings = hasOverrides ? resolveSettings({ ...raw, ...overrides }, warnings) : globalSettings;

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

  const palettes = normalizePalettes(raw.palettes, warnings);
  for (const tv of tvs) {
    const { settings, companion } = tv;
    checkPaletteRef(settings.palette, palettes, `"${tv.name}"`, warnings);
    checkPaletteRef(companion?.palette, palettes, `"${tv.name}" (modo Roku)`, warnings);
    for (const slot of settings.streaming) {
      checkPaletteRef(slot.palette, palettes, `Botón de streaming ${slot.index + 1}`, warnings);
    }
  }

  const cardId = firstDefined(raw.card_id, `auto:${tvs.map((t) => t.entity).join(',')}`);

  return deepFreeze({
    format: isV4 ? 'v4' : 'legacy',
    cardId: String(cardId),
    theme: resolveTheme(firstDefined(raw.theme, raw.colorMode)),
    style: resolveStyle(raw.style, warnings),
    palettes,
    controlModeEntity: firstDefined(raw.control_mode_entity) ?? null,
    tvs,
    warnings: [...new Set(warnings)],
  });
}

export { STYLES, normalizeConfig, normalizePlatform, resolveSettings };
