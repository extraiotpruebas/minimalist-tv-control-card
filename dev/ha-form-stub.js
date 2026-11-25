customElements.define('ha-form', class extends HTMLElement {
  constructor() {
    super();
    this._data = {};
    this._schema = [];
    this._sig = '';
  }

  connectedCallback() { this.style.display = 'block'; }

  set hass(h) { this._hass = h; }
  get hass() { return this._hass; }
  set schema(s) { this._schema = s || []; this._sync(); }
  get schema() { return this._schema; }
  set data(d) { this._data = d || {}; this._sync(); }
  get data() { return this._data; }
  set computeLabel(fn) { if (fn === this._computeLabel) return; this._computeLabel = fn; this._sig = ''; this._sync(); }
  get computeLabel() { return this._computeLabel; }
  set computeHelper(fn) { if (fn === this._computeHelper) return; this._computeHelper = fn; this._sig = ''; this._sync(); }
  get computeHelper() { return this._computeHelper; }

  _fields(schema = this._schema) {
    return schema.flatMap((f) => (Array.isArray(f.schema) && !f.name ? this._fields(f.schema) : [f]));
  }

  _sync() {
    const sig = JSON.stringify(this._schema);
    if (sig !== this._sig) {
      this._sig = sig;
      this._build();
    }
    for (const input of this.querySelectorAll('[data-name]')) {
      if (input === document.activeElement || this.contains(document.activeElement) && input.matches(':focus')) continue;
      this._setValue(input, this._data[input.dataset.name]);
    }
  }

  _setValue(input, value) {
    if (input.type === 'checkbox') input.checked = !!value;
    else if (input.type === 'color') input.value = Array.isArray(value) ? `#${value.map((n) => Number(n).toString(16).padStart(2, '0')).join('')}` : '#000000';
    else if (input.tagName === 'TEXTAREA') input.value = value && Object.keys(value).length ? JSON.stringify(value) : '';
    else input.value = value ?? '';
  }

  _build() {
    this.replaceChildren();
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px 10px;';
    for (const field of this._fields()) {
      const label = document.createElement('label');
      label.style.cssText = 'display:grid;gap:2px;font-size:12px;opacity:.9';
      const caption = document.createElement('span');
      caption.textContent = this.computeLabel?.(field) ?? field.name;
      const input = this._input(field);
      input.dataset.name = field.name;
      input.style.cssText = 'font:inherit;font-size:13px;padding:5px 6px;border-radius:6px;border:1px solid #8886;background:#0002;color:inherit;min-width:0';
      label.append(caption, input);
      const help = this.computeHelper?.(field);
      if (help) {
        const small = document.createElement('small');
        small.textContent = help;
        small.style.opacity = '.6';
        label.append(small);
      }
      wrap.append(label);
    }
    this.append(wrap);
  }

  _input(field) {
    const sel = field.selector || {};
    let input;
    if (sel.select) {
      if (sel.select.custom_value) {
        input = document.createElement('input');
        const list = document.createElement('datalist');
        list.id = `dl-${Math.random().toString(36).slice(2)}`;
        for (const o of sel.select.options) list.append(new Option(o.label, o.value));
        input.setAttribute('list', list.id);
        queueMicrotask(() => input.after(list));
      } else {
        input = document.createElement('select');
        input.add(new Option('—', ''));
        for (const o of sel.select.options) input.add(new Option(o.label, o.value));
      }
    } else if (sel.entity) {
      input = document.createElement('input');
      const domains = [].concat(sel.entity.filter?.domain ?? []);
      const list = document.createElement('datalist');
      list.id = `dl-${Math.random().toString(36).slice(2)}`;
      for (const id of Object.keys(this._hass?.states ?? {})) {
        if (!domains.length || domains.includes(id.split('.')[0])) list.append(new Option(id, id));
      }
      input.setAttribute('list', list.id);
      queueMicrotask(() => input.after(list));
    } else if (sel.color_rgb) {
      input = document.createElement('input');
      input.type = 'color';
    } else if (sel.number) {
      input = document.createElement('input');
      input.type = 'number';
    } else if (sel.boolean) {
      input = document.createElement('input');
      input.type = 'checkbox';
    } else if (sel.object) {
      input = document.createElement('textarea');
      input.rows = 2;
      input.placeholder = '{"clave": "valor"}  (JSON)';
    } else {
      input = document.createElement('input');
      if (sel.icon) input.placeholder = 'mdi:…';
    }
    const emit = () => {
      let value;
      if (input.type === 'checkbox') value = input.checked;
      else if (input.type === 'color') value = [1, 3, 5].map((i) => parseInt(input.value.slice(i, i + 2), 16));
      else if (input.type === 'number') value = input.value === '' ? undefined : Number(input.value);
      else if (input.tagName === 'TEXTAREA') {
        if (input.value.trim() === '') value = {};
        else { try { value = JSON.parse(input.value); } catch { return; } }
      } else value = input.value;
      this._data = { ...this._data, [field.name]: value };
      this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: this._data }, bubbles: true, composed: true }));
    };
    const live = input.tagName === 'INPUT' && input.type !== 'checkbox' && !input.getAttribute('list');
    input.addEventListener(live ? 'input' : 'change', emit);
    return input;
  }
});
