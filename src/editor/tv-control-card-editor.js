/* Módulo §7: el elemento del editor (Lit). La lógica pura está en view.js y ops.js. */
import { LitElement, html, nothing, unsafeCSS } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { normalizeConfig } from '../config/normalize.js';
import { applyFormChange, applyOp } from './ops.js';
import { sameJson } from './paths.js';
import { EDITOR_CSS } from './styles.js';
import { buildEditorView, childrenByParent } from './view.js';

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
    this._open = new Map();         // key de un panel → abierto/cerrado, SOLO si el usuario lo cambió (no va al YAML)
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
    return html`<div class="ed">${this._renderChildren(childrenByParent(nodes), null)}</div>`;
  }

  /**
   * La lista de nodos es plana, pero cada nodo sabe su `parent` (un encabezado con
   * `fold` = panel). Aquí se pinta el árbol: los hijos de un panel solo se crean
   * mientras está abierto, así un editor con muchas secciones cerradas es liviano.
   */
  _renderChildren(tree, parent) {
    const base = parent?.fold.base ?? 0;
    return repeat(tree.get(parent?.key ?? '') ?? [], (node) => node.key,
      (node) => (node.fold ? this._renderFold(node, tree, base) : this._renderNode(node, base)));
  }

  _isOpen(node) {
    return this._open.has(node.key) ? this._open.get(node.key) : node.fold.open;
  }

  _renderFold(node, tree, base) {
    const open = this._isOpen(node);
    const indent = `margin-inline-start: ${Math.max(0, (node.depth ?? 0) - base) * 16}px`;
    return html`<details class="ed-fold l${node.level}" data-key=${node.key} style=${indent} ?open=${open}>
      <summary @click=${(e) => this._toggleFold(e, node)}>
        <span class="ed-fold-main">
          <span class="ed-fold-title">${node.text}</span>
          ${node.fold.summary ? html`<span class="ed-fold-sum">${node.fold.summary}</span>` : nothing}
        </span>
        ${(node.actions ?? []).map((item) => this._renderButton(item))}
      </summary>
      ${open ? html`<div class="ed-fold-body">${this._renderChildren(tree, node)}</div>` : nothing}
    </details>`;
  }

  /**
   * El editor es el ÚNICO dueño del estado abierto/cerrado. Se cancela el plegado
   * nativo del <details> y se pinta según `_open`: si el navegador y Lit lo cambiaran
   * a la vez (el evento `toggle` llega después), un repintado en medio deshacía el clic.
   */
  _toggleFold(e, node) {
    e.preventDefault();
    this._open.set(node.key, !this._isOpen(node));
    this.requestUpdate();
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

  _renderNode(node, base = 0) {
    const indent = `margin-inline-start: ${Math.max(0, (node.depth ?? 0) - base) * 16}px`;
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
      case 'swatches':
        return html`<div class="ed-swatches" data-key=${node.key} style=${indent}>${node.colors.map((c) => html`<span
          class="ed-sw ${c.base ? 'base' : ''}" style="background:${c.color}"
          title="${c.label}: ${c.color}${c.base ? ' (de la base)' : ''}"></span>`)}</div>`;
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
      @click=${(e) => {
        // Los botones de un panel viven dentro de su <summary>: sin esto, pulsarlos también lo plegaría.
        e.preventDefault();
        e.stopPropagation();
        this._onOp(item.op);
      }}>${item.label}</button>`;
  }

  _onFormChange(e, node) {
    e.stopPropagation();   // el editor solo avisa a HA con config-changed
    const next = applyFormChange(this._config, node, e.detail.value);
    if (node.open && !sameJson(next, this._config)) this._open.set(node.open, true);   // p. ej. la paleta recién copiada
    this._commit(next);
  }

  _onOp(op) {
    if (op.open) this._open.set(op.open, true);   // lo recién agregado se muestra abierto
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
