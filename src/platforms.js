/* Módulo §3. */
import { INPUTS } from './actions/inputs.js';
import { has } from './util.js';

/* ============================================================================
 * §3  PLATAFORMAS (DRIVERS)
 * ----------------------------------------------------------------------------
 * Cada plataforma es un objeto con las MISMAS funciones. El resto del código no
 * pregunta "¿es Samsung?": solo llama `platform.sendKey(...)` y cada driver sabe
 * qué servicio de HA usar.
 *
 * En C sería:
 *   struct platform { const char *id; int (*send_code)(hass_t*, device_t*, const char*); ... };
 *   static const struct platform LG = { "lg", lg_send_code, ... };
 *
 * Todas las funciones devuelven la Promise de `hass.callService`, para que quien
 * llama pueda ESPERAR (await) a que HA conteste. Esto es la base del arreglo del
 * "hold infinito": no se manda la siguiente repetición hasta que la anterior
 * terminó.
 *
 * `device` es un objeto { platform, entity, remote? }:
 *   - TV LG/Samsung: { platform: 'lg', entity: 'media_player.tv' }
 *   - Roku:          { platform: 'roku', entity: 'media_player.roku', remote: 'remote.roku' }
 * ========================================================================== */

/** Error para "esta plataforma no soporta esa acción". */
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
    // Entrada por puerto: tv/switchInput no depende del nombre que el usuario le
    // puso a la entrada. La TV en vivo es una app (ver inputs.js).
    selectInput(hass, device, input) {
      const target = INPUTS[input]?.lg;
      if (!target) return Promise.reject(new UnsupportedActionError(this.id, `entrada "${input}"`));
      return target.app
        ? this.sendCommand(hass, device, 'system.launcher/launch', { id: target.app })
        : this.sendCommand(hass, device, 'tv/switchInput', { inputId: target.inputId });
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
    // ST_HDMIn por send_key (ver inputs.js): la integración elige el mejor canal.
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
      // El Roku recibe teclas por su entidad remote.*, no por el media_player.
      return hass.callService('remote', 'send_command', { entity_id: device.remote, command: code });
    },
  },
};

// Lo que es igual para todas las plataformas se escribe una sola vez.
// Los drivers que lo necesiten pueden sobrescribirlo.
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
};
for (const platform of Object.values(PLATFORMS)) {
  // Object.setPrototypeOf hace que, si el driver no define una función, JS la
  // busque en PLATFORM_DEFAULTS. Es la "herencia" de objetos de JS (prototipos).
  Object.setPrototypeOf(platform, PLATFORM_DEFAULTS);
}

function getPlatform(id) {
  return has(PLATFORMS, id) ? PLATFORMS[id] : null;
}

export { PLATFORMS, UnsupportedActionError, getPlatform };
