/*
 * Utilidades pequeñas que usan varios módulos. Cada una estaba antes en la sección
 * donde se usó por primera vez (has en §2, delay en §4, deepFreeze/firstDefined en
 * §5, BaseElement en §6); al separar en módulos se juntan aquí para que ningún
 * módulo tenga que importar de otro solo por una utilidad.
 */

/**
 * ¿`obj` tiene la propiedad `key` PROPIA? Un objeto normal hereda propiedades
 * como 'toString' o 'constructor', así que `KEYS['toString']` NO es undefined.
 * Object.hasOwn solo mira las propiedades escritas en el propio objeto.
 */
const has = (obj, key) => typeof key === 'string' && Object.hasOwn(obj, key);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Object.freeze impide modificar un objeto (en modo módulo, intentarlo lanza
 * TypeError). Solo congela el primer nivel, por eso se recorre recursivamente.
 * Los catálogos y el modelo normalizado se comparten por referencia entre TVs:
 * congelarlos garantiza que nadie los cambie "por accidente" desde la tarjeta.
 */
function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const value of Object.values(obj)) deepFreeze(value);
  }
  return obj;
}

/** Devuelve el primer valor "útil": ni undefined, ni null, ni string vacío. */
function firstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

/*
 * En Node (los tests) no existe HTMLElement. Con `?? class {}` la clase se puede
 * declarar igual y los tests siguen importando el archivo sin navegador.
 * (?? = "si lo de la izquierda es null/undefined, usa lo de la derecha".)
 */
const BaseElement = globalThis.HTMLElement ?? class {};

export { BaseElement, deepFreeze, delay, firstDefined, has };
