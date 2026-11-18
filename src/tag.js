/*
 * Nombre del elemento. Por defecto 'tv-control-card'. Para probar la v4 en un HA
 * que YA tiene instalada otra versión, se carga el recurso con ?tag=…:
 *   /local/minimalist-tv-control-card.js?tag=tv-control-card-v4
 * y en el dashboard se usa `type: custom:tv-control-card-v4`. Así conviven las
 * dos versiones sin chocar (dos define() con el mismo nombre no pueden coexistir).
 *
 * ¿Por qué el tag se lee en index.js y no aquí? `import.meta.url` es la URL del
 * archivo donde se escribe. En el archivo final (dist/) todo es un solo archivo y
 * daría igual, pero en desarrollo cada módulo de src/ se carga con su propia URL,
 * y solo la ENTRADA (index.js) recibe el `?tag=`. Por eso index.js lee su URL y
 * llama setCardTag() antes de registrar los elementos.
 *
 * CARD_TAG y EDITOR_TAG son `let` exportados: los módulos que los importan ven
 * siempre el valor ACTUAL (los imports de ES modules son "vivos", no copias).
 */
export const DEFAULT_CARD_TAG = 'tv-control-card';
export let CARD_TAG = DEFAULT_CARD_TAG;
export let EDITOR_TAG = `${DEFAULT_CARD_TAG}-editor`;

/** Lee `?tag=` de una URL. Si falta o no es un nombre válido de custom element, da el de siempre. */
export function tagFromUrl(url) {
  try {
    const tag = new URL(url).searchParams.get('tag');
    return tag && /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(tag) ? tag : DEFAULT_CARD_TAG;
  } catch {
    return DEFAULT_CARD_TAG;
  }
}

/** Lo llama index.js UNA vez, antes de registrar los elementos. */
export function setCardTag(tag) {
  CARD_TAG = tag;
  EDITOR_TAG = `${tag}-editor`;
}
