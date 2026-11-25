import { LitElement, html, nothing, unsafeCSS } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { normalizeConfig } from '../config/normalize.js';
import { applyFormChange, applyOp } from './ops.js';
import { sameJson } from './paths.js';
import { EDITOR_CSS } from './styles.js';
import { buildEditorView, childrenByParent } from './view.js';

let haFormReady = null;
function ensureHaForm() {
  if (globalThis.customElements?.get('ha-form')) return Promise.resolve();
  haFormReady ??= (async () => {
    try {
      const helpers = await window.loadCardHelpers?.();
      const card = await helpers?.createCardElement({ type: 'entities', entities: [] });
      await card?.constructor?.getConfigElement?.();
    } catch { }
    await customElements.whenDefined('ha-form');
  })();
  return haFormReady;
}

const computeLabel = (s) => s.label ?? s.name;
const computeHelper = (s) => s.helper;

class TvControlCardEditor extends LitElement {
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
    this._expanded = new Set();
    this._open = new Map();
    this._schemas = new Map();
  }

  setConfig(config) {
    this._config = config;
  }

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

  _toggleFold(e, node) {
    e.preventDefault();
    this._open.set(node.key, !this._isOpen(node));
    this.requestUpdate();
  }

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
      default:
        return html`<div class="ed-${node.kind}" data-key=${node.key} style=${indent}>${node.text}</div>`;
    }
  }

  _renderButton(item) {
    return html`<button type="button" title=${item.title ?? nothing} ?disabled=${!!item.disabled}
      @click=${(e) => {
        e.preventDefault();
        e.stopPropagation();
        this._onOp(item.op);
      }}>${item.label}</button>`;
  }

  _onFormChange(e, node) {
    e.stopPropagation();
    const next = applyFormChange(this._config, node, e.detail.value);
    if (node.open && !sameJson(next, this._config)) this._open.set(node.open, true);
    this._commit(next);
  }

  _onOp(op) {
    if (op.open) this._open.set(op.open, true);
    if (op.op === 'expand') {
      this._expanded.add(op.key);
      this.requestUpdate();
      return;
    }
    if (op.collapse) this._expanded.delete(op.collapse);
    this._commit(applyOp(this._config, op));
  }

  _commit(next) {
    if (sameJson(next, this._config)) {
      this.requestUpdate();
      return;
    }
    this._config = next;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: next }, bubbles: true, composed: true }));
  }
}

export { TvControlCardEditor };
