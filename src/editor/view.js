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
import { KEYS } from '../actions/keys.js';
import { parseAction } from '../actions/parse.js';
import { CUSTOM_MODE_IDS, DEFAULT_BUTTONS, DEFAULT_PAD, DEFAULT_STREAMING, DIRECTIONS, FIXED_MODES } from '../config/catalogs.js';
import { normalizePlatform } from '../config/normalize.js';
import { actionSchema, actionToForm } from './action-form.js';
import { ALL_ACTION_TYPES, BRANDS, BRAND_ACTION_TYPES, BUTTON_LABELS, DEFAULT_MODES, DIRECTION_LABELS, SOURCE_OPTIONS, STEP_ACTION_TYPES, STYLE_OPTIONS, THEME_OPTIONS, TV_PLATFORM_OPTIONS } from './catalogs.js';
import { clone, expandShortcuts, getPath, isPlainObject } from './paths.js';

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

export { buildEditorView };
