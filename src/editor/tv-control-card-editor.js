/* Módulo §7: el elemento del editor (DOM). La lógica pura está en view.js y ops.js. */
import { normalizeConfig } from '../config/normalize.js';
import { applyFormChange, applyOp } from './ops.js';
import { sameJson } from './paths.js';
import { EDITOR_CSS } from './styles.js';
import { buildEditorView } from './view.js';
import { BaseElement } from '../util.js';

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

class TvControlCardEditor extends BaseElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>${EDITOR_CSS}</style><div class="ed"></div>`;
    this._root = this.shadowRoot.querySelector('.ed');
    this._els = new Map();          // key → elemento: así se reutilizan entre renders
    this._expanded = new Set();     // "Personalizar" abierto pero aún sin datos (no va al YAML)
    this._config = null;
    this._hass = null;
    this.shadowRoot.addEventListener('click', (e) => {
      const btn = e.target.closest?.('button[data-op]');
      if (btn) this._onButton(btn);
    });
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    for (const el of this._els.values()) if (el._kind === 'form') el.hass = hass;
    if (first) this._render();
  }

  connectedCallback() {
    ensureHaForm().then(() => this._render());
  }

  _render() {
    if (!this._config || !globalThis.customElements?.get('ha-form')) return;
    let model = null;
    let error = null;
    try {
      model = normalizeConfig(this._config);
    } catch (err) {
      error = err.message;
    }
    const mediaPlayers = Object.keys(this._hass?.states ?? {}).filter((id) => id.startsWith('media_player.'));
    this._reconcile(buildEditorView(this._config, { model, error, expanded: this._expanded, mediaPlayers }));
  }

  /** Pinta los nodos en orden, reutilizando por `key` y quitando los que ya no están. */
  _reconcile(nodes) {
    const keep = new Set();
    nodes.forEach((node, i) => {
      let el = this._els.get(node.key);
      if (!el || el._kind !== node.kind) {
        el = this._create(node);
        this._els.set(node.key, el);
      }
      keep.add(node.key);
      this._fill(el, node);
      if (this._root.children[i] !== el) this._root.insertBefore(el, this._root.children[i] ?? null);
    });
    for (const [key, el] of this._els) {
      if (!keep.has(key)) {
        el.remove();
        this._els.delete(key);
      }
    }
  }

  _create(node) {
    let el;
    if (node.kind === 'form') {
      el = document.createElement('ha-form');
      el.computeLabel = (s) => s.label ?? s.name;
      el.computeHelper = (s) => s.helper;
      el.addEventListener('value-changed', (e) => {
        e.stopPropagation();   // el editor solo avisa a HA con config-changed
        this._commit(applyFormChange(this._config, el._node, e.detail.value));
      });
    } else {
      el = document.createElement('div');
    }
    el._kind = node.kind;
    return el;
  }

  _fill(el, node) {
    el._node = node;
    el.dataset.key = node.key;
    el.style.marginInlineStart = `${(node.depth ?? 0) * 16}px`;
    if (node.kind === 'form') {
      el.hass = this._hass;
      const schemaJson = JSON.stringify(node.schema);
      if (el._schemaJson !== schemaJson) {
        el._schemaJson = schemaJson;
        el.schema = node.schema;
      }
      el.data = node.data;
      return;
    }
    // Títulos, notas, botones y avisos: se rehacen (no tienen foco que cuidar).
    el.className = node.kind === 'heading' ? `ed-h l${node.level}` : node.kind === 'alert' ? `ed-alert ${node.level}` : `ed-${node.kind === 'buttons' ? 'btns' : node.kind}`;
    const ops = [];
    const button = (item) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = item.label;
      if (item.title) b.title = item.title;
      b.disabled = !!item.disabled;
      b.dataset.op = String(ops.push(item.op) - 1);
      return b;
    };
    el._ops = ops;
    if (node.kind === 'buttons') {
      el.replaceChildren(...node.items.map(button));
    } else if (node.kind === 'heading') {
      const span = document.createElement('span');
      span.textContent = node.text;
      el.replaceChildren(span, ...(node.actions ?? []).map(button));
    } else if (node.kind === 'alert') {
      const text = document.createElement('div');
      text.textContent = node.text;
      const children = [text];
      if (node.actions?.length) {
        const row = document.createElement('div');
        row.className = 'ed-btns';
        row.append(...node.actions.map(button));
        children.push(row);
      }
      el.replaceChildren(...children);
    } else {
      el.textContent = node.text;
    }
  }

  _onButton(btn) {
    const host = btn.closest('[data-key]');
    const op = host?._ops?.[Number(btn.dataset.op)];
    if (!op) return;
    if (op.op === 'expand') {
      this._expanded.add(op.key);
      this._render();
      return;
    }
    if (op.collapse) this._expanded.delete(op.collapse);
    this._commit(applyOp(this._config, op));
  }

  /** Guarda la config nueva, avisa a HA (que repinta la vista previa) y repinta el editor. */
  _commit(next) {
    if (sameJson(next, this._config)) {
      this._render();
      return;
    }
    this._config = next;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: next }, bubbles: true, composed: true }));
    this._render();
  }
}

export { TvControlCardEditor };
