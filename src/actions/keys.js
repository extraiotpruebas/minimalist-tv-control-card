const KEYS = {
  up:          { label: 'Arriba',          lg: 'UP',          samsung: 'KEY_UP',       roku: 'up' },
  down:        { label: 'Abajo',           lg: 'DOWN',        samsung: 'KEY_DOWN',     roku: 'down' },
  left:        { label: 'Izquierda',       lg: 'LEFT',        samsung: 'KEY_LEFT',     roku: 'left' },
  right:       { label: 'Derecha',         lg: 'RIGHT',       samsung: 'KEY_RIGHT',    roku: 'right' },
  enter:       { label: 'Enter / OK',      lg: 'ENTER',       samsung: 'KEY_ENTER',    roku: 'select' },
  back:        { label: 'Atrás',           lg: 'BACK',        samsung: 'KEY_RETURN',   roku: 'back' },
  exit:        { label: 'Salir',           lg: 'EXIT',        samsung: 'KEY_EXIT',     roku: null },
  home:        { label: 'Inicio',          lg: 'HOME',        samsung: 'KEY_HOME',     roku: 'home' },
  menu:        { label: 'Menú',            lg: 'MENU',        samsung: 'KEY_MENU',     roku: null },
  info:        { label: 'Info',            lg: 'INFO',        samsung: 'KEY_INFO',     roku: 'info' },
  guide:       { label: 'Guía',            lg: 'GUIDE',       samsung: 'KEY_GUIDE',    roku: null },
  apps:        { label: 'Mis apps',        lg: 'MYAPPS',      samsung: 'KEY_APP_LIST', roku: null },
  search:      { label: 'Buscar',          lg: null,          samsung: null,           roku: 'search' },
  input_menu:  { label: 'Menú de fuentes', lg: 'INPUT_HUB',   samsung: 'KEY_SOURCE',   roku: null },
  ch_up:       { label: 'Subir canal',     lg: 'CHANNELUP',   samsung: 'KEY_CHUP',     roku: 'channel_up' },
  ch_down:     { label: 'Bajar canal',     lg: 'CHANNELDOWN', samsung: 'KEY_CHDOWN',   roku: 'channel_down' },
  ch_prev:     { label: 'Canal anterior',  lg: null,          samsung: 'KEY_PRECH',    roku: null },
  vol_up:      { label: 'Subir volumen',   lg: 'VOLUMEUP',    samsung: 'KEY_VOLUP',    roku: 'volume_up' },
  vol_down:    { label: 'Bajar volumen',   lg: 'VOLUMEDOWN',  samsung: 'KEY_VOLDOWN',  roku: 'volume_down' },
  mute:        { label: 'Silenciar',       lg: 'MUTE',        samsung: 'KEY_MUTE',     roku: 'volume_mute' },
  play:        { label: 'Play',            lg: 'PLAY',        samsung: 'KEY_PLAY',     roku: 'play' },
  pause:       { label: 'Pausa',           lg: 'PAUSE',       samsung: 'KEY_PAUSE',    roku: 'play' },
  stop:        { label: 'Stop',            lg: 'STOP',        samsung: 'KEY_STOP',     roku: null },
  rewind:      { label: 'Rebobinar',       lg: 'REWIND',      samsung: 'KEY_REWIND',   roku: 'reverse' },
  ff:          { label: 'Avance rápido',   lg: 'FASTFORWARD', samsung: 'KEY_FF',       roku: 'forward' },
  replay:      { label: 'Repetir',         lg: null,          samsung: null,           roku: 'replay' },
  record:      { label: 'Grabar',          lg: 'RECORD',      samsung: 'KEY_REC',      roku: null },
  cc:          { label: 'Subtítulos',      lg: 'CC',          samsung: 'KEY_CAPTION',  roku: null },
  asterisk:    { label: 'Asterisco / Herramientas', lg: 'ASTERISK', samsung: 'KEY_TOOLS', roku: null },
  screen_remote: { label: 'Control en pantalla', lg: 'SCREEN_REMOTE', samsung: null, roku: null },
  red:         { label: 'Rojo',            lg: 'RED',         samsung: 'KEY_RED',      roku: null },
  green:       { label: 'Verde',           lg: 'GREEN',       samsung: 'KEY_GREEN',    roku: null },
  yellow:      { label: 'Amarillo',        lg: 'YELLOW',      samsung: 'KEY_YELLOW',   roku: null },
  blue:        { label: 'Azul',            lg: 'BLUE',        samsung: 'KEY_CYAN',     roku: null },
};

for (let d = 0; d <= 9; d++) {
  KEYS[`digit_${d}`] = { label: String(d), lg: String(d), samsung: `KEY_${d}`, roku: null };
}

const HOLDABLE_KEYS = new Set(['up', 'down', 'left', 'right']);

const TV_ONLY_KEYS = new Set(['vol_up', 'vol_down', 'mute']);

const CODE_TO_KEY = (() => {
  const map = new Map();
  for (const [key, def] of Object.entries(KEYS)) {
    for (const platform of ['lg', 'samsung', 'roku']) {
      const code = def[platform];
      if (code && !map.has(code)) map.set(code, key);
    }
  }
  return map;
})();

export { CODE_TO_KEY, HOLDABLE_KEYS, KEYS, TV_ONLY_KEYS };
