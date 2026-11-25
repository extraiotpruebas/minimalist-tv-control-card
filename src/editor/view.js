import { KEYS } from '../actions/keys.js';
import { parseAction } from '../actions/parse.js';
import { CUSTOM_MODE_IDS, DEFAULT_BUTTONS, DEFAULT_PAD, DEFAULT_STREAMING, DIRECTIONS, FIXED_MODES } from '../config/catalogs.js';
import { normalizePlatform } from '../config/normalize.js';
import { actionSchema, actionToForm } from './action-form.js';
import { ACTION_UI_TYPES, ALL_ACTION_TYPES, BRANDS, BRAND_ACTION_TYPES, BUTTON_LABELS, DEFAULT_MODES, DIRECTION_LABELS, SOURCE_OPTIONS, STEP_ACTION_TYPES, STYLE_OPTIONS, THEME_OPTIONS, TV_PLATFORM_OPTIONS } from './catalogs.js';
import { fold } from './fold.js';
import { assignmentNodes, paletteSection } from './palettes.js';
import { clone, expandShortcuts, getPath, isPlainObject } from './paths.js';

function listActions(arrayPath, index, length, { canRemove = true } = {}) {
  return [
    { label: '↑', title: 'Subir', op: { op: 'move', path: arrayPath, index, delta: -1 }, disabled: index === 0 },
    { label: '↓', title: 'Bajar', op: { op: 'move', path: arrayPath, index, delta: 1 }, disabled: index === length - 1 },
    { label: '✕', title: 'Quitar', op: { op: 'remove', path: arrayPath, index }, disabled: !canRemove },
  ];
}

function shortLabel(options, value) {
  const found = options.find((o) => o.value === value);
  return found ? found.label.replace(/ \(.*\)$/, '') : String(value ?? '');
}

const ACTION_SHORT = {
  input: 'entrada', source: 'fuente', script: 'script', service: 'servicio de HA', command: 'command LG',
  button: 'botón crudo', sequence: 'secuencia', numpad: 'teclado numérico', platform: 'distinta por marca',
};

function describeAction(raw, { allowDefault = false, defaultText = 'predeterminada' } = {}) {
  const form = actionToForm(raw);
  if (form.type === 'default') return allowDefault ? defaultText : 'sin acción';
  if (form.type === 'none') return 'sin acción';
  if (form.type === 'key') return form.key ? `tecla ${KEYS[form.key]?.label ?? form.key}` : 'tecla sin elegir';
  return ACTION_SHORT[form.type] ?? ACTION_UI_TYPES[form.type] ?? form.type;
}

const OVERRIDE_NAMES = { modes: 'modos', custom_modes: 'modos personalizados', default_pad: 'touchpad', streaming: 'streaming', buttons: 'botones', palette: 'paleta' };

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

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

function padNodes(config, basePath, key, depth, { allowDefault }) {
  const nodes = [];
  for (const dir of DIRECTIONS) {
    const entry = getPath(config, [...basePath, dir]);
    const defaultKey = KEYS[DEFAULT_PAD[dir].action.key].label;
    const defaultLabel = allowDefault ? `Predeterminada (${defaultKey})` : undefined;
    const head = { kind: 'heading', key: `${key}.${dir}`, depth, level: 3, text: DIRECTION_LABELS[dir] };
    const children = [
      { kind: 'form', key: `${key}.${dir}.i`, depth, path: [...basePath, dir],
        schema: [{ name: 'icon', label: 'Ícono', selector: { icon: {} } }], data: { icon: entry?.icon ?? '' } },
      ...actionNodes(config, [...basePath, dir, 'action'], `${key}.${dir}.a`, depth, { allowDefault, defaultLabel }),
    ];
    nodes.push(...fold(head, children, { summary: describeAction(entry?.action, { allowDefault, defaultText: `tecla ${defaultKey} (predeterminada)` }) }));
  }
  return nodes;
}

function describeDefaultButton(id) {
  const action = parseAction(DEFAULT_BUTTONS[id].action);
  if (id === 'power') return 'encender/apagar la TV';
  return action?.type === 'key' ? `tecla ${KEYS[action.key].label}` : 'sin acción';
}

function settingsNodes(config, base, kp, depth, ctx, override) {
  const nodes = [];
  const here = getPath(config, base) ?? {};
  const present = (k) => here[k] !== undefined;
  const level = override ? 2 : 1;

  const effectiveModes = (present('modes') ? here.modes : config.modes) ?? DEFAULT_MODES;
  const customDefs = (override && here.custom_modes) || config.custom_modes || {};
  const modeLabel = (id) => FIXED_MODES[id]?.label ?? customDefs[id]?.label ?? id;
  let modesHead = null;
  const modesChildren = [];
  if (!override || present('modes')) {
    const modeOptions = [
      ...Object.entries(FIXED_MODES).map(([id, def]) => ({ value: id, label: id === 'info' ? `${def.label} (experimental)` : def.label })),
      ...CUSTOM_MODE_IDS.map((id) => ({ value: id, label: customDefs[id]?.label ? `${customDefs[id].label} (${id})` : `Personalizado ${id.slice(-1)} (${id})` })),
    ];
    const modes = present('modes') ? here.modes : (config.modes ?? DEFAULT_MODES);
    modesHead = { kind: 'heading', key: `${kp}modes`, depth, level, text: override ? 'Modos propios' : 'Modos del touchpad',
      actions: override ? [{ label: '✕', title: 'Usar los modos globales', op: { op: 'delete', path: [...base, 'modes'] } }] : undefined };
    modesChildren.push({ kind: 'form', key: `${kp}modes.f`, depth, path: base, codec: 'modes',
      schema: [{ name: '', type: 'grid', schema: ['m1', 'm2', 'm3'].map((name, i) => ({ name, label: `Modo ${i + 1}`, required: true, selector: { select: { mode: 'dropdown', options: modeOptions } } })) }],
      data: { m1: modes[0], m2: modes[1], m3: modes[2] } });
  } else {
    nodes.push({ kind: 'buttons', key: `${kp}modes.add`, depth, items: [{ label: '+ Modos propios', op: { op: 'set', path: [...base, 'modes'], value: [...(config.modes ?? DEFAULT_MODES)], open: `${kp}modes` } }] });
  }

  const customNodes = modesHead ? modesChildren : nodes;
  const usedCustom = CUSTOM_MODE_IDS.filter((id) => effectiveModes.includes(id));
  if (usedCustom.length) {
    const cmBase = override ? [...base, 'custom_modes'] : ['custom_modes'];
    if (override && !present('custom_modes')) {
      customNodes.push({ kind: 'note', key: `${kp}cm.note`, depth, text: `${usedCustom.join(', ')}: usa la definición global.` });
      customNodes.push({ kind: 'buttons', key: `${kp}cm.add`, depth, items: [{ label: '+ Definición propia de los modos personalizados', op: { op: 'set', path: cmBase, value: clone(config.custom_modes ?? {}), open: `${kp}cm` } }] });
    } else {
      const defs = [];
      for (const id of usedCustom) {
        const n = id.slice(-1);
        const def = getPath(config, [...cmBase, id]) ?? {};
        const head = { kind: 'heading', key: `${kp}cm.${id}`, depth, level: 2, text: `Modo ${def.label || `Personalizado ${n}`} (${id})` };
        const children = [
          { kind: 'form', key: `${kp}cm.${id}.f`, depth, path: [...cmBase, id],
            schema: [{ name: '', type: 'grid', schema: [
              { name: 'label', label: 'Nombre', selector: { text: {} } },
              { name: 'icon', label: 'Ícono del modo', selector: { icon: {} } },
            ] }],
            data: { label: def.label ?? '', icon: def.icon ?? '' } },
          ...padNodes(config, [...cmBase, id], `${kp}cm.${id}.pad`, depth + 1, { allowDefault: false }),
        ];
        const done = DIRECTIONS.filter((dir) => getPath(config, [...cmBase, id, dir, 'action']) !== undefined).length;
        defs.push(...fold(head, children, { summary: done ? `${done} de 4 direcciones definidas` : 'sin direcciones definidas' }));
      }
      if (override) {
        const head = { kind: 'heading', key: `${kp}cm`, depth, level: 2, text: 'Modos personalizados propios',
          actions: [{ label: '✕', title: 'Usar la definición global', op: { op: 'delete', path: cmBase } }] };
        customNodes.push(...fold(head, defs, { summary: usedCustom.join(', ') }));
      } else {
        customNodes.push(...defs);
      }
    }
  }
  if (modesHead) {
    const names = (Array.isArray(effectiveModes) ? effectiveModes : []).map(modeLabel);
    nodes.push(...fold(modesHead, modesChildren, { summary: names.join(', ') }));
  }

  if (present('default_pad')) {
    const head = { kind: 'heading', key: `${kp}dp`, depth, level, text: 'Touchpad sin modo',
      actions: [{ label: '✕', title: 'Volver al predeterminado (flechas)', op: { op: 'delete', path: [...base, 'default_pad'] } }] };
    nodes.push(...fold(head, padNodes(config, [...base, 'default_pad'], `${kp}dp.pad`, depth + 1, { allowDefault: true }),
      { summary: 'personalizado' }));
  } else {
    const add = { kind: 'buttons', key: `${kp}dp.add`, depth,
      items: [{ label: '+ Personalizar touchpad sin modo', op: { op: 'set', path: [...base, 'default_pad'], value: override ? clone(config.default_pad ?? {}) : {}, open: `${kp}dp` } }] };
    if (override) nodes.push(add);
    else nodes.push(...fold({ kind: 'heading', key: `${kp}dp`, depth, level, text: 'Touchpad sin modo' }, [add], { summary: 'predeterminado (flechas)' }));
  }

  if (!override || present('streaming')) {
    const head = { kind: 'heading', key: `${kp}st`, depth, level, text: override ? 'Streaming propio' : 'Botones de streaming',
      actions: override ? [{ label: '✕', title: 'Usar el streaming global', op: { op: 'delete', path: [...base, 'streaming'] } }] : undefined };
    const streamingPath = [...base, 'streaming'];
    const slots = getPath(config, streamingPath) ?? [];
    const defaults = DEFAULT_STREAMING.map((source) => ({ source }));
    const children = [];
    const names = [];
    let customCount = 0;
    DEFAULT_STREAMING.forEach((defaultId, i) => {
      const entry = isPlainObject(slots[i]) ? slots[i] : {};
      const slotKey = `${kp}st.${i}`;
      const isCustom = ['icon', 'action', 'accent', 'palette'].some((k) => entry[k] !== undefined);
      if (isCustom) customCount += 1;
      names.push(shortLabel(SOURCE_OPTIONS, entry.source ?? defaultId).replace(/ \(.*\)$/, ''));
      const custom = isCustom || ctx.expanded?.has(slotKey);
      const schema = [{ name: 'source', label: `Botón ${i + 1}`, selector: { select: { mode: 'dropdown', options: SOURCE_OPTIONS } } }];
      if (custom) {
        schema.push(
          { name: 'icon', label: 'Ícono', selector: { icon: {} } },
          { name: 'accent', label: 'Color', helper: '#e50914 o 229, 9, 20. Vacío = el color de la app.', selector: { text: {} } },
        );
      }
      children.push({ kind: 'form', key: `${slotKey}.f`, depth, path: [...streamingPath, i], init: { path: streamingPath, value: defaults }, schema,
        data: { source: entry.source ?? defaultId, icon: entry.icon ?? '', accent: entry.accent ?? '' } });
      if (custom) {
        children.push(...assignmentNodes(config, [...streamingPath, i, 'palette'], `${slotKey}.pal`, depth + 1, 'Paleta de este botón', { init: { path: streamingPath, value: defaults } }));
        children.push(...actionNodes(config, [...streamingPath, i, 'action'], `${slotKey}.a`, depth + 1,
          { allowDefault: true, defaultLabel: 'Predeterminada (abrir la fuente)', types: ALL_ACTION_TYPES.filter((t) => t !== 'numpad') }));
        children.push({ kind: 'buttons', key: `${slotKey}.b`, depth: depth + 1,
          items: [{ label: 'Quitar personalización', op: { op: 'unset', path: [...streamingPath, i], keys: ['icon', 'action', 'accent', 'palette'], collapse: slotKey } }] });
      } else {
        children.push({ kind: 'buttons', key: `${slotKey}.b`, depth: depth + 1, items: [{ label: 'Personalizar ícono, color o acción', op: { op: 'expand', key: slotKey } }] });
      }
    });
    nodes.push(...fold(head, children, { summary: `${names.join(', ')}${customCount ? ` · ${plural(customCount, 'personalizado', 'personalizados')}` : ''}` }));
  } else {
    nodes.push({ kind: 'buttons', key: `${kp}st.add`, depth,
      items: [{ label: '+ Streaming propio', op: { op: 'set', path: [...base, 'streaming'], value: clone(config.streaming ?? DEFAULT_STREAMING.map((source) => ({ source }))), open: `${kp}st` } }] });
  }

  if (!override || present('buttons')) {
    const head = { kind: 'heading', key: `${kp}bt`, depth, level, text: override ? 'Botones propios' : 'Botones',
      actions: override ? [{ label: '✕', title: 'Usar los botones globales', op: { op: 'delete', path: [...base, 'buttons'] } }] : undefined };
    const buttons = getPath(config, [...base, 'buttons']) ?? {};
    const children = [];
    const changed = [];
    for (const id of Object.keys(DEFAULT_BUTTONS)) {
      const bKey = `${kp}bt.${id}`;
      const entry = buttons[id];
      if (entry === undefined) {
        children.push({ kind: 'heading', key: bKey, depth, level: 'item', text: `${BUTTON_LABELS[id]}: ${describeDefaultButton(id)}`,
          actions: [{ label: 'Personalizar', op: { op: 'set', path: [...base, 'buttons', id], value: {}, open: bKey } }] });
        continue;
      }
      changed.push(BUTTON_LABELS[id]);
      const bHead = { kind: 'heading', key: bKey, depth, level: 2, text: BUTTON_LABELS[id],
        actions: [{ label: 'Restablecer', title: 'Volver al predeterminado', op: { op: 'delete', path: [...base, 'buttons', id] } }] };
      const bChildren = [];
      if (id === 'top_left') bChildren.push({ kind: 'note', key: `${bKey}.n`, depth, text: 'Si solo manda Salir se oculta (ya está abajo). Con Roku, su lugar lo ocupa el selector TV | Roku.' });
      bChildren.push({ kind: 'form', key: `${bKey}.i`, depth, path: [...base, 'buttons', id],
        schema: [{ name: 'icon', label: 'Ícono', selector: { icon: {} } }], data: { icon: entry?.icon ?? '' } });
      bChildren.push(...actionNodes(config, [...base, 'buttons', id, 'action'], `${bKey}.a`, depth,
        { allowDefault: true, defaultLabel: `Predeterminada (${describeDefaultButton(id)})` }));
      children.push(...fold(bHead, bChildren, { summary: describeAction(entry?.action, { allowDefault: true, defaultText: describeDefaultButton(id) }) }));
    }
    nodes.push(...fold(head, children, { summary: changed.length ? `${plural(changed.length, 'personalizado', 'personalizados')}: ${changed.join(', ')}` : 'todos predeterminados' }));
  } else {
    nodes.push({ kind: 'buttons', key: `${kp}bt.add`, depth,
      items: [{ label: '+ Botones propios', op: { op: 'set', path: [...base, 'buttons'], value: clone(config.buttons ?? {}), open: `${kp}bt` } }] });
  }
  return nodes;
}

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

  const generalHead = { kind: 'heading', key: 'general', depth: 0, level: 1, text: 'General' };
  const general = [];
  general.push({ kind: 'form', key: 'general.f', depth: 0, path: [], defaults: { style: 'relieve', theme: 'dark' },
    schema: [
      { name: 'card_id', label: 'ID de la tarjeta', helper: 'Para recordar la TV elegida por cada usuario. Único por tarjeta.', selector: { text: {} } },
      { name: '', type: 'grid', schema: [
        { name: 'style', label: 'Estilo', selector: { select: { mode: 'dropdown', options: STYLE_OPTIONS } } },
        { name: 'theme', label: 'Tema', selector: { select: { mode: 'dropdown', options: THEME_OPTIONS } } },
      ] },
    ],
    data: { card_id: config.card_id ?? '', style: config.style ?? 'relieve', theme: config.theme ?? 'dark' } });
  general.push(...assignmentNodes(config, ['palette'], 'general.pal', 0, 'Paleta de la tarjeta'));
  if (config.control_mode_entity !== undefined || ctx.expanded?.has('cme')) {
    general.push({ kind: 'heading', key: 'cme', depth: 0, level: 3, text: 'Entidad de modo',
      actions: [{ label: '✕', title: 'Quitar', op: { op: 'delete', path: ['control_mode_entity'], collapse: 'cme' } }] });
    general.push({ kind: 'form', key: 'cme.f', depth: 0, path: [],
      schema: [{ name: 'control_mode_entity', label: 'input_select', helper: 'Sincroniza el modo activo con un input_select (sus opciones: menu, audio, custom1…).', selector: { entity: { filter: { domain: 'input_select' } } } }],
      data: { control_mode_entity: config.control_mode_entity ?? '' } });
  } else {
    general.push({ kind: 'buttons', key: 'cme.add', depth: 0, items: [{ label: '+ Entidad de modo (input_select)', op: { op: 'expand', key: 'cme' } }] });
  }
  const paletteName = typeof config.palette === 'string' ? config.palette : (isPlainObject(config.palette) ? 'paleta claro/oscuro' : '');
  const generalSummary = [config.card_id, shortLabel(STYLE_OPTIONS, config.style ?? 'relieve'), shortLabel(THEME_OPTIONS, config.theme ?? 'dark'), paletteName].filter(Boolean).join(' · ');
  nodes.push(...fold(generalHead, general, { summary: generalSummary, open: true }));

  const tvsHead = { kind: 'heading', key: 'tvs', depth: 0, level: 1, text: 'Televisores' };
  const tvNodes = [];
  const tvs = Array.isArray(config.tvs) ? config.tvs : [];
  tvs.forEach((tv, i) => {
    const t = isPlainObject(tv) ? tv : {};
    const kp = `tv${i}.`;
    const tvHead = { kind: 'heading', key: `${kp}h`, depth: 0, level: 2, text: `TV ${i + 1}${t.name ? ` · ${t.name}` : ''}`,
      actions: listActions(['tvs'], i, tvs.length, { canRemove: tvs.length > 1 }) };
    const children = [];
    children.push({ kind: 'form', key: `${kp}f`, depth: 1, path: ['tvs', i],
      schema: [
        { name: '', type: 'grid', schema: [
          { name: 'name', label: 'Nombre', selector: { text: {} } },
          { name: 'platform', label: 'Marca', selector: { select: { mode: 'dropdown', options: TV_PLATFORM_OPTIONS } } },
        ] },
        { name: 'entity', label: 'Entidad de la TV', required: true, selector: { entity: { filter: { domain: 'media_player' } } } },
      ],
      data: { name: t.name ?? '', entity: t.entity ?? '', platform: t.platform ?? normalizePlatform(t.type) } });

    children.push(...assignmentNodes(config, ['tvs', i, 'overrides', 'palette'], `${kp}pal`, 1, 'Paleta de esta TV'));

    const adds = [];
    if (t.companion === undefined) adds.push({ label: '+ Roku conectado', op: { op: 'set', path: ['tvs', i, 'companion'], value: {} } });
    if (t.overrides === undefined) adds.push({ label: '+ Configuración propia de esta TV', op: { op: 'set', path: ['tvs', i, 'overrides'], value: {}, open: `${kp}ov` } });
    if (adds.length) children.push({ kind: 'buttons', key: `${kp}add`, depth: 1, items: adds });
    if (t.companion !== undefined) {
      children.push({ kind: 'heading', key: `${kp}rk`, depth: 1, level: 3, text: 'Roku conectado',
        actions: [{ label: '✕', title: 'Quitar el Roku', op: { op: 'delete', path: ['tvs', i, 'companion'] } }] });
      const c = isPlainObject(t.companion) ? t.companion : {};
      children.push({ kind: 'form', key: `${kp}rk.f`, depth: 1, path: ['tvs', i, 'companion'],
        schema: [{ name: '', type: 'grid', schema: [
          { name: 'media_entity', label: 'media_player del Roku', selector: { entity: { filter: { domain: 'media_player' } } } },
          { name: 'remote_entity', label: 'remote del Roku', selector: { entity: { filter: { domain: 'remote' } } } },
        ] }],
        data: { media_entity: c.media_entity ?? c.entity ?? '', remote_entity: c.remote_entity ?? c.remote ?? '' } });
      children.push(...assignmentNodes(config, ['tvs', i, 'companion', 'palette'], `${kp}rk.pal`, 1, 'Paleta del modo Roku'));
    }
    if (t.overrides !== undefined) {
      const ovHead = { kind: 'heading', key: `${kp}ov`, depth: 1, level: 2, text: 'Configuración propia de esta TV',
        actions: [{ label: '✕', title: 'Quitar: usar la configuración global', op: { op: 'delete', path: ['tvs', i, 'overrides'] } }] };
      const ovChildren = [
        { kind: 'note', key: `${kp}ov.n`, depth: 1, text: 'Lo que agregues aquí reemplaza a la configuración global solo para esta TV.' },
        ...settingsNodes(config, ['tvs', i, 'overrides'], `${kp}ov.`, 1, ctx, true),
      ];
      const own = Object.entries(OVERRIDE_NAMES).filter(([k]) => isPlainObject(t.overrides) && t.overrides[k] !== undefined).map(([, name]) => name);
      children.push(...fold(ovHead, ovChildren, { summary: own.length ? own.join(', ') : 'sin cambios todavía' }));
    }

    const platform = t.platform ?? normalizePlatform(t.type);
    const tvSummary = [shortLabel(TV_PLATFORM_OPTIONS, platform), t.entity || 'sin entidad', t.companion !== undefined && 'con Roku', t.overrides !== undefined && 'config. propia']
      .filter(Boolean).join(' · ');
    tvNodes.push(...fold(tvHead, children, { summary: tvSummary, open: i === 0 }));
  });
  const used = new Set(tvs.map((tv) => tv?.entity));
  const suggestion = (ctx.mediaPlayers ?? []).find((id) => !used.has(id)) ?? '';
  tvNodes.push({ kind: 'buttons', key: 'tvs.add', depth: 0,
    items: [{ label: '+ Agregar TV', op: { op: 'push', path: ['tvs'], value: { name: '', entity: suggestion, platform: 'lg' }, open: `tv${tvs.length}.h` } }] });
  nodes.push(...fold(tvsHead, tvNodes, { summary: plural(tvs.length, 'TV', 'TVs'), open: true }));

  nodes.push(...settingsNodes(config, [], '', 0, ctx, false));
  nodes.push(...paletteSection(config));
  return nodes;
}

export { buildEditorView };
export { childrenByParent } from './fold.js';
