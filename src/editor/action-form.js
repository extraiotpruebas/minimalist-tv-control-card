import { parseAction } from '../actions/parse.js';
import { ACTION_UI_TYPES, ALL_ACTION_TYPES, INPUT_OPTIONS, KEY_OPTIONS, LG_COMMANDS } from './catalogs.js';
import { isPlainObject } from './paths.js';

function actionToForm(raw) {
  if (raw === undefined) return { type: 'default' };
  if (raw === null) return { type: 'none' };
  if (Array.isArray(raw)) return { type: 'sequence', delay: 400 };
  const a = isPlainObject(raw) ? raw : parseAction(raw);
  if (!isPlainObject(a)) return { type: 'none' };
  switch (a.type) {
    case 'key': return { type: 'key', key: a.key ?? '' };
    case 'source': return { type: 'source', source: a.source ?? '' };
    case 'input': return { type: 'input', input: a.input ?? '' };
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

function formToAction(data, prevRaw) {
  const prev = actionToForm(prevRaw);
  const changed = data.type !== prev.type;
  const v = changed ? {} : data;
  switch (data.type) {
    case 'default': return undefined;
    case 'none': return null;
    case 'key': return v.key ? v.key : { type: 'key', key: '' };
    case 'source': return { type: 'source', source: v.source ?? '' };
    case 'input': return v.input ? `input:${v.input}` : { type: 'input', input: '' };
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
      schema.push({ name: 'source', label: 'Fuente', helper: 'El nombre exacto de la lista de fuentes de la TV. Para un HDMI conviene "Entrada": no depende del nombre.', selector: { text: {} } });
      break;
    case 'input':
      schema.push({ name: 'input', label: 'Entrada', helper: 'Por puerto: funciona aunque la entrada tenga otro nombre en la TV. LG y Samsung.', selector: { select: { mode: 'dropdown', options: INPUT_OPTIONS } } });
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

export { actionSchema, actionToForm, formToAction };
