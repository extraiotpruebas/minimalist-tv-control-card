import { CODE_TO_KEY, HOLDABLE_KEYS, KEYS } from './keys.js';
import { normalizeInputId } from './inputs.js';
import { has } from '../util.js';

const ACTION_TYPES = ['key', 'button', 'command', 'source', 'input', 'service', 'sequence', 'platform', 'numpad'];

function stripSsap(uri) {
  return String(uri).trim().replace(/^ssap:\/\//i, '');
}

function parseAction(raw) {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === 'object') {
    if (Array.isArray(raw)) {
      return parseAction({ type: 'sequence', steps: raw });
    }
    if (!ACTION_TYPES.includes(raw.type)) return null;
    switch (raw.type) {
      case 'key':
        return has(KEYS, raw.key) ? { type: 'key', key: raw.key } : null;
      case 'button':
        return raw.button ? { type: 'button', button: String(raw.button) } : null;
      case 'command': {
        if (!raw.command) return null;
        const action = { type: 'command', command: stripSsap(raw.command) };
        if (raw.payload && typeof raw.payload === 'object') action.payload = { ...raw.payload };
        return action;
      }
      case 'source':
        return raw.source ? { type: 'source', source: String(raw.source) } : null;
      case 'input': {
        const input = normalizeInputId(raw.input);
        return input ? { type: 'input', input } : null;
      }
      case 'service': {
        if (!raw.service || !String(raw.service).includes('.')) return null;
        return { type: 'service', service: String(raw.service), data: { ...(raw.data || {}) } };
      }
      case 'sequence': {
        if (!Array.isArray(raw.steps)) return null;
        const steps = raw.steps.map(parseAction).filter((step) => step && step.type !== 'numpad');
        if (steps.length === 0) return null;
        const ms = Number(raw.delay);
        const delay = raw.delay !== undefined && Number.isFinite(ms) ? Math.max(0, ms) : 400;
        return { type: 'sequence', steps, delay };
      }
      case 'platform': {
        const by = {};
        for (const [platform, sub] of Object.entries(raw.by || {})) {
          const parsed = parseAction(sub);
          if (parsed) by[platform] = parsed;
        }
        return Object.keys(by).length ? { type: 'platform', by } : null;
      }
      case 'numpad':
        return { type: 'numpad' };
    }
    return null;
  }

  const str = String(raw).trim();
  if (str === '' || str.toLowerCase() === 'pendiente') return null;
  if (str.toLowerCase() === 'numpad') return { type: 'numpad' };

  if (/^script\.[a-z0-9_]+$/i.test(str)) {
    return { type: 'service', service: 'script.turn_on', data: { entity_id: str } };
  }
  if (/^scene\.[a-z0-9_]+$/i.test(str)) {
    return { type: 'service', service: 'scene.turn_on', data: { entity_id: str } };
  }

  if (str.startsWith('source:')) {
    const source = str.slice('source:'.length).trim();
    return source ? { type: 'source', source } : null;
  }
  if (str.startsWith('input:')) return parseAction({ type: 'input', input: str.slice('input:'.length) });
  if (str.startsWith('command:')) {
    const command = stripSsap(str.slice('command:'.length));
    return command ? { type: 'command', command } : null;
  }
  if (str.startsWith('key:')) {
    return parseAction({ type: 'key', key: str.slice(4).trim() });
  }

  if (has(KEYS, str)) return { type: 'key', key: str };

  const key = CODE_TO_KEY.get(str);
  if (key) return { type: 'key', key };

  return { type: 'button', button: str };
}

function resolveForPlatform(action, platformId) {
  if (!action) return null;
  if (action.type !== 'platform') return action;
  return action.by[platformId] || action.by.default || null;
}

function isHoldable(action) {
  return !!action && action.type === 'key' && HOLDABLE_KEYS.has(action.key);
}

export { isHoldable, parseAction, resolveForPlatform, stripSsap };
