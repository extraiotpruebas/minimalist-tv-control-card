/* ============================================================================
 * §6  LA TARJETA (custom element)
 * ----------------------------------------------------------------------------
 * Ciclo de vida que sigue HA con cualquier tarjeta:
 *
 *   new TvControlCard()   constructor: crea el shadowRoot y UN listener de clic
 *   setConfig(config)     cada vez que cambia el YAML  → normalizeConfig + rebuild
 *   set hass(hass)        cada vez que cambia CUALQUIER entidad de HA (¡muy seguido!)
 *   connectedCallback     la tarjeta entra a la página
 *   disconnectedCallback  la tarjeta sale (cambio de vista, modo edición...)
 *
 * El render, con Lit (LitElement):
 *
 *   willUpdate()      antes de cada render: estado que depende de la TV (cambio de
 *                     settings, TV que se apagó, pausa del centro tras encender).
 *   render()          arma la "vista" (_view) y devuelve la plantilla (template.js).
 *                     Lit compara con lo que hay en pantalla y solo toca lo que
 *                     cambió. Es "idempotente": todo se calcula del estado actual,
 *                     por eso el bug del "tema pegado" de la v3 no puede ocurrir.
 *
 *   El estado propio (this._ui, _busy, _loading…) son objetos normales, no
 *   propiedades reactivas de Lit: cada cambio llama _schedule() = requestUpdate().
 *   set hass solo lo llama si cambió una entidad que nos importa, y Lit junta
 *   varios pedidos en un solo render.
 *
 * Lit reutiliza los nodos: los botones sobreviven a los updates de hass, y esa es
 * la base del arreglo del hold infinito (paso 4).
 * ========================================================================== */
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
  // El CSS de siempre: Lit lo convierte UNA vez en una hoja compartida por todas las
  // tarjetas (adoptedStyleSheets), con respaldo a <style> en navegadores viejos.
  static styles = unsafeCSS(CARD_CSS);

  constructor() {
    super();
    this._model = null;              // salida de normalizeConfig (congelada)
    this._hass = null;
    this._ui = { tvIndex: 0, mode: null, roku: false, numpad: false };  // estado PROPIO de la tarjeta
    this._appliedSettings = null;    // settings de la TV que ya se pintaron (para contar cambios)
    this._shownStatus = null;        // estado de la TV que muestra la pantalla AHORA
    this._pickerOpen = false;        // selector de TVs abierto
    this._toastState = { text: '', show: false };
    this._watched = [];              // objetos de estado vistos en el último set hass
    this._modeEntityState = undefined;
    this._restored = false;          // ¿ya se leyó la TV guardada en localStorage?
    this._toastTimer = 0;
    this._waiters = new StateWaiters();
    this._hold = null;               // presión en curso: { el, action, device, pointerId, active }
    this._timing = TIMING;           // la autoprueba del navegador lo reemplaza por tiempos cortos
    this._suppressClick = null;      // { el, until }: el click que sigue a un hold no debe re-enviar
    this._sequenceRunning = false;   // una secuencia a la vez (un doble toque no mezcla dos PINs)
    this._centerPress = null;        // { power, at }: qué cara tenía el centro al tocarlo
    this._centerGuardUntil = 0;      // hasta cuándo el centro ignora OK tras encender
    this._lastStatus = null;
    this._busy = new Map();          // entity → 'Encendiendo…' / 'Apagando…'
    this._loading = new Map();       // entity → índice del botón de streaming en curso
    this._stats = { builds: 0, applies: 0, updates: 0 };  // lo muestra el harness
  }

  /*
   * Lit crea el shadowRoot aquí (no en el constructor). Es el lugar para registrar
   * la delegación de eventos: un listener por TIPO de evento para todos los botones,
   * presentes y futuros. Como Lit reutiliza los nodos, nunca hay que volver a
   * registrarlos.
   */
  createRenderRoot() {
    const root = super.createRenderRoot();
    root.addEventListener('click', (e) => this._onClick(e));
    root.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    // Cualquiera de estos termina una presión. Se escucha en el shadowRoot (no
    // en el botón), así que da igual dónde se suelte el dedo.
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      root.addEventListener(type, () => this._stopHold());
    }
    // Escape cierra lo que esté abierto (numpad o selector de TVs).
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (this._ui.numpad) this._toggleNumpad(false);
      this._togglePicker(false);
    });
    // Mantener presionado en móvil abre el menú contextual: en los botones no.
    root.addEventListener('contextmenu', (e) => {
      if (e.target.closest?.('[data-act]')) e.preventDefault();
    });
    return root;
  }

  /* ----- API que usa Home Assistant ----- */

  setConfig(config) {
    // Si normalizeConfig lanza un Error, HA muestra la tarjeta roja con el mensaje.
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
    this._waiters.check(hass);       // primero las esperas: no dependen de qué cambió
    this._syncModeEntity(hass);
    if (this._watchedChanged(hass)) this._schedule();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    super.connectedCallback();
    this._watched = [];              // al volver a la página, repintar sí o sí
    document.addEventListener('visibilitychange', this._onVisibility);
    this._schedule();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Si la tarjeta sale de la página con un dedo encima, la presión termina aquí.
    this._stopHold();
    document.removeEventListener('visibilitychange', this._onVisibility);
    this._togglePicker(false);
    clearTimeout(this._toastTimer);
    // Las esperas de _waitFor NO se cancelan: HA desconecta y reconecta tarjetas
    // al cambiar de vista, y un flujo de "encender + elegir fuente" debe seguir.
    // Todas tienen timeout, así que no quedan colgadas.
  }

  getCardSize() {
    return 9;
  }

  // Dashboards de "secciones": la tarjeta ocupa 6 de 12 columnas por defecto y la
  // altura la decide su contenido (no se define `rows`).
  getGridOptions() {
    return { columns: 6, min_columns: 4 };
  }

  /** HA pide el editor visual al abrir "Editar tarjeta". */
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

  /* ----- estado derivado ----- */

  get _tv() {
    return this._model.tvs[this._ui.tvIndex] ?? this._model.tvs[0];
  }

  /** Pad del touchpad según el modo activo (o el default si no hay modo). */
  get _pad() {
    const settings = this._tv.settings;
    return (this._ui.mode && settings.modeDefs[this._ui.mode]?.pad) || settings.defaultPad;
  }

  get _storageKey() {
    // Misma clave que producción, para que el cliente conserve su TV elegida al actualizar.
    return `tv-card__${this._model.cardId}__${this._hass?.user?.id || 'default'}`;
  }

  /* ----- reacción a hass ----- */

  _restoreTv() {
    if (this._restored || !this._hass) return;
    this._restored = true;
    const saved = Number.parseInt(storage.get(this._storageKey), 10);
    if (saved >= 0 && saved < this._model.tvs.length) this._ui.tvIndex = saved;
    this._ui.roku = this._loadRokuMode();
  }

  /** Clave de producción: el modo Roku se recuerda por TV y por usuario. */
  get _rokuKey() {
    return `tv-card__roku__${this._model.cardId}__${this._hass?.user?.id || 'default'}__${this._tv.entity}`;
  }

  /** Igual que producción: si nunca se eligió, una TV con Roku arranca en modo Roku. */
  _loadRokuMode() {
    if (!this._tv.companion) return false;
    return storage.get(this._rokuKey) !== '0';
  }

  /** Entidades cuyo cambio debe repintar la tarjeta. Cualquier otra se ignora. */
  _watchedEntities() {
    const tv = this._tv;
    return [tv.entity, tv.companion?.entity, this._model.controlModeEntity].filter(Boolean);
  }

  /**
   * HA nunca modifica un objeto de estado: cuando una entidad cambia, crea un
   * objeto NUEVO. Entonces basta comparar referencias (===), sin revisar campo
   * por campo. Es como comparar punteros en C en vez de hacer memcmp.
   */
  _watchedChanged(hass) {
    const next = this._watchedEntities().map((id) => hass.states[id]);
    // Con theme: auto, también importa si HA cambió entre claro y oscuro.
    next.push(this._model.theme === 'auto' ? !!hass.themes?.darkMode : null);
    const changed = next.length !== this._watched.length || next.some((st, i) => st !== this._watched[i]);
    this._watched = next;
    return changed;
  }

  /** control_mode_entity (p. ej. un input_select) fija el modo desde HA, igual que en producción. */
  _syncModeEntity(hass) {
    const id = this._model.controlModeEntity;
    const st = id ? hass.states[id] : undefined;
    if (!st || st === this._modeEntityState) return;
    this._modeEntityState = st;
    const value = has(MODE_ALIASES, st.state) ? MODE_ALIASES[st.state] : st.state;
    this._ui.mode = this._tv.settings.modes.includes(value) ? value : null;
  }

  /** Espera a que `entityId` cumpla `predicate`. Resuelve true, o false si pasa `timeoutMs`. */
  _waitFor(entityId, predicate, timeoutMs) {
    return this._waiters.wait(this._hass, entityId, predicate, timeoutMs);
  }

  /* ----- render ----- */

  /** Pide un render. Lit junta varios pedidos seguidos en uno solo. */
  _schedule() {
    this.requestUpdate();
  }

  /** 'light' | 'dark'. Con theme: auto se sigue el modo oscuro de HA. */
  get _theme() {
    if (this._model.theme !== 'auto') return this._model.theme;
    return this._hass?.themes?.darkMode ? 'dark' : 'light';
  }

  /** Lit lo llama UNA vez, cuando crea el DOM por primera vez. */
  firstUpdated() {
    this._stats.builds++;
  }

  /*
   * Antes de cada render: el estado que depende de la TV. Va aquí y no en render()
   * porque cambia cosas (cierra el numpad, corta un hold): render() solo describe.
   */
  willUpdate() {
    if (!this._model) return;
    this._stats.updates++;
    const tv = this._tv;
    const settings = tv.settings;
    if (this._appliedSettings !== settings) {
      // Otra TV con su propia configuración: si el modo activo no existe en ella, se apaga.
      this._stats.applies++;
      if (this._ui.mode && !settings.modes.includes(this._ui.mode)) this._ui.mode = null;
      this._appliedSettings = settings;
    }

    const status = tvStatus(this._hass?.states?.[tv.entity]);
    // Con la TV apagada o sin conexión, los controles que le hablan a la TV se
    // BLOQUEAN (disabled en la plantilla): un hold en curso se corta, y el numpad
    // se cierra para que el centro "Encender" quede a la vista.
    if (status !== 'on') {
      if (this._hold) this._stopHold();
      this._ui.numpad = false;
    }
    // Justo cuando la TV pasa a 'on', el centro ignora OK un momento: un doble toque
    // a "Encender" no debe terminar mandando un OK a la TV recién prendida.
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

  /**
   * Todo lo que muestra la tarjeta, calculado desde el estado actual: qué TV, si
   * está prendida, qué app, qué modo… La plantilla (template.js) solo lo pinta.
   */
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
    // Paleta: la del botón de la app activa, la del modo Roku o la de la tarjeta.
    // Como todo lo demás, se recalcula en cada render: al salir de Netflix, la
    // paleta "cine" desaparece sola (styleMap borra los tokens que ya no vienen).
    const theme = this._theme;
    const appSlot = now.sourceId ? settings.streaming.find((sl) => sl.source.id === now.sourceId) : null;
    const palette = resolvePalette({
      palettes: this._model.palettes, theme, roku,
      appRef: appSlot?.palette, rokuRef: tv.companion?.palette, cardRef: settings.palette,
    });
    // Los botones que abren el numpad dicen si está abierto (aria-expanded).
    const expanded = (action) => (action?.type === 'numpad' ? String(this._ui.numpad) : undefined);
    const pad = this._pad;
    const loadingIndex = this._loading.get(tv.entity);

    // Botón propio del encabezado (el "exit" de arriba de los YAML viejos). Si solo
    // repite el EXIT de abajo, se oculta: era un duplicado. Con Roku, su lugar lo
    // ocupa el selector TV | Roku.
    const topLeft = buttons.top_left;
    const isPlainExit = topLeft.action?.type === 'key' && topLeft.action.key === 'exit';

    return {
      style: this._model.style,
      // La paleta decide si la tarjeta es clara u oscura (su `base`).
      theme: palette?.base ?? theme,
      paletteStyle: paletteTokens(palette),
      status,
      mode: this._ui.mode ?? 'default',
      roku,
      busy: !!busy,
      numpad: this._ui.numpad,
      multi: this._model.tvs.length > 1,
      // Se recalcula en cada render: si no hay color, la variable se BORRA
      // (por eso el "tema pegado" de la v3 ya no puede ocurrir).
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

  /* ----- eventos ----- */

  /** La acción "de teclado" de un botón (pad, centro, abajo), o null si no aplica. */
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
    // closest() sube desde el nodo tocado hasta encontrar un [data-act]. Así un
    // toque sobre el <ha-icon> de dentro cuenta como toque al botón.
    const el = e.target.closest?.('[data-act]');
    if (!el || !this._model || !this.hasUpdated) return;

    // Un hold ya envió la acción en el pointerdown: el click que el navegador
    // dispara al soltar no debe mandarla otra vez.
    const suppress = this._suppressClick;
    if (suppress?.el === el && performance.now() < suppress.until) {
      this._suppressClick = null;
      return;
    }

    if (el.disabled) return;   // bloqueado (TV apagada)
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
      case 'picker':   return this._togglePicker();
      case 'tv':       return this._selectTv(Number(el.dataset.index));
    }
  }

  /**
   * Las teclas repetibles (solo las flechas, ver HOLDABLE_KEYS) se manejan en
   * pointerdown para responder al instante y poder repetir. Todo lo demás sigue en click.
   */
  _onPointerDown(e) {
    if (e.button !== 0 || !this._model || !this.hasUpdated) return;   // solo botón principal / dedo
    const el = e.target.closest?.('[data-act]');
    if (!el || el.disabled) return;
    if (el.dataset.act === 'center') {
      // Lo que cuenta es la cara que se VEÍA al tocar, no la que haya al soltar:
      // un toque que empezó como "Encender" nunca termina mandando un OK.
      this._centerPress = { power: this._shownStatus !== 'on', at: performance.now() };
      if (this._centerPress.power) return;   // como Encender no hay hold
    }
    const action = this._actionFor(el);
    if (!isHoldable(action)) return;
    this._suppressClick = { el, until: Infinity };
    this._startHold(el, action, e.pointerId);
  }

  _onVisibility = () => {
    if (document.hidden) this._stopHold();   // la app pasó a segundo plano
  };

  /**
   * Bucle del hold. Diferencia clave con producción/v3: NO hay setInterval.
   * Es un bucle `async` que hace await de cada envío, así que nunca hay dos
   * llamadas en vuelo, y que revisa `hold.active` en cada vuelta. Para pararlo
   * basta con poner active = false (eso hace _stopHold); no hay ningún timer
   * huérfano que pueda seguir mandando teclas.
   */
  async _startHold(el, action, pointerId) {
    this._stopHold();
    const device = this._route(action);
    const hold = { el, pointerId, active: true };
    this._hold = hold;
    el.classList.add('pressed');
    // La captura hace que el pointerup llegue a este botón aunque el dedo se
    // haya movido fuera. (En eventos sintéticos de prueba lanza: no importa.)
    try { el.setPointerCapture(pointerId); } catch { /* sin captura */ }
    this._haptic();

    const { holdDelay, holdInterval, holdMaxRepeats } = this._timing;
    try {
      await executeAction(this._hass, action, device);
      await delay(holdDelay);
      for (let i = 0; i < holdMaxRepeats && hold.active; i++) {
        const started = performance.now();
        await executeAction(this._hass, action, device);
        // Si HA tardó más que el intervalo, la siguiente sale de inmediato; si
        // tardó menos, se espera lo que falta. Nunca hay envíos en paralelo.
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
    } catch { /* ya no había captura */ }
    // El click que viene justo después de soltar se ignora (ver _onClick).
    if (this._suppressClick?.el === hold.el) this._suppressClick.until = performance.now() + 600;
  }

  /** Un toque, un evento háptico (antes había casos con dos). */
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

  /**
   * Una secuencia (p. ej. un PIN) tarda: N pasos con `delay` entre ellos. Si se
   * vuelve a tocar el botón mientras corre, el segundo toque se ignora; si no,
   * las dos secuencias se intercalarían en la TV (1-1-2-2-3-3-4-4).
   */
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

  /**
   * Teclas del numpad: SIEMPRE van a la TV, también en modo Roku. El Roku no tiene
   * dígitos, así que los números ya irían a la TV; el OK del numpad debe ir al
   * mismo lugar que los números (si no, un PIN escrito en la TV se confirmaría en el Roku).
   */
  _numpadKey(action) {
    this._haptic();
    const tv = this._tv;
    this._run(action, { platform: tv.platform, entity: tv.entity });
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

  /* ----- flujos de encendido y fuentes ----- */

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

  /**
   * Garantiza que la TV esté prendida. Nunca usa toggle. Devuelve true si HA
   * confirmó 'on' dentro del tiempo límite.
   */
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

  /**
   * Encender/apagar. NUNCA usa media_player.toggle: con un estado viejo o
   * 'unavailable', un toggle puede apagar una TV que en realidad está prendida.
   *   on → turn_off      off / unavailable → turn_on
   * Mientras se espera la confirmación, más toques se ignoran (antes cada toque
   * extra era otro toggle).
   */
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

  /**
   * Solo enciende; NUNCA apaga. Si la TV ya está prendida no hace nada. Lo usan el
   * power (cuando la TV no está on) y el centro del touchpad en su cara "Encender":
   * así, aunque HA tenga un estado viejo, tocar el centro no puede apagar la TV.
   */
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

  /** Centro del touchpad: OK con la TV prendida, Encender con la TV apagada. */
  _onCenter() {
    // Si el click viene de un toque reciente, manda la cara que se veía al tocar;
    // si viene del teclado (click sin pointerdown), la que se ve ahora.
    const press = this._centerPress;
    this._centerPress = null;
    const recent = press && performance.now() - press.at < 1500;
    const asPower = recent ? press.power : this._shownStatus !== 'on';
    if (asPower) return this._turnOn();
    if (performance.now() < this._centerGuardUntil) return;
    return this._press(this._tv.settings.buttons.center.action);
  }

  /**
   * select_source + esperar a que HA reporte esa fuente. Arreglo del bug B3:
   * antes se esperaban 5 s ANTES de mandar y se revisaba el estado una sola vez.
   * Ahora se manda de inmediato y se espera la confirmación (máx. 6 s), con un
   * reintento.
   */
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

  /**
   * Botón de streaming:
   *   1. Si la TV no está prendida, la enciende y espera a que HA lo confirme.
   *      (Si no se confirma, sigue igual: el estado de HA puede ir atrasado.)
   *   2. Con acción propia configurada → la ejecuta.
   *   3. En modo Roku, o si la app solo existe en el Roku (p. ej. Fubo) → abre la
   *      app en el Roku. En el segundo caso antes pone la TV en la entrada del Roku.
   *   4. Si no → select_source en la TV, con confirmación.
   */
  async _stream(index) {
    // `tv` se captura AHORA: si el usuario cambia de TV a mitad del flujo, este
    // flujo sigue trabajando con la TV original (closure).
    const tv = this._tv;
    const slot = tv.settings.streaming[index];
    if (!slot || this._loading.has(tv.entity)) return;   // ya hay un cambio de fuente en curso
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
        // Por puerto no se espera confirmación: HA reporta el NOMBRE de la entrada
        // ("PlayStation"), que no dice si es el HDMI 2. Si falla, el catch avisa.
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

  /** Selector TV | Roku del encabezado: a quién se controla. */
  _setRoku(on) {
    if (!this._tv.companion || this._ui.roku === on) return;
    this._haptic();
    this._stopHold();
    this._ui.roku = on;
    storage.set(this._rokuKey, on ? '1' : '0');
    this._schedule();
  }

  /** Igual que producción: tocar el modo activo lo desactiva (vuelve al pad default). */
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
    // El listener en document existe SOLO mientras el popup está abierto
    // (la v3 agregaba uno nuevo en cada render y nunca los quitaba).
    if (open) document.addEventListener('pointerdown', this._onOutsidePointer, true);
    else document.removeEventListener('pointerdown', this._onOutsidePointer, true);
    this._schedule();
  }

  /*
   * Campo de clase con arrow function: `this` queda fijo a la tarjeta, y la
   * referencia es siempre la misma, así que removeEventListener la encuentra.
   *
   * composedPath() es la ruta real del evento, incluidos los nodos dentro del
   * shadowRoot. e.target no sirve aquí: desde document, el navegador "disfraza"
   * el target como la tarjeta completa (retargeting), y por eso la condición de
   * la v3 siempre daba lo mismo.
   */
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
