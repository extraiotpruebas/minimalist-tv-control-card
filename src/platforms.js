import { INPUTS } from './actions/inputs.js';
import { has } from './util.js';

class UnsupportedActionError extends Error {
  constructor(platformId, what) {
    super(`La plataforma "${platformId}" no soporta: ${what}`);
    this.name = 'UnsupportedActionError';
  }
}

const PLATFORMS = {
  lg: {
    id: 'lg',
    label: 'LG webOS',
    integration: 'webostv',
    supportsCommands: true,
    sendCode(hass, device, code) {
      return hass.callService('webostv', 'button', { entity_id: device.entity, button: code });
    },
    sendCommand(hass, device, command, payload) {
      const data = { entity_id: device.entity, command };
      if (payload && Object.keys(payload).length) data.payload = payload;
      return hass.callService('webostv', 'command', data);
    },
    selectInput(hass, device, input) {
      const target = INPUTS[input]?.lg;
      if (!target) return Promise.reject(new UnsupportedActionError(this.id, `entrada "${input}"`));
      return target.app
        ? this.sendCommand(hass, device, 'system.launcher/launch', { id: target.app })
        : this.sendCommand(hass, device, 'tv/switchInput', { inputId: target.inputId });
    },
    showMessage(hass, device, message) {
      return this.sendCommand(hass, device, 'system.notifications/createToast', { message });
    },
    openUrl(hass, device, url) {
      return this.sendCommand(hass, device, 'system.launcher/open', { target: url });
    },
    typeText(hass, device, text) {
      return this.sendCommand(hass, device, 'com.webos.service.ime/insertText', { text, replace: 0 });
    },
    deleteText(hass, device) {
      return this.sendCommand(hass, device, 'com.webos.service.ime/deleteCharacters', { count: 1 });
    },
    sendEnter(hass, device) {
      return this.sendCommand(hass, device, 'com.webos.service.ime/sendEnterKey');
    },
  },

  samsung: {
    id: 'samsung',
    label: 'Samsung (SamsungTV Smart)',
    integration: 'samsungtv_smart',
    supportsCommands: false,
    sendCode(hass, device, code) {
      return hass.callService('media_player', 'play_media', {
        entity_id: device.entity,
        media_content_type: 'send_key',
        media_content_id: code,
      });
    },
    selectInput(hass, device, input) {
      const code = INPUTS[input]?.samsung;
      if (!code) return Promise.reject(new UnsupportedActionError(this.id, `entrada "${input}"`));
      return this.sendCode(hass, device, code);
    },
  },

  roku: {
    id: 'roku',
    label: 'Roku',
    integration: 'roku',
    supportsCommands: false,
    sendCode(hass, device, code) {
      return hass.callService('remote', 'send_command', { entity_id: device.remote, command: code });
    },
  },
};

const PLATFORM_DEFAULTS = {
  selectSource(hass, device, source) {
    return hass.callService('media_player', 'select_source', { entity_id: device.entity, source });
  },
  turnOn(hass, device) {
    return hass.callService('media_player', 'turn_on', { entity_id: device.entity });
  },
  turnOff(hass, device) {
    return hass.callService('media_player', 'turn_off', { entity_id: device.entity });
  },
  sendCommand() {
    return Promise.reject(new UnsupportedActionError(this.id, 'commands'));
  },
  selectInput(hass, device, input) {
    return Promise.reject(new UnsupportedActionError(this.id, `entrada "${input}"`));
  },
  showMessage() {
    return Promise.reject(new UnsupportedActionError(this.id, 'mensaje en pantalla'));
  },
  openUrl() {
    return Promise.reject(new UnsupportedActionError(this.id, 'abrir una página'));
  },
  typeText() {
    return Promise.reject(new UnsupportedActionError(this.id, 'escribir texto'));
  },
  deleteText() {
    return Promise.reject(new UnsupportedActionError(this.id, 'escribir texto'));
  },
  sendEnter() {
    return Promise.reject(new UnsupportedActionError(this.id, 'escribir texto'));
  },
};
for (const platform of Object.values(PLATFORMS)) {
  Object.setPrototypeOf(platform, PLATFORM_DEFAULTS);
}

function getPlatform(id) {
  return has(PLATFORMS, id) ? PLATFORMS[id] : null;
}

export { PLATFORMS, UnsupportedActionError, getPlatform };
