/* Módulo §6: esqueleto HTML de la tarjeta y ayudantes de DOM. */
import { KEYS } from '../actions/keys.js';
import { BOTTOM_BUTTONS, DEFAULT_STREAMING, DIRECTIONS, NUMPAD_DIGITS } from '../config/catalogs.js';

/* ---------- esqueleto del DOM ---------- */

/*
 * HTML 100% estático: no contiene NADA del YAML del usuario. Por eso puede vivir
 * en un <template> que el navegador parsea una vez; cada tarjeta lo clona con
 * cloneNode(true), que es más rápido que volver a parsear texto con innerHTML.
 *
 * data-act  = qué hace el botón (lo lee el único listener de clic: delegación).
 * data-ref  = nodos que _update necesita encontrar rápido (se guardan en this._refs).
 */
const SKELETON = `
<ha-card class="card" data-ref="card">
  <div class="body">
    <header class="head">
      <button type="button" class="tv-name" data-act="picker" data-ref="status" aria-haspopup="listbox" aria-expanded="false">
        <span data-ref="name"></span><ha-icon class="chevron" icon="mdi:chevron-down"></ha-icon>
      </button>
      <div class="switch" data-ref="switch" role="group" aria-label="Controlar">
        <button type="button" data-act="target" data-id="tv">TV</button>
        <button type="button" data-act="target" data-id="roku">Roku</button>
      </div>
      <button type="button" class="round" data-act="top_left" data-ref="topLeft"><ha-icon></ha-icon></button>
      <button type="button" class="round power" data-act="power" data-ref="power" aria-label="Encender o apagar"><ha-icon></ha-icon></button>
    </header>
    <div class="picker" data-ref="picker" role="listbox" hidden></div>
    <div class="screen" aria-live="polite">
      <div class="glass">
        <ha-icon class="now-icon" data-ref="nowIcon"></ha-icon>
        <div class="now-text">
          <div class="now-title" data-ref="state"></div>
          <div class="now-sub" data-ref="nowSub"></div>
        </div>
      </div>
    </div>
    <section class="apps">
      ${DEFAULT_STREAMING.map((_, i) => `<button type="button" class="app" data-act="stream" data-index="${i}"><ha-icon></ha-icon></button>`).join('')}
    </section>
    <section class="pad">
      ${DIRECTIONS.map((dir) => `<button type="button" class="dir ${dir}" data-act="pad" data-dir="${dir}" aria-label="${KEYS[dir].label}"><ha-icon></ha-icon></button>`).join('')}
      <button type="button" class="ok" data-act="center" data-ref="center" aria-label="OK">
        <span class="ok-face"><ha-icon data-ref="centerIcon"></ha-icon><span>OK</span></span>
        <span class="ok-power" aria-hidden="true"><ha-icon data-ref="centerPower"></ha-icon></span>
      </button>
    </section>
    <section class="numpad" data-ref="numpad" role="group" aria-label="Teclado numérico">
      ${NUMPAD_DIGITS.map((d) => `<button type="button" class="key num" data-act="digit" data-digit="${d}">${d}</button>`).join('')}
      <button type="button" class="key num" data-act="numpad_close" aria-label="Cerrar teclado"><ha-icon icon="mdi:close"></ha-icon></button>
      <button type="button" class="key num" data-act="digit" data-digit="0">0</button>
      <button type="button" class="key num" data-act="numpad_ok" aria-label="OK"><ha-icon icon="mdi:keyboard-return"></ha-icon></button>
    </section>
    <nav class="modes" data-ref="modes" role="radiogroup" aria-label="Modo del touchpad"></nav>
    <footer class="keys">
      ${BOTTOM_BUTTONS.map((id) => `<button type="button" class="key" data-act="bottom" data-id="${id}" aria-label="${KEYS[id].label}"><ha-icon></ha-icon></button>`).join('')}
    </footer>
    <div class="toast" data-ref="toast" role="status" aria-live="polite"></div>
  </div>
</ha-card>`;

let skeletonTemplate = null;
function cloneSkeleton() {
  if (!skeletonTemplate) {
    skeletonTemplate = document.createElement('template');
    skeletonTemplate.innerHTML = SKELETON;
  }
  return skeletonTemplate.content.cloneNode(true);
}

/* ---------- helpers de DOM: solo escriben si el valor cambió ---------- */

function setAttr(el, name, value) {
  if (value === null || value === undefined || value === '') {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== value) {
    el.setAttribute(name, value);
  }
}
function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}
function setVar(el, name, value) {
  if (value) el.style.setProperty(name, value);
  else el.style.removeProperty(name);
}
function makeIcon(icon, className) {
  const el = document.createElement('ha-icon');
  if (icon) el.setAttribute('icon', icon);
  if (className) el.className = className;
  return el;
}

export { cloneSkeleton, makeIcon, setAttr, setText, setVar };
