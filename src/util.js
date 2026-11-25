const has = (obj, key) => typeof key === 'string' && Object.hasOwn(obj, key);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const value of Object.values(obj)) deepFreeze(value);
  }
  return obj;
}

function firstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

export { deepFreeze, delay, firstDefined, has };
