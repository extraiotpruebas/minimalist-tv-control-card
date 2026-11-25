export function createFakeHass({ states = {}, latency = 0, fail = null } = {}) {
  const calls = [];
  return {
    states,
    user: { id: 'test-user' },
    calls,
    callService(domain, service, data) {
      calls.push({ domain, service, data });
      return new Promise((resolve, reject) => {
        setTimeout(() => (fail ? reject(new Error(fail)) : resolve()), latency);
      });
    },
  };
}

export const LG_TV = { platform: 'lg', entity: 'media_player.lg' };
export const SAMSUNG_TV = { platform: 'samsung', entity: 'media_player.samsung' };
export const ROKU = { platform: 'roku', entity: 'media_player.roku', remote: 'remote.roku' };
