/* Módulo §7: el elemento del editor (Lit). La lógica pura está en view.js y ops.js. */
import { LitElement, html, nothing, unsafeCSS } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { normalizeConfig } from '../config/normalize.js';
import { applyFormChange, applyOp } from './ops.js';
import { sameJson } from './paths.js';
import { EDITOR_CSS } from './styles.js';
import { buildEditorView } from './view.js';

/**
 * HA carga <ha-form> bajo demanda. Si nuestro editor se abre antes, se fuerza la
 * carga pidiendo el editor de una tarjeta nativa (truco estándar de las tarjetas
 * custom). Se hace una sola vez para todas las instancias.
 */
let haFormReady = null;
function ensureHaForm() {
  if (globalThis.customElements?.get('ha-form')) return Promise.resolve();
  haFormReady ??= (async () => {
    try {
      const helpers = await window.loadCardHelpers?.();
      const card = await helpers?.createCardElement({ type: 'entities', entities: [] });
      await card?.constructor?.getConfigElement?.();
    } catch { /* si falla, se espera a que HA lo defina por su cuenta */ }
    await customElements.whenDefined('ha-form');
  })();
  return haFormReady;
}

const computeLabel = (s) => s.label ?? s.name;
const computeHelper = (s) => s.helper;

/*
 * Con Lit, render() DESCRIBE el editor completo a partir de la config; Lit compara
 * con lo que ya está en pantalla y solo toca lo que cambió. Lo que antes hacía
 * _reconcile a mano (reutilizar cada elemento por su `key` para no perder el foco)
 * lo hace la directiva repeat(): mismo `key` → mismo elemento en el DOM.
 */
class TvControlCardEditor extends LitElement {
  // Propiedades "reactivas": al asignarles un valor nuevo, Lit agenda un render.
  // `state: true` = estado interno (no es un atributo HTML ni API pública).
  static properties = {
    _config: { state: true },
    _formReady: { state: true },
  };

  static styles = unsafeCSS(EDITOR_CSS);

  constructor() {
    super();
    this._config = null;
    this._formReady = false;
    this._hass = null;
    this._expanded = new Set();     // "Personalizar" abierto pero aún sin datos (no va al YAML)
    this._schemas = new Map();      // key → { json, schema }: el MISMO objeto mientras no cambie
  }

  setConfig(config) {
    this._config = config;
  }

  /*
   * HA manda un hass nuevo con CADA cambio de cualquier entidad. El editor no
   * depende de los estados (solo la lista de entidades para sugerir), así que no
   * se vuelve a pintar todo: se le pasa el hass nuevo a cada <ha-form> y listo.
   * Solo el primero agenda un render (antes no había ninguno).
   */
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    for (const form of this.renderRoot?.querySelectorAll?.('ha-form') ?? []) form.hass = hass;
    if (first) this.requestUpdate();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    super.connectedCallback();
    ensureHaForm().then(() => { this._formReady = true; });
  }

  render() {
    if (!this._config || !this._formReady) return nothing;
    let model = null;
    let error = null;
    try {
      model = normalizeConfig(this._config);
    } catch (err) {
      error = err.message;
    }
    const mediaPlayers = Object.keys(this._hass?.states ?? {}).filter((id) => id.startsWith('media_player.'));
    const nodes = buildEditorView(this._config, { model, error, expanded: this._expanded, mediaPlayers });
    return html`<div class="ed">${repeat(nodes, (node) => node.key, (node) => this._renderNode(node))}</div>`;
  }

  /**
   * buildEditorView crea un schema NUEVO en cada render. Si se le pasara siempre uno
   * nuevo, <ha-form> reharía sus campos (y el campo donde escribes perdería el foco).
   * Por eso se reutiliza el objeto anterior mientras su contenido sea igual.
   */
  _schemaFor(node) {
    const json = JSON.stringify(node.schema);
    const cached = this._schemas.get(node.key);
    if (cached?.json === json) return cached.schema;
    this._schemas.set(node.key, { json, schema: node.schema });
    return node.schema;
  }

  _renderNode(node) {
    const indent = `margin-inline-start: ${(node.depth ?? 0) * 16}px`;
    switch (node.kind) {
      case 'form':
        return html`<ha-form
          data-key=${node.key}
          style=${indent}
          .hass=${this._hass}
          .schema=${this._schemaFor(node)}
          .data=${node.data}
          .computeLabel=${computeLabel}
          .computeHelper=${computeHelper}
          @value-changed=${(e) => this._onFormChange(e, node)}
        ></ha-form>`;
      case 'heading':
        return html`<div class="ed-h l${node.level}" data-key=${node.key} style=${indent}>
          <span>${node.text}</span>${(node.actions ?? []).map((item) => this._renderButton(item))}
        </div>`;
      case 'alert':
        return html`<div class="ed-alert ${node.level}" data-key=${node.key} style=${indent}>
          <div>${node.text}</div>
          ${node.actions?.length ? html`<div class="ed-btns">${node.actions.map((item) => this._renderButton(item))}</div>` : nothing}
        </div>`;
      case 'buttons':
        return html`<div class="ed-btns" data-key=${node.key} style=${indent}>${node.items.map((item) => this._renderButton(item))}</div>`;
      default:   // 'note'
        return html`<div class="ed-${node.kind}" data-key=${node.key} style=${indent}>${node.text}</div>`;
    }
  }

  _renderButton(item) {
    return html`<button type="button" title=${item.title ?? nothing} ?disabled=${!!item.disabled}
      @click=${() => this._onOp(item.op)}>${item.label}</button>`;
  }

  _onFormChange(e, node) {
    e.stopPropagation();   // el editor solo avisa a HA con config-changed
    this._commit(applyFormChange(this._config, node, e.detail.value));
  }

  _onOp(op) {
    if (op.op === 'expand') {
      this._expanded.add(op.key);
      this.requestUpdate();   // un Set modificado por dentro no avisa solo: se pide el render
      return;
    }
    if (op.collapse) this._expanded.delete(op.collapse);
    this._commit(applyOp(this._config, op));
  }

  /** Guarda la config nueva, avisa a HA (que repinta la vista previa) y repinta el editor. */
  _commit(next) {
    if (sameJson(next, this._config)) {
      // Sin cambios (p. ej. un valor inválido): se repinta para que los campos vuelvan a la config.
      this.requestUpdate();
      return;
    }
    this._config = next;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: next }, bubbles: true, composed: true }));
  }
}

export { TvControlCardEditor };
