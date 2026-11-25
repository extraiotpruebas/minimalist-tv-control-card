/* Módulo §6: estilos de la tarjeta. */

/* ---------- estilos ---------- */

/*
 * El CSS está en TRES capas:
 *   1. Estructura común: layout, pantalla de vidrio, touchpad, responsivo. Igual
 *      para los tres estilos.
 *   2. Tokens: colores y sombras con nombres COMPARTIDOS (--tv-surface, --tv-ink,
 *      --tv-accent...). Cada estilo y tema les da valores propios. Las paletas
 *      (config/palettes.js) solo cambian estos tokens.
 *   3. Forma de cada estilo (relieve / halo / cristal): losetas o círculos, bisel o
 *      halo, paneles de vidrio. Es lo único que difiere entre estilos.
 *
 * JS solo pone atributos (data-style, data-theme, data-status...), dos variables
 * (--tv-accent, --tv-glow) y, si hay una paleta, los tokens de la capa 2 que esa
 * paleta define (paletteTokens en logic.js), en el style del ha-card. Un style
 * inline le gana a cualquier selector, así que la paleta pisa al estilo sin CSS
 * nuevo. Nunca escribe sombras.
 *
 * `container-type` está en ha-card: un contenedor no puede consultarse a sí mismo,
 * así que el layout que cambia con @container vive en .body (su hijo).
 */
const CARD_CSS = `
:host { display: block; }
* { box-sizing: border-box; }
.card [hidden] { display: none !important; }

/* ===================== 1. ESTRUCTURA COMÚN ===================== */
ha-card.card {
  display: block; height: 100%; overflow: hidden; container-type: inline-size;
  border: none; border-radius: 28px;
  background: var(--tv-bg); color: var(--tv-ink); box-shadow: var(--tv-card-shadow);
  font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, Roboto, system-ui, sans-serif));
  user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
  --tv-accent: var(--tv-accent-default);   /* acento de la interfaz (JS lo cambia por el de la app) */
  --tv-glow: #dce6f5;                      /* luz de la pantalla: blanco 6500 K si no hay app */
  transition: background 0.8s;
}
/* :where() tiene especificidad 0: este reset nunca le gana a una clase. */
:where(.card) button {
  appearance: none; border: 0; margin: 0; padding: 0; background: none; color: inherit; font: inherit;
  cursor: pointer; -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; touch-action: manipulation;
}
.card button:focus-visible { outline: 2px solid var(--tv-accent); outline-offset: 2px; }
.card button:disabled { cursor: default; }

.body {
  position: relative; isolation: isolate; display: grid; gap: 18px; padding: 22px;
  grid-template-areas: "head" "screen" "apps" "pad" "modes" "keys";
}

.head { grid-area: head; display: grid; grid-auto-flow: column; grid-template-columns: minmax(0, 1fr); grid-auto-columns: auto; align-items: center; gap: 10px; }
.tv-name { display: flex; align-items: center; gap: 2px; min-width: 0; justify-self: start; font-size: 19px; font-weight: 600; letter-spacing: -0.015em; cursor: default; }
.tv-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chevron { display: none; --mdc-icon-size: 18px; opacity: 0.5; }
.card.multi .tv-name { cursor: pointer; }
.card.multi .chevron { display: block; }
.switch { display: grid; grid-template-columns: 1fr 1fr; padding: 3px; border-radius: 999px; font-size: 13px; font-weight: 500; }
.switch button { height: 32px; padding: 0 13px; border-radius: 999px; color: var(--tv-ink-2); }
.switch button[aria-pressed="true"] { color: var(--tv-ink); }
.round { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; color: var(--tv-ink-2); --mdc-icon-size: 21px; }

/* Selector de TVs: sale debajo del nombre. La forma (fondo, sombras, cómo se
   marca la TV activa) la pone cada estilo en la capa 3. */
.picker {
  position: absolute; z-index: 5; top: 70px; left: 14px; width: min(calc(100% - 28px), 320px);
  display: grid; gap: 2px; padding: 6px; max-height: 60%; overflow: auto;
  border-radius: 20px; transform-origin: 28px 0;
  animation: tv-pop 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.15);
}
.picker-item {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px;
  min-height: 48px; padding: 6px 12px 6px 6px; border-radius: 14px; text-align: start;
  font-size: 15px; font-weight: 500; color: var(--tv-ink-2); transition: background 0.15s, color 0.15s;
}
.picker-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.picker-item .tv-ico { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; --mdc-icon-size: 20px; }
.picker-item .check { visibility: hidden; --mdc-icon-size: 18px; }
.picker-item.active { color: var(--tv-ink); }
.picker-item.active .check { visibility: visible; }
@media (hover: hover) { .picker-item:not(.active):hover { color: var(--tv-ink); background: color-mix(in srgb, var(--tv-ink) 5%, transparent); } }

/* La pantalla de vidrio: dice qué se está viendo. Detrás, la luz de la app
   (como el bias light de una TV). Es igual en los tres estilos. */
.screen { grid-area: screen; position: relative; isolation: isolate; margin-bottom: 6px; }
.screen::before {
  content: ""; position: absolute; inset: 18% 6% -16%; z-index: -1; border-radius: 40%;
  background: var(--tv-glow); filter: blur(30px); opacity: 0.5;
  transition: opacity 0.8s ease, background-color 0.8s ease;
}
.card:not([data-status="on"]) .screen::before { opacity: 0; }
.glass {
  position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 16px;
  min-height: 108px; padding: 18px 22px; border-radius: 20px; color: #f3f5f8; overflow: hidden;
  background: linear-gradient(160deg, #171a1f, #050608 58%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.07), inset 0 1px 0 rgb(255 255 255 / 0.1), 0 14px 30px -16px rgb(0 0 0 / 0.55);
}
.glass::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(115deg, transparent 40%, rgb(255 255 255 / 0.055) 41%, transparent 64%); }
.now-icon { --mdc-icon-size: 36px; color: var(--tv-glow); transition: color 0.8s; }
.card:not([data-status="on"]) .now-icon { color: rgb(243 245 248 / 0.35); }
.now-text { min-width: 0; display: grid; justify-items: start; }
.now-title { max-width: 100%; font-size: 23px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.now-sub { font-size: 13px; color: rgb(243 245 248 / 0.55); margin-top: 3px; }
.now-sub:empty { display: none; }
.card[data-busy="true"] .now-title { animation: tv-pulse 1.4s ease-in-out infinite; }

.apps { grid-area: apps; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.app { position: relative; display: grid; place-items: center; height: 54px; color: var(--tv-ink-2); --mdc-icon-size: 28px; }
.app.active { color: var(--tv-accent); }
.app.loading ha-icon { animation: tv-spin 0.9s linear infinite; }

/* Touchpad: 4 cuñas (clip-path) que cubren todo el círculo, así toda el área es
   tocable, y el OK encima. */
.pad { grid-area: pad; position: relative; justify-self: center; width: min(100%, 280px); aspect-ratio: 1; border-radius: 50%; overflow: hidden; }
.dir { position: absolute; inset: 0; display: flex; justify-content: center; align-items: center; color: var(--tv-ink-2); --mdc-icon-size: 26px; transition: background 0.2s, color 0.2s, box-shadow 0.2s; }
.dir.up    { clip-path: polygon(0 0, 100% 0, 50% 50%);       align-items: flex-start; padding-top: 11%; }
.dir.down  { clip-path: polygon(0 100%, 100% 100%, 50% 50%); align-items: flex-end; padding-bottom: 11%; }
.dir.left  { clip-path: polygon(0 0, 0 100%, 50% 50%);       justify-content: flex-start; padding-left: 11%; }
.dir.right { clip-path: polygon(100% 0, 100% 100%, 50% 50%); justify-content: flex-end; padding-right: 11%; }
.dir.empty { pointer-events: none; }
.dir.empty ha-icon { opacity: 0.35; }
.dir:is(.pressed, :active) { color: var(--tv-ink); }
/* Dónde nace el brillo al presionar (lo usan Relieve y Cristal). La elipse es
   chica a propósito: queda DENTRO de la cuña sin tocar sus lados y se apaga antes
   del OK, así nunca se ve la forma de triángulo, solo luz que entra desde el borde. */
.dir.up    { --tv-press-at: 50% 0%;   --tv-press-size: 40% 29%; }
.dir.down  { --tv-press-at: 50% 100%; --tv-press-size: 40% 29%; }
.dir.left  { --tv-press-at: 0% 50%;   --tv-press-size: 29% 40%; }
.dir.right { --tv-press-at: 100% 50%; --tv-press-size: 29% 40%; }
.ok { position: absolute; z-index: 2; inset: 31%; border-radius: 50%; display: grid; place-items: center; font-size: 15px; font-weight: 600; color: var(--tv-ink-2); --mdc-icon-size: 26px; transition: color 0.3s, transform 0.12s; }
/* El centro tiene DOS caras apiladas en la misma celda del grid: OK y Encender.
   Con la TV apagada se cruzan (opacidad + escala), así se nota que el botón cambió
   de función en lugar de cambiar de golpe. */
.ok > span { grid-area: 1 / 1; position: relative; display: grid; place-items: center; transition: opacity 0.3s ease, transform 0.3s ease; }
.ok-face ha-icon:not([icon]) { display: none; }
.ok-face ha-icon[icon] + span { display: none; }
.ok-power { --mdc-icon-size: 32px; opacity: 0; transform: scale(0.7); }
/* Fondo de "botón principal" en una capa aparte: así aparece con un fundido
   también en los estilos cuyo fondo es un degradado (los degradados no se animan). */
.ok::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--tv-cta-bg); box-shadow: var(--tv-cta-shadow); opacity: 0; transition: opacity 0.3s ease; }

.modes { grid-area: modes; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; }
.modes:empty { display: none; }
.mode { display: flex; align-items: center; justify-content: center; gap: 7px; height: 44px; min-width: 0; font-size: 14px; font-weight: 500; color: var(--tv-ink-2); --mdc-icon-size: 19px; }
.mode span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mode[aria-checked="true"] { color: var(--tv-ink); }

.keys { grid-area: keys; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.key { display: grid; place-items: center; height: 50px; color: var(--tv-ink-2); --mdc-icon-size: 24px; }

/* Numpad: mientras está abierto ocupa el lugar del touchpad (misma área del grid).
   Sus teclas son .key, así que cada estilo les da la misma forma que a la fila de abajo. */
/* aspect-ratio: 1 = la misma huella cuadrada que el touchpad: abrirlo no cambia la
   altura de la tarjeta (en Masonry, eso movería las tarjetas de abajo). */
.numpad { grid-area: pad; display: none; justify-self: center; width: min(100%, 280px); aspect-ratio: 1; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(4, minmax(0, 1fr)); gap: 10px; }
.card[data-numpad="true"] .numpad { display: grid; animation: tv-pop 0.18s ease-out; }
.card[data-numpad="true"] .pad { display: none; }
/* Sin alto fijo: las 4 filas se reparten el cuadro (en una tarjeta angosta las
   teclas se achican en lugar de hacer crecer la tarjeta). */
.num { height: auto; min-height: 0; font-size: 22px; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--tv-ink); }

.toast {
  position: absolute; left: 16px; right: 16px; bottom: 16px; z-index: 6;
  padding: 10px 14px; border-radius: 12px; background: rgb(10 12 16 / 0.88); color: #fff;
  font-size: 0.85rem; text-align: center;
  opacity: 0; transform: translateY(8px); transition: opacity 0.2s, transform 0.2s; pointer-events: none;
}
.toast.show { opacity: 1; transform: none; }

/* Celular angosto: modos solo con ícono. */
@container (max-width: 340px) {
  .body { padding: 16px; gap: 14px; }
  .mode span { display: none; }
  .round { width: 38px; height: 38px; }
  .picker { top: 60px; left: 10px; width: calc(100% - 20px); }
}
/* Tablet / columna ancha: dos columnas, el touchpad a la derecha. */
@container (min-width: 600px) {
  .body {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 36px; align-items: center; padding: 26px;
    grid-template-areas: "head pad" "screen pad" "apps pad" "modes pad" "keys pad";
    grid-template-rows: auto auto auto auto 1fr;
  }
  .pad, .numpad { width: min(100%, 310px); }
  .keys { align-self: end; }
}
@container (min-width: 860px) { .pad, .numpad { width: min(100%, 360px); } }

/* ===================== 2 y 3. ESTILOS ===================== */

/* ---------- A · RELIEVE (predeterminado): losetas con elevación suave y bisel ---------- */
.card[data-style="relieve"] {
  --tv-surface: #eef1f5; --tv-surface-top: #f5f7fa; --tv-raised: #ffffff; --tv-raised-2: #f6f8fa; --tv-thumb: #ffffff;
  --tv-ink: #1b1f25; --tv-ink-2: #565e69; --tv-line: #d9dee5; --tv-track: #e1e5eb; --tv-hi: #ffffff;
  --tv-shadow: rgb(25 35 55 / 0.16); --tv-shadow-2: rgb(25 35 55 / 0.07); --tv-on: #1f9d63; --tv-accent-default: var(--tv-ink);
  --tv-bg: linear-gradient(180deg, var(--tv-surface-top), var(--tv-surface) 45%);
  --tv-card-shadow: 0 1px 2px var(--tv-shadow-2), 0 24px 48px -28px var(--tv-shadow), inset 0 1px 0 var(--tv-hi);
}
.card[data-style="relieve"][data-theme="dark"] {
  --tv-surface: #16181c; --tv-surface-top: #1c1f24; --tv-raised: rgb(255 255 255 / 0.075); --tv-raised-2: rgb(255 255 255 / 0.03); --tv-thumb: rgb(255 255 255 / 0.14);
  --tv-ink: #eef0f3; --tv-ink-2: #9aa1ab; --tv-line: rgb(255 255 255 / 0.09); --tv-track: rgb(0 0 0 / 0.35); --tv-hi: rgb(255 255 255 / 0.12);
  --tv-shadow: rgb(0 0 0 / 0.6); --tv-shadow-2: rgb(0 0 0 / 0.4); --tv-on: #64e3a6; --tv-accent-default: #dce6f5;
  --tv-bg: radial-gradient(120% 50% at 50% 0%, color-mix(in srgb, var(--tv-glow) 9%, transparent), transparent 70%), linear-gradient(180deg, var(--tv-surface-top), var(--tv-surface) 50%);
}
.card[data-style="relieve"] :is(.round, .app, .key) {
  background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2)); border-radius: 16px;
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 6px 14px -8px var(--tv-shadow);
  transition: transform 0.12s, box-shadow 0.12s;
}
.card[data-style="relieve"] .round { border-radius: 50%; }
.card[data-style="relieve"][data-theme="dark"] :is(.round, .app, .key, .pad) { -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
.card[data-style="relieve"] :is(.round, .app, .key):is(.pressed, :active) { transform: scale(0.97); box-shadow: inset 0 1px 3px var(--tv-shadow), 0 0 0 1px var(--tv-line); }
.card[data-style="relieve"] .app.active { box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1.5px currentColor, 0 8px 18px -8px currentColor; }
.card[data-style="relieve"] .switch { background: var(--tv-track); box-shadow: inset 0 1px 2px var(--tv-shadow-2); }
.card[data-style="relieve"] .switch button[aria-pressed="true"] { background: var(--tv-thumb); box-shadow: inset 0 1px 0 var(--tv-hi), 0 2px 6px -2px var(--tv-shadow); }
.card[data-style="relieve"] .pad {
  background: radial-gradient(circle at 50% 30%, var(--tv-raised), var(--tv-raised-2) 75%);
  box-shadow: inset 0 0 0 1px var(--tv-line), inset 0 -10px 24px -14px var(--tv-shadow), 0 16px 32px -18px var(--tv-shadow), inset 0 1px 0 var(--tv-hi);
}
/* Las 4 marcas del bisel. */
.card[data-style="relieve"] .pad::before {
  content: ""; position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  --tick: color-mix(in srgb, var(--tv-ink-2) 45%, transparent);
  background:
    linear-gradient(var(--tick), var(--tick)) 50% 3.5% / 2px 10px no-repeat,
    linear-gradient(var(--tick), var(--tick)) 50% 96.5% / 2px 10px no-repeat,
    linear-gradient(var(--tick), var(--tick)) 3.5% 50% / 10px 2px no-repeat,
    linear-gradient(var(--tick), var(--tick)) 96.5% 50% / 10px 2px no-repeat;
}
.card[data-style="relieve"] .dir::after { content: ""; position: absolute; background: var(--tv-accent); border-radius: 2px; opacity: 0; transition: opacity 0.25s; box-shadow: 0 0 10px 1px var(--tv-accent); }
.card[data-style="relieve"] .dir.up::after    { top: 3.5%; left: calc(50% - 1px); width: 2px; height: 10px; }
.card[data-style="relieve"] .dir.down::after  { bottom: 3.5%; left: calc(50% - 1px); width: 2px; height: 10px; }
.card[data-style="relieve"] .dir.left::after  { left: 3.5%; top: calc(50% - 1px); width: 10px; height: 2px; }
.card[data-style="relieve"] .dir.right::after { right: 3.5%; top: calc(50% - 1px); width: 10px; height: 2px; }
.card[data-style="relieve"] .dir:is(.pressed, :active)::after { opacity: 1; }
.card[data-style="relieve"] .dir { --tv-press: 26%; --tv-press-mid: 10%; }
.card[data-style="relieve"] .ok { background: linear-gradient(180deg, var(--tv-raised-2), var(--tv-raised)); box-shadow: inset 0 2px 6px -2px var(--tv-shadow), 0 0 0 1px var(--tv-line), 0 1px 0 var(--tv-hi); }
.card[data-style="relieve"] .ok:is(.pressed, :active) { box-shadow: inset 0 0 0 1.5px var(--tv-accent), inset 0 3px 8px -2px var(--tv-shadow); color: var(--tv-ink); }
.card[data-style="relieve"] .modes { background: var(--tv-track); border-radius: 16px; padding: 4px; box-shadow: inset 0 1px 2px var(--tv-shadow-2); }
.card[data-style="relieve"] .mode { border-radius: 12px; height: 40px; }
.card[data-style="relieve"] .mode[aria-checked="true"] { background: var(--tv-thumb); box-shadow: inset 0 1px 0 var(--tv-hi), 0 2px 8px -3px var(--tv-shadow); }
/* Selector: una loseta elevada; la TV activa queda "hundida" en el riel y su ícono
   es la perilla, igual que el modo activo. */
.card[data-style="relieve"] .picker {
  background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2)), var(--tv-surface-top);
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 4px 10px -6px var(--tv-shadow-2), 0 22px 44px -18px var(--tv-shadow);
}
.card[data-style="relieve"] .picker-item .tv-ico { background: var(--tv-track); box-shadow: inset 0 1px 2px var(--tv-shadow-2); }
.card[data-style="relieve"] .picker-item.active { background: var(--tv-track); box-shadow: inset 0 1px 2px var(--tv-shadow-2); }
.card[data-style="relieve"] .picker-item.active .tv-ico { background: var(--tv-thumb); box-shadow: inset 0 1px 0 var(--tv-hi), 0 2px 6px -2px var(--tv-shadow); }

/* ---------- B · HALO: la luz de la app llega al touchpad como un anillo ---------- */
.card[data-style="halo"] {
  --tv-surface: #f0f2f6; --tv-raised: #ffffff; --tv-ink: #1b1f25; --tv-ink-2: #555d68; --tv-line: #d8dde4;
  --tv-hi: #ffffff; --tv-shadow: rgb(25 35 55 / 0.15); --tv-shadow-2: rgb(25 35 55 / 0.05); --tv-on: #1f9d63; --tv-accent-default: var(--tv-ink);
  --tv-bg: var(--tv-surface);
  --tv-card-shadow: 0 1px 2px var(--tv-shadow-2), 0 24px 48px -30px var(--tv-shadow), inset 0 1px 0 var(--tv-hi);
}
.card[data-style="halo"][data-theme="dark"] {
  --tv-surface: #121418; --tv-raised: rgb(255 255 255 / 0.06); --tv-ink: #eef0f3; --tv-ink-2: #99a0aa; --tv-line: rgb(255 255 255 / 0.1);
  --tv-hi: rgb(255 255 255 / 0.14); --tv-shadow: rgb(0 0 0 / 0.7); --tv-shadow-2: rgb(0 0 0 / 0.4); --tv-on: #64e3a6; --tv-accent-default: #dce6f5;
  --tv-bg:
    radial-gradient(70% 40% at 75% 55%, color-mix(in srgb, var(--tv-glow) 10%, transparent), transparent 70%),
    radial-gradient(90% 45% at 20% 0%, color-mix(in srgb, var(--tv-glow) 8%, transparent), transparent 70%),
    var(--tv-surface);
}
.card[data-style="halo"] :is(.round, .key, .app) {
  background: var(--tv-raised);
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 8px 18px -10px var(--tv-shadow);
  transition: transform 0.12s, box-shadow 0.12s;
}
.card[data-style="halo"] .key { width: 52px; height: 52px; justify-self: center; border-radius: 50%; }
.card[data-style="halo"] .num { width: auto; height: 100%; aspect-ratio: 1; }
.card[data-style="halo"] .app { border-radius: 18px; }
.card[data-style="halo"] .app.active::after { content: ""; position: absolute; bottom: 7px; width: 16px; height: 3px; border-radius: 3px; background: currentColor; }
.card[data-style="halo"][data-theme="dark"] :is(.round, .key, .app, .switch, .modes) { -webkit-backdrop-filter: blur(14px) saturate(140%); backdrop-filter: blur(14px) saturate(140%); }
.card[data-style="halo"] :is(.round, .key, .app):is(.pressed, :active) { transform: scale(0.95); }
.card[data-style="halo"] .switch { background: var(--tv-raised); box-shadow: 0 0 0 1px var(--tv-line), inset 0 1px 0 var(--tv-hi); }
.card[data-style="halo"] .switch button[aria-pressed="true"] { background: var(--tv-ink); color: var(--tv-surface); }
.card[data-style="halo"] .pad {
  background: radial-gradient(circle at 50% 40%, var(--tv-raised), transparent 80%), var(--tv-raised);
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 18px 40px -22px var(--tv-shadow);
}
/* El halo: anillo del color de la app, solo con la TV prendida. */
.card[data-style="halo"] .pad::before {
  content: ""; position: absolute; inset: 0; z-index: 1; border-radius: 50%; pointer-events: none;
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--tv-accent) 55%, transparent), inset 0 0 22px -6px color-mix(in srgb, var(--tv-accent) 60%, transparent);
  opacity: 0; transition: opacity 0.8s ease;
}
.card[data-style="halo"][data-status="on"] .pad::before { opacity: 1; }
/* Truco: un anillo de círculo completo recortado por la cuña deja ver solo el arco de esa dirección. */
.card[data-style="halo"] .dir { border-radius: 50%; }
.card[data-style="halo"] .dir:is(.pressed, :active) { box-shadow: inset 0 0 0 4px var(--tv-accent), inset 0 0 30px -4px var(--tv-accent); }
.card[data-style="halo"] .ok { background: var(--tv-surface); box-shadow: 0 0 0 1px var(--tv-line), inset 0 2px 8px -3px var(--tv-shadow); }
.card[data-style="halo"][data-theme="dark"] .ok { background: rgb(0 0 0 / 0.25); }
.card[data-style="halo"] .ok:is(.pressed, :active) { box-shadow: 0 0 0 2px var(--tv-accent), inset 0 2px 8px -3px var(--tv-shadow); color: var(--tv-ink); }
.card[data-style="halo"] .modes { background: var(--tv-raised); border-radius: 999px; padding: 4px; box-shadow: 0 0 0 1px var(--tv-line), inset 0 1px 0 var(--tv-hi); }
.card[data-style="halo"] .mode { border-radius: 999px; height: 40px; }
.card[data-style="halo"] .mode[aria-checked="true"] { background: var(--tv-ink); color: var(--tv-surface); }
/* Selector: cápsula plana con aro fino; la TV activa se invierte como el modo activo. */
.card[data-style="halo"] .picker {
  border-radius: 26px;
  background: linear-gradient(var(--tv-raised), var(--tv-raised)), var(--tv-surface);
  box-shadow: inset 0 1px 0 var(--tv-hi), 0 0 0 1px var(--tv-line), 0 22px 44px -18px var(--tv-shadow);
}
.card[data-style="halo"] .picker-item { border-radius: 999px; }
.card[data-style="halo"] .picker-item .tv-ico { box-shadow: inset 0 0 0 1px var(--tv-line); }
.card[data-style="halo"] .picker-item.active { background: var(--tv-ink); color: var(--tv-surface); }
.card[data-style="halo"] .picker-item.active .tv-ico { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tv-surface) 30%, transparent); }
.card[data-style="halo"][data-theme="dark"] .picker { -webkit-backdrop-filter: blur(14px) saturate(140%); backdrop-filter: blur(14px) saturate(140%); }

/* ---------- C · CRISTAL: la luz de la app en el fondo y paneles de vidrio ---------- */
.card[data-style="cristal"] {
  --tv-surface: #e9edf3; --tv-raised: rgb(255 255 255 / 0.62); --tv-raised-2: rgb(255 255 255 / 0.35); --tv-hi: rgb(255 255 255 / 0.95);
  --tv-ink: #1b1f25; --tv-ink-2: #545c67; --tv-line: rgb(30 45 70 / 0.1); --tv-shadow: rgb(30 45 70 / 0.22); --tv-on: #1f9d63;
  --tv-accent-default: var(--tv-ink); --tv-blob: #9fb7ff;
  --tv-bg:
    radial-gradient(55% 38% at 18% 8%, color-mix(in srgb, var(--tv-glow) 22%, transparent), transparent 72%),
    radial-gradient(50% 45% at 92% 92%, color-mix(in srgb, var(--tv-blob) 28%, transparent), transparent 72%),
    radial-gradient(45% 35% at 85% 30%, color-mix(in srgb, var(--tv-glow) 12%, transparent), transparent 70%),
    var(--tv-surface);
  --tv-card-shadow: 0 1px 2px rgb(30 45 70 / 0.06), 0 28px 56px -32px var(--tv-shadow);
}
.card[data-style="cristal"][data-theme="dark"] {
  --tv-surface: #0d0f13; --tv-raised: rgb(255 255 255 / 0.07); --tv-raised-2: rgb(255 255 255 / 0.025); --tv-hi: rgb(255 255 255 / 0.2);
  --tv-ink: #f0f2f5; --tv-ink-2: #a1a8b2; --tv-line: rgb(255 255 255 / 0.08); --tv-shadow: rgb(0 0 0 / 0.75); --tv-on: #64e3a6;
  --tv-accent-default: #dce6f5; --tv-blob: color-mix(in srgb, var(--tv-glow) 45%, #3d5cff);
  --tv-card-shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 28px 56px -32px var(--tv-shadow);
}
/* El vidrio: translúcido, desenfoca lo de atrás, brillo en la arista superior.
   Se aplica a pocos paneles grandes (no a cada botón) para no cargar tablets viejas. */
.card[data-style="cristal"] :is(.round, .switch, .apps, .pad, .modes, .keys, .numpad) {
  background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2));
  -webkit-backdrop-filter: blur(20px) saturate(160%); backdrop-filter: blur(20px) saturate(160%);
  box-shadow: inset 0 1px 0 var(--tv-hi), inset 0 0 0 1px var(--tv-line), 0 12px 28px -16px var(--tv-shadow);
}
.card[data-style="cristal"] .round { transition: transform 0.12s; }
.card[data-style="cristal"] .round:is(.pressed, :active) { transform: scale(0.95); }
.card[data-style="cristal"] .switch button[aria-pressed="true"] { background: var(--tv-ink); color: var(--tv-surface); }
.card[data-style="cristal"] :is(.apps, .keys, .numpad) { border-radius: 22px; padding: 6px; gap: 4px; }
.card[data-style="cristal"] :is(.app, .key) { border-radius: 16px; transition: background 0.2s; }
.card[data-style="cristal"] .key { height: 46px; }
.card[data-style="cristal"] .app.active { background: color-mix(in srgb, currentColor 12%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 30%, transparent); }
.card[data-style="cristal"] :is(.app, .key):is(.pressed, :active) { background: color-mix(in srgb, var(--tv-ink) 8%, transparent); }
.card[data-style="cristal"] .dir { --tv-press: 34%; --tv-press-mid: 13%; }
.card:is([data-style="relieve"], [data-style="cristal"]) .dir:is(.pressed, :active) {
  background: radial-gradient(var(--tv-press-size) at var(--tv-press-at),
    color-mix(in srgb, var(--tv-accent) var(--tv-press), transparent),
    color-mix(in srgb, var(--tv-accent) var(--tv-press-mid), transparent) 45%,
    transparent);
}
.card[data-style="cristal"] .ok { background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2)); box-shadow: inset 0 1px 0 var(--tv-hi), inset 0 0 0 1px var(--tv-line), 0 8px 18px -10px var(--tv-shadow); }
.card[data-style="cristal"] .ok:is(.pressed, :active) { box-shadow: inset 0 0 0 1.5px var(--tv-accent), inset 0 0 16px -4px var(--tv-accent); color: var(--tv-ink); }
.card[data-style="cristal"] .modes { border-radius: 18px; padding: 4px; }
.card[data-style="cristal"] .mode { border-radius: 14px; height: 40px; }
.card[data-style="cristal"] .mode[aria-checked="true"] { background: var(--tv-raised); box-shadow: inset 0 1px 0 var(--tv-hi), 0 4px 12px -6px var(--tv-shadow); }
.card[data-style="cristal"][data-theme="dark"] .mode[aria-checked="true"] { background: rgb(255 255 255 / 0.13); }
/* Selector: un panel de vidrio más denso que el resto (flota encima de la pantalla). */
.card[data-style="cristal"] .picker {
  border-radius: 22px;
  background: linear-gradient(180deg, var(--tv-raised), var(--tv-raised-2)), color-mix(in srgb, var(--tv-surface) 80%, transparent);
  -webkit-backdrop-filter: blur(24px) saturate(170%); backdrop-filter: blur(24px) saturate(170%);
  box-shadow: inset 0 1px 0 var(--tv-hi), inset 0 0 0 1px var(--tv-line), 0 24px 48px -20px var(--tv-shadow);
}
.card[data-style="cristal"] .picker-item .tv-ico { background: var(--tv-raised); box-shadow: inset 0 1px 0 var(--tv-hi), inset 0 0 0 1px var(--tv-line); }
.card[data-style="cristal"] .picker-item.active { background: var(--tv-raised); box-shadow: inset 0 1px 0 var(--tv-hi), 0 4px 12px -6px var(--tv-shadow); }
.card[data-style="cristal"][data-theme="dark"] .picker-item.active { background: rgb(255 255 255 / 0.13); }
/* Sin backdrop-filter (navegadores viejos): paneles opacos, sigue siendo legible. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .card[data-style="cristal"] :is(.round, .switch, .apps, .pad, .modes, .keys, .picker, .numpad) { background: color-mix(in srgb, var(--tv-surface) 75%, #ffffff); }
  .card[data-style="cristal"][data-theme="dark"] :is(.round, .switch, .apps, .pad, .modes, .keys, .picker, .numpad) { background: #1b1e24; }
}

/* ===================== ESTADOS (comunes; van al final para ganar a los estilos) ===================== */
/* Botón principal (el centro como Encender). En oscuro, un círculo claro que brilla
   sobre el fondo. En claro, un círculo oscuro gritaba demasiado sobre tanto blanco:
   ahí resalta por ELEVACIÓN (blanco con sombra marcada), no por contraste. */
.card { --tv-cta-bg: var(--tv-ink); --tv-cta-ink: var(--tv-surface); --tv-cta-shadow: 0 10px 24px -10px var(--tv-shadow); }
.card[data-theme="light"] {
  --tv-cta-bg: linear-gradient(180deg, #ffffff, #f1f4f8); --tv-cta-ink: var(--tv-ink);
  --tv-cta-shadow: 0 0 0 1px var(--tv-line), 0 14px 26px -12px rgb(25 35 55 / 0.38), 0 2px 5px -2px rgb(25 35 55 / 0.18), inset 0 1px 0 #ffffff;
}
.card[data-status="on"] .power { color: var(--tv-on); }
/* TV apagada o sin conexión: se atenúa todo menos el centro del touchpad, que se
   vuelve el botón Encender (por eso se atenúan las cuñas y no el .pad entero: la
   opacidad de un padre se multiplica en sus hijos y no se puede "deshacer"). */
.card:is([data-status="off"], [data-status="unavailable"]) :is(.apps, .pad .dir, .modes, .keys) { opacity: 0.4; transition: opacity 0.5s; }
.card:is([data-status="off"], [data-status="unavailable"]) .ok { color: var(--tv-cta-ink); }
.card:is([data-status="off"], [data-status="unavailable"]) .ok::before { opacity: 1; }
.card:is([data-status="off"], [data-status="unavailable"]) .ok-face { opacity: 0; transform: scale(0.7); }
.card:is([data-status="off"], [data-status="unavailable"]) .ok-power { opacity: 1; transform: none; }
.card:is([data-status="off"], [data-status="unavailable"]) .ok:is(.pressed, :active) { transform: scale(0.96); }
.card[data-busy="true"] .ok-power ha-icon { animation: tv-spin 0.9s linear infinite; }
/* El botón que abre el numpad se queda "hundido" mientras está abierto. */
.card [aria-expanded="true"]:is(.key, .round, .dir) { color: var(--tv-ink); box-shadow: inset 0 1px 3px var(--tv-shadow), 0 0 0 1.5px var(--tv-ink-2); }

@keyframes tv-pulse { 50% { opacity: 0.45; } }
@keyframes tv-spin { to { transform: rotate(360deg); } }
@keyframes tv-pop { from { opacity: 0; transform: translateY(-6px) scale(0.97); } }
@media (prefers-reduced-motion: reduce) {
  .card, .card * { transition: none !important; animation: none !important; }
}
`;

/*
 * Una sola hoja de estilos para TODAS las tarjetas de la página: la tarjeta la usa
 * como `static styles` y Lit la convierte UNA vez en un CSSStyleSheet compartido
 * (adoptedStyleSheets), con respaldo a <style> en navegadores viejos. La v3
 * reinsertaba un <style> de 733 líneas en cada render.
 */
export { CARD_CSS };
