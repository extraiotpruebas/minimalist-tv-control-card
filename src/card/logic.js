import { KEYS, TV_ONLY_KEYS } from '../actions/keys.js';
import { SOURCES } from '../config/catalogs.js';
import { has } from '../util.js';

function tvStatus(stateObj) {
  if (!stateObj || stateObj.state === 'unavailable' || stateObj.state === 'unknown') return 'unavailable';
  return stateObj.state === 'off' || stateObj.state === 'standby' ? 'off' : 'on';
}

class StateWaiters {
  constructor() {
    this._pending = new Set();
  }

  wait(hass, entityId, predicate, timeoutMs) {
    const test = (h) => {
      const st = h?.states?.[entityId];
      try {
        return !!st && !!predicate(st);
      } catch {
        return false;
      }
    };
    if (test(hass)) return Promise.resolve(true);

    return new Promise((resolve) => {
      const waiter = {
        test,
        finish: (ok) => {
          clearTimeout(waiter.timer);
          this._pending.delete(waiter);
          resolve(ok);
        },
      };
      waiter.timer = setTimeout(() => waiter.finish(false), timeoutMs);
      this._pending.add(waiter);
    });
  }

  check(hass) {
    for (const waiter of [...this._pending]) {
      if (waiter.test(hass)) waiter.finish(true);
    }
  }

  cancelAll() {
    for (const waiter of [...this._pending]) waiter.finish(false);
  }

  get size() {
    return this._pending.size;
  }
}

const storage = {
  get(key) {
    try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
  },
  set(key, value) {
    try { globalThis.localStorage?.setItem(key, String(value)); } catch { }
  },
};

const TIMING = Object.freeze({
  holdDelay: 400,
  holdInterval: 250,
  holdMaxRepeats: 40,
  powerOn: 20000,
  powerOff: 10000,
  sourceConfirm: 6000,
});
const SOURCE_ATTEMPTS = 2;
const CENTER_GUARD_MS = 800;
const ROKU_ACCENT = '#6f1ab1';

const TV_MODES = new Set(['audio', 'fuentes']);

function routeAction(action, { tv, rokuMode, mode }) {
  const tvDevice = { platform: tv.platform, entity: tv.entity };
  const companion = tv.companion;
  if (!action || !rokuMode || !companion?.remote || TV_MODES.has(mode)) return tvDevice;
  const companionDevice = { platform: companion.platform, entity: companion.entity, remote: companion.remote };
  if (action.type === 'platform') return has(action.by, companion.platform) ? companionDevice : tvDevice;
  if (action.type === 'sequence') {
    const ctx = { tv, rokuMode, mode };
    return action.steps.every((step) => routeAction(step, ctx).entity === companion.entity) ? companionDevice : tvDevice;
  }
  if (action.type === 'key' && !TV_ONLY_KEYS.has(action.key) && KEYS[action.key][companion.platform]) return companionDevice;
  return tvDevice;
}

const normSource = (s) => String(s ?? '').trim().toLowerCase();

function sourceMatches(stateObj, candidates, preferAppName = false) {
  const attrs = stateObj?.attributes ?? {};
  const current = normSource(preferAppName ? (attrs.app_name || attrs.source) : attrs.source);
  return current !== '' && candidates.some((c) => normSource(c) === current);
}

function resolveSourceName(stateObj, candidates) {
  const list = stateObj?.attributes?.source_list;
  if (Array.isArray(list)) {
    for (const candidate of candidates) {
      const match = list.find((s) => normSource(s) === normSource(candidate));
      if (match) return match;
    }
  }
  return candidates[0];
}

function describeNow({ status, busy, roku, hasCompanion, tvState, rokuState, streaming }) {
  const blank = { sub: '', accent: null, sourceId: null };
  if (busy) return { ...blank, title: busy, icon: 'mdi:television' };
  if (status === 'unavailable') return { ...blank, title: 'Sin conexión', sub: 'Revisa que la TV esté conectada a la red.', icon: 'mdi:wifi-off' };
  if (status === 'off') return { ...blank, title: 'Apagada', icon: 'mdi:television-off' };

  const sub = hasCompanion ? (roku ? 'En el Roku' : 'En la TV') : '';
  const source = roku
    ? SOURCES.find((s) => s.rokuSource && sourceMatches(rokuState, [s.rokuSource], true))
    : SOURCES.find((s) => s.service && sourceMatches(tvState, s.alternates ?? [s.service]));

  if (source) {
    const slot = streaming.find((sl) => sl.source.id === source.id);
    return {
      title: source.name,
      sub,
      icon: slot?.icon ?? source.icon,
      accent: slot?.accent ?? source.accent ?? (roku ? ROKU_ACCENT : null),
      sourceId: source.id,
    };
  }
  const attrs = (roku ? rokuState : tvState)?.attributes ?? {};
  const raw = roku ? (attrs.app_name || attrs.source) : attrs.source;
  return {
    title: raw || (roku ? 'Roku' : 'Encendida'),
    sub,
    icon: roku ? 'mdi:remote-tv' : /hdmi/i.test(raw ?? '') ? 'mdi:hdmi-port' : 'mdi:television-play',
    accent: roku ? ROKU_ACCENT : null,
    sourceId: null,
  };
}

function resolvePalette({ palettes, theme, roku, appRef, rokuRef, cardRef }) {
  const levels = [appRef, roku ? rokuRef : null, cardRef];
  for (const ref of levels) {
    const name = ref?.[theme];
    if (name && Object.hasOwn(palettes, name)) return palettes[name];
  }
  return null;
}

function paletteTokens(palette) {
  const t = {};
  if (!palette) return t;
  const { base, background, button, text, accent, on } = palette;
  const dark = base === 'dark';
  if (background) {
    t['--tv-surface'] = background;
    t['--tv-surface-top'] = `color-mix(in srgb, ${background} ${dark ? 95 : 55}%, #fff)`;
  }
  if (button) {
    t['--tv-raised'] = dark ? `color-mix(in srgb, ${button} 75%, transparent)` : button;
    t['--tv-raised-2'] = dark ? `color-mix(in srgb, ${button} 40%, transparent)` : `color-mix(in srgb, ${button} 80%, var(--tv-surface))`;
    t['--tv-thumb'] = button;
  }
  if (text) {
    t['--tv-ink'] = text;
    t['--tv-ink-2'] = `color-mix(in srgb, ${text} 64%, var(--tv-surface))`;
    t['--tv-line'] = `color-mix(in srgb, ${text} ${dark ? 10 : 13}%, transparent)`;
  }
  if (accent) {
    t['--tv-accent-default'] = accent;
    t['--tv-blob'] = `color-mix(in srgb, ${accent} 60%, ${dark ? '#000' : '#fff'})`;
  }
  if (on) t['--tv-on'] = on;
  return t;
}

export { CENTER_GUARD_MS, SOURCE_ATTEMPTS, StateWaiters, TIMING, describeNow, paletteTokens, resolvePalette, resolveSourceName, routeAction, sourceMatches, storage, tvStatus };
