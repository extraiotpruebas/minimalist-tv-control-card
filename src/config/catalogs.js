import { INPUTS } from '../actions/inputs.js';
import { KEYS } from '../actions/keys.js';
import { parseAction } from '../actions/parse.js';
import { deepFreeze } from '../util.js';

const SOURCES = [
  { id: 'netflix',     name: 'Netflix',     icon: 'mdi:netflix',        service: 'Netflix',     rokuSource: 'Netflix',     accent: '#e50914' },
  { id: 'disney',      name: 'Disney+',     icon: 'phu:disney-plus',    service: 'Disney+',     rokuSource: 'Disney Plus', accent: '#1f5bff' },
  { id: 'prime',       name: 'Prime Video', icon: 'phu:prime-video',    service: 'Prime Video', rokuSource: 'Prime Video', accent: '#00a8e1' },
  { id: 'YouTube',     name: 'YouTube',     icon: 'mdi:youtube',        service: 'YouTube',     rokuSource: 'YouTube',     accent: '#ff0033' },
  { id: 'appletv',     name: 'Apple TV',    icon: 'phu:apple-tv',       service: 'Apple TV',    rokuSource: 'Apple TV',    accent: '#a1a6ad' },
  { id: 'hbomax',      name: 'Max',         icon: 'phu:hbo-max',        service: 'Max',         rokuSource: 'Max',         accent: '#3355ff' },
  { id: 'paramount',   name: 'Paramount+',  icon: 'phu:paramount-plus', service: 'Paramount+',  rokuSource: 'Paramount Plus', accent: '#0064ff' },
  { id: 'dazn',        name: 'DAZN',        icon: 'phu:dazn',           service: 'DAZN',        rokuSource: 'DAZN Live Sports Streaming', accent: '#e8ff1a' },
  { id: 'universal',   name: 'Universal+',  icon: 'mdi:earth',          service: 'Universal+',  rokuSource: 'Universal+',  accent: null },
  { id: 'spotify',     name: 'Spotify',     icon: 'mdi:spotify',        service: 'Spotify',     rokuSource: 'Spotify',     accent: '#1db954' },
  { id: 'crunchyroll', name: 'Crunchyroll', icon: 'mdi:alpha-c-circle', service: 'Crunchyroll', rokuSource: 'Crunchyroll', accent: '#f47521' },
  { id: 'twitch',      name: 'Twitch',      icon: 'mdi:twitch',         service: 'Twitch',      rokuSource: 'Twitch',      accent: '#9146ff' },
  { id: 'fubo',        name: 'Fubo',        icon: 'mdi:alpha-f-circle', service: null,          rokuSource: 'Fubo: Watch Live TV & Sports', accent: '#fa4616' },
  { id: 'roku',        name: 'Roku',        icon: 'phu:roku-ultra',     service: 'Roku OTT',    alternates: ['Roku OTT', 'Roku'], rokuSource: null, accent: '#6f1ab1' },
  { id: 'hdmi1',       name: 'HDMI 1',      icon: 'mdi:hdmi-port',      service: 'HDMI 1',      input: 'hdmi1', rokuSource: null, accent: null },
  { id: 'hdmi2',       name: 'HDMI 2',      icon: 'mdi:hdmi-port',      service: 'HDMI 2',      input: 'hdmi2', rokuSource: null, accent: null },
  { id: 'hdmi3',       name: 'HDMI 3',      icon: 'mdi:hdmi-port',      service: 'HDMI 3',      input: 'hdmi3', rokuSource: null, accent: null },
  { id: 'hdmi4',       name: 'HDMI 4',      icon: 'mdi:hdmi-port',      service: 'HDMI 4',      input: 'hdmi4', rokuSource: null, accent: null },
];
const SOURCES_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

const DEFAULT_STREAMING = ['netflix', 'disney', 'YouTube', 'appletv'];

const DIRECTIONS = ['up', 'left', 'right', 'down'];
const NUMPAD_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function pad(...entries) {
  const result = {};
  DIRECTIONS.forEach((dir, i) => {
    const [icon, action] = entries[i] || [];
    result[dir] = { icon: icon || null, action: parseAction(action) };
  });
  return result;
}

const FIXED_MODES = {
  menu: {
    label: 'Menú', icon: 'mdi:menu-open',
    pad: pad(['mdi:home', 'home'], ['mdi:menu', 'menu'], ['mdi:exit-to-app', 'exit'], ['mdi:undo-variant', 'back']),
  },
  busqueda: {
    label: 'Canales', icon: 'mdi:television-classic',
    pad: pad(['mdi:plus-box', 'ch_up'], ['mdi:hdmi-port', 'input_menu'], ['mdi:format-list-numbered', 'guide'], ['mdi:minus-box', 'ch_down']),
  },
  audio: {
    label: 'Audio', icon: 'mdi:volume-high',
    pad: pad(['mdi:volume-plus', 'vol_up'], ['mdi:volume-off', 'mute'], ['mdi:surround-sound', null], ['mdi:volume-minus', 'vol_down']),
  },
  fuentes: {
    label: 'Fuentes', icon: 'mdi:television-shimmer',
    pad: pad(
      [INPUTS.hdmi1.icon, 'input:hdmi1'],
      [INPUTS.hdmi2.icon, 'input:hdmi2'],
      [INPUTS.hdmi3.icon, 'input:hdmi3'],
      [INPUTS.hdmi4.icon, 'input:hdmi4'],
    ),
  },
  info: {
    label: 'Información', icon: 'mdi:information-variant-circle-outline',
    pad: pad(['mdi:television-guide', 'guide'], ['mdi:information-slab-circle-outline', 'info'], ['mdi:apps', 'apps'], ['mdi:tools', 'asterisk']),
  },
};
const MODE_ALIASES = { navegacion: 'menu' };
const RESERVED_MODES = new Set(['text', 'amplificador']);
const CUSTOM_MODE_IDS = ['custom1', 'custom2', 'custom3'];

const DEFAULT_PAD = pad(['mdi:chevron-up', 'up'], ['mdi:chevron-left', 'left'], ['mdi:chevron-right', 'right'], ['mdi:chevron-down', 'down']);

const DEFAULT_BUTTONS = {
  top_left: { icon: 'mdi:exit-to-app',  action: 'exit' },
  power:    { icon: 'mdi:power',        action: null },
  center:   { icon: null,               action: 'enter' },
  back:     { icon: 'mdi:undo-variant', action: 'back' },
  home:     { icon: 'mdi:home',         action: 'home' },
  exit:     { icon: 'mdi:exit-to-app',  action: 'exit' },
  menu:     { icon: 'mdi:menu',         action: 'menu' },
};
const BOTTOM_BUTTONS = ['back', 'home', 'exit', 'menu'];

[KEYS, INPUTS, SOURCES, FIXED_MODES, DEFAULT_PAD, DEFAULT_BUTTONS].forEach(deepFreeze);

export { BOTTOM_BUTTONS, CUSTOM_MODE_IDS, DEFAULT_BUTTONS, DEFAULT_PAD, DEFAULT_STREAMING, DIRECTIONS, FIXED_MODES, MODE_ALIASES, NUMPAD_DIGITS, RESERVED_MODES, SOURCES, SOURCES_BY_ID, pad };
