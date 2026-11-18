/**
 * Minimalist TV Control Card — v4
 *
 * Punto de entrada. Vite parte de este archivo, sigue sus `import` y junta todo en
 * UN solo archivo: dist/minimalist-tv-control-card.js (el que se instala en HA).
 *
 * Mapa de módulos (las secciones § son las del antiguo archivo único):
 *   §1  actions/keys.js         Tabla de teclas semánticas (KEYS)
 *   §2  actions/parse.js        parseAction(): lo que venga del YAML → un objeto
 *   §3  platforms.js            Drivers: cómo habla cada marca con Home Assistant
 *   §4  execute.js              executeAction(): ejecuta una acción sobre un dispositivo
 *   §5  config/catalogs.js      Catálogos (fuentes, modos, botones)
 *       config/normalize.js     normalizeConfig()
 *   §6  card/logic.js           Lógica pura de la tarjeta (estado, ruteo, pantalla)
 *       card/styles.js          CSS
 *       card/skeleton.js        HTML base y ayudantes de DOM
 *       card/tv-control-card.js La tarjeta (custom element)
 *   §7  editor/*.js             El editor visual (lógica pura + elemento)
 *       util.js, tag.js, version.js
 *
 * Los `export` del final no los usa HA: sirven para que las pruebas de Node
 * importen las funciones puras sin navegador.
 */
import { CARD_VERSION } from './version.js';
import { DEFAULT_CARD_TAG, CARD_TAG, EDITOR_TAG, tagFromUrl, setCardTag } from './tag.js';
import { TvControlCard } from './card/tv-control-card.js';
import { TvControlCardEditor } from './editor/tv-control-card-editor.js';

// El ?tag= viaja en la URL de ESTE archivo (ver tag.js).
setCardTag(tagFromUrl(import.meta.url));

/*
 * Registro. Se protege por dos razones:
 *   - En Node no existe customElements (los tests importan este archivo).
 *   - Si HA carga el recurso dos veces (p. ej. con ?v=1 y ?v=2), un segundo
 *     define() con el mismo nombre lanzaría un error y rompería el dashboard.
 */
if (globalThis.customElements && !customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, TvControlCardEditor);
if (globalThis.customElements && !customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, TvControlCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === CARD_TAG)) {
    window.customCards.push({
      type: CARD_TAG,
      name: CARD_TAG === DEFAULT_CARD_TAG ? 'Minimalist TV Control Card' : `Minimalist TV Control Card (${CARD_TAG})`,
      description: 'Control para TVs LG y Samsung, con Roku opcional.',
      preview: false,
      documentationURL: 'https://github.com/extraiotpruebas/minimalist-tv-control-card',
    });
  }
  console.info(`%c TV-CONTROL-CARD %c ${CARD_VERSION} `, 'background:#0a84ff;color:#fff;border-radius:3px 0 0 3px', 'background:#333;color:#fff;border-radius:0 3px 3px 0');
}

/* ============================================================================
 * EXPORTS (para los tests de Node; HA los ignora)
 * ========================================================================== */
export { CARD_VERSION, TvControlCard };
export { KEYS, HOLDABLE_KEYS, TV_ONLY_KEYS, CODE_TO_KEY } from './actions/keys.js';
export { parseAction, resolveForPlatform, isHoldable, stripSsap } from './actions/parse.js';
export { tvStatus, StateWaiters, describeNow, routeAction, sourceMatches, resolveSourceName } from './card/logic.js';
export { SOURCES, FIXED_MODES, DEFAULT_BUTTONS } from './config/catalogs.js';
export { normalizeConfig, STYLES } from './config/normalize.js';
export { actionToForm, formToAction } from './editor/action-form.js';
export { applyFormChange, applyOp } from './editor/ops.js';
export { setPath, deletePath, getPath } from './editor/paths.js';
export { serializeV4 } from './editor/serialize.js';
export { buildEditorView } from './editor/view.js';
export { executeAction } from './execute.js';
export { PLATFORMS, UnsupportedActionError, getPlatform } from './platforms.js';
