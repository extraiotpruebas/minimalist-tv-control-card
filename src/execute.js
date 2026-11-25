import { KEYS } from './actions/keys.js';
import { resolveForPlatform } from './actions/parse.js';
import { UnsupportedActionError, getPlatform } from './platforms.js';
import { delay } from './util.js';

async function executeAction(hass, action, device) {
  if (!hass || !action || !device) return;
  const platform = getPlatform(device.platform);
  if (!platform) throw new Error(`Plataforma desconocida: ${device.platform}`);

  const resolved = resolveForPlatform(action, platform.id);
  if (!resolved) return;

  switch (resolved.type) {
    case 'key': {
      const code = KEYS[resolved.key]?.[platform.id];
      if (!code) throw new UnsupportedActionError(platform.id, `tecla "${resolved.key}"`);
      return platform.sendCode(hass, device, code);
    }
    case 'button':
      return platform.sendCode(hass, device, resolved.button);
    case 'command':
      return platform.sendCommand(hass, device, resolved.command, resolved.payload);
    case 'source':
      return platform.selectSource(hass, device, resolved.source);
    case 'input':
      return platform.selectInput(hass, device, resolved.input);
    case 'service': {
      const [domain, service] = resolved.service.split('.');
      return hass.callService(domain, service, resolved.data);
    }
    case 'sequence':
      for (let i = 0; i < resolved.steps.length; i++) {
        if (i > 0) await delay(resolved.delay);
        await executeAction(hass, resolved.steps[i], device);
      }
      return;
    case 'numpad':
      throw new Error('"numpad" es una acción de la tarjeta, no de la TV');
    default:
      throw new Error(`Tipo de acción desconocido: ${resolved.type}`);
  }
}

export { executeAction };
