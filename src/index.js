import { CARD_VERSION } from './version.js';
import { DEFAULT_CARD_TAG, CARD_TAG, EDITOR_TAG, tagFromUrl, setCardTag } from './tag.js';
import { TvControlCard } from './card/tv-control-card.js';
import { TvControlCardEditor } from './editor/tv-control-card-editor.js';

setCardTag(tagFromUrl(import.meta.url));

const inBrowser = typeof window !== 'undefined' && !!globalThis.customElements;
if (inBrowser && !customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, TvControlCardEditor);
if (inBrowser && !customElements.get(CARD_TAG)) {
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

export { CARD_VERSION, TvControlCard };
export { KEYS, HOLDABLE_KEYS, TV_ONLY_KEYS, CODE_TO_KEY } from './actions/keys.js';
export { parseAction, resolveForPlatform, isHoldable, stripSsap } from './actions/parse.js';
export { tvStatus, StateWaiters, describeNow, paletteTokens, resolvePalette, routeAction, sourceMatches, resolveSourceName } from './card/logic.js';
export { BUILTIN_PALETTES, PALETTE_FIELDS, contrastRatio, normalizeHex, paletteRef } from './config/palettes.js';
export { SOURCES, FIXED_MODES, DEFAULT_BUTTONS } from './config/catalogs.js';
export { normalizeConfig, STYLES } from './config/normalize.js';
export { actionToForm, formToAction } from './editor/action-form.js';
export { applyFormChange, applyOp } from './editor/ops.js';
export { setPath, deletePath, getPath } from './editor/paths.js';
export { serializeV4 } from './editor/serialize.js';
export { buildEditorView, childrenByParent } from './editor/view.js';
export { mapPaletteRefs, removePalette, renamePalette, renameRef } from './editor/palettes.js';
export { executeAction } from './execute.js';
export { PLATFORMS, UnsupportedActionError, getPlatform } from './platforms.js';
