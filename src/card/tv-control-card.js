import { LitElement, nothing, unsafeCSS } from 'lit';
import { isHoldable } from '../actions/parse.js';
import { CENTER_GUARD_MS, SOURCE_ATTEMPTS, StateWaiters, TIMING, describeNow, paletteTokens, resolvePalette, resolveSourceName, routeAction, sourceMatches, storage, tvStatus } from './logic.js';
import { CARD_CSS } from './styles.js';
import { cardTemplate } from './template.js';
import { BOTTOM_BUTTONS, DIRECTIONS, MODE_ALIASES, SOURCES_BY_ID } from '../config/catalogs.js';
import { normalizeConfig } from '../config/normalize.js';
import { executeAction } from '../execute.js';
import { UnsupportedActionError, getPlatform } from '../platforms.js';
import { CARD_TAG, EDITOR_TAG } from '../tag.js';
import { delay, has } from '../util.js';

class TvControlCard extends LitElement {
  static styles = unsafeCSS(CARD_CSS);

  constructor() {
    super();
    this._model = null;
    this._hass = null;
    this._ui = { tvIndex: 0, mode: null, roku: false, numpad: false };
    this._appliedSettings = null;
    this._shownStatus = null;
    this._pickerOpen = false;
    this._toastState = { text: '', show: false };
    this._watched = [];
    this._modeEntityState = undefined;
    this._restored = false;
    this._toastTimer = 0;
    this._waiters = new StateWaiters();
    this._hold = null;
    this._timing = TIMING;
    this._suppressClick = null;
    this._sequenceRunning = false;
    this._centerPress = null;
    this._centerGuardUntil = 0;
    this._lastStatus = null;
    this._busy = new Map();
    this._loading = new Map();
    this._stats = { builds: 0, applies: 0, updates: 0 };
  }

  createRenderRoot() {
    const root = super.createRenderRoot();
    root.addEventListener('click', (e) => this._onClick(e));
    root.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      root.addEventListener(type, () => this._stopHold());
    }
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target?.dataset?.ref === 'textInput') {
        e.preventDefault();
        this._textSend();
        return;
      }
      if (e.key !== 'Escape') return;
      if (this._ui.numpad) this._toggleNumpad(false);
      this._togglePicker(false);
    });
    root.addEventListener('contextmenu', (e) => {
      if (e.target.closest?.('[data-act]')) e.preventDefault();
    });
    return root;
  }

  setConfig(config) {
    const model = normalizeConfig(config);
    if (model.warnings.length) console.warn(`[${CARD_TAG}] ${model.cardId}:`, model.warnings);
    this._stopHold();
    this._togglePicker(false);
    this._model = model;
    this._ui = { tvIndex: 0, mode: null, roku: false, numpad: false };
    this._restored = false;
    this._appliedSettings = null;
    this._watched = [];
    this._modeEntityState = undefined;
    this._schedule();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._model) return;
    this._restoreTv();
    this._waiters.check(hass);
    this._syncModeEntity(hass);
    if (this._watchedChanged(hass)) this._schedule();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    super.connectedCallback();
    this._watched = [];
    document.addEventListener('visibilitychange', this._onVisibility);
    this._schedule();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopHold();
    document.removeEventListener('visibilitychange', this._onVisibility);
    this._togglePicker(false);
    clearTimeout(this._toastTimer);
  }

  getCardSize() {
    return 9;
  }

  getGridOptions() {
    return { columns: 6, min_columns: 4 };
  }

  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig(hass) {
    const entity = Object.keys(hass?.states ?? {}).find((id) => id.startsWith('media_player.')) ?? 'media_player.tv';
    return {
      card_id: 'mi_tv',
      tvs: [{ name: 'Mi TV', entity, platform: 'lg' }],
      modes: ['menu', 'busqueda', 'audio'],
    };
  }

  get _tv() {
    return this._model.tvs[this._ui.tvIndex] ?? this._model.tvs[0];
  }

  get _pad() {
    const settings = this._tv.settings;
    return (this._ui.mode && settings.modeDefs[this._ui.mode]?.pad) || settings.defaultPad;
  }

  get _storageKey() {
    return `tv-card__${this._model.cardId}__${this._hass?.user?.id || 'default'}`;
  }

  _restoreTv() {
    if (this._restored || !this._hass) return;
    this._restored = true;
    const saved = Number.parseInt(storage.get(this._storageKey), 10);
    if (saved >= 0 && saved < this._model.tvs.length) this._ui.tvIndex = saved;
    this._ui.roku = this._loadRokuMode();
  }

  get _rokuKey() {
    return `tv-card__roku__${this._model.cardId}__${this._hass?.user?.id || 'default'}__${this._tv.entity}`;
  }

  _loadRokuMode() {
    if (!this._tv.companion) return false;
    return storage.get(this._rokuKey) !== '0';
  }

  _watchedEntities() {
    const tv = this._tv;
    return [tv.entity, tv.companion?.entity, this._model.controlModeEntity].filter(Boolean);
  }

  _watchedChanged(hass) {
    const next = this._watchedEntities().map((id) => hass.states[id]);
    next.push(this._model.theme === 'auto' ? !!hass.themes?.darkMode : null);
    const changed = next.length !== this._watched.length || next.some((st, i) => st !== this._watched[i]);
    this._watched = next;
    return changed;
  }

  _syncModeEntity(hass) {
    const id = this._model.controlModeEntity;
    const st = id ? hass.states[id] : undefined;
    if (!st || st === this._modeEntityState) return;
    this._modeEntityState = st;
    const value = has(MODE_ALIASES, st.state) ? MODE_ALIASES[st.state] : st.state;
    this._ui.mode = this._tv.settings.modes.includes(value) ? value : null;
  }

  _waitFor(entityId, predicate, timeoutMs) {
    return this._waiters.wait(this._hass, entityId, predicate, timeoutMs);
  }

  _schedule() {
    this.requestUpdate();
  }

  get _theme() {
    if (this._model.theme !== 'auto') return this._model.theme;
    return this._hass?.themes?.darkMode ? 'dark' : 'light';
  }

  firstUpdated() {
    this._stats.builds++;
  }

  willUpdate() {
    if (!this._model) return;
    this._stats.updates++;
    const tv = this._tv;
    const settings = tv.settings;
    if (this._appliedSettings !== settings) {
      this._stats.applies++;
      if (this._ui.mode && !settings.modes.includes(this._ui.mode)) this._ui.mode = null;
      this._appliedSettings = settings;
    }

    const status = tvStatus(this._hass?.states?.[tv.entity]);
    if (status !== 'on') {
      if (this._hold) this._stopHold();
      this._ui.numpad = false;
      if (this._ui.mode === 'text') this._ui.mode = null;
    }
    if (status === 'on' && this._lastStatus !== null && this._lastStatus !== 'on') {
      this._centerGuardUntil = performance.now() + CENTER_GUARD_MS;
    }
    this._lastStatus = status;
    this._shownStatus = status;
  }

  render() {
    if (!this._model) return nothing;
    return cardTemplate(this._view());
  }

  _view() {
    const tv = this._tv;
    const settings = tv.settings;
    const { buttons } = settings;
    const st = this._hass?.states?.[tv.entity];
    const status = this._shownStatus;
    const roku = this._ui.roku && !!tv.companion;
    const busy = this._busy.get(tv.entity);
    const locked = status !== 'on';
    const centerIsPower = status !== 'on';
    const now = describeNow({
      status, busy, roku,
      hasCompanion: !!tv.companion,
      tvState: st,
      rokuState: roku ? this._hass?.states?.[tv.companion.entity] : null,
      streaming: settings.streaming,
    });
    const theme = this._theme;
    const appSlot = now.sourceId ? settings.streaming.find((sl) => sl.source.id === now.sourceId) : null;
    const palette = resolvePalette({
      palettes: this._model.palettes, theme, roku,
      appRef: appSlot?.palette, rokuRef: tv.companion?.palette, cardRef: settings.palette,
    });
    const expanded = (action) => (action?.type === 'numpad' ? String(this._ui.numpad) : undefined);
    const pad = this._pad;
    const loadingIndex = this._loading.get(tv.entity);

    const topLeft = buttons.top_left;
    const isPlainExit = topLeft.action?.type === 'key' && topLeft.action.key === 'exit';

    return {
      style: this._model.style,
      theme: palette?.base ?? theme,
      paletteStyle: paletteTokens(palette),
      status,
      mode: this._ui.mode ?? 'default',
      roku,
      busy: !!busy,
      numpad: this._ui.numpad,
      text: this._ui.mode === 'text',
      textNote: this._textNote(),
      multi: this._model.tvs.length > 1,
      accent: now.accent,
      locked,
      name: tv.name,
      hasCompanion: !!tv.companion,
      pickerOpen: this._pickerOpen,
      topLeft: {
        hidden: !topLeft.action || isPlainExit || !!tv.companion,
        icon: topLeft.icon,
        label: topLeft.action?.type === 'service' ? topLeft.action.data?.entity_id : 'Acción',
        expanded: expanded(topLeft.action),
      },
      powerIcon: buttons.power.icon,
      tvs: this._model.tvs.map((t, index) => ({
        index,
        name: t.name,
        active: index === this._ui.tvIndex,
        icon: t.platform === 'samsung' ? 'mdi:television' : 'mdi:television-play',
      })),
      now,
      streaming: settings.streaming.map((slot, index) => ({
        index,
        name: slot.source.name,
        active: !!now.sourceId && slot.source.id === now.sourceId,
        loading: loadingIndex === index,
        icon: loadingIndex === index ? 'mdi:loading' : slot.icon,
      })),
      pad: Object.fromEntries(DIRECTIONS.map((dir) => [dir, {
        icon: pad[dir].icon,
        empty: !pad[dir].action,
        expanded: expanded(pad[dir].action),
      }])),
      centerIsPower,
      centerIcon: buttons.center.icon,
      centerPowerIcon: busy && centerIsPower ? 'mdi:loading' : buttons.power.icon,
      modes: settings.modes.map((id) => ({
        id,
        label: settings.modeDefs[id].label,
        icon: settings.modeDefs[id].icon,
        checked: id === this._ui.mode,
      })),
      bottom: Object.fromEntries(BOTTOM_BUTTONS.map((id) => [id, { icon: buttons[id].icon, expanded: expanded(buttons[id].action) }])),
      toast: this._toastState,
    };
  }

  _actionFor(el) {
    const buttons = this._tv.settings.buttons;
    switch (el.dataset.act) {
      case 'pad':    return this._pad[el.dataset.dir]?.action ?? null;
      case 'center': return buttons.center.action;
      case 'bottom': return buttons[el.dataset.id]?.action ?? null;
      case 'top_left': return this._tv.companion ? null : buttons.top_left.action;
      default:       return null;
    }
  }

  _onClick(e) {
    const el = e.target.closest?.('[data-act]');
    if (!el || !this._model || !this.hasUpdated) return;

    const suppress = this._suppressClick;
    if (suppress?.el === el && performance.now() < suppress.until) {
      this._suppressClick = null;
      return;
    }

    if (el.disabled) return;
    switch (el.dataset.act) {
      case 'center':   return this._onCenter();
      case 'pad':
      case 'bottom':   return this._press(this._actionFor(el));
      case 'top_left': return this._press(this._actionFor(el));
      case 'target':   return this._setRoku(el.dataset.id === 'roku');
      case 'power':    return this._power();
      case 'stream':   return this._stream(Number(el.dataset.index));
      case 'mode':     return this._toggleMode(el.dataset.id);
      case 'digit':    return this._numpadKey({ type: 'key', key: `digit_${el.dataset.digit}` });
      case 'numpad_ok':    return this._numpadKey({ type: 'key', key: 'enter' });
      case 'numpad_close': return this._toggleNumpad(false);
      case 'text_send':    return this._textSend();
      case 'text_delete':  return this._textRun({ type: 'text', op: 'delete' });
      case 'text_enter':   return this._textRun({ type: 'text', op: 'enter' });
      case 'text_close':   return this._toggleMode('text');
      case 'picker':   return this._togglePicker();
      case 'tv':       return this._selectTv(Number(el.dataset.index));
    }
  }

  _onPointerDown(e) {
    if (e.button !== 0 || !this._model || !this.hasUpdated) return;
    const el = e.target.closest?.('[data-act]');
    if (!el || el.disabled) return;
    if (el.dataset.act === 'center') {
      this._centerPress = { power: this._shownStatus !== 'on', at: performance.now() };
      if (this._centerPress.power) return;
    }
    const action = this._actionFor(el);
    if (!isHoldable(action)) return;
    this._suppressClick = { el, until: Infinity };
    this._startHold(el, action, e.pointerId);
  }

  _onVisibility = () => {
    if (document.hidden) this._stopHold();
  };

  async _startHold(el, action, pointerId) {
    this._stopHold();
    const device = this._route(action);
    const hold = { el, pointerId, active: true };
    this._hold = hold;
    el.classList.add('pressed');
    try { el.setPointerCapture(pointerId); } catch { }
    this._haptic();

    const { holdDelay, holdInterval, holdMaxRepeats } = this._timing;
    try {
      await executeAction(this._hass, action, device);
      await delay(holdDelay);
      for (let i = 0; i < holdMaxRepeats && hold.active; i++) {
        const started = performance.now();
        await executeAction(this._hass, action, device);
        const rest = holdInterval - (performance.now() - started);
        if (rest > 0 && hold.active) await delay(rest);
      }
    } catch (err) {
      this._showError(err);
    } finally {
      if (this._hold === hold) this._stopHold();
    }
  }

  _stopHold() {
    const hold = this._hold;
    if (!hold) return;
    hold.active = false;
    this._hold = null;
    hold.el.classList.remove('pressed');
    try {
      if (hold.el.hasPointerCapture?.(hold.pointerId)) hold.el.releasePointerCapture(hold.pointerId);
    } catch { }
    if (this._suppressClick?.el === hold.el) this._suppressClick.until = performance.now() + 600;
  }

  _haptic(type = 'light') {
    this.dispatchEvent(new CustomEvent('haptic', { detail: type, bubbles: true, composed: true }));
  }

  _press(action) {
    if (!action) return;
    if (action.type === 'numpad') return this._toggleNumpad();
    if (action.type === 'sequence') return this._runSequence(action);
    this._haptic();
    this._run(action);
  }

  async _runSequence(action) {
    if (this._sequenceRunning) return;
    this._sequenceRunning = true;
    this._haptic();
    try {
      await this._run(action);
    } finally {
      this._sequenceRunning = false;
    }
  }

  _numpadKey(action) {
    this._haptic();
    const tv = this._tv;
    this._run(action, { platform: tv.platform, entity: tv.entity });
  }

  _textNote() {
    const platform = this._route({ type: 'text', text: ' ' }).platform;
    if (platform === 'lg') return 'En la LG solo escribe en los campos de texto de la propia TV (ajustes, buscador del sistema). No funciona en apps como YouTube o Netflix.';
    if (platform === 'roku') return 'Escribir en el Roku todavía no está disponible.';
    return 'Esta marca no soporta escribir texto desde la tarjeta.';
  }

  async _textRun(action) {
    this._haptic();
    try {
      await executeAction(this._hass, action, this._route(action));
      return true;
    } catch (err) {
      this._showError(err);
      return false;
    }
  }

  async _textSend() {
    const input = this.renderRoot.querySelector('[data-ref="textInput"]');
    const text = input?.value ?? '';
    if (text === '') {
      this._toast('Escribe un texto primero.');
      return;
    }
    if (this._textBusy) return;
    this._textBusy = true;
    try {
      if (await this._textRun({ type: 'text', text })) input.value = '';
    } finally {
      this._textBusy = false;
    }
  }

  _toggleNumpad(force) {
    const open = force ?? !this._ui.numpad;
    if (open === this._ui.numpad) return;
    if (open && tvStatus(this._hass?.states?.[this._tv.entity]) !== 'on') {
      this._toast('Enciende la TV para usar el teclado numérico.');
      return;
    }
    this._haptic();
    this._stopHold();
    this._ui.numpad = open;
    this._schedule();
  }

  _route(action) {
    return routeAction(action, { tv: this._tv, rokuMode: this._ui.roku, mode: this._ui.mode });
  }

  _run(action, device = this._route(action)) {
    return executeAction(this._hass, action, device).catch((err) => this._showError(err));
  }

  _setBusy(entity, label) {
    if (label) this._busy.set(entity, label);
    else this._busy.delete(entity);
    this._schedule();
  }

  _setLoading(entity, index) {
    if (index === null) this._loading.delete(entity);
    else this._loading.set(entity, index);
    this._schedule();
  }

  async _ensureOn(tv) {
    if (tvStatus(this._hass?.states?.[tv.entity]) === 'on') return true;
    this._setBusy(tv.entity, 'Encendiendo…');
    try {
      await getPlatform(tv.platform).turnOn(this._hass, { platform: tv.platform, entity: tv.entity });
      return await this._waitFor(tv.entity, (s) => tvStatus(s) === 'on', this._timing.powerOn);
    } finally {
      this._setBusy(tv.entity, null);
    }
  }

  async _power() {
    const tv = this._tv;
    if (this._busy.has(tv.entity)) return;
    if (tvStatus(this._hass?.states?.[tv.entity]) !== 'on') return this._turnOn();
    this._haptic();
    const custom = tv.settings.buttons.power.action;
    if (custom) return this._run(custom);
    this._setBusy(tv.entity, 'Apagando…');
    try {
      await getPlatform(tv.platform).turnOff(this._hass, { platform: tv.platform, entity: tv.entity });
      await this._waitFor(tv.entity, (s) => tvStatus(s) !== 'on', this._timing.powerOff);
    } catch (err) {
      this._showError(err);
    } finally {
      this._setBusy(tv.entity, null);
    }
  }

  async _turnOn() {
    const tv = this._tv;
    if (this._busy.has(tv.entity)) return;
    if (tvStatus(this._hass?.states?.[tv.entity]) === 'on') return;
    this._haptic();
    const custom = tv.settings.buttons.power.action;
    if (custom) return this._run(custom);
    try {
      if (!(await this._ensureOn(tv))) {
        this._toast(tv.platform === 'lg'
          ? 'La TV no confirmó el encendido. En LG, revisa que el encendido (Wake on LAN) esté configurado en HA.'
          : 'La TV no confirmó el encendido.');
      }
    } catch (err) {
      this._showError(err);
    }
  }

  _onCenter() {
    const press = this._centerPress;
    this._centerPress = null;
    const recent = press && performance.now() - press.at < 1500;
    const asPower = recent ? press.power : this._shownStatus !== 'on';
    if (asPower) return this._turnOn();
    if (performance.now() < this._centerGuardUntil) return;
    return this._press(this._tv.settings.buttons.center.action);
  }

  async _selectSourceConfirmed(device, candidates) {
    const platform = getPlatform(device.platform);
    const preferAppName = device.platform === 'roku';
    const name = resolveSourceName(this._hass?.states?.[device.entity], candidates);
    for (let attempt = 1; attempt <= SOURCE_ATTEMPTS; attempt++) {
      await platform.selectSource(this._hass, device, name);
      if (await this._waitFor(device.entity, (s) => sourceMatches(s, candidates, preferAppName), this._timing.sourceConfirm)) return true;
    }
    return false;
  }

  async _stream(index) {
    const tv = this._tv;
    const slot = tv.settings.streaming[index];
    if (!slot || this._loading.has(tv.entity)) return;
    const { source } = slot;
    const companion = tv.companion;
    const viaRoku = !slot.action && !!source.rokuSource && !!companion?.entity && (this._ui.roku || !source.service);
    if (!slot.action && !viaRoku && !source.service) {
      this._toast(`${source.name} solo está disponible a través de un Roku.`);
      return;
    }

    this._haptic();
    this._setLoading(tv.entity, index);
    const tvDevice = { platform: tv.platform, entity: tv.entity };
    try {
      await this._ensureOn(tv);
      let ok = true;
      if (slot.action) {
        await executeAction(this._hass, slot.action, this._route(slot.action));
      } else if (source.input) {
        await executeAction(this._hass, { type: 'input', input: source.input }, tvDevice);
      } else if (viaRoku) {
        if (!this._ui.roku) await this._selectSourceConfirmed(tvDevice, SOURCES_BY_ID.get('roku').alternates);
        ok = await this._selectSourceConfirmed({ platform: companion.platform, entity: companion.entity }, [source.rokuSource]);
      } else {
        ok = await this._selectSourceConfirmed(tvDevice, source.alternates ?? [source.service]);
      }
      if (!ok) this._toast(`No se pudo confirmar el cambio a ${source.name}.`);
    } catch (err) {
      this._showError(err);
    } finally {
      this._setLoading(tv.entity, null);
    }
  }

  _setRoku(on) {
    if (!this._tv.companion || this._ui.roku === on) return;
    this._haptic();
    this._stopHold();
    this._ui.roku = on;
    storage.set(this._rokuKey, on ? '1' : '0');
    this._schedule();
  }

  _toggleMode(id) {
    this._haptic();
    this._stopHold();
    this._ui.numpad = false;
    this._ui.mode = this._ui.mode === id ? null : id;
    this._schedule();
  }

  _togglePicker(force) {
    const open = force ?? !this._pickerOpen;
    if (open === this._pickerOpen || (open && !(this._model?.tvs.length > 1))) return;
    this._pickerOpen = open;
    if (open) document.addEventListener('pointerdown', this._onOutsidePointer, true);
    else document.removeEventListener('pointerdown', this._onOutsidePointer, true);
    this._schedule();
  }

  _onOutsidePointer = (e) => {
    const path = e.composedPath();
    const root = this.renderRoot;
    if (!path.includes(root.querySelector('.picker')) && !path.includes(root.querySelector('.tv-name'))) this._togglePicker(false);
  };

  _selectTv(index) {
    if (!(index >= 0 && index < this._model.tvs.length)) return;
    this._togglePicker(false);
    if (index === this._ui.tvIndex) return;
    this._haptic();
    this._stopHold();
    this._ui.tvIndex = index;
    this._ui.mode = null;
    this._ui.numpad = false;
    this._ui.roku = this._loadRokuMode();
    this._watched = [];
    storage.set(this._storageKey, index);
    this._schedule();
  }

  _toast(message) {
    if (!this.hasUpdated) return;
    this._toastState = { text: message, show: true };
    this._schedule();
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toastState = { ...this._toastState, show: false };
      this._schedule();
    }, 3500);
  }

  _showError(err) {
    console.warn(`[${CARD_TAG}]`, err);
    const message = err instanceof UnsupportedActionError ? err.message : `Error: ${err?.message ?? err}`;
    this._toast(message);
  }
}

export { TvControlCard };
