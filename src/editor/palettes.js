import { BUILTIN_PALETTES, PALETTE_FIELDS, contrastRatio, normalizeHex } from '../config/palettes.js';
import { fold } from './fold.js';
import { deletePath, getPath, isPlainObject, setPath } from './paths.js';

const NONE = '__none__';

const FIELD_LABELS = { background: 'Fondo', button: 'Botones', text: 'Texto', accent: 'Acento', on: 'Encendido' };
const BASE_LABELS = { dark: 'oscura', light: 'clara' };

const BASE_COLORS = {
  dark: { background: '#16181c', button: '#27292d', text: '#eef0f3', accent: '#dce6f5', on: '#64e3a6' },
  light: { background: '#eef1f5', button: '#ffffff', text: '#1b1f25', accent: '#1b1f25', on: '#1f9d63' },
};

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const baseOf = (palette) => (palette?.base === 'light' ? 'light' : 'dark');

function allPalettes(config) {
  return { ...BUILTIN_PALETTES, ...(isPlainObject(config.palettes) ? config.palettes : {}) };
}

function uniqueName(config, stem = 'paleta') {
  const taken = allPalettes(config);
  let name = stem;
  for (let n = 2; Object.hasOwn(taken, name); n += 1) name = `${stem}-${n}`;
  return name;
}

function renameRef(ref, from, to) {
  const swap = (name) => (name === from ? (to ?? undefined) : name);
  if (typeof ref === 'string') return swap(ref);
  if (!isPlainObject(ref)) return ref;
  const light = swap(ref.light);
  const dark = swap(ref.dark);
  if (light === undefined && dark === undefined) return undefined;
  return { ...(light !== undefined && { light }), ...(dark !== undefined && { dark }) };
}

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

function renamePalette(config, from, to) {
  const name = String(to ?? '').trim();
  const own = isPlainObject(config.palettes) ? config.palettes : {};
  if (!name || name === from || !Object.hasOwn(own, from) || Object.hasOwn(own, name)) return config;
  const palettes = Object.fromEntries(Object.entries(own).map(([key, value]) => [key === from ? name : key, value]));
  return mapPaletteRefs({ ...config, palettes }, (ref) => renameRef(ref, from, name));
}

function removePalette(config, name) {
  const next = deletePath(config, ['palettes', name]);
  if (Object.hasOwn(BUILTIN_PALETTES, name)) return next;
  return mapPaletteRefs(next, (ref) => renameRef(ref, name, null));
}

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

function effectiveColors(raw, base) {
  return PALETTE_FIELDS.map((field) => {
    const own = raw[field] !== undefined ? normalizeHex(raw[field]) : null;
    return { field, label: FIELD_LABELS[field], color: own ?? BASE_COLORS[base][field], base: !own };
  });
}

function contrastNote(colors) {
  const by = Object.fromEntries(colors.map((c) => [c.field, c.color]));
  const part = (name, ratio) => `${ratio < 4.5 ? '⚠ ' : ''}${name} ${ratio.toFixed(1)}:1`;
  const text = `Contraste ${part('texto/fondo', contrastRatio(by.text, by.background))} · ${part('texto/botones', contrastRatio(by.text, by.button))}`;
  return contrastRatio(by.text, by.background) < 4.5 || contrastRatio(by.text, by.button) < 4.5
    ? `${text}. Menos de 4.5:1 cuesta leer; prueba un texto más claro u oscuro.` : text;
}

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
