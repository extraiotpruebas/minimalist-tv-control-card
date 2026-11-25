/* Módulo §5c: paletas de color (catálogo incluido, lectura del YAML, contraste). */
import { has } from '../util.js';

/* ============================================================================
 * PALETAS
 * ----------------------------------------------------------------------------
 * Una paleta son 5 colores + la base (claro u oscuro). No son los ~15 tokens del
 * CSS: el resto se DERIVA de estos 5 (ver paletteTokens en card/logic.js), así es
 * difícil armar una combinación ilegible. Todos los colores son opcionales: lo que
 * falta sale de la base (el tema claro u oscuro del estilo elegido).
 *
 *   background → fondo de la tarjeta     accent → color de la interfaz sin app
 *   button     → apps, teclas, touchpad  on     → indicador de "encendida"
 *   text       → texto e íconos
 *
 * Se asignan en tres lugares; gana el más específico (resolvePalette, logic.js):
 *   streaming[i].palette  →  companion.palette (modo Roku)  →  palette (tarjeta,
 *   o la TV con overrides). Cada asignación es un nombre o { light, dark }.
 * ========================================================================== */
const PALETTE_FIELDS = ['background', 'button', 'text', 'accent', 'on'];

/*
 * Paletas incluidas: cada una es UNA línea de datos, así que agregar más casi no
 * pesa. Todas cumplen contraste 4.5:1 del texto sobre el fondo y sobre los botones
 * (lo comprueba test/config.test.mjs).
 */
const BUILTIN_PALETTES = {
  grafito:    { base: 'dark',  background: '#1b1d21', button: '#2c2f35', text: '#eceef1', accent: '#f0b44c', on: '#62d6a0' },
  medianoche: { base: 'dark',  background: '#0c1424', button: '#1b2a45', text: '#e8eef8', accent: '#5cc8ff', on: '#43dba0' },
  ciruela:    { base: 'dark',  background: '#1a1220', button: '#2e2138', text: '#f1eaf5', accent: '#c79bff', on: '#6fe0a9' },
  bosque:     { base: 'dark',  background: '#101a16', button: '#1f2e28', text: '#e7f0eb', accent: '#d9b77e', on: '#62dca0' },
  oled:       { base: 'dark',  background: '#050506', button: '#18181b', text: '#f4f4f5', accent: '#ffffff', on: '#5ee39b' },
  nube:       { base: 'light', background: '#e6ecf4', button: '#ffffff', text: '#18202c', accent: '#2f62d9', on: '#1b9a5f' },
  arena:      { base: 'light', background: '#ece7df', button: '#fbf8f3', text: '#2a251f', accent: '#9a6b3f', on: '#3f9a62' },
  menta:      { base: 'light', background: '#e3eeea', button: '#fbfefc', text: '#16241e', accent: '#0f7c8c', on: '#1d9a5d' },
};

/**
 * Color del YAML → '#rrggbb' (minúsculas), o null si no es un color válido.
 * Acepta '#1a2b3c', '1a2b3c', '#abc', '26, 43, 60' y [26, 43, 60] (el selector
 * color_rgb de HA entrega un arreglo).
 */
function normalizeHex(value) {
  if (Array.isArray(value)) value = value.join(',');
  const str = String(value ?? '').trim().toLowerCase();
  let m = /^#?([0-9a-f]{6})$/.exec(str);
  if (m) return `#${m[1]}`;
  m = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(str);
  if (m) return `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`;
  m = /^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/.exec(str);
  if (m && m.slice(1).every((n) => Number(n) <= 255)) {
    return `#${m.slice(1).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
  }
  return null;
}

/** Una paleta del YAML → { base, ...colores válidos }. Los colores inválidos se avisan y se omiten. */
function normalizePalette(name, raw, warnings) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    warnings.push(`La paleta "${name}" no es un bloque de colores; se ignoró.`);
    return null;
  }
  const base = String(raw.base ?? '').trim().toLowerCase();
  if (base && base !== 'light' && base !== 'dark') warnings.push(`Paleta "${name}": base "${raw.base}" desconocida; se usará "dark".`);
  const palette = { base: base === 'light' ? 'light' : 'dark' };
  for (const field of PALETTE_FIELDS) {
    if (raw[field] === undefined || raw[field] === null || raw[field] === '') continue;
    const hex = normalizeHex(raw[field]);
    if (hex) palette[field] = hex;
    else warnings.push(`Paleta "${name}": el color ${field} "${raw[field]}" no es válido (usa #rrggbb); se usará el de la base.`);
  }
  return palette;
}

/**
 * `palettes:` del YAML + las incluidas. Una paleta propia con el mismo nombre que
 * una incluida la reemplaza (así un instalador puede ajustar "grafito" a su gusto).
 */
function normalizePalettes(raw, warnings) {
  const result = { ...BUILTIN_PALETTES };
  if (raw === undefined || raw === null) return result;
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    warnings.push('"palettes" debe ser un bloque de nombre: { colores }; se ignoró.');
    return result;
  }
  for (const [name, def] of Object.entries(raw)) {
    const palette = normalizePalette(name, def, warnings);
    if (palette) result[name] = palette;
  }
  return result;
}

/**
 * Una asignación (`palette: grafito` o `palette: { light: nube, dark: grafito }`)
 * → { light, dark } con nombres o null. Así el resto del código no distingue entre
 * las dos formas. Devuelve null si no hay asignación.
 */
function paletteRef(value) {
  if (typeof value === 'string' && value.trim()) return { light: value.trim(), dark: value.trim() };
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const pick = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const ref = { light: pick(value.light), dark: pick(value.dark) };
    return ref.light || ref.dark ? ref : null;
  }
  return null;
}

/** Avisa de los nombres asignados que no existen (en vez de ignorarlos en silencio). */
function checkPaletteRef(ref, palettes, where, warnings) {
  for (const name of new Set([ref?.light, ref?.dark])) {
    if (name && !has(palettes, name)) {
      warnings.push(`${where}: la paleta "${name}" no existe. Incluidas: ${Object.keys(BUILTIN_PALETTES).join(', ')}.`);
    }
  }
}

/**
 * Contraste WCAG 2 entre dos colores '#rrggbb': de 1 (iguales) a 21 (negro y
 * blanco). 4.5 es el mínimo recomendado para texto normal.
 */
function contrastRatio(a, b) {
  const luminance = (hex) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export { BUILTIN_PALETTES, PALETTE_FIELDS, checkPaletteRef, contrastRatio, normalizeHex, normalizePalettes, paletteRef };
