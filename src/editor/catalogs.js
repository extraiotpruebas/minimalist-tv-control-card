/* Módulo §7: catálogos de los selectores del editor. */
import { INPUTS } from '../actions/inputs.js';
import { KEYS } from '../actions/keys.js';
import { SOURCES } from '../config/catalogs.js';

/* ---------- catálogos para los selectores ---------- */

const ACTION_UI_TYPES = {
  default: 'Predeterminada',
  none: 'Ninguna',
  key: 'Tecla',
  input: 'Entrada (HDMI / antena)',
  source: 'Fuente por nombre (select_source)',
  script: 'Script o escena',
  service: 'Servicio de HA',
  command: 'Command LG (webOS)',
  button: 'Botón crudo (código)',
  sequence: 'Secuencia de pasos (p. ej. un PIN)',
  numpad: 'Abrir teclado numérico',
  platform: 'Distinta por marca',
};
const ALL_ACTION_TYPES = ['key', 'input', 'source', 'script', 'service', 'command', 'button', 'sequence', 'numpad', 'platform'];
const STEP_ACTION_TYPES = ['key', 'button', 'command', 'input', 'source', 'script', 'service'];
const BRAND_ACTION_TYPES = ['key', 'input', 'source', 'script', 'service', 'command', 'button', 'sequence'];
const BRANDS = [['lg', 'LG'], ['samsung', 'Samsung'], ['roku', 'Roku'], ['default', 'Otras marcas']];

const PLATFORM_NAMES = { lg: 'LG', samsung: 'Samsung', roku: 'Roku' };
/** Teclas para el selector: "Subir volumen (vol_up) · LG, Samsung, Roku". */
const KEY_OPTIONS = Object.entries(KEYS).map(([id, def]) => {
  const brands = ['lg', 'samsung', 'roku'].filter((p) => def[p]).map((p) => PLATFORM_NAMES[p]);
  return { value: id, label: `${def.label} (${id}) · ${brands.join(', ') || 'ninguna'}` };
});

/**
 * Commands de webOS más útiles (webostv.command). Los URIs vienen de aiowebostv y
 * de la documentación de HA; los que se marcan con payload necesitan datos.
 * POR VERIFICAR en una TV real antes de usarlos con clientes.
 */
const LG_COMMANDS = [
  { value: 'system.launcher/launch', label: 'Abrir app · payload: { id: "netflix" }' },
  { value: 'tv/switchInput', label: 'Cambiar entrada · payload: { inputId: "HDMI_1" }' },
  { value: 'com.webos.service.tvpower/power/turnOffScreen', label: 'Apagar la pantalla (el audio sigue)' },
  { value: 'com.webos.service.tvpower/power/turnOnScreen', label: 'Encender la pantalla' },
  { value: 'system.notifications/createToast', label: 'Mostrar un mensaje · payload: { message: "Hola" }' },
  { value: 'media.controls/play', label: 'Play' },
  { value: 'media.controls/pause', label: 'Pausa' },
  { value: 'media.controls/stop', label: 'Stop' },
  { value: 'media.controls/rewind', label: 'Rebobinar' },
  { value: 'media.controls/fastForward', label: 'Avance rápido' },
  { value: 'com.webos.service.ime/insertText', label: 'Escribir texto · payload: { text: "abc", replace: 0 }' },
  { value: 'system.launcher/open', label: 'Abrir URL en el navegador · payload: { target: "https://…" }' },
];

/** Entradas por puerto: LG y Samsung (el Roku no tiene entradas). */
const INPUT_OPTIONS = Object.entries(INPUTS).map(([id, def]) => ({ value: id, label: def.label }));
const SOURCE_OPTIONS = SOURCES.map((s) => ({ value: s.id, label: s.service ? s.name : `${s.name} (solo por Roku)` }));
const STYLE_OPTIONS = [
  { value: 'relieve', label: 'Relieve (predeterminado)' },
  { value: 'halo', label: 'Halo' },
  { value: 'cristal', label: 'Cristal' },
];
const THEME_OPTIONS = [
  { value: 'dark', label: 'Oscuro (predeterminado)' },
  { value: 'light', label: 'Claro' },
  { value: 'auto', label: 'Automático (sigue a HA)' },
];
const TV_PLATFORM_OPTIONS = [{ value: 'lg', label: 'LG (webOS)' }, { value: 'samsung', label: 'Samsung' }];
const DIRECTION_LABELS = { up: 'Arriba', left: 'Izquierda', right: 'Derecha', down: 'Abajo' };
const BUTTON_LABELS = {
  top_left: 'Botón del encabezado (izquierda)',
  power: 'Encender / apagar',
  center: 'Centro del touchpad (OK)',
  back: 'Atrás',
  home: 'Inicio',
  exit: 'Salir',
  menu: 'Menú',
};
const DEFAULT_MODES = ['menu', 'busqueda', 'audio'];

export { ACTION_UI_TYPES, ALL_ACTION_TYPES, BRANDS, BRAND_ACTION_TYPES, BUTTON_LABELS, DEFAULT_MODES, DIRECTION_LABELS, INPUT_OPTIONS, KEY_OPTIONS, LG_COMMANDS, SOURCE_OPTIONS, STEP_ACTION_TYPES, STYLE_OPTIONS, THEME_OPTIONS, TV_PLATFORM_OPTIONS };
