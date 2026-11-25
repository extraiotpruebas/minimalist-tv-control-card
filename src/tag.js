export const DEFAULT_CARD_TAG = 'tv-control-card';
export let CARD_TAG = DEFAULT_CARD_TAG;
export let EDITOR_TAG = `${DEFAULT_CARD_TAG}-editor`;

export function tagFromUrl(url) {
  try {
    const tag = new URL(url).searchParams.get('tag');
    return tag && /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(tag) ? tag : DEFAULT_CARD_TAG;
  } catch {
    return DEFAULT_CARD_TAG;
  }
}

export function setCardTag(tag) {
  CARD_TAG = tag;
  EDITOR_TAG = `${tag}-editor`;
}
