import { DIRECTIONS } from '../config/catalogs.js';

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function getPath(obj, path) {
  let cur = obj;
  for (const k of path) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[k];
  }
  return cur;
}

function setPath(obj, path, value) {
  if (path.length === 0) return value;
  const [k, ...rest] = path;
  const base = Array.isArray(obj) ? [...obj] : isPlainObject(obj) ? { ...obj } : (typeof k === 'number' ? [] : {});
  const next = setPath(base[k], rest, value);
  if (next === undefined) {
    if (Array.isArray(base)) base.splice(k, 1);
    else delete base[k];
  } else {
    base[k] = next;
  }
  return base;
}

function deletePath(obj, path) {
  let out = setPath(obj, path, undefined);
  for (let i = path.length - 1; i > 0; i--) {
    const parent = getPath(out, path.slice(0, i));
    if (!isPlainObject(parent) || Object.keys(parent).length > 0) break;
    out = setPath(out, path.slice(0, i), undefined);
  }
  return out;
}

function fieldNames(schema) {
  return schema.flatMap((item) => (Array.isArray(item.schema) && !item.name ? fieldNames(item.schema) : [item.name]));
}

function expandShortcuts(config) {
  if (!isPlainObject(config)) return {};
  const toEntry = (v) => (v !== null && v !== undefined && !isPlainObject(v) ? { action: v } : v);
  const fixPad = (p) => (isPlainObject(p)
    ? Object.fromEntries(Object.entries(p).map(([k, v]) => [k, DIRECTIONS.includes(k) ? toEntry(v) : v]))
    : p);
  const fixSettings = (s) => {
    const out = { ...s };
    if (isPlainObject(s.buttons)) out.buttons = Object.fromEntries(Object.entries(s.buttons).map(([k, v]) => [k, toEntry(v)]));
    if (isPlainObject(s.custom_modes)) out.custom_modes = Object.fromEntries(Object.entries(s.custom_modes).map(([k, v]) => [k, fixPad(v)]));
    if (isPlainObject(s.default_pad)) out.default_pad = fixPad(s.default_pad);
    return out;
  };
  const out = fixSettings(config);
  if (Array.isArray(out.tvs)) {
    out.tvs = out.tvs.map((tv) => (isPlainObject(tv) && isPlainObject(tv.overrides) ? { ...tv, overrides: fixSettings(tv.overrides) } : tv));
  }
  return out;
}

export { clone, deletePath, expandShortcuts, fieldNames, getPath, isPlainObject, sameJson, setPath };
