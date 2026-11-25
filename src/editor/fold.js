function fold(head, children, { summary = '', open = false } = {}) {
  const direct = children.filter((child) => !child.parent).map((child) => child.depth ?? 0);
  head.fold = { summary, open, base: direct.length ? Math.min(...direct) : (head.depth ?? 0) };
  for (const child of children) child.parent ??= head.key;
  return [head, ...children];
}

function childrenByParent(nodes) {
  const map = new Map();
  for (const node of nodes) {
    const parent = node.parent ?? '';
    if (!map.has(parent)) map.set(parent, []);
    map.get(parent).push(node);
  }
  return map;
}

export { childrenByParent, fold };
