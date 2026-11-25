/*
 * Módulo §6: la plantilla de la tarjeta (Lit).
 *
 * cardTemplate(v) DESCRIBE la tarjeta completa a partir de `v`, un objeto con todo
 * lo que hay que mostrar (lo arma TvControlCard._view()). Lit compara con lo que ya
 * está en pantalla y solo toca lo que cambió: los botones son siempre los MISMOS
 * nodos, y por eso un hold no pierde su botón aunque lleguen updates de hass.
 *
 * Es el mismo HTML que tenía el antiguo SKELETON (mismas clases, data-act y
 * data-ref), así el CSS no cambió en nada. Los data-ref ya no los usa la tarjeta;
 * se conservan como marcas estables para la autoprueba.
 *
 * Tres detalles de Lit que importan aquí:
 *   - `attr=${x ?? nothing}`: con `nothing` Lit QUITA el atributo (antes: setAttr con null).
 *   - `?hidden=${cond}`: atributo booleano, existe o no existe.
 *   - classMap({...}): solo agrega o quita las clases que nombra y respeta las demás.
 *     Importa en los botones del touchpad: el hold les pone `pressed` por su cuenta,
 *     y un render a mitad del hold no debe borrarla.
 */
import { html, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { KEYS } from '../actions/keys.js';
import { NUMPAD_DIGITS } from '../config/catalogs.js';

const icon = (name) => name ?? nothing;

/** Un botón de la fila de abajo (back, home, exit, menu). */
function bottomKey(v, id) {
  const b = v.bottom[id];
  return html`<button type="button" class="key" data-act="bottom" data-id=${id} aria-label=${KEYS[id].label}
    aria-expanded=${b.expanded ?? nothing} ?disabled=${v.locked}><ha-icon icon=${icon(b.icon)}></ha-icon></button>`;
}

/**
 * Una dirección del touchpad. classMap debe ser la ÚNICA expresión del atributo
 * class, así que la clase de la dirección (`dir up`) también va dentro.
 */
function padButton(v, dir) {
  const p = v.pad[dir];
  return html`<button type="button" class=${classMap({ dir: true, [dir]: true, empty: p.empty })} data-act="pad" data-dir=${dir}
    aria-label=${KEYS[dir].label} aria-expanded=${p.expanded ?? nothing} ?disabled=${v.locked}><ha-icon icon=${icon(p.icon)}></ha-icon></button>`;
}

function cardTemplate(v) {
  return html`
<ha-card class="card ${classMap({ multi: v.multi })}" data-ref="card"
  data-style=${v.style} data-theme=${v.theme} data-status=${v.status} data-mode=${v.mode}
  data-roku=${String(v.roku)} data-busy=${String(v.busy)} data-numpad=${String(v.numpad)}
  style=${styleMap({ ...v.paletteStyle, '--tv-accent': v.accent ?? undefined, '--tv-glow': v.accent ?? undefined })}>
  <div class="body">
    <header class="head">
      <button type="button" class="tv-name" data-act="picker" data-ref="status" aria-haspopup="listbox" aria-expanded=${String(v.pickerOpen)}>
        <span data-ref="name">${v.name}</span><ha-icon class="chevron" icon="mdi:chevron-down"></ha-icon>
      </button>
      <div class="switch" data-ref="switch" role="group" aria-label="Controlar" ?hidden=${!v.hasCompanion}>
        <button type="button" data-act="target" data-id="tv" aria-pressed=${String(!v.roku)}>TV</button>
        <button type="button" data-act="target" data-id="roku" aria-pressed=${String(v.roku)}>Roku</button>
      </div>
      <button type="button" class="round" data-act="top_left" data-ref="topLeft" ?hidden=${v.topLeft.hidden}
        aria-label=${v.topLeft.label} aria-expanded=${v.topLeft.expanded ?? nothing}><ha-icon icon=${icon(v.topLeft.icon)}></ha-icon></button>
      <button type="button" class="round power" data-act="power" data-ref="power" aria-label="Encender o apagar"><ha-icon icon=${icon(v.powerIcon)}></ha-icon></button>
    </header>
    <div class="picker" data-ref="picker" role="listbox" ?hidden=${!v.pickerOpen}>${repeat(v.tvs, (tv) => tv.index, (tv) =>
      html`<button type="button" class="picker-item ${classMap({ active: tv.active })}" data-act="tv" data-index=${tv.index} role="option" aria-selected=${String(tv.active)}><ha-icon class="tv-ico" icon=${tv.icon}></ha-icon><span>${tv.name}</span><ha-icon class="check" icon="mdi:check"></ha-icon></button>`)}</div>
    <div class="screen" aria-live="polite">
      <div class="glass">
        <ha-icon class="now-icon" data-ref="nowIcon" icon=${icon(v.now.icon)}></ha-icon>
        <div class="now-text">
          <div class="now-title" data-ref="state">${v.now.title}</div>
          <div class="now-sub" data-ref="nowSub">${v.now.sub || nothing}</div>
        </div>
      </div>
    </div>
    <section class="apps">${v.streaming.map((s) =>
      html`<button type="button" class="app ${classMap({ active: s.active, loading: s.loading })}" data-act="stream" data-index=${s.index} aria-label=${s.name}><ha-icon icon=${icon(s.icon)}></ha-icon></button>`)}</section>
    <section class="pad">
      ${padButton(v, 'up')}${padButton(v, 'left')}${padButton(v, 'right')}${padButton(v, 'down')}
      <button type="button" class="ok" data-act="center" data-ref="center" aria-label=${v.centerIsPower ? 'Encender' : 'OK'}>
        <span class="ok-face"><ha-icon data-ref="centerIcon" icon=${icon(v.centerIcon)}></ha-icon><span>OK</span></span>
        <span class="ok-power" aria-hidden="true"><ha-icon data-ref="centerPower" icon=${icon(v.centerPowerIcon)}></ha-icon></span>
      </button>
    </section>
    <section class="numpad" data-ref="numpad" role="group" aria-label="Teclado numérico">
      ${NUMPAD_DIGITS.map((d) => html`<button type="button" class="key num" data-act="digit" data-digit=${d}>${d}</button>`)}
      <button type="button" class="key num" data-act="numpad_close" aria-label="Cerrar teclado"><ha-icon icon="mdi:close"></ha-icon></button>
      <button type="button" class="key num" data-act="digit" data-digit="0">0</button>
      <button type="button" class="key num" data-act="numpad_ok" aria-label="OK"><ha-icon icon="mdi:keyboard-return"></ha-icon></button>
    </section>
    <nav class="modes" data-ref="modes" role="radiogroup" aria-label="Modo del touchpad">${repeat(v.modes, (m) => m.id, (m) =>
      html`<button type="button" class="mode" data-act="mode" data-id=${m.id} role="radio" aria-checked=${String(m.checked)} ?disabled=${v.locked}><ha-icon icon=${icon(m.icon)}></ha-icon><span>${m.label}</span></button>`)}</nav>
    <footer class="keys">
      ${bottomKey(v, 'back')}${bottomKey(v, 'home')}${bottomKey(v, 'exit')}${bottomKey(v, 'menu')}
    </footer>
    <div class="toast ${classMap({ show: v.toast.show })}" data-ref="toast" role="status" aria-live="polite">${v.toast.text}</div>
  </div>
</ha-card>`;
}

export { cardTemplate };
