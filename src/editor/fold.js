/* Módulo §7: agrupación de nodos del editor en paneles plegables (acordeón). */

/*
 * ACORDEÓN. buildEditorView sigue devolviendo una lista PLANA de nodos (las pruebas
 * y el DOM la recorren igual que antes); el agrupado se expresa con dos datos:
 *   - un encabezado con `fold: { summary, open, base }` es un panel plegable;
 *   - cada nodo de su interior lleva `parent: <key del encabezado>`.
 * `summary` es la línea que se ve con el panel cerrado ("Menú, Audio · 1 propio"),
 * `open` si arranca abierto, y `base` la profundidad de sus hijos directos (para
 * que la sangría se mida desde el panel y no desde el borde del editor).
 */
function fold(head, children, { summary = '', open = false } = {}) {
  const direct = children.filter((child) => !child.parent).map((child) => child.depth ?? 0);
  head.fold = { summary, open, base: direct.length ? Math.min(...direct) : (head.depth ?? 0) };
  for (const child of children) child.parent ??= head.key;
  return [head, ...children];
}

/** Nodos agrupados por su `parent` ('' = raíz), conservando el orden. Para pintar el árbol. */
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
