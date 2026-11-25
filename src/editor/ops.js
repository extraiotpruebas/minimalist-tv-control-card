import { formToAction } from './action-form.js';
import { clone, deletePath, expandShortcuts, fieldNames, getPath, sameJson, setPath } from './paths.js';
import { applyPaletteForm, removePalette } from './palettes.js';
import { serializeV4 } from './serialize.js';

function applyFormChange(rawConfig, node, data) {
  let config = expandShortcuts(rawConfig);
  if (node.init && getPath(config, node.init.path) === undefined) config = setPath(config, node.init.path, clone(node.init.value));

  switch (node.codec) {
    case 'action':
      return setPath(config, node.path, formToAction(data, getPath(config, node.path)));
    case 'modes': {
      const modes = ['m1', 'm2', 'm3'].map((k) => data[k] ?? node.data[k]).filter(Boolean);
      return setPath(config, [...node.path, 'modes'], modes);
    }
    case 'palette-ref':
    case 'palette-meta':
    case 'palette-color':
    case 'palette-copy':
      return applyPaletteForm(config, node, data);
    default: {
      let out = config;
      for (const name of fieldNames(node.schema)) {
        const value = data[name];
        if (sameJson(value, node.data[name])) continue;
        const empty = value === undefined || value === null || value === '' || node.defaults?.[name] === value;
        out = setPath(out, [...node.path, name], empty ? undefined : value);
      }
      return out;
    }
  }
}

function applyOp(rawConfig, op) {
  const config = expandShortcuts(rawConfig);
  switch (op.op) {
    case 'set': return setPath(config, op.path, clone(op.value));
    case 'delete': return deletePath(config, op.path);
    case 'unset':
      if (getPath(config, op.path) === undefined) return config;
      return op.keys.reduce((c, k) => setPath(c, [...op.path, k], undefined), config);
    case 'push': {
      const arr = getPath(config, op.path);
      return setPath(config, op.path, [...(Array.isArray(arr) ? arr : []), clone(op.value)]);
    }
    case 'remove': {
      const arr = [...(getPath(config, op.path) ?? [])];
      arr.splice(op.index, 1);
      return setPath(config, op.path, arr);
    }
    case 'move': {
      const arr = [...(getPath(config, op.path) ?? [])];
      const j = op.index + op.delta;
      if (j < 0 || j >= arr.length) return config;
      [arr[op.index], arr[j]] = [arr[j], arr[op.index]];
      return setPath(config, op.path, arr);
    }
    case 'palette-delete': return removePalette(config, op.name);
    case 'convert': return serializeV4(rawConfig);
    default: return config;
  }
}

export { applyFormChange, applyOp };
