/* Módulo §7: editor de paletas (la lista de paletas y los selectores de asignación). */
import { BUILTIN_PALETTES, PALETTE_FIELDS, contrastRatio, normalizeHex } from '../config/palettes.js';
import { fold } from './fold.js';
import { deletePath, getPath, isPlainObject, setPath } from './paths.js';

/* ============================================================================
 * PALETAS EN EL EDITOR
 * ----------------------------------------------------------------------------
 * Dos partes, igual que el resto del editor (nodos puros + DOM delgado):
 *   1. paletteSection(config)      el panel "Paletas": crear, copiar, renombrar,
 *                                  editar colores y borrar.
 *   2. assignmentNodes(config...)  el selector que ASIGNA una paleta (tarjeta, TV,
 *                                  Roku, botón de streaming), con o sin par
 *                                  claro/oscuro.
 * Renombrar o borrar una paleta toca todas las asignaciones que la usan: por eso
 * existe mapPaletteRefs, que recorre los 5 lugares donde puede haber `palette:`.
 * ========================================================================== */

/** Valor del selector para "sin paleta" (un select de HA no maneja bien el texto vacío). */
const NONE = '__none__';

const FIELD_LABELS = { background: 'Fondo', button: 'Botones', text: 'Texto', accent: 'Acento', on: 'Encendido' };
const BASE_LABELS = { dark: 'oscura', light: 'clara' };

/**
 * Colores de Relieve por base: lo que vale un campo vacío. Sirven de punto de
 * partida del selector de color y para el aviso de contraste (en oscuro, `button`
 * es el blanco translúcido de Relieve ya mezclado con el fondo).
 */
const BASE_COLORS = {
  dark: { background: '#16181c', button: '#27292d', text: '#eef0f3', accent: '#dce6f5', on: '#64e3a6' },
  light: { background: '#eef1f5', button: '#ffffff', text: '#1b1f25', accent: '#1b1f25', on: '#1f9d63' },
};

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const baseOf = (palette) => (palette?.base === 'light' ? 'light' : 'dark');

/** Todas las paletas disponibles: las incluidas + las del YAML (una propia reemplaza a la incluida). */
function allPalettes(config) {
  return { ...BUILTIN_PALETTES, ...(isPlainObject(config.palettes) ? config.palettes : {}) };
}

/** Nombre libre para una paleta nueva: "paleta", "paleta-2", "paleta-3"… */
function uniqueName(config, stem = 'paleta') {
  const taken = allPalettes(config);
  let name = stem;
  for (let n = 2; Object.hasOwn(taken, name); n += 1) name = `${stem}-${n}`;
  return name;
}

/* ---------- asignaciones: recorrer y cambiar los `palette:` de toda la config ---------- */

/**
 * Una asignación de paleta (lo que hay bajo una clave `palette:`) → la misma
 * asignación con el nombre `from` cambiado por `to`.
 *
 *   ref:  'grafito'                          (una sola paleta, claro y oscuro)
 *         { light: 'nube', dark: 'grafito' } (un par; puede traer solo un lado)
 *         undefined                          (sin asignación)
 *   to:   un nombre nuevo, o null = QUITAR el nombre (así se borra una paleta)
 *
 * Devuelve la asignación nueva, o undefined si ya no queda ningún nombre.
 * NO muta `ref` (HA congela la config) y lo que no se llame `from` queda igual.
 * Pruebas: test/palette-refs.test.mjs
 *
 * VERSIÓN PROVISIONAL del asistente, para poder probar el editor en HA. Es el
 * ejercicio "Learn by Doing" de Ian: su versión reemplaza a esta (mismas pruebas).
 */
function renameRef(ref, from, to) {
  const swap = (name) => (name === from ? (to ?? undefined) : name);
  if (typeof ref === 'string') return swap(ref);
  if (!isPlainObject(ref)) return ref;
  const light = swap(ref.light);
  const dark = swap(ref.dark);
  if (light === undefined && dark === undefined) return undefined;
  return { ...(light !== undefined && { light }), ...(dark !== undefined && { dark }) };
}

/**
 * Aplica `fn(ref)` a cada asignación de paleta de la config y devuelve la config
 * nueva (sin mutar). Los 5 lugares: la tarjeta, `tvs[i].overrides` (y su streaming),
 * `tvs[i].companion` y `streaming[j]`. Si fn devuelve undefined, se quita la clave.
 */
function mapPaletteRefs(config, fn) {
  const fix = (obj) => {
    if (!isPlainObject(obj) || obj.palette === undefined) return obj;
    const next = fn(obj.palette);
    if (next !== undefined) return { ...obj, palette: next };
    const { palette: _removed, ...rest } = obj;
    return rest;
  };
  const fixSlots = (list) => (Array.isArray(list) ? list.map(fix) : list);
  const fixTv = (tv) => {
    if (!isPlainObject(tv)) return tv;
    let out = tv;
    if (isPlainObject(tv.companion)) out = { ...out, companion: fix(tv.companion) };
    if (isPlainObject(tv.overrides)) {
      let overrides = fix(tv.overrides);
      if (Array.isArray(overrides.streaming)) overrides = { ...overrides, streaming: fixSlots(overrides.streaming) };
      out = { ...out, overrides };
    }
    return out;
  };
  let out = fix(config);
  if (Array.isArray(out.streaming)) out = { ...out, streaming: fixSlots(out.streaming) };
  if (Array.isArray(out.tvs)) out = { ...out, tvs: out.tvs.map(fixTv) };
  return out;
}

/**
 * Renombra una paleta (conservando su lugar en la lista) y actualiza todo lo que la
 * usaba. Sin cambios si el nombre nuevo está vacío, es igual, o ya lo tiene otra paleta propia.
 */
function renamePalette(config, from, to) {
  const name = String(to ?? '').trim();
  const own = isPlainObject(config.palettes) ? config.palettes : {};
  if (!name || name === from || !Object.hasOwn(own, from) || Object.hasOwn(own, name)) return config;
  const palettes = Object.fromEntries(Object.entries(own).map(([key, value]) => [key === from ? name : key, value]));
  return mapPaletteRefs({ ...config, palettes }, (ref) => renameRef(ref, from, name));
}

/**
 * Borra una paleta. Si la ASIGNACIÓN apuntaba a ella y ya no existe ninguna con ese
 * nombre (ni incluida), se quita de las asignaciones; si era una incluida que se había
 * reemplazado, las asignaciones siguen siendo válidas (vuelve la incluida).
 */
function removePalette(config, name) {
  const next = deletePath(config, ['palettes', name]);
  if (Object.hasOwn(BUILTIN_PALETTES, name)) return next;
  return mapPaletteRefs(next, (ref) => renameRef(ref, name, null));
}

/* ---------- nodos: selector de asignación ---------- */

/**
 * El selector que asigna una paleta en `path` (…`.palette`). Con una sola paleta es un
 * desplegable; con un par claro/oscuro son dos. Los botones pasan de una forma a la otra.
 */
function assignmentNodes(config, path, key, depth, label, { init } = {}) {
  const raw = getPath(config, path);
  const palettes = allPalettes(config);
  const optionsFor = (current) => {
    const options = [{ value: NONE, label: 'Ninguna (la del estilo)' },
      ...Object.entries(palettes).map(([name, p]) => ({ value: name, label: `${name} · ${BASE_LABELS[baseOf(p)]}` }))];
    if (current && current !== NONE && !Object.hasOwn(palettes, current)) options.push({ value: current, label: `${current} (no existe)` });
    return options;
  };
  const select = (name, text) => ({ name, label: text, selector: { select: { mode: 'dropdown', options: optionsFor(raw?.[name] ?? raw) } } });

  if (isPlainObject(raw)) {
    const same = raw.dark ?? raw.light;
    return [
      { kind: 'form', key, depth, path, codec: 'palette-ref', pair: true, init,
        schema: [{ name: '', type: 'grid', schema: [select('light', `${label} · claro`), select('dark', `${label} · oscuro`)] }],
        data: { light: raw.light ?? NONE, dark: raw.dark ?? NONE } },
      { kind: 'buttons', key: `${key}.b`, depth, items: [
        { label: 'Usar la misma en claro y oscuro', op: { op: 'set', path, value: same } }] },
    ];
  }
  const nodes = [{ kind: 'form', key, depth, path, codec: 'palette-ref', init,
    schema: [{ name: 'value', label, selector: { select: { mode: 'dropdown', options: optionsFor(raw) } } }],
    data: { value: typeof raw === 'string' && raw ? raw : NONE } }];
  if (typeof raw === 'string' && raw) {
    nodes.push({ kind: 'buttons', key: `${key}.b`, depth, items: [
      { label: 'Distinta en claro y oscuro', op: { op: 'set', path, value: { light: raw, dark: raw } } }] });
  }
  return nodes;
}

/* ---------- nodos: el panel "Paletas" ---------- */

/** Un color de la paleta: el suyo si lo tiene, si no el de la base (se marca como `base`). */
function effectiveColors(raw, base) {
  return PALETTE_FIELDS.map((field) => {
    const own = raw[field] !== undefined ? normalizeHex(raw[field]) : null;
    return { field, label: FIELD_LABELS[field], color: own ?? BASE_COLORS[base][field], base: !own };
  });
}

/** "Contraste texto/fondo 12.1:1 · texto/botones 9.3:1" con ⚠ si no llega a 4.5 (mínimo para texto normal). */
function contrastNote(colors) {
  const by = Object.fromEntries(colors.map((c) => [c.field, c.color]));
  const part = (name, ratio) => `${ratio < 4.5 ? '⚠ ' : ''}${name} ${ratio.toFixed(1)}:1`;
  const text = `Contraste ${part('texto/fondo', contrastRatio(by.text, by.background))} · ${part('texto/botones', contrastRatio(by.text, by.button))}`;
  return contrastRatio(by.text, by.background) < 4.5 || contrastRatio(by.text, by.button) < 4.5
    ? `${text}. Menos de 4.5:1 cuesta leer; prueba un texto más claro u oscuro.` : text;
}

/** La key usa la POSICIÓN, no el nombre: renombrar (se emite en cada tecla) no debe recrear el campo ni cerrar el panel. */
function paletteFold(config, name, index) {
  const raw = isPlainObject(config.palettes[name]) ? config.palettes[name] : {};
  const base = baseOf(raw);
  const kp = `pal.${index}`;
  const colors = effectiveColors(raw, base);
  const children = [
    { kind: 'swatches', key: `${kp}.s`, depth: 1, colors },
    { kind: 'form', key: `${kp}.f`, depth: 1, path: ['palettes', name], codec: 'palette-meta',
      schema: [{ name: '', type: 'grid', schema: [
        { name: 'name', label: 'Nombre', selector: { text: {} } },
        { name: 'base', label: 'Base', helper: 'Claro u oscuro: lo que no definas sale de aquí.', selector: { select: { mode: 'dropdown', options: [{ value: 'dark', label: 'Oscura' }, { value: 'light', label: 'Clara' }] } } },
      ] }],
      data: { name, base } },
  ];
  for (const field of PALETTE_FIELDS) {
    if (raw[field] === undefined) continue;
    children.push({ kind: 'heading', key: `${kp}.c.${field}`, depth: 1, level: 3, text: FIELD_LABELS[field],
      actions: [{ label: '✕', title: 'Quitar: usa el de la base', op: { op: 'delete', path: ['palettes', name, field] } }] });
    children.push({ kind: 'form', key: `${kp}.c.${field}.f`, depth: 1, path: ['palettes', name], codec: 'palette-color', field,
      schema: [{ name: 'color', label: '', selector: { color_rgb: {} } }],
      data: { color: hexToRgb(colors.find((c) => c.field === field).color) } });
  }
  const missing = PALETTE_FIELDS.filter((field) => raw[field] === undefined);
  if (missing.length) {
    children.push({ kind: 'buttons', key: `${kp}.add`, depth: 1,
      items: missing.map((field) => ({ label: `+ ${FIELD_LABELS[field]}`, op: { op: 'set', path: ['palettes', name, field], value: BASE_COLORS[base][field] } })) });
  }
  children.push({ kind: 'note', key: `${kp}.n`, depth: 1, text: contrastNote(colors) });
  const own = PALETTE_FIELDS.length - missing.length;
  const head = { kind: 'heading', key: kp, depth: 0, level: 2, text: name,
    actions: [{ label: '✕', title: 'Eliminar la paleta', op: { op: 'palette-delete', name } }] };
  return fold(head, children, { summary: `${BASE_LABELS[base]} · ${own} de ${PALETTE_FIELDS.length} colores` });
}

/** El panel "Paletas" completo (siempre existe: ahí se crea la primera). */
function paletteSection(config) {
  const own = isPlainObject(config.palettes) ? config.palettes : {};
  const names = Object.keys(own);
  const fresh = uniqueName(config);
  const copyOptions = Object.entries(allPalettes(config)).map(([name, p]) => ({ value: name, label: `${name} · ${BASE_LABELS[baseOf(p)]}` }));
  const children = [
    { kind: 'note', key: 'pal.n', depth: 0, text: 'Una paleta son 5 colores y una base (clara u oscura); el resto se calcula. Se asignan en General, en cada TV, en el Roku y en cada botón de streaming.' },
  ];
  names.forEach((name, index) => children.push(...paletteFold({ ...config, palettes: own }, name, index)));
  children.push({ kind: 'buttons', key: 'pal.add', depth: 0, items: [
    { label: '+ Nueva paleta', op: { op: 'set', path: ['palettes', fresh], value: { base: 'dark', ...BASE_COLORS.dark }, open: `pal.${names.length}` } }] });
  children.push({ kind: 'form', key: 'pal.copy', depth: 0, path: [], codec: 'palette-copy', newName: fresh, open: `pal.${names.length}`,
    schema: [{ name: 'from', label: 'Crear copiando una existente', selector: { select: { mode: 'dropdown', options: copyOptions } } }],
    data: { from: '' } });
  const head = { kind: 'heading', key: 'pal', depth: 0, level: 1, text: 'Paletas' };
  const builtin = Object.keys(BUILTIN_PALETTES).length;
  return fold(head, children, { summary: `${names.length ? `${names.length} propias` : 'ninguna propia'} · ${builtin} incluidas` });
}

/* ---------- formularios: datos → config nueva (los usa applyFormChange) ---------- */

/** Un formulario de paletas cambió. `config` ya viene con los atajos expandidos. */
function applyPaletteForm(config, node, data) {
  const set = (path, value) => (value === undefined ? deletePath(config, path) : setPath(config, path, value));
  switch (node.codec) {
    case 'palette-ref': {
      const pick = (value) => (value && value !== NONE ? value : undefined);
      if (!node.pair) return set(node.path, pick(data.value));
      const light = pick(data.light);
      const dark = pick(data.dark);
      return set(node.path, light || dark ? { ...(light && { light }), ...(dark && { dark }) } : undefined);
    }
    case 'palette-meta': {
      let next = config;
      let name = node.path[1];
      if (data.name !== node.data.name) {
        const renamed = renamePalette(next, name, data.name);
        if (renamed !== next) { next = renamed; name = String(data.name).trim(); }
      }
      if (data.base !== node.data.base && (data.base === 'light' || data.base === 'dark')) next = setPath(next, ['palettes', name, 'base'], data.base);
      return next;
    }
    case 'palette-color': {
      const hex = normalizeHex(data.color);
      return hex ? setPath(config, [...node.path, node.field], hex) : config;
    }
    case 'palette-copy': {
      const source = allPalettes(config)[data.from];
      if (!source) return config;
      return setPath(config, ['palettes', node.newName], { ...source });
    }
    default: return config;
  }
}

export { BASE_COLORS, NONE, allPalettes, applyPaletteForm, assignmentNodes, hexToRgb, mapPaletteRefs, paletteSection, removePalette, renamePalette, renameRef, uniqueName };
