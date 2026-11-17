# Guía de estudio: cómo funciona la Minimalist TV Control Card

> Para: Ian. Nivel: principiante en JavaScript, CSS y HTML.
> Rama: `refactor/v4`. Archivo principal: `minimalist-tv-control-card.js`.

Esta guía explica, pieza por pieza, el código de tu tarjeta. Está pensada para leerse
en orden, pero cada parte se entiende por separado. Todos los fragmentos de código
salen del archivo real; al lado de cada uno se indica de dónde vienen:

- **v4** = el archivo actual en la rama `refactor/v4` (secciones §1 a §5).
- **v3 (producción)** = la versión que tienen hoy los clientes, commit `dce0f18`.
  La puedes ver con:
  ```bash
  git -C /home/ian/HAdesigns/TV-Control-Card show dce0f18:minimalist-tv-control-card.js | less
  ```
  La usamos para estudiar HTML, CSS y eventos, porque la parte visual de la v4
  todavía no existe. También la usamos para ver **qué está mal** y cómo lo va a
  resolver la v4.

## Índice

1. [Cómo carga Home Assistant una tarjeta](#1-cómo-carga-home-assistant-una-tarjeta)
2. [JavaScript desde cero, con el código real](#2-javascript-desde-cero-con-el-código-real)
3. [Recorrido por la v4, sección por sección](#3-recorrido-por-la-v4-sección-por-sección)
4. [HTML para tarjetas](#4-html-para-tarjetas)
5. [CSS](#5-css)
6. [Eventos](#6-eventos)
7. [Pruebas con `node:test`](#7-pruebas-con-nodetest)
8. [Glosario y ejercicios](#8-glosario-y-ejercicios)

---

# 1. Cómo carga Home Assistant una tarjeta

Antes de ver una sola línea de JavaScript conviene entender **quién llama a quién**.
Tu archivo no "se ejecuta" solo: Home Assistant (HA) lo carga y luego le va hablando
a la tarjeta a través de unos pocos métodos con nombres fijos.

## 1.1 El recurso `type: module`

En HA, en *Ajustes → Paneles → Recursos* (o en `lovelace: resources:` si usas YAML),
el archivo se registra así:

```yaml
resources:
  - url: /hacsfiles/minimalist-tv-control-card/minimalist-tv-control-card.js
    type: module
```

`type: module` le dice al navegador: "carga este archivo como un **módulo ES**"
(ES = ECMAScript, el nombre oficial del estándar de JavaScript). Eso tiene tres
consecuencias que importan:

1. **Puede usar `import` y `export`.** Por eso la v4 puede terminar con
   `export { ... }` (ver §EXPORTS). HA ignora esos exports, pero las pruebas de
   Node los usan para importar las funciones.
2. **Su ámbito es privado.** Una variable `const KEYS` declarada arriba del
   archivo **no** se vuelve global (no aparece como `window.KEYS`). En la v3 había
   variables globales a propósito (`window.ygriega = 0;` en el `constructor`), que
   cualquier otro script de la página podía pisar. En un módulo eso ya no pasa por
   accidente.
3. **Modo estricto automático** (`"use strict"`). Algunos errores silenciosos se
   vuelven errores visibles; por ejemplo, asignar a una variable no declarada lanza
   `ReferenceError` en vez de crear una global.

Un módulo se ejecuta **una sola vez** por página, aunque pongas la tarjeta diez veces
en el dashboard. Lo que se repite son las **instancias** de la tarjeta, no el archivo.

## 1.2 `customElements.define`: registrar una etiqueta nueva

El navegador ya conoce etiquetas como `<div>` o `<button>`. Con
`customElements.define` le enseñas una etiqueta nueva. Al final de la v3:

```js
// v3 (producción), al final del archivo
customElements.define('tv-control-card', TVControlCard);
customElements.define('tv-control-card-editor', TVControlCardEditor);
```

Esto significa: "cada vez que alguien cree un `<tv-control-card>`, usa la clase
`TVControlCard` para darle comportamiento". Reglas:

- El nombre **debe llevar un guion** (`tv-control-card`). Así nunca choca con
  etiquetas futuras del estándar HTML, que no llevan guion.
- Un nombre solo se puede registrar **una vez**. Si el archivo se carga dos veces
  (por ejemplo, el recurso está duplicado), la segunda llamada lanza
  `NotSupportedError: ... the name "tv-control-card" has already been used with this registry`.
  La forma defensiva es:
  ```js
  if (!customElements.get('tv-control-card')) {
    customElements.define('tv-control-card', TVControlCard);
  }
  ```

Cuando en tu YAML escribes `type: custom:tv-control-card`, HA quita el prefijo
`custom:` y hace, en esencia, `document.createElement('tv-control-card')`.

La v3 además se anuncia en el selector de tarjetas de la UI:

```js
// v3 (producción)
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'tv-control-card',
    name: 'TV Control Card',
    ...
});
```

`window.customCards` es una convención de HA: un arreglo global donde cada tarjeta
personalizada se apunta para aparecer en el diálogo "Agregar tarjeta". La línea
`window.customCards = window.customCards || [];` significa "si ya existe, úsalo; si
no, crea un arreglo vacío" (el operador `||` se explica en la parte 2).

## 1.3 Los métodos que HA llama

Esta es la "interfaz" que HA espera de una tarjeta. No hay un archivo que la
declare: HA simplemente llama a esos nombres y, si existen, los usa.

| Miembro | ¿Quién lo llama y cuándo? | ¿Qué debe hacer la tarjeta? |
|---|---|---|
| `constructor()` | El navegador, al crear el elemento | Preparar estado inicial. **No** tocar atributos ni hijos todavía. |
| `setConfig(config)` | HA, justo después de crear la tarjeta y cada vez que cambia el YAML | Validar y guardar la config. Si es inválida, lanzar un `Error`: HA muestra una tarjeta roja con el mensaje. |
| `set hass(hass)` | HA, **cada vez que cambia cualquier entidad** de tu casa | Revisar si cambió algo que le importa a la tarjeta y, solo entonces, actualizar la pantalla. |
| `connectedCallback()` | El navegador, al insertar el elemento en la página | Arrancar cosas que necesitan estar en pantalla. |
| `disconnectedCallback()` | El navegador, al quitarlo de la página (cambias de vista, cierras el editor) | Limpiar: timers, listeners en `document`, holds en curso. |
| `getCardSize()` | HA (vista Masonry) | Devolver la altura aproximada en "unidades" de unos 50 px. |
| `getGridOptions()` | HA (vista Sections) | Devolver filas/columnas que ocupa. La v3 no lo tiene; la v4 lo agregará. |
| `static getConfigElement()` | HA, al abrir el editor visual | Devolver el elemento del editor. |
| `static getStubConfig()` | HA, al agregar la tarjeta desde la UI | Devolver una config de ejemplo. |

`static` significa que el método pertenece a la **clase**, no a cada tarjeta: HA
llama `TVControlCard.getConfigElement()`, no `miTarjeta.getConfigElement()`.

En la v3:

```js
// v3 (producción)
static getConfigElement() {
    return document.createElement('tv-control-card-editor');
}

getCardSize() {
    return 6;
}
```

## 1.4 El objeto `hass`

`hass` es la "foto" completa de tu Home Assistant en ese instante, más funciones
para mandar órdenes. Lo que usa la tarjeta:

```text
hass
├── states                       ← todas las entidades
│   ├── "media_player.lg_sala"
│   │   ├── entity_id: "media_player.lg_sala"
│   │   ├── state: "on"          ← SIEMPRE un string: "on", "off", "unavailable"...
│   │   └── attributes
│   │       ├── source: "Netflix"
│   │       ├── source_list: ["HDMI 1", "Netflix", ...]
│   │       └── friendly_name: "TV Sala"
│   └── "remote.roku" ...
├── user
│   └── id: "abc123"             ← la v3 lo usa para recordar la TV elegida por usuario
└── callService(domain, service, data, target?)  → Promise
```

`hass.callService` es la única forma en que la tarjeta "hace" algo. Por ejemplo:

```js
hass.callService('media_player', 'turn_on', { entity_id: 'media_player.lg_sala' });
```

equivale a ejecutar en Herramientas de desarrollador → Acciones:

```yaml
action: media_player.turn_on
data:
  entity_id: media_player.lg_sala
```

`callService` devuelve una **Promise** (una "promesa de resultado futuro", se
explica en 2.14): se cumple cuando HA confirma que procesó la llamada y se rechaza
si hubo un error. Este detalle es la base del arreglo del hold infinito.

**Muy importante:** HA reemplaza el objeto `hass` entero cada vez que cambia
*cualquier* entidad: un sensor de temperatura, una luz del baño, lo que sea. En una
casa con muchos sensores, `set hass` puede llamarse varias veces por segundo. Por
eso la tarjeta tiene que **filtrar**: mirar solo sus entidades y no hacer nada si no
cambiaron.

## 1.5 El flujo completo

```text
 Navegador carga el módulo (una vez)
        │
        ▼
 customElements.define('tv-control-card', TVControlCard)
        │
        │   HA encuentra "type: custom:tv-control-card" en el dashboard
        ▼
 document.createElement('tv-control-card')  ──►  constructor()
        │
        ▼
 card.setConfig(config)          ← si lanza Error: tarjeta roja con el mensaje
        │
        ▼
 card.hass = hass                ──►  set hass(hass)   (la primera vez)
        │
        ▼
 se inserta en la página          ──►  connectedCallback()
        │
        │   ... pasa el tiempo; cambia una entidad cualquiera ...
        ▼
 card.hass = hassNuevo           ──►  set hass(hassNuevo)
        │                               │
        │                               ├─ ¿cambió algo mío?  no → return
        │                               └─ sí → actualizar pantalla
        ▼
 el usuario cambia de vista       ──►  disconnectedCallback()
```

El orden exacto entre `set hass` y `connectedCallback` puede variar según cómo HA
monte la vista. Por eso la v3 guarda `this.state.isConnected` y solo dibuja si ya
está conectada. Un buen diseño no depende de ese orden.

## 1.6 El editor visual

Cuando abres "Editar tarjeta", HA llama `getConfigElement()`, crea el editor, le da
`setConfig(config)` y `hass`. El editor **no guarda nada por sí mismo**: cada vez que
el usuario cambia un campo, el editor dispara un evento `config-changed` con la
config nueva, y HA se encarga de guardarla y de volver a llamar `setConfig`.

```js
// v3 (producción), TVControlCardEditor
this.querySelector('#card-id-input').addEventListener('change', (e) => {
    this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: { ...this._config, card_id: e.target.value }}
    }));
});
```

Lee esto así: "cuando el `<input>` cambie, crea una config nueva igual a la anterior
pero con `card_id` actualizado, y anúnciala". Los `...` (spread) y `CustomEvent` se
explican más adelante (2.6 y 6.5).

---

# 2. JavaScript desde cero, con el código real

## 2.1 `const` y `let`

```js
// v4 §1
const KEYS = { up: { ... }, down: { ... }, ... };

for (let d = 0; d <= 9; d++) {
  KEYS[`digit_${d}`] = { label: String(d), lg: String(d), samsung: `KEY_${d}`, roku: null };
}
```

- `const` crea un nombre que **no se puede reasignar**: `KEYS = {}` daría
  `TypeError: Assignment to constant variable.`
- Pero `const` **no congela el contenido**. Por eso el ciclo puede agregar
  `KEYS.digit_0`, `KEYS.digit_1`, etc. El nombre `KEYS` sigue apuntando al mismo
  objeto; lo que cambia es lo que hay dentro.
- `let` crea un nombre que sí se puede reasignar (`d++`).
- Ambos tienen **ámbito de bloque**: `d` solo existe dentro del `for`.
- Existe también `var`, la forma antigua. No la uses: su ámbito es la función entera
  y produce errores raros.

Regla práctica: usa `const` siempre, y `let` solo cuando necesites reasignar.

Si quisieras que `KEYS` fuera realmente inmutable, existe `Object.freeze(KEYS)`.
Congela solo el primer nivel: los objetos internos (`KEYS.up`) seguirían siendo
modificables.

## 2.2 Tipos básicos

| Tipo | Ejemplos del código | Notas |
|---|---|---|
| string | `'UP'`, `"KEY_UP"`, `` `KEY_${d}` `` | Comillas simples, dobles o backticks; da igual, salvo que los backticks permiten `${}`. |
| number | `400`, `0.15`, `250` | Solo hay un tipo de número (decimal de 64 bits). No hay `int` separado. |
| boolean | `true`, `false` | |
| `null` | `roku: null` | "No hay valor, a propósito". |
| `undefined` | una propiedad que no existe | "Nunca se le dio valor". `KEYS.no_existe` es `undefined`. |
| object | `{ type: 'key' }`, arrays, funciones, `Map`, `Set` | Todo lo que no es lo anterior. |

**Valores "falsy".** En una condición (`if`, `||`, `!`), estos valores cuentan como
falso: `false`, `0`, `''` (string vacío), `null`, `undefined`, `NaN`. Todo lo demás
cuenta como verdadero, incluso `'0'`, `[]` y `{}`.

Eso explica líneas como esta:

```js
// v4 §2, parseAction
case 'button':
  return raw.button ? { type: 'button', button: String(raw.button) } : null;
```

Si `raw.button` es `undefined` o `''`, la condición es falsa y devuelve `null`.

El operador `? :` es el **ternario**: `condición ? siEsVerdad : siEsFalso`.

**Comparar: siempre `===`.** `===` compara sin convertir tipos (`'1' === 1` es
`false`). `==` convierte antes de comparar y da sorpresas (`'' == 0` es `true`).
El código usa siempre `===` y `!==`.

**`typeof`** dice el tipo como string: `typeof 'hola'` es `'string'`. Trampa
histórica: `typeof null` es `'object'`. Por eso `parseAction` revisa `null` **antes**
de preguntar si es un objeto:

```js
// v4 §2, parseAction
if (raw === null || raw === undefined) return null;

if (typeof raw === 'object') {
  if (Array.isArray(raw)) { ... }
```

Y como `typeof []` también es `'object'`, para distinguir un arreglo hay que usar
`Array.isArray(raw)`.

## 2.3 Objetos

Un objeto es un conjunto de pares `clave: valor`.

```js
// v4 §1
up: { label: 'Arriba', lg: 'UP', samsung: 'KEY_UP', roku: 'up' },
```

Dos formas de leer una propiedad:

```js
KEYS.up.lg          // 'UP'   → notación de punto: el nombre está escrito en el código
KEYS['up']['lg']    // 'UP'   → notación de corchetes: el nombre es un valor
```

Los corchetes son necesarios cuando el nombre está en una variable:

```js
// v4 §4, executeAction
const code = KEYS[resolved.key]?.[platform.id];
```

Aquí `resolved.key` vale, por ejemplo, `'vol_up'` y `platform.id` vale `'samsung'`,
así que esto es `KEYS['vol_up']['samsung']`, o sea `'KEY_VOLUP'`.

Asignar a una clave que no existe la **crea**: `KEYS['digit_3'] = {...}`.

Funciones útiles sobre objetos:

```js
Object.keys(obj)     // ['up', 'down', ...]            solo claves
Object.values(obj)   // [{label:'Arriba',...}, ...]   solo valores
Object.entries(obj)  // [['up', {...}], ['down', {...}], ...]  pares
```

`parseAction` usa `Object.keys(by).length` para saber si el objeto `by` quedó vacío.

**Métodos abreviados.** Dentro de un objeto, `sendCode(hass, device, code) { ... }`
es una abreviatura de `sendCode: function (hass, device, code) { ... }`. Así están
escritos los drivers de §3.

## 2.4 Arrays (arreglos)

```js
// v4 §2
const ACTION_TYPES = ['key', 'button', 'command', 'source', 'service', 'sequence', 'platform'];
```

Un array es una lista ordenada. Se indexa desde 0 (`ACTION_TYPES[0]` es `'key'`),
tiene `.length` y crece solo. Los métodos que más verás:

| Método | Qué devuelve | Ejemplo real |
|---|---|---|
| `.includes(x)` | `true`/`false` | `ACTION_TYPES.includes(raw.type)` |
| `.map(fn)` | un array **nuevo** con `fn` aplicada a cada elemento | `(raw.steps \|\| []).map(parseAction)` |
| `.filter(fn)` | un array nuevo con los elementos donde `fn` es verdadera | `.filter(Boolean)` |
| `.find(fn)` | el primer elemento que cumple, o `undefined` | v3: `this.controlModes.find(m => m.id === modeId)` |
| `.some(fn)` | `true` si al menos uno cumple | v3: `candidates.some(c => norm(c) === norm(...))` |
| `.forEach(fn)` | nada (`undefined`) | v3: muchos listeners |
| `.join(sep)` | un string | v3: `.map(...).join('')` al construir HTML |

`.filter(Boolean)` es un truco común: `Boolean` es una función que convierte
cualquier valor a `true`/`false`, así que esto **quita los valores falsy**. En la
secuencia de §2 sirve para descartar los pasos que `parseAction` convirtió en `null`:

```js
// v4 §2, parseAction, case 'sequence'
const steps = (raw.steps || []).map(parseAction).filter(Boolean);
```

Paso a paso con `['1', 'pendiente', '0']`:
`map` → `[{type:'key',key:'digit_1'}, null, {type:'key',key:'digit_0'}]`
→ `filter(Boolean)` → `[{...digit_1}, {...digit_0}]`.

## 2.5 Template literals (backticks)

```js
// v4 §1
KEYS[`digit_${d}`] = { label: String(d), lg: String(d), samsung: `KEY_${d}`, roku: null };
```

Un string entre backticks (`` ` ``) puede:

- Insertar valores con `${expresión}`: si `d` es 3, `` `KEY_${d}` `` es `'KEY_3'`.
- Ocupar varias líneas sin trucos.

La v3 construye **todo el HTML y el CSS** de la tarjeta con un template literal
gigante (más de 700 líneas). Dentro de `${}` puede ir cualquier expresión, incluso
otro template literal o un `.map(...)`:

```js
// v3 (producción), render()
${this.displayOrder.map(modeId => {
    const mode = this.controlModes.find(m => m.id === modeId);
    if (!mode) return '';
    return `
        <div class="mode-button mode-${mode.id} ${this.state.controlMode === mode.id ? 'active' : ''}"
            data-mode="${mode.id}">
            <ha-icon icon="${mode.icon}"></ha-icon>
        </div>
    `;
}).join('')}
```

¿Por qué `.join('')`? Porque `.map` devuelve un **array** de strings. Si metes un
array dentro de `${}`, JavaScript lo convierte a string separando con comas:
`['<div>a</div>', '<div>b</div>']` se volvería `'<div>a</div>,<div>b</div>'`, y esa
coma aparecería en pantalla. `.join('')` los pega sin separador.

## 2.6 Funciones y arrow functions

Tres formas de escribir una función:

```js
// 1. Declaración (v4 §2)
function stripSsap(uri) {
  return String(uri).trim().replace(/^ssap:\/\//i, '');
}

// 2. Arrow function con cuerpo de una sola expresión (v4 §4)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 3. Arrow function con bloque (v3)
botonCentral.addEventListener('click', () => {
    this._dispararHaptic('medium');
    this.handleCenterButton();
});
```

En la forma 2, lo que va después de `=>` **se devuelve automáticamente** (no hace
falta `return`). En la forma 3, con llaves `{ }`, sí hace falta `return` si quieres
devolver algo.

Diferencias importantes entre `function` y `=>`:

1. **`this`**: una arrow function no tiene `this` propio; usa el `this` del lugar
   donde fue escrita. Se explica con calma en 2.10. Por eso los listeners de la v3
   usan arrows: dentro, `this` sigue siendo la tarjeta.
2. **Hoisting**: una declaración `function` se puede usar antes de la línea donde
   está escrita (JS la "sube" al inicio del ámbito). Una `const f = () => ...` no.

**Las funciones son valores.** Se pueden guardar en variables, pasar como argumento
y devolver. `map(parseAction)` le pasa la función `parseAction` a `map`, que la
llamará una vez por elemento. Ojo: no lleva paréntesis; `map(parseAction())`
llamaría a la función inmediatamente, que no es lo que se quiere.

**Parámetros por defecto:**

```js
// v3 (producción)
_dispararHaptic(tipo = 'medium') { ... }
```

Si llamas `_dispararHaptic()` sin argumento, `tipo` vale `'medium'`.

**IIFE** (función que se llama a sí misma al definirse):

```js
// v4 §1
const CODE_TO_KEY = (() => {
  const map = new Map();
  ...
  return map;
})();
```

Fíjate en los paréntesis del final: `(() => { ... })()` define una función y la
ejecuta en el acto. Sirve para calcular un valor con varias líneas de código, usando
variables temporales (`map`) que no quedan sueltas en el módulo. `CODE_TO_KEY`
recibe lo que devuelve la función.

**Closures.** Una función "recuerda" las variables del lugar donde se creó, aunque
ese lugar ya haya terminado. En la v3, cada sector del touchpad tiene sus propias
variables de hold:

```js
// v3 (producción), listenerTouchpad()
['up', 'left', 'right', 'down'].forEach(direction => {
    ...
    let holdTimeout = null;
    let holdInterval = null;
    let isHold = false;

    const startHold = () => { ... holdInterval = setInterval(...) ... };
    const stopHold  = () => { ... clearInterval(holdInterval); ... };

    sector.addEventListener('pointerdown', startHold);
    sector.addEventListener('pointerup', stopHold);
```

`startHold` y `stopHold` comparten `holdInterval` **de su propia vuelta del ciclo**.
Cada dirección tiene su caja privada de variables. Este detalle es clave para
entender el bug del hold infinito (sección 4.6): cuando la v3 redibuja, crea cajas
nuevas, y la vieja, con el `setInterval` corriendo adentro, queda inalcanzable.

## 2.7 Destructuring y spread (`...`)

**Destructuring** = sacar partes de un array u objeto a variables, en una línea.

```js
// v4 §4: destructuring de array
const [domain, service] = resolved.service.split('.');
// 'script.turn_on'.split('.') → ['script', 'turn_on']
// domain = 'script', service = 'turn_on'

// v4 §1: destructuring en un for...of
for (const [key, def] of Object.entries(KEYS)) { ... }
// cada vuelta: key = 'up', def = { label: 'Arriba', lg: 'UP', ... }
```

De objeto, con "resto":

```js
// v3 (producción), editor
const { entity, modelConfig, ...cleanConfig } = this._config;
```

Esto crea `entity` y `modelConfig` con esos campos, y `cleanConfig` con **todos los
demás**. Se usa para quitar dos claves de un objeto sin modificar el original.

**Spread** = "desparramar" el contenido de un objeto o array dentro de otro.

```js
// v4 §2, parseAction
if (raw.payload && typeof raw.payload === 'object') action.payload = { ...raw.payload };
...
return { type: 'service', service: String(raw.service), data: { ...(raw.data || {}) } };
```

`{ ...raw.payload }` crea un objeto **nuevo** con las mismas claves. ¿Por qué copiar?
Porque los objetos en JS se pasan **por referencia**: si guardas `raw.payload` tal
cual y luego alguien lo modifica, cambiaría también la config original de HA. La
prueba lo verifica:

```js
// test/actions.test.mjs
assert.notEqual(parsed.payload, cmd.payload, 'el payload debe ser una copia, no la misma referencia');
```

Dos advertencias:

- Es una copia **superficial**: si `payload` tiene objetos adentro, esos se
  comparten. Para una copia profunda existe `structuredClone(obj)`.
- `{ ...(raw.data || {}) }`: los paréntesis importan. Si `raw.data` es `undefined`,
  se usa `{}`. (Spread de `undefined` en un objeto no falla, pero así queda explícito.)

En el editor de la v3, `{ ...this._config, card_id: e.target.value }` significa "todo
lo de la config, y además `card_id` con el valor nuevo". Si una clave aparece dos
veces, **gana la última**.

## 2.8 Optional chaining `?.`, `||` y `??`

```js
// v4 §4
const code = KEYS[resolved.key]?.[platform.id];
```

`?.` significa "si lo de la izquierda es `null` o `undefined`, detente y devuelve
`undefined`; si no, sigue". Sin él, `KEYS['no_existe']['lg']` lanzaría
`TypeError: Cannot read properties of undefined (reading 'lg')`. Formas:

- `obj?.prop`
- `obj?.[expresión]` (la que usa §4)
- `fn?.()` (llama solo si existe)

En la v3: `this._hass.user?.id || 'default'`, `rokuState?.attributes?.app_name`.

**`||` y `??` para valores por defecto:**

```js
a || b   // si a es falsy (false, 0, '', null, undefined, NaN) → b
a ?? b   // si a es null o undefined (solo esos dos)          → b
```

La diferencia importa con `0` y `''`. Si un usuario configura `delay: 0`,
`raw.delay || 400` daría `400` (mal: 0 es falsy), mientras que `raw.delay ?? 400`
daría `0`. La v4 evita el problema de otra forma, con `Number.isFinite`:

```js
// v4 §2, case 'sequence'
const delay = Number.isFinite(raw.delay) ? Math.max(0, raw.delay) : 400;
```

`Number.isFinite(x)` es `true` solo si `x` es un número real (no `NaN`, no
`Infinity`, **no un string**). Ojo: si en el YAML alguien escribe `delay: "500"`
entre comillas, llega como string y se usa el valor por defecto 400.

**`!!x`** convierte cualquier cosa a booleano (la doble negación). En §2:

```js
function isHoldable(action) {
  return !!action && action.type === 'key' && HOLDABLE_KEYS.has(action.key);
}
```

`&&` también "cortocircuita": si `!!action` es `false`, no evalúa lo demás (y así
nunca intenta leer `action.type` de `null`).

## 2.9 `Map` y `Set`

```js
// v4 §1
const HOLDABLE_KEYS = new Set(['up', 'down', 'left', 'right', 'vol_up', 'vol_down', 'ch_up', 'ch_down']);

const CODE_TO_KEY = (() => {
  const map = new Map();
  for (const [key, def] of Object.entries(KEYS)) {
    for (const platform of ['lg', 'samsung', 'roku']) {
      const code = def[platform];
      if (code && !map.has(code)) map.set(code, key);
    }
  }
  return map;
})();
```

- **`Set`**: una colección de valores **sin repetir**. Lo útil es `.has(x)`, que
  responde rápido "¿está?". Para listas de "permitidos" es más claro que un array.
- **`Map`**: un diccionario clave → valor, con `.get(k)`, `.set(k, v)`, `.has(k)`,
  `.size`.

¿Por qué `Map` y no un objeto para `CODE_TO_KEY`? Un objeto normal hereda
propiedades de `Object.prototype` (como `toString` o `constructor`). Entonces
`obj['toString']` existe aunque tú nunca lo hayas puesto. Un `Map` empieza
realmente vacío: `CODE_TO_KEY.get('toString')` es `undefined`. (Ver la nota sobre
esto en la sección 3.2, porque `KEYS` sí es un objeto normal.)

Qué hay dentro de `CODE_TO_KEY` después de construirlo (extracto):

```text
'UP'        → 'up'        'KEY_UP'    → 'up'       'up'        → 'up'   (código Roku)
'VOLUMEUP'  → 'vol_up'    'KEY_VOLUP' → 'vol_up'   'volume_up' → 'vol_up'
'select'    → 'enter'     'KEY_RETURN'→ 'back'     '1'         → 'digit_1'
'play'      → 'play'      (también es el código Roku de pause, pero gana la primera)
```

## 2.10 Clases, `this`, getters y setters

Una **clase** es un molde para crear objetos con los mismos métodos.

```js
// v4 §3
class UnsupportedActionError extends Error {
  constructor(platformId, what) {
    super(`La plataforma "${platformId}" no soporta: ${what}`);
    this.name = 'UnsupportedActionError';
  }
}
```

- `extends Error`: hereda de la clase `Error` incorporada. Así obtiene `message`,
  `stack` (la pila de llamadas, útil para depurar) y funciona con `instanceof Error`.
- `constructor`: se ejecuta con `new UnsupportedActionError('roku', 'tecla "exit"')`.
- `super(...)`: llama al constructor de la clase padre. En una clase con `extends`
  es **obligatorio llamarlo antes de usar `this`**; si no, da
  `ReferenceError: Must call super constructor in derived class before accessing 'this'`.
- `this.name = ...`: así la consola muestra `UnsupportedActionError: ...` en vez de
  solo `Error: ...`.

La tarjeta de la v3 también es una clase: `class TVControlCard extends HTMLElement`.
Heredar de `HTMLElement` es lo que la convierte en una etiqueta HTML.

### `this`

`this` es "el objeto sobre el que se llamó el método". Se decide **al llamar**, no al
escribir la función:

```js
PLATFORMS.lg.sendCommand(...)    // dentro de sendCommand, this === PLATFORMS.lg
const f = PLATFORMS.lg.sendCommand;
f(...)                           // this === undefined (en módulos). ¡Se perdió!
```

Esto importa en §3: `PLATFORM_DEFAULTS.sendCommand` usa `this.id`. Funciona porque
siempre se llama como `platform.sendCommand(...)`.

Las **arrow functions** no tienen `this` propio: usan el de afuera. Comparación con
un listener de la v3:

```js
// Con arrow: this sigue siendo la tarjeta
botonPower.addEventListener('click', () => this.togglePower());

// Con function: this sería el elemento clicado (botonPower), no la tarjeta
botonPower.addEventListener('click', function () { this.togglePower(); }); // TypeError
```

La alternativa antigua es `.bind(this)`, que crea una copia de la función con `this`
fijo. La v3 lo hace en `_nuevoMetodo`:
`this._onTouchStart = this._onTouchStart.bind(this);`. (Por cierto, `_nuevoMetodo`
nunca se llama: es código muerto.)

### Getters y setters

Un **getter** parece una propiedad pero ejecuta código al leerla. Un **setter**
ejecuta código al asignarla.

```js
// v3 (producción)
get activeRokuConfig() {
    if (this._tvList) {
        return this._tvList[this.state.activeTvIndex]?.roku || null;
    }
    return this._rokuConfig || null;
}

set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;
    ...
}
```

- Se usa sin paréntesis: `this.activeRokuConfig`, no `this.activeRokuConfig()`.
- `set hass(hass)` es **el** punto de entrada de los datos: cuando HA escribe
  `card.hass = nuevoHass`, se ejecuta este código. Por eso se guarda el valor real
  en otra propiedad, `this._hass`. El guion bajo es solo una convención que significa
  "interno, no lo toques desde afuera". JavaScript también tiene campos privados de
  verdad, con `#` (`this.#hass`), pero el código no los usa.

Cuidado con los getters "caros": `get streamingServices()` en la v3 recalcula la
lista y hace `console.log` **cada vez que se lee**, y se lee varias veces por render.

## 2.11 Prototipos: `Object.setPrototypeOf` en PLATFORMS

Esta es la parte más "rara" de JavaScript si vienes de otros lenguajes, y la v4 la
usa a propósito.

```js
// v4 §3
const PLATFORM_DEFAULTS = {
  selectSource(hass, device, source) { ... },
  turnOn(hass, device) { ... },
  turnOff(hass, device) { ... },
  sendCommand() {
    return Promise.reject(new UnsupportedActionError(this.id, 'commands'));
  },
};
for (const platform of Object.values(PLATFORMS)) {
  Object.setPrototypeOf(platform, PLATFORM_DEFAULTS);
}
```

Cada objeto de JS tiene un enlace oculto a otro objeto, su **prototipo**. Cuando
pides una propiedad que el objeto no tiene, JS la busca en el prototipo; si tampoco
está, en el prototipo del prototipo, y así hasta llegar a `null`. A esto se le llama
la **cadena de prototipos**.

```text
PLATFORMS.samsung                      PLATFORM_DEFAULTS              Object.prototype
┌──────────────────────────┐ proto ┌──────────────────────┐ proto ┌──────────────┐
│ id: 'samsung'            │──────►│ selectSource()       │──────►│ toString()   │──► null
│ sendCode()               │       │ turnOn() / turnOff() │       │ hasOwnProperty│
│ supportsCommands: false  │       │ sendCommand()        │       │ ...          │
└──────────────────────────┘       └──────────────────────┘       └──────────────┘
```

- `PLATFORMS.samsung.sendCode` → está en samsung → lo usa.
- `PLATFORMS.samsung.sendCommand` → no está en samsung → lo busca en
  `PLATFORM_DEFAULTS` → encuentra el que rechaza con `UnsupportedActionError`.
- `PLATFORMS.lg.sendCommand` → **sí** está en lg → usa el de LG. Se dice que LG
  "sobrescribe" (override) el valor por defecto.

¿Y `this.id` dentro de `PLATFORM_DEFAULTS.sendCommand`? Cuando llamas
`PLATFORMS.samsung.sendCommand()`, `this` es `PLATFORMS.samsung` (el objeto a la
izquierda del punto), aunque la función viva en el prototipo. Por eso el mensaje dice
`"samsung"` y no `undefined`.

Las clases de JS (`class`, `extends`) funcionan exactamente con este mismo mecanismo
por debajo; son una sintaxis más cómoda.

**Alternativas** que había:

```js
// a) Copiar con spread: cada driver recibe copias de las funciones
const samsung = { ...PLATFORM_DEFAULTS, id: 'samsung', sendCode() { ... } };

// b) Crear el objeto ya con el prototipo
const samsung = Object.create(PLATFORM_DEFAULTS);

// c) Clases
class Platform { selectSource() {...} sendCommand() {...} }
class SamsungPlatform extends Platform { sendCode() {...} }
```

Se eligió `setPrototypeOf` porque deja los drivers escritos como objetos literales
simples, fáciles de leer. MDN advierte que cambiar el prototipo de un objeto puede
ser lento, pero aquí se hace una sola vez, al cargar el archivo, sobre tres objetos
pequeños: no importa.

> **Analogía con C (una de las dos de la guía):** `PLATFORMS` es como un
> `struct platform` con punteros a función, uno por marca. El prototipo es como
> rellenar los punteros vacíos con funciones por defecto, pero JS lo hace en el
> momento de la llamada, buscando por nombre.

## 2.12 Módulos: `import` y `export`

Al final de la v4:

```js
export {
  CARD_VERSION,
  KEYS,
  ...
  executeAction,
  stripSsap,
};
```

Y en la prueba:

```js
// test/actions.test.mjs
import {
  parseAction, executeAction, isHoldable, resolveForPlatform, KEYS, UnsupportedActionError,
} from '../minimalist-tv-control-card.js';
import { createFakeHass, LG_TV, SAMSUNG_TV, ROKU } from './helpers.mjs';
```

- `export { a, b }` publica esos nombres; lo que no se exporta queda privado del
  módulo (por ejemplo, `PLATFORM_DEFAULTS` y `delay` no se exportan).
- `import { a } from './ruta.js'` los trae. La ruta es relativa al archivo que
  importa y **lleva la extensión** (`.js`, `.mjs`).
- `export function createFakeHass(...)` (en `helpers.mjs`) es la otra forma:
  exportar en la misma línea donde se declara.
- Lo que se importa es una **conexión en vivo** y de solo lectura: no puedes hacer
  `KEYS = {}` desde la prueba, pero sí ves el mismo objeto `KEYS`.

**¿Por qué `.mjs` en las pruebas y `.js` en la tarjeta?** Node decide si un archivo
es módulo ES por su extensión y por `package.json`:

- `.mjs` → siempre módulo ES.
- `.js` → módulo ES si el `package.json` más cercano dice `"type": "module"`.

Por eso existe esta línea en `package.json`:

```json
"type": "module",
```

Sin ella, Node podría interpretar la tarjeta en el formato antiguo (CommonJS, el de
`require()`).

## 2.13 `switch`, `throw` y errores

```js
// v4 §4, executeAction
switch (resolved.type) {
  case 'key': {
    const code = KEYS[resolved.key]?.[platform.id];
    if (!code) throw new UnsupportedActionError(platform.id, `tecla "${resolved.key}"`);
    return platform.sendCode(hass, device, code);
  }
  case 'button':
    return platform.sendCode(hass, device, resolved.button);
  ...
  default:
    throw new Error(`Tipo de acción desconocido: ${resolved.type}`);
}
```

- `switch` compara con `===` contra cada `case`.
- Si un `case` no termina con `return`, `break` o `throw`, **sigue ejecutando el
  siguiente** ("fall-through"). Aquí todos terminan con `return` o `throw`, así que no
  hace falta `break`.
- Las llaves en `case 'key': { ... }` crean un bloque. Sin ellas, el `const code`
  de un `case` chocaría con otro `const code` en otro `case`
  (`SyntaxError: Identifier 'code' has already been declared`), porque todo el
  `switch` es un solo bloque.
- `default` atrapa cualquier otro valor.

**`throw`** lanza un error: la función se detiene y el error "sube" hasta que algún
`try { } catch (e) { }` lo atrapa. Si nadie lo atrapa, aparece en la consola como
`Uncaught Error: ...`.

```js
try {
  await executeAction(hass, action, device);
} catch (err) {
  if (err instanceof UnsupportedActionError) mostrarToast(err.message);
  else throw err;   // otro tipo de error: que siga subiendo
}
```

`instanceof` pregunta "¿este objeto fue creado por esta clase (o una hija)?". Es la
razón de tener una clase de error propia: poder distinguir "esta TV no tiene esa
tecla" de "se cayó la red".

Dentro de una función `async` (siguiente sección), `throw` **no** sale como excepción
normal: se convierte en una Promise rechazada.

## 2.14 Promises

Una **Promise** representa un resultado que llegará en el futuro. Está en uno de
tres estados:

```text
            ┌──────────► fulfilled (cumplida, con un valor)
 pending ───┤
            └──────────► rejected  (rechazada, con un error)
```

Una vez que pasa a cumplida o rechazada, ya no cambia.

Cómo se crea una (helpers.mjs, el hass falso):

```js
callService(domain, service, data) {
  calls.push({ domain, service, data });
  return new Promise((resolve, reject) => {
    setTimeout(() => (fail ? reject(new Error(fail)) : resolve()), latency);
  });
},
```

`new Promise(fn)` ejecuta `fn` de inmediato y le pasa dos funciones: llamar
`resolve(valor)` la cumple; llamar `reject(error)` la rechaza. Aquí se cumple (o
rechaza) después de `latency` milisegundos, simulando una red lenta.

Cómo se usa el resultado, forma clásica:

```js
hass.callService('media_player', 'turn_on', { entity_id: 'media_player.tv' })
  .then(() => console.log('HA confirmó'))
  .catch((err) => console.error('falló:', err));
```

`delay` en §4 es una Promise que se cumple sola después de `ms` milisegundos:

```js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
```

Atajos útiles: `Promise.resolve(v)` (ya cumplida), `Promise.reject(e)` (ya
rechazada; lo usa `PLATFORM_DEFAULTS.sendCommand`), `Promise.all([...])` (espera a
todas), `Promise.race([...])` (la primera que termine).

## 2.15 `async` / `await` y el event loop

```js
// v4 §4
async function executeAction(hass, action, device) {
  ...
  case 'sequence':
    for (let i = 0; i < resolved.steps.length; i++) {
      if (i > 0) await delay(resolved.delay);
      await executeAction(hass, resolved.steps[i], device);
    }
    return;
```

- Una función `async` **siempre devuelve una Promise**, aunque escribas `return 5`
  (devuelve una Promise que se cumple con 5).
- Si dentro haces `return otraPromise`, la Promise de la función "adopta" el
  resultado de esa otra. Por eso `return platform.sendCode(...)` hace que
  `executeAction` termine cuando HA contesta.
- Si dentro haces `throw`, la Promise se **rechaza**. Por eso la prueba usa
  `assert.rejects(executeAction(...))` y no un `try/catch` síncrono.
- `await promesa` **pausa esta función** (y solo esta) hasta que la promesa termine.
  Si se cumple, `await` devuelve el valor; si se rechaza, `await` lanza el error ahí
  mismo, como si fuera un `throw`.

### ¿Qué pasa mientras la función está "pausada"?

JavaScript en el navegador corre en **un solo hilo**. Nada corre "en paralelo" con
tu código. Lo que hay es un **event loop** (bucle de eventos):

```text
          ┌────────────────────────────────────────────────┐
          │                 EVENT LOOP                     │
          │                                                │
          │  1. Toma UNA tarea de la cola de tareas        │
          │     (un clic, un setTimeout que venció,        │
          │      un mensaje del websocket de HA...)        │
          │     y la ejecuta hasta el final.               │
          │                                                │
          │  2. Ejecuta TODAS las microtareas pendientes   │
          │     (continuaciones de Promises / await).      │
          │                                                │
          │  3. Si toca, el navegador redibuja la pantalla.│
          │                                                │
          │  4. Vuelve a 1.                                │
          └────────────────────────────────────────────────┘
```

Cuando una función llega a `await`, **devuelve el control** al event loop. El loop
sigue atendiendo clics, redibujando y recibiendo updates de `hass`. Cuando la promesa
se cumple, el resto de la función se agenda como microtarea y continúa donde se
quedó.

> **Analogía con C (la segunda y última):** en C, esperar una respuesta de red
> normalmente bloquea el hilo (`recv()` se queda parado). En JS nunca se bloquea:
> `await` es más parecido a "guarda dónde ibas, atiende otras cosas y vuelve aquí
> cuando llegue la respuesta".

Consecuencia práctica: **un ciclo infinito síncrono congela toda la pestaña**
(`while (true) {}` nunca devuelve el control). Un ciclo con `await` adentro no la
congela, porque en cada vuelta suelta el control.

### Por qué `for...of` con `await` va en orden y `forEach(async)` no

```js
// En orden: cada paso espera al anterior
for (const step of steps) {
  await executeAction(hass, step, device);
}

// TODOS A LA VEZ: forEach no espera nada
steps.forEach(async (step) => {
  await executeAction(hass, step, device);
});
console.log('esto se imprime ANTES de que termine cualquier paso');
```

`forEach` llama a tu función una vez por elemento y **descarta lo que devuelve**.
Una función `async` devuelve una Promise, que `forEach` simplemente ignora. Así que
`forEach` arranca los cuatro pasos casi en el mismo instante y termina enseguida. El
`await` de adentro solo pausa a *cada* función individual, no al `forEach`.

Con la secuencia del PIN `1-1-0-2` en una LG, `forEach(async)` mandaría los cuatro
botones juntos y la TV podría recibirlos desordenados o perder alguno. El
`for` con `await` garantiza `1`, espera, `1`, espera, `0`, espera, `2`.

Si **sí** quieres en paralelo y esperar a que terminen todos:
`await Promise.all(steps.map((s) => executeAction(hass, s, device)));`

Dato curioso de la v3: `sendPass` usa `for...of` con `await this.delay(500)`, pero
llama `this.sendButtonAction(button)` **sin** `await` (y esa función ni siquiera
devuelve la Promise). Espera el tiempo, pero no la respuesta de HA.

## 2.16 `setTimeout` y `setInterval`

```js
const id = setTimeout(fn, 500);   // ejecuta fn UNA vez, dentro de ~500 ms
clearTimeout(id);                 // la cancela si aún no se ejecutó

const id2 = setInterval(fn, 200); // ejecuta fn cada ~200 ms, PARA SIEMPRE
clearInterval(id2);               // la única forma de detenerla
```

- Ambas devuelven un identificador. **Si pierdes el identificador, ya no puedes
  cancelar el timer.** Esto es exactamente lo que pasa en el bug del hold.
- El tiempo es un **mínimo**, no una garantía: el callback entra a la cola de
  tareas y espera su turno.
- `setInterval` no sabe nada de Promises: dispara cada 200 ms **aunque la llamada
  anterior a HA no haya terminado**. Si la TV tarda 1 s en responder, en ese segundo
  ya se mandaron 5 comandos más que se acumulan.

La v3 usa ambos en el hold:

```js
// v3 (producción), listenerTouchpad(), startHold
holdTimeout = setTimeout(() => {
    const action = getAction();
    if (!action || !HOLD_ACTIONS.includes(action)) return;
    isHold = true;
    holdInterval = setInterval(() => {
        this.handleTouchpadButton(direction);
    }, 200);
}, 500);
```

"Si mantienes el dedo 500 ms, empieza a repetir cada 200 ms". La v4 reemplaza el
`setInterval` por un ciclo `async` (ver 3.6).

---

# 3. Recorrido por la v4, sección por sección

El archivo de la v4 está dividido en secciones numeradas. Hoy existen §1 a §5; la
tarjeta visual (§6) y el editor (§7) vienen después.

```text
 YAML del usuario
      │
      ▼
 §5 normalizeConfig(raw) ──► modelo limpio { tvs: [{ platform, entity, companion, settings }] }
                                     │
              (cada botón del modelo tiene una acción ya parseada)
                                     │
 §2 parseAction('VOLUMEUP') ──► { type: 'key', key: 'vol_up' }
                                     │
 §4 executeAction(hass, acción, device)
      │   usa §1 KEYS para traducir 'vol_up' al código de la marca
      │   usa §3 PLATFORMS para saber qué servicio de HA llamar
      ▼
 hass.callService(...)  ──► Home Assistant ──► la TV
```

La idea central: **separar "qué quiere el usuario" de "cómo se dice en cada marca"**.
La v3 mezclaba ambas cosas en cada botón (`actionLG`, `actionSamsung`, `actionRoku`
repetidos en varios lugares), y por eso un error en una tabla no se corregía en las
otras.

Las secciones §1 a §5 son **funciones puras** o casi: reciben datos y devuelven
datos, sin tocar la pantalla. Eso permite probarlas con Node, sin navegador.

## 3.1 §1 Teclas semánticas (`KEYS`)

```js
const KEYS = {
  up:     { label: 'Arriba',        lg: 'UP',       samsung: 'KEY_UP',    roku: 'up' },
  ...
  vol_up: { label: 'Subir volumen', lg: 'VOLUMEUP', samsung: 'KEY_VOLUP', roku: 'volume_up' },
  ...
  exit:   { label: 'Salir',         lg: 'EXIT',     samsung: 'KEY_EXIT',  roku: null },
};
```

- La **clave** (`up`, `vol_up`, `exit`) es el nombre "semántico": lo que la tecla
  *significa*, independiente de la marca.
- Cada valor dice qué código manda cada plataforma. `null` = esa plataforma no tiene
  esa tecla (el Roku no tiene `exit`).
- `label` es el texto en español, para el editor.

Después vienen los dígitos (generados con un `for`, ver 2.1) y dos `Set`:

```js
const HOLDABLE_KEYS = new Set(['up', 'down', 'left', 'right', 'vol_up', 'vol_down', 'ch_up', 'ch_down']);
const TV_ONLY_KEYS  = new Set(['vol_up', 'vol_down', 'mute']);
```

- `HOLDABLE_KEYS`: las únicas teclas que se repiten al mantener presionado. Un
  script, una fuente o un `command` se mandan **una sola vez** por toque. Esto es
  parte del arreglo del bug B1 (hold infinito).
- `TV_ONLY_KEYS`: aunque el Roku esté activo, el volumen va a la TV. Todavía no se
  usa en §1-§5; lo usará la tarjeta (§6) para elegir el `device`.

Y el índice inverso `CODE_TO_KEY` (explicado en 2.9), que permite que un YAML viejo
con `'VOLUMEUP'` o `'KEY_VOLUP'` se entienda como `vol_up`.

## 3.2 §2 Acciones: `parseAction`

**Entrada:** cualquier cosa que venga del YAML: un string viejo, un objeto nuevo, una
lista, `null`.
**Salida:** un objeto con forma fija, o `null` si no hay acción válida.

Las formas posibles de salida (el comentario de §2 las lista):

```js
{ type: 'key',      key: 'up' }
{ type: 'button',   button: 'KEY_HDMI' }
{ type: 'command',  command: 'tv/switchInput', payload: { inputId: 'HDMI_1' } }   // solo LG
{ type: 'source',   source: 'HDMI 1' }
{ type: 'service',  service: 'script.turn_on', data: { entity_id: 'script.x' } }
{ type: 'sequence', steps: [acción, ...], delay: 500 }
{ type: 'platform', by: { lg: acción, samsung: acción, default: acción } }
```

Todas comparten el campo `type`, que dice "qué clase de acción es" y, por lo tanto,
qué otros campos tiene. Así el resto del código hace un solo `switch (action.type)`.
A este patrón se le llama **unión discriminada** (*discriminated union*): el `type`
discrimina entre variantes.

### El recorrido de un string

`parseAction` prueba en este orden y se queda con la **primera** regla que aplica:

```text
 str = String(raw).trim()
  │
  ├─ '' o 'pendiente' (sin importar mayúsculas)        → null
  ├─ /^script\.[a-z0-9_]+$/i     ej. 'script.art_mode' → service script.turn_on
  ├─ /^scene\.[a-z0-9_]+$/i      ej. 'scene.cine'      → service scene.turn_on
  ├─ empieza con 'source:'       ej. 'source:HDMI 1'   → { type:'source', source:'HDMI 1' }
  ├─ empieza con 'command:'      quita 'ssap://'       → { type:'command', ... }
  ├─ empieza con 'key:'          ej. 'key:mute'        → parseAction({type:'key', key:'mute'})
  ├─ KEYS[str] existe            ej. 'up'              → { type:'key', key:'up' }
  ├─ CODE_TO_KEY.get(str)        ej. 'VOLUMEUP'        → { type:'key', key:'vol_up' }
  └─ cualquier otra cosa         ej. 'KEY_HDMI'        → { type:'button', button:'KEY_HDMI' }
```

El orden importa. Por ejemplo, `'script.x'` tiene que revisarse antes de la última
regla; si no, se mandaría como un botón crudo a la TV.

### Expresiones regulares (regex)

```js
/^script\.[a-z0-9_]+$/i.test(str)
```

Una regex es un patrón para strings, escrito entre `/ /`:

| Pieza | Significado |
|---|---|
| `^` | inicio del string |
| `script` | literalmente "script" |
| `\.` | un punto literal (sin `\`, `.` significa "cualquier carácter") |
| `[a-z0-9_]+` | uno o más (`+`) caracteres entre a-z, 0-9 o `_` |
| `$` | fin del string |
| `i` (después de la `/` final) | ignorar mayúsculas/minúsculas |

`.test(str)` devuelve `true`/`false`. En `stripSsap`,
`.replace(/^ssap:\/\//i, '')` reemplaza un `ssap://` al inicio por nada. Las `\/`
son barras escapadas, porque `/` sola cerraría la regex.

### El recorrido de un objeto

Si `raw` es objeto, primero revisa que `raw.type` esté en `ACTION_TYPES` y luego,
según el tipo, **valida y copia** solo los campos que le importan. Cosas a notar:

- `case 'sequence'` llama a `parseAction` **recursivamente** sobre cada paso
  (`.map(parseAction)`). Una secuencia puede tener secuencias adentro.
- Una lista (`['1', '1', '0', '2']`) es un atajo para una secuencia: la primera
  rama envuelve el array en `{ type: 'sequence', steps: raw }` y vuelve a llamar.
- `case 'platform'` parsea cada variante y descarta las inválidas.
- Lo que no se reconoce devuelve `null`. La filosofía es "nunca lanzar un error por
  una acción mal escrita: simplemente no hay acción".

### `resolveForPlatform` e `isHoldable`

```js
function resolveForPlatform(action, platformId) {
  if (!action) return null;
  if (action.type !== 'platform') return action;
  return action.by[platformId] || action.by.default || null;
}
```

Si la acción es "por plataforma", elige la variante de esa plataforma; si no hay,
usa `default`; si tampoco, `null`. Cualquier otra acción pasa tal cual.

> **Nota de revisión (detalle fino):** `KEYS` es un objeto normal, así que hereda
> propiedades de `Object.prototype`. Por eso `parseAction('toString')` devuelve
> `{ type: 'key', key: 'toString' }` en vez de un botón crudo (lo comprobé con Node).
> No rompe nada grave (luego `executeAction` lanza `UnsupportedActionError`), pero
> la forma robusta de preguntar "¿esta clave es mía?" es `Object.hasOwn(KEYS, str)`.
> Lo mismo aplica a `PLATFORMS[id]` en `getPlatform` y a `FIXED_MODES[id]` en §5.

## 3.3 §3 Plataformas (drivers)

```js
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
  },
  samsung: { ... sendCode → media_player.play_media con media_content_type 'send_key' ... },
  roku:    { ... sendCode → remote.send_command sobre device.remote ... },
};
```

Cada driver tiene **las mismas funciones** con los mismos parámetros. El resto del
código nunca pregunta "¿es Samsung?"; solo llama `platform.sendCode(...)` y cada
driver sabe qué servicio usar. Agregar una marca nueva (Android TV, por ejemplo) es
agregar un objeto más, sin tocar `executeAction`.

Lo común (`selectSource`, `turnOn`, `turnOff` y el `sendCommand` que rechaza) vive en
`PLATFORM_DEFAULTS` y se hereda por prototipo (explicado en 2.11).

Detalles:

- **`{ entity_id: device.entity, command }`**: cuando la clave y la variable se
  llaman igual, se puede escribir solo `command` en vez de `command: command`. Se
  llama *shorthand property*.
- **Todas las funciones devuelven la Promise de `callService`.** Así quien llama
  puede hacer `await` y saber cuándo terminó HA. Esto es imprescindible para el hold.
- **`device`** es un objeto pequeño `{ platform, entity, remote? }`, no la entidad de
  HA completa. Para el Roku, las teclas van por `device.remote` (`remote.roku`) y las
  fuentes por `device.entity` (`media_player.roku`).
- **LG `command` vs `button`**: `webostv.button` manda una tecla del control remoto.
  `webostv.command` llama a la API interna de webOS (por ejemplo, abrir el selector
  de entradas) y espera una respuesta. Por eso el plan dice que los `command` nunca
  se auto-repiten.

## 3.4 §4 `executeAction`

**Entrada:** `hass`, una acción ya normalizada y un `device`.
**Salida:** una Promise que se cumple cuando HA terminó, o se rechaza si algo falló.

```js
async function executeAction(hass, action, device) {
  if (!hass || !action || !device) return;
  const platform = getPlatform(device.platform);
  if (!platform) throw new Error(`Plataforma desconocida: ${device.platform}`);

  const resolved = resolveForPlatform(action, platform.id);
  if (!resolved) return;

  switch (resolved.type) {
    case 'key':     { const code = KEYS[resolved.key]?.[platform.id]; ... return platform.sendCode(hass, device, code); }
    case 'button':  return platform.sendCode(hass, device, resolved.button);
    case 'command': return platform.sendCommand(hass, device, resolved.command, resolved.payload);
    case 'source':  return platform.selectSource(hass, device, resolved.source);
    case 'service': { const [domain, service] = resolved.service.split('.'); return hass.callService(domain, service, resolved.data); }
    case 'sequence': ... for con await ...
    default:        throw new Error(`Tipo de acción desconocido: ${resolved.type}`);
  }
}
```

Observa las **cláusulas de guarda** al inicio: los casos raros (sin `hass`, sin
acción, plataforma desconocida) salen primero, y el resto de la función puede
suponer que todo está bien. Es más legible que anidar `if` dentro de `if`.

Fíjate también en que `case 'service'` no pasa por el driver: un script de HA se
ejecuta igual sin importar la marca de la TV.

### Ejemplo completo: `'VOLUMEUP'` en una Samsung

Supón un YAML viejo de un cliente con una Samsung y un custom mode con
`custom1_up_value: VOLUMEUP` (que era el código de LG). En la v3 eso mandaba
`'VOLUMEUP'` a la Samsung, que no lo entendía. En la v4:

```text
1. §5 normalizeConfig lee custom1_up_value: 'VOLUMEUP'
      └─ llama parseAction('VOLUMEUP')

2. §2 parseAction('VOLUMEUP')
      ├─ no es '' ni 'pendiente'
      ├─ no es script. ni scene.
      ├─ no empieza con source:, command:, key:
      ├─ KEYS['VOLUMEUP']  → undefined (las claves son minúsculas)
      ├─ CODE_TO_KEY.get('VOLUMEUP') → 'vol_up'   ✔
      └─ devuelve { type: 'key', key: 'vol_up' }

3. El usuario toca la flecha de arriba en el modo custom1.
   La tarjeta (§6, futura) llama:
      executeAction(hass, { type:'key', key:'vol_up' },
                    { platform: 'samsung', entity: 'media_player.samsung' })

4. §4 executeAction
      ├─ getPlatform('samsung') → PLATFORMS.samsung
      ├─ resolveForPlatform(...) → la misma acción (no es 'platform')
      ├─ case 'key':
      │     code = KEYS['vol_up']?.['samsung'] → 'KEY_VOLUP'
      └─ return PLATFORMS.samsung.sendCode(hass, device, 'KEY_VOLUP')

5. §3 samsung.sendCode
      └─ hass.callService('media_player', 'play_media', {
             entity_id: 'media_player.samsung',
             media_content_type: 'send_key',
             media_content_id: 'KEY_VOLUP',
         })   → devuelve una Promise

6. HA → integración SamsungTV Smart → la TV sube el volumen.
   La Promise se cumple → el await de quien llamó continúa.
```

Esto es exactamente lo que comprueba la prueba
`'el VOLUMEUP de un YAML viejo ahora funciona en Samsung'`.

### Ejemplo con error: `exit` en un Roku

```text
executeAction(hass, { type:'key', key:'exit' }, ROKU)
  └─ code = KEYS['exit']?.['roku'] → null
  └─ throw new UnsupportedActionError('roku', 'tecla "exit"')
       → como la función es async, esto RECHAZA la Promise
       → hass.callService nunca se llama
```

## 3.5 §5 Catálogos y `normalizeConfig`

**Entrada:** la config cruda que recibe `setConfig` (formato v4 nuevo, formato del
repo v3.x o la variante "v3 multientidad").
**Salida:** un **modelo interno** limpio y siempre con la misma forma:

```js
{
  format: 'v4' | 'legacy',
  cardId: 'sala',                 // o 'auto:media_player.a,media_player.b'
  theme: 'dark' | 'light',
  controlModeEntity: null | 'input_select.modo_tv',
  tvs: [
    {
      name: 'Sala',
      entity: 'media_player.lg_sala',
      platform: 'lg',
      companion: { platform: 'roku', entity: 'media_player.roku', remote: 'remote.roku' } | null,
      settings: {
        modes: ['menu', 'busqueda', 'custom1'],
        modeDefs: { menu: { id, label, icon, pad }, ... },
        defaultPad: { up: { icon, action }, left: ..., right: ..., down: ... },
        streaming: [ { index, source, icon, action, accent }, ... ],   // siempre 4
        buttons: { top_left, power, center, back, home, exit, menu },
      },
    },
  ],
  warnings: ['Modo desconocido "inventado", se omitió.', ...],
}
```

La tarjeta (§6) **solo leerá este modelo**; nunca vuelve a mirar las claves crudas
del YAML. Toda la "arqueología" de formatos viejos queda encerrada en §5.

### Catálogos

- `SOURCES`: las fuentes/apps que se pueden asignar a los 4 botones de streaming.
  `SOURCES_BY_ID` es un `Map` para buscar por `id` rápido:
  ```js
  const SOURCES_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));
  ```
  `new Map(...)` acepta una lista de pares `[clave, valor]`; el `.map` convierte cada
  fuente en `['netflix', {...}]`.
- `FIXED_MODES`: los modos que vienen con la tarjeta (`menu`, `busqueda`, `audio`,
  `fuentes`, `info`), cada uno con su `pad` (las 4 direcciones del touchpad).
- `MODE_ALIASES = { navegacion: 'menu' }`: el modo viejo `navegacion` se migra a
  `menu`.
- `RESERVED_MODES`: `text` y `amplificador`, para la Fase 4; si aparecen, se omiten
  con un aviso.
- `DEFAULT_BUTTONS`: los botones fijos. `top_left` es el botón de arriba a la
  izquierda, que en la v3 se llamaba `exit` y que muchos clientes usan para scripts.
  En la v4 queda separado del EXIT de abajo (bug B4).

### La función `pad` y los rest parameters

```js
function pad(...entries) {
  const result = {};
  DIRECTIONS.forEach((dir, i) => {
    const [icon, action] = entries[i] || [];
    result[dir] = { icon: icon || null, action: parseAction(action) };
  });
  return result;
}

// uso:
pad(['mdi:home', 'home'], ['mdi:menu', 'menu'], ['mdi:exit-to-app', 'exit'], ['mdi:undo-variant', 'back'])
```

- `...entries` en los **parámetros** es lo contrario del spread: junta todos los
  argumentos en un array. Se llama *rest parameter*. Aquí `entries` es un array de 4
  pares.
- `forEach((dir, i) => ...)`: el segundo parámetro del callback es el índice.
- `const [icon, action] = entries[i] || [];`: si falta el par, se destructura un array
  vacío y ambos quedan `undefined` (sin error).
- Resultado: `{ up: { icon: 'mdi:home', action: {type:'key', key:'home'} }, left: ... }`.

Es un ejemplo de función "atajo" para que la tabla `FIXED_MODES` se lea como una
tabla y no como 40 líneas repetitivas.

### Helpers pequeños

```js
function firstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}
```

Devuelve el primer valor "útil". Se usa para expresar prioridades:
`firstDefined(n.icon, l.icon, def.icon)` = "el ícono del formato nuevo; si no, el del
viejo; si no, el por defecto". Es como encadenar `??`, pero tratando además `''` como
vacío (en YAML, un campo vacío suele llegar como `''` o `null`).

- `normalizePlatform('LG TV')` → `'lg'`; `'samsung'` → `'samsung'`. Cualquier cosa
  desconocida cae en `'lg'`, igual que en producción.
- `normalizeColor('229, 9, 20')` → `'rgb(229, 9, 20)'`. Un color hexadecimal se
  deja igual.
- `normalizeCompanion(raw)` acepta tanto `media_entity`/`remote_entity` (formato
  viejo `roku:`) como `entity`/`remote`.

### `legacyPerBrandAction`: valores distintos por marca

El formato viejo permitía `custom1_up_value`, `custom1_up_value_lg` y
`custom1_up_value_samsung`. La función:

1. Parsea los tres.
2. Si no hay variantes por marca, devuelve la genérica.
3. Si las variantes coinciden con la genérica **después de parsear**, devuelve una
   sola acción. Como `parseAction` ya traduce `'VOLUMEUP'` y `'KEY_VOLUP'` a
   `vol_up`, casi siempre coinciden.
4. Si de verdad son distintas, arma `{ type: 'platform', by: { lg, samsung, default } }`.

Para comparar dos objetos usa `JSON.stringify(x) === JSON.stringify(y)`. Comparar
objetos con `===` compara **identidad** (si son el mismo objeto en memoria), no
contenido; convertirlos a texto es un truco sencillo para comparar contenido. Su
límite: depende del orden de las claves, que aquí siempre es el mismo porque
`parseAction` construye los objetos igual.

### El operador `in`

```js
// readPad
action: entry && 'action' in entry ? parseAction(entry.action) : (fallback?.[dir]?.action ?? null),
```

`'action' in entry` pregunta "¿el objeto tiene la clave `action`?", aunque su valor
sea `null`. Es distinto de `entry.action !== undefined`: permite que el usuario
escriba `action: null` a propósito para **desactivar** un botón, en vez de heredar el
valor por defecto.

> **Nota de revisión:** `in` solo funciona sobre objetos. Si alguien escribe el
> atajo `up: vol_up` (un string en vez de `{ action: ... }`) dentro de
> `custom_modes`, o `buttons: { power: script.x }`, `normalizeConfig` lanza
> `TypeError: Cannot use 'in' operator to search for 'action' in vol_up`
> (lo comprobé con Node). Conviene revisar `typeof entry === 'object'` antes, o
> aceptar el string como acción directa.

### El flujo de `normalizeConfig`

```text
normalizeConfig(raw)
 │
 ├─ ¿raw es un objeto?  no → throw Error('Configuración inválida.')
 │
 ├─ isV4 = ¿tiene alguna clave que solo existe en v4? (modes, buttons, streaming, ...)
 │
 ├─ 1. rawTvs: usa raw.tvs, o arma una lista de una TV con raw.entity,
 │        o throw Error('Define al menos una TV ...')
 │
 ├─ 2. globalSettings = resolveSettings(raw, warnings)
 │        ├─ resolveModes        → ['menu', 'busqueda', 'audio']
 │        ├─ resolveCustomMode   (por cada customN usado)
 │        ├─ resolveDefaultPad
 │        ├─ resolveStreaming    → 4 slots
 │        └─ resolveButtons
 │
 ├─ 3. por cada TV:
 │        ├─ junta overrides (overrides: {...} + claves sueltas que no son propias de la TV)
 │        ├─ si hay overrides → resolveSettings({ ...raw, ...overrides })
 │        └─ si no            → reutiliza globalSettings (el MISMO objeto)
 │
 ├─ 4. cardId = raw.card_id o 'auto:' + entidades
 │
 └─ return { format, cardId, theme, controlModeEntity, tvs, warnings: [...new Set(warnings)] }
```

Ideas a notar:

- **`warnings` se pasa como parámetro y las funciones le hacen `push`.** Un array es
  un objeto, y los objetos se pasan por referencia: todas las funciones escriben en
  el mismo array. Al final, `[...new Set(warnings)]` quita repetidos: el `Set`
  elimina duplicados y el spread lo vuelve a convertir en array.
- **`{ ...raw, ...overrides }`**: la config global con los overrides encima (gana
  el último). Es una mezcla **superficial**: si una TV sobrescribe `custom_modes`,
  reemplaza el objeto `custom_modes` entero, no solo el modo que cambió. Hoy funciona
  porque `resolveCustomMode` vuelve a los valores por defecto para los modos que
  faltan, pero conviene saberlo.
- **Reutilizar `globalSettings`** en vez de copiarlo ahorra memoria con 17 TVs, y
  la prueba lo verifica con `assert.strictEqual` (misma identidad). La contracara es
  que **nadie debe modificar** ese objeto después: un cambio en una TV aparecería
  en todas. Lo mismo para los `pad` de `FIXED_MODES`, que se comparten entre todas
  las configs (`{ id, ...FIXED_MODES[id] }` copia solo el primer nivel). Si se
  quiere blindar, `Object.freeze` recursivo en los catálogos.
- **Lanza errores solo cuando la config no se puede usar** (sin TVs, TV sin
  `entity`). Todo lo demás se resuelve con valores por defecto y un aviso en
  `warnings`. HA mostrará los errores como tarjeta roja.

## 3.6 Lo que viene: §6 y §7 según el plan

Esto todavía **no existe** en el archivo. Los fragmentos de esta sección son bocetos
para entender la idea, no el código final.

### `_build` / `_update` en lugar de `render()` completo

```js
// BOCETO (no es el código real)
setConfig(raw) {
  this._model = normalizeConfig(raw);     // lanza Error si es inválida → tarjeta roja
  this._built = false;
  if (this.isConnected) this._build();
}

set hass(hass) {
  this._hass = hass;
  const sig = this._signature(hass);      // string con SOLO lo que me importa
  if (sig === this._lastSig) return;      // nada mío cambió: no tocar nada
  this._lastSig = sig;
  this._update();                         // parchar clases, textos y variables CSS
}
```

- `_build()` crea el DOM **una vez**.
- `_update()` solo cambia lo necesario: una clase, un texto, unas variables CSS.
- La **firma** (`_signature`) es, por ejemplo, un string con el `state` y la
  `source` de la TV activa y del companion. Si es igual a la anterior, no se hace
  nada. Esto también arregla el bug B5 (la v3 no miraba la entidad del Roku).

### Hold con `async`/`await` en lugar de `setInterval`

```js
// BOCETO (no es el código real)
async _runHold(action, device, token) {
  for (let n = 0; n < 40; n++) {                 // límite de seguridad
    if (token.cancelled) return;
    await executeAction(this._hass, action, device);   // espera a HA
    if (token.cancelled) return;
    await delay(250);
  }
}
```

Diferencias con la v3:

| v3 (`setInterval`, 200 ms) | v4 (ciclo `async`, ~250 ms) |
|---|---|
| Dispara aunque HA no haya contestado: los comandos se acumulan. | La siguiente repetición sale solo después de que terminó la anterior. |
| Sin límite: si nadie llama `clearInterval`, sigue para siempre. | Máximo ~40 repeticiones pase lo que pase. |
| Se detiene solo con `pointerup`/`pointerleave` sobre el nodo original. | Se detiene con `pointerup`, `pointercancel`, `lostpointercapture`, `visibilitychange`, `disconnectedCallback`, o cambio de TV/modo. |

---

# 4. HTML para tarjetas

## 4.1 Elementos y atributos

HTML describe la **estructura** de la página como un árbol de elementos:

```html
<div class="top-button power-button" data-action="power">
    <ha-icon icon="mdi:power"></ha-icon>
</div>
```

- `<div>...</div>` es un **elemento**: etiqueta de apertura, contenido, etiqueta de
  cierre. `<div>` es una caja genérica sin significado propio.
- `class="top-button power-button"` es un **atributo**. `class` admite varios
  nombres separados por espacios; el CSS y el JS los usan para encontrar elementos.
- `id="..."` sería un identificador único en la página (o en el shadow root).

El navegador convierte este texto en objetos JS: el **DOM** (*Document Object
Model*). Cada elemento es un objeto con propiedades (`.className`, `.style`,
`.textContent`) y métodos (`.querySelector()`, `.addEventListener()`).

```js
// v3 (producción), saveElementReferences()
this.elements.powerButton = this.shadowRoot.querySelector('.power-button');
```

`querySelector(selector)` devuelve el **primer** elemento que coincide con un
selector CSS (o `null`). `querySelectorAll` devuelve todos.

## 4.2 Atributos `data-*`

Cualquier atributo que empiece con `data-` es tuyo: el navegador no lo interpreta.
Sirve para guardar datos en el HTML que el JS lee después:

```js
// v3 (producción): en el HTML
<div class="tv-selector-item ..." data-index="${index}">

// v3 (producción): en el listener
const index = parseInt(item.dataset.index);
```

- `element.dataset` es un objeto con todos los `data-*`. Los guiones se vuelven
  *camelCase*: `data-tv-index` → `dataset.tvIndex`.
- El valor **siempre es string**. Por eso `parseInt(...)` para convertir a número.
  (Mejor `parseInt(x, 10)` o `Number(x)`, para no depender de la base por defecto.)

En la v4, `data-*` es la base de la delegación de eventos (sección 6.4):
`data-action="power"`, `data-zone="top|bottom"` (bug B4), `data-dir="up"`.

## 4.3 Custom elements y Shadow DOM

`<tv-control-card>` es un **custom element** (sección 1.2). Por dentro, la tarjeta
tiene su propio árbol escondido, el **Shadow DOM**:

```js
// v3 (producción), constructor
this.attachShadow({ mode: 'open' });
```

```text
<hui-card>                                  ← página de HA
  └─ <tv-control-card>                      ← tu elemento (el "host")
       └─ #shadow-root (open)               ← árbol privado
            ├─ <style>...</style>
            └─ <ha-card>
                 └─ <div class="tv-control-card">
                      └─ <div class="card-grid"> ...
```

Qué te da el Shadow DOM:

1. **Encapsulación de CSS.** Tus estilos no se escapan a la página y los de la página
   no entran. Puedes usar `.button` sin miedo a chocar con otra tarjeta.
2. **Encapsulación de selectores.** `document.querySelector('.power-button')` **no**
   encuentra nada dentro de tu tarjeta; hay que usar `this.shadowRoot.querySelector`.
3. **Excepciones importantes:** las **variables CSS** (`--algo`) y las propiedades
   heredables (color, fuente) **sí atraviesan** el límite. Por eso los temas de HA
   (`--primary-color`) llegan a tu tarjeta, y por eso puedes cambiar el tamaño de un
   `ha-icon` con `--mdc-icon-size`.

`mode: 'open'` permite acceder desde afuera con `elemento.shadowRoot` (útil para
depurar en DevTools). Con `'closed'` sería `null`.

La v3 tiene una función que viola la encapsulación a propósito: `listenerModo` busca
el botón **recorriendo toda la página** desde `document.querySelector("home-assistant")`
y bajando por cada `shadowRoot`, hasta encontrar el primer `TV-CONTROL-CARD`. Es lento
y además es un bug: si hay **dos** tarjetas en el dashboard, siempre encuentra la
primera, así que la segunda tarjeta registra sus listeners de modo en los botones de
la primera. Lo correcto es `this.shadowRoot.querySelector(...)`.

## 4.4 `ha-card` y `ha-icon`

Son custom elements que HA ya registró; tú solo los usas.

- **`<ha-card>`**: el contenedor estándar de una tarjeta. Aplica el fondo, el borde
  redondeado y la sombra del tema del usuario. La v3 lo anula
  (`background: transparent !important`) para dibujar su propio fondo.
- **`<ha-icon icon="mdi:power">`**: dibuja un ícono de Material Design Icons (o de
  otros paquetes instalados, como `phu:` de *custom-brand-icons*). El tamaño se
  controla con la variable `--mdc-icon-size`:
  ```css
  .touchpad-button ha-icon { --mdc-icon-size: 28px; }
  ```

## 4.5 `innerHTML` y por qué reconstruirlo en cada update es lento

La v3 dibuja con una sola asignación gigante:

```js
// v3 (producción), render()
render() {
    const styles = this.getCurrentStyles();
    this.shadowRoot.innerHTML = `
        <style> ... más de 700 líneas de CSS ... </style>
        <ha-card> ... todo el HTML ... </ha-card>
    `;
    this.saveElementReferences();
    this.updateCardStyles();
    this.listenerModo(...); this.listenerPower(); this.listenerExit();
    this.listenerStreaming(); this.listenerBottomButtons();
    this.listenerTouchpad(); this.listenerTvSelector();
}
```

Asignar a `innerHTML` hace todo esto **cada vez**:

1. Destruye todos los elementos anteriores (y con ellos sus listeners).
2. Parsea el string como HTML.
3. Parsea de nuevo las más de 700 líneas de CSS del `<style>`.
4. Crea todos los elementos nuevos; los `ha-icon` vuelven a cargar su ícono.
5. Recalcula estilos y layout y redibuja.
6. Después, el código vuelve a buscar elementos y a registrar todos los listeners.

¿Y cuándo se llama `render()`? Desde `set hass` cada vez que cambia el estado o la
fuente de la TV, al cambiar de modo, al cambiar de TV, al alternar el modo Roku, al
mostrar "Encendiendo TV...". Cada vez, todo desde cero.

Además, el HTML se arma pegando strings con datos del usuario sin escapar:
`<span>${tv.name}</span>`. Si un nombre tuviera `<` o `"`, rompería el HTML. En la
v4, los textos se ponen con `element.textContent = nombre`, que nunca interpreta HTML.

## 4.6 El bug del hold infinito (B1), paso a paso

Juntemos closures (2.6), timers (2.16) e `innerHTML` (4.5):

```text
 t = 0 ms     Dedo abajo en la flecha ↑  (sector <path> A)
              pointerdown → startHold()  [closure A: holdInterval = null]
 t = 500 ms   setTimeout vence → holdInterval = setInterval(enviar ↑, 200)
              [closure A: holdInterval = 17]
 t = 700 ms   envía ↑ ... t = 900 ms envía ↑ ...
 t = 950 ms   Llega un update de hass (cambió la source de la TV)
              set hass → render() → shadowRoot.innerHTML = `...`
              ├─ el <path> A se DESTRUYE (sale del DOM)
              ├─ se crea un <path> B nuevo, idéntico a la vista
              └─ listenerTouchpad() crea closure B: holdInterval = null
 t = 1100 ms  envía ↑ (el interval 17 sigue vivo: nadie lo canceló)
 t = 1200 ms  Dedo arriba.
              pointerup cae sobre <path> B  → stopHold() de closure B
              └─ clearInterval(null)  ← ¡no hace nada!
 t = 1300 ms  envía ↑ ... envía ↑ ... para siempre.
              El id 17 solo lo conocía closure A, que ya nadie puede llamar.
```

Y como `setInterval` no espera a que HA conteste, con la TV o la red lentas los
comandos se acumulan y la TV se satura. La v4 lo arregla por cuatro lados:

1. **DOM persistente** (`_build` una vez): el `<path>` nunca se reemplaza.
2. **Ciclo `async` con `await`** (3.6): no se acumulan comandos.
3. **Límite** de repeticiones.
4. **Muchas formas de detenerlo** (`pointercancel`, `lostpointercapture`,
   `disconnectedCallback`...), con el estado del hold guardado en la tarjeta y no en
   un closure por nodo.

---

# 5. CSS

## 5.1 Selectores

Un selector dice **a qué elementos** se aplica una regla:

```css
.touchpad-button ha-icon {        /* selector */
    --mdc-icon-size: 28px;        /* declaración: propiedad: valor; */
}
```

| Selector | Qué selecciona | Ejemplo real (v3) |
|---|---|---|
| `ha-card` | por etiqueta | `ha-card { padding: 0; }` |
| `.clase` | por clase | `.top-button { ... }` |
| `.a.b` (sin espacio) | elementos con **ambas** clases | `.mode-button.active { ... }` |
| `.a .b` (con espacio) | `.b` que está **dentro** de `.a` | `.touchpad-button ha-icon` |
| `.a, .b` | `.a` **o** `.b` | `.streaming-section, .top-section, .mode-buttons` |
| `[data-x="y"]` | por atributo | `.touchpad-svg-overlay [data-direction="up"]` (en JS) |
| `:hover` | pseudo-clase: puntero encima | `.top-button:hover` |
| `:host` | el propio custom element, visto desde su shadow root | `:host { display: block; }` |

## 5.2 Cascada, especificidad e `!important`

Cuando varias reglas le dan valores distintos a la misma propiedad, gana:

1. La que tenga `!important` (por encima de todo lo normal, incluso del `style=""`).
2. Si no, un `style="..."` puesto en el elemento (estilo *inline*).
3. Si no, la de **mayor especificidad**.
4. Con la misma especificidad, la que aparece **más abajo** en el CSS.

La especificidad se cuenta como (IDs, clases/atributos/pseudo-clases, etiquetas):

```text
ha-card                          (0, 0, 1)
.mode-button                     (0, 1, 0)
.mode-button.active              (0, 2, 0)   ← le gana a .mode-button
.touchpad-button ha-icon         (0, 1, 1)
#card-id-input                   (1, 0, 0)   ← un id le gana a cualquier cantidad de clases
```

La v3 usa `!important` para que los `@media` le ganen a reglas mal planteadas:

```css
/* v3 (producción) */
.tv-control-card { transform: scale(0.78); right: 18px; bottom: 50px; height: 1000px; ... }

@media (min-width: 601px) {
    .tv-control-card {
        height: auto !important;
        transform: scale(1) !important;
        right: 0 !important;
        bottom: 0 !important;
    }
}
```

Esto es una señal de alarma: se pone un valor, luego otro que lo deshace con
`!important`. En realidad aquí ni siquiera haría falta (la regla del `@media` va
después y tiene la misma especificidad, así que ya ganaría), pero la costumbre de
usar `!important` termina en guerras donde nada se puede sobrescribir, ni siquiera
con estilos del tema del usuario. El plan elimina todos los `!important`.

## 5.3 Box model

Cada elemento es una caja con capas:

```text
┌──────────────── margin (espacio afuera) ────────────────┐
│ ┌────────────── border (borde) ───────────────────────┐ │
│ │ ┌──────────── padding (relleno interno) ──────────┐ │ │
│ │ │                                                 │ │ │
│ │ │            content (width × height)             │ │ │
│ │ │                                                 │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

Por defecto (`box-sizing: content-box`), `width` es solo el contenido; padding y
borde se suman encima. Con `box-sizing: border-box` (lo usa `.tv-control-card`),
`width` incluye padding y borde, que es mucho más intuitivo.

`border-radius: 50%` en un cuadrado lo vuelve círculo (así son los botones
redondos y el touchpad).

## 5.4 Flexbox

Para alinear elementos **en una dimensión** (fila o columna):

```css
/* v3 (producción) */
.top-button {
    display: flex;
    align-items: center;       /* centra en el eje cruzado (vertical, en una fila) */
    justify-content: center;   /* centra en el eje principal (horizontal, en una fila) */
}
.tv-status-label {
    display: flex;
    flex-direction: column;    /* el eje principal pasa a ser vertical */
    gap: 2px;                  /* espacio entre hijos */
}
```

`display: flex` + `align-items: center` + `justify-content: center` es la receta
clásica para centrar un ícono dentro de un botón.

## 5.5 Grid y `grid-template-areas`

Para layouts en **dos dimensiones**. La v3 dibuja la tarjeta entera con un grid:

```css
/* v3 (producción) */
.card-grid {
    display: grid;
    grid-template-areas:
        "top-section top-section top-section"
        "streaming streaming streaming"
        "spacer1 spacer1 spacer1"
        "spacer2 spacer2 spacer2"
        "touchpad touchpad touchpad"
        "spacer3 spacer3 spacer3"
        "mode-buttons mode-buttons mode-buttons"
        "spacer4 spacer4 spacer4"
        "botones botones botones"
        "tv-selector tv-selector tv-selector";
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto 15px 20px auto 20px auto 30px auto 28px;
    gap: 15px;
}
.touchpad-section { grid-area: touchpad; }
```

- `grid-template-areas` es un **dibujo** del layout: cada string es una fila, cada
  palabra una celda. Repetir el mismo nombre une celdas en un área.
- `grid-area: touchpad` dice "este elemento va en el área llamada touchpad".
- `1fr` = una fracción del espacio libre. `1fr 1fr 1fr` = tres columnas iguales.
- `auto` = la fila mide lo que mida su contenido.

Observa que **todas las filas ocupan las 3 columnas**: el grid de 3 columnas no se
aprovecha y funciona como una simple pila vertical. Además las filas `spacer1..4`
son divs vacíos para hacer espacio, sumando al `gap: 15px`. Es más simple
`display: flex; flex-direction: column;` con márgenes o un `gap` por sección.

El touchpad sí usa bien las áreas:

```css
.touchpad-grid {
    display: grid;
    grid-template-areas:
        ". up ."
        "left center right"
        ". down .";
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
}
```

```text
┌──────┬──────┬──────┐
│  .   │  up  │  .   │     "." = celda vacía
├──────┼──────┼──────┤
│ left │center│right │
├──────┼──────┼──────┤
│  .   │ down │  .   │
└──────┴──────┴──────┘
```

## 5.6 Variables CSS (`--x` y `var()`)

```css
:host {
    --tv-accent: rgb(229, 9, 20);
}
.mode-button.active {
    border-color: var(--tv-accent);
    box-shadow: 0 0 20px var(--tv-accent, white);   /* white = valor si no existe */
}
```

- Se declaran con dos guiones y se leen con `var(--nombre, valorPorDefecto)`.
- **Se heredan** hacia los hijos y atraviesan el Shadow DOM (4.3).
- Se pueden cambiar desde JS **sin tocar el HTML**:
  ```js
  this.style.setProperty('--tv-accent', 'rgb(229, 9, 20)');
  ```

La v3 no usa variables para los temas: mete los colores en el template con `${}`
(`background: ${styles.touchpadBackground};`). Cambiar de Netflix a Disney+ obliga a
regenerar **todo** el CSS y todo el HTML con `innerHTML`. Con variables, cambiar de
tema es cambiar unas 15 propiedades en el host: el navegador recalcula los colores y
no se reconstruye nada.

Un detalle de la v3 que importa al migrar a variables: algunos valores del tema
terminan en `;`:

```js
stateBackgroundOn: 'rgba(182, 45, 45, 0.15);',
```

En el template de la v3 no rompe nada (queda `background: rgba(...);;` y el `;` extra
es una declaración vacía). Pero `setProperty('--x', 'rgba(...);')` **rechaza el valor
en silencio** (un `;` suelto no es válido en el valor de una variable). Por eso la
versión local refactorizada perdía los colores ON/OFF (bug B5).

## 5.7 Media queries frente a container queries

La v3 se adapta con `@media`:

```css
@media (max-width: 600px) {
    .touchpad-section { width: 270px; height: 270px; }
}
```

`@media (max-width: 600px)` pregunta por el ancho de la **ventana**. Pero una tarjeta
no ocupa la ventana: en una tablet de 1024 px con tres columnas de Masonry, la
tarjeta puede medir 330 px, y el `@media` cree que hay espacio de sobra.

Las **container queries** preguntan por el ancho del **contenedor**:

```css
:host {
    display: block;
    container-type: inline-size;   /* "mídeme": los hijos pueden consultar mi ancho */
}
@container (max-width: 360px) {
    .touchpad { width: 80%; }
}
.touchpad {
    width: clamp(180px, 70cqi, 300px);  /* 70% del ancho del contenedor, entre 180 y 300 px */
    aspect-ratio: 1;                    /* siempre cuadrado */
}
```

- `container-type: inline-size` convierte al elemento en contenedor consultable
  por ancho. Un elemento no puede consultarse a sí mismo: las reglas `@container`
  aplican a sus **descendientes**.
- `cqi` = 1% del ancho del contenedor.
- `clamp(mínimo, ideal, máximo)` limita un valor entre dos extremos.
- `aspect-ratio: 1` mantiene la proporción sin fijar el alto.

## 5.8 Transforms, transitions y keyframes

```css
/* v3 (producción) */
.top-button { transition: all 0.3s ease; }

@keyframes spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

```js
// v3, al elegir una app de streaming
haIcon.style.animation = 'spin 0.5s steps(5) infinite';
```

- **`transform`** mueve, rota o escala un elemento **solo visualmente**: el espacio
  que ocupa en el layout no cambia. Por eso `transform: scale(0.78)` en
  `.tv-control-card` deja un hueco donde estaría el tamaño original, y la v3 lo tapa
  con `right: 18px; bottom: 50px;` y `top: 100px` en el grid. El plan elimina estos
  `scale` y usa tamaños reales.
- **`transition`** anima el cambio de una propiedad cuando su valor cambia (por
  ejemplo, al agregar la clase `.active`). `all` es cómodo pero anima todo, incluso
  lo que no hace falta; mejor listar propiedades (`transition: background 0.3s, box-shadow 0.3s`).
- **`@keyframes`** define una animación por pasos; `animation` la aplica.
  `steps(5)` la hace "a saltos" en vez de suave; `infinite` la repite siempre.

Un detalle importante: las transiciones necesitan que el **mismo** elemento cambie
de valor. Si `innerHTML` reemplaza el elemento, el nuevo nace con el valor final y
no hay nada que animar. Otra razón para el DOM persistente.

## 5.9 `:host`

Dentro del shadow root, `:host` selecciona al propio `<tv-control-card>`:

```css
:host { display: block; }
:host([hidden]) { display: none; }    /* forma con condición: si el host tiene el atributo hidden */
```

Los custom elements son `display: inline` por defecto (como un `<span>`), así que
`display: block` es casi obligatorio. Los estilos de la página sobre
`tv-control-card` le ganan a `:host`, lo cual permite que un usuario lo ajuste con
card-mod.

## 5.10 `adoptedStyleSheets`

En lugar de un `<style>` dentro del `innerHTML` (que se vuelve a parsear en cada
render y se duplica en cada tarjeta), el plan usa una hoja compartida:

```js
// BOCETO
const SHEET = new CSSStyleSheet();
SHEET.replaceSync(`:host { display: block; } ...`);   // se parsea UNA vez por página

// en el constructor de cada tarjeta:
this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [SHEET];
```

Diez tarjetas en el dashboard comparten **un solo** objeto de estilos, parseado una
sola vez. Lit hace exactamente esto con `static styles`.

---

# 6. Eventos

## 6.1 `addEventListener`

```js
// v3 (producción)
botonPower.addEventListener('click', () => this.togglePower());
```

"Cuando ocurra `click` en `botonPower`, llama a esta función." La función recibe un
objeto `event` con información (`event.target`, `event.pointerId`...).

Para quitarlo: `removeEventListener('click', laMismaFuncion)`. Tiene que ser
**la misma** función (la misma referencia), por eso no se puede quitar un listener
escrito como arrow anónima.

Opciones útiles: `{ once: true }` (se quita solo tras la primera vez),
`{ passive: true }` (prometes no llamar `preventDefault`, mejora el scroll).

## 6.2 `click` y los pointer events

| Evento | Cuándo |
|---|---|
| `pointerdown` | el dedo/ratón/lápiz toca o se presiona |
| `pointerup` | se levanta |
| `pointercancel` | el navegador "roba" el gesto (por ejemplo, decide que es un scroll) o el sistema lo interrumpe |
| `pointerleave` | el puntero sale del elemento |
| `lostpointercapture` | el elemento pierde la captura del puntero |
| `click` | después de `pointerdown` + `pointerup` sobre el mismo elemento |

Los pointer events unifican ratón, touch y lápiz (antes había `mousedown` y
`touchstart` por separado; la v3 todavía tiene código muerto con `touchstart` en
`_nuevoMetodo`).

En la v3, el hold escucha `pointerdown`, `pointerup` y `pointerleave`, pero **no**
`pointercancel`. En un celular, si el navegador interpreta el gesto como scroll,
manda `pointercancel` y nunca llega `pointerup`: el hold no se detiene.

La v4 usará **captura de puntero**:

```js
// BOCETO
onPointerDown(e) {
  e.target.setPointerCapture(e.pointerId);  // todos los eventos de ESTE dedo vienen a mí
  ...
}
```

Con la captura, aunque el dedo se deslice fuera del sector, el `pointerup` llega al
mismo elemento. Y en CSS, `touch-action: none` sobre el touchpad le dice al
navegador "aquí no hagas scroll ni zoom", lo que evita `pointercancel` innecesarios.

## 6.3 Propagación: `bubbles` y `composed`

Un evento no ocurre solo en el elemento tocado. Recorre el árbol:

```text
          document
             ▲
        <home-assistant>                     composed: true → cruza shadow roots
             ▲
        <tv-control-card>   ← host
             ▲  ── límite del shadow root ──
        <div class="card-grid">              bubbles: true → sube por los padres
             ▲
        <div class="top-button power-button">
             ▲
        <ha-icon>           ← event.target (donde se tocó)
```

- **`bubbles`**: si el evento "burbujea" hacia los padres. `click` y los pointer
  events sí burbujean.
- **`composed`**: si cruza los límites del Shadow DOM. Los eventos nativos de
  usuario (`click`, `pointerdown`) son `composed: true`.
- **Retargeting**: cuando un evento sale de un shadow root, `event.target` se
  "reescribe" para que afuera solo se vea el host. Para un listener en `document`,
  un clic dentro de tu tarjeta tiene como `target`... un elemento de HA de más
  arriba, no tu botón. Para ver el camino real: `event.composedPath()`.
- `event.stopPropagation()` detiene el recorrido.

Esto explica un detalle de la v3:

```js
// v3 (producción), listenerTvSelector()
document.addEventListener('click', (e) => {
    if (!this.shadowRoot.contains(e.target)) {
        popup.style.display = 'none';
        ...
    }
}, { once: true });
```

Por el retargeting, en `document` el `e.target` nunca está dentro de tu shadow root,
así que la condición siempre es verdadera. La forma correcta de preguntar "¿el clic
fue dentro de mi tarjeta?" es `e.composedPath().includes(this)`. Además, este
listener se agrega a `document` en **cada** render (el plan lo señala).

## 6.4 Delegación de eventos

La v3 registra un listener por botón, en cada render (`listenerPower`,
`listenerExit`, `listenerStreaming`...). La v4 usará **delegación**: un solo listener
por tipo de evento en el shadow root, que mira en qué botón cayó el clic:

```js
// BOCETO
this.shadowRoot.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');   // sube hasta el primer ancestro con data-action
  if (!btn) return;                                 // clic fuera de un botón
  this._handleAction(btn.dataset.action, btn.dataset.zone);
});
```

- Funciona porque `click` burbujea: un clic en el `<ha-icon>` sube hasta el shadow
  root, pasando por el `<div data-action="power">`.
- Dentro del shadow root no hay retargeting: `e.target` es el elemento real (o el
  `ha-icon`, que es el host de su propio shadow root).
- `element.closest(selector)` busca hacia arriba (incluido el propio elemento) el
  primero que coincida.

Ventajas: se registra **una vez** en el constructor, sirve para botones que aparecen
después (al cambiar de modo o de TV) y es imposible que un listener quede "pegado"
a un nodo viejo.

## 6.5 `CustomEvent`: `haptic` y `config-changed`

Puedes crear y disparar tus propios eventos:

```js
// v3 (producción)
_dispararHaptic(tipo = 'medium') {
    const event = new CustomEvent('haptic', {
        detail: tipo,
        bubbles: true,
        composed: true,
    });
    this.dispatchEvent(event);
}
```

- `detail` lleva los datos (aquí `'medium'`). HA reconoce `'success'`, `'warning'`,
  `'failure'`, `'light'`, `'medium'`, `'heavy'` y `'selection'`.
- `bubbles: true, composed: true` son necesarios para que el evento suba desde tu
  tarjeta, atraviese todos los shadow roots de HA y llegue a quien lo escucha (el
  frontend lo pasa a la app de celular, que vibra).

Ojo con el **háptico doble** de la v3: el listener del botón central llama
`_dispararHaptic('medium')` y luego `handleCenterButton()`, que vuelve a llamarlo.
Lo mismo pasa al tocar una app de streaming con la TV apagada (el listener dispara
el háptico y luego `togglePower()` lo dispara otra vez). Vibra dos veces.

`config-changed` lo dispara el editor (1.6). En la v3 se crea sin `bubbles` ni
`composed`; funciona porque HA escucha directamente sobre el elemento editor, pero
la ayuda `fireEvent` del frontend de HA los usa en `true` por defecto, y el plan pide
hacerlo igual.

---

# 7. Pruebas con `node:test`

## 7.1 Por qué se puede probar sin navegador

§1 a §5 no tocan el DOM ni a HA directamente: reciben datos (y un objeto `hass`) y
devuelven datos o llaman `hass.callService`. Si a `executeAction` le pasas un
`hass` **falso** que solo anota las llamadas, puedes comprobar exactamente qué le
habría pedido a HA, sin TV, sin HA y sin navegador.

`node:test` es el sistema de pruebas que trae Node incluido: no hay que instalar
nada (por eso no existe `node_modules/`).

## 7.2 El hass falso (`test/helpers.mjs`)

```js
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
```

Lo que conviene notar:

- **Parámetros con destructuring y valores por defecto**:
  `{ states = {}, latency = 0, fail = null } = {}` significa "recibo un objeto de
  opciones; si falta alguna, usa estos valores; si no me pasan nada, usa `{}`".
  Se llama `createFakeHass()` o `createFakeHass({ latency: 5 })`.
- **Closure**: `calls` vive dentro de la función, y el objeto devuelto lo comparte
  (`calls` como propiedad y dentro de `callService`). Cada hass falso tiene su propia
  lista.
- `latency` simula una TV lenta; `fail` hace que la Promise se rechace, como cuando
  la TV está apagada.

`LG_TV`, `SAMSUNG_TV` y `ROKU` son `device` de ejemplo listos para usar.

## 7.3 Anatomía de una prueba

```js
// test/actions.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('el VOLUMEUP de un YAML viejo ahora funciona en Samsung', async () => {
  const hass = createFakeHass();
  await executeAction(hass, parseAction('VOLUMEUP'), SAMSUNG_TV);
  assert.equal(hass.calls[0].data.media_content_id, 'KEY_VOLUP');
});
```

- `test(nombre, función)` registra una prueba. Si la función termina sin lanzar
  error, pasa; si lanza, falla.
- Si la función es `async`, Node **espera** su Promise. Por eso se puede usar
  `await` dentro.
- `node:assert/strict` es la versión estricta: `equal` compara con `===` y
  `deepEqual` compara contenido de objetos sin conversiones de tipo.

Las comprobaciones que usan las pruebas:

| Función | Pasa si... |
|---|---|
| `assert.equal(a, b)` | `a === b` |
| `assert.notEqual(a, b)` | `a !== b` (se usa para comprobar que el payload es una copia) |
| `assert.strictEqual(a, b)` | igual que `equal` en modo estricto; se usa para recalcar "mismo objeto" |
| `assert.deepEqual(a, b)` | `a` y `b` tienen el mismo contenido, aunque sean objetos distintos |
| `assert.ok(x)` | `x` es truthy |
| `assert.throws(fn, patrón)` | llamar `fn()` lanza un error que coincide (regex o clase) |
| `assert.rejects(promesa, patrón)` | la Promise se **rechaza** con un error que coincide |
| `assert.fail(msg)` | nunca: falla siempre con ese mensaje |

`throws` frente a `rejects`:

```js
// normalizeConfig es síncrona: lanza → se prueba con throws (se le pasa una FUNCIÓN)
assert.throws(() => normalizeConfig({ type: 'custom:tv-control-card' }), /al menos una TV/);

// executeAction es async: no lanza, devuelve una Promise rechazada → rejects + await
await assert.rejects(executeAction(hass, parseAction('exit'), ROKU), UnsupportedActionError);
```

Fíjate en `() =>` dentro de `throws`: hay que pasar una función para que `assert`
la llame dentro de su propio `try/catch`. Si escribieras
`assert.throws(normalizeConfig({...}))`, el error saltaría antes de llegar a
`assert`.

Una prueba que mide tiempo:

```js
test('una secuencia se ejecuta en orden y espera entre pasos', async () => {
  const hass = createFakeHass({ latency: 5 });
  const seq = parseAction({ type: 'sequence', steps: ['1', '1', '0', '2'], delay: 20 });
  const start = Date.now();
  await executeAction(hass, seq, LG_TV);
  const elapsed = Date.now() - start;
  assert.deepEqual(hass.calls.map((c) => c.data.button), ['1', '1', '0', '2']);
  assert.ok(elapsed >= 60, `debió esperar ~3×20ms, tardó ${elapsed}ms`);
});
```

Si alguien cambiara el `for` con `await` por un `forEach(async)`, esta prueba
fallaría: los 4 pasos saldrían juntos, `executeAction` terminaría sin esperar nada y
`elapsed` sería de casi 0 ms.

## 7.4 Fixtures privados y pruebas que se saltan

`test/config.test.mjs` prueba `normalizeConfig` con YAML reales de clientes (en
JSON), guardados en `test/fixtures/private/`, carpeta que está en `.gitignore`:

```js
function privateFixture(name) {
  const url = new URL(`./fixtures/private/${name}.json`, import.meta.url);
  return existsSync(url) ? JSON.parse(readFileSync(url, 'utf8')) : null;
}

test('...', { skip: !fixture && 'fixture privado no disponible' }, () => { ... });
```

- `import.meta.url` es la URL del archivo de prueba actual; `new URL(ruta, base)`
  resuelve la ruta relativa a ese archivo, sin importar desde qué carpeta corras Node.
- `readFileSync` lee el archivo como texto y `JSON.parse` lo convierte en objeto.
- La opción `skip` de `test` marca la prueba como saltada (con ese motivo) cuando el
  fixture no existe, por ejemplo en GitHub, donde esos archivos no se suben.

## 7.5 Cómo correrlas

Desde la carpeta del proyecto:

```bash
npm test                                   # corre el script "test" de package.json
node --test "test/**/*.test.mjs"           # lo mismo, a mano
node --test --test-name-pattern="Samsung"  # solo las pruebas cuyo nombre coincide
node --test --watch "test/**/*.test.mjs"   # se repiten solas al guardar
npm run check                              # node --check: solo revisa la sintaxis
```

Las comillas en `"test/**/*.test.mjs"` hacen que el patrón lo expanda **Node** y no
bash (bash sin `globstar` no entiende `**`). Node acepta patrones así desde la
versión 21; tienes la 22.

La salida usa el formato TAP: `ok 1 - nombre` si pasa, `not ok 1 - nombre` con el
detalle del `assert` si falla, y un resumen al final (`# pass 31`, `# fail 0`).

Una advertencia para cuando exista §6: la tarjeta hará
`class TVControlCard extends HTMLElement` y `customElements.define(...)`. En Node no
existen `HTMLElement` ni `customElements`, así que importar el archivo desde las
pruebas fallaría con `ReferenceError: HTMLElement is not defined`. Habrá que
proteger esa parte (por ejemplo, `if (typeof HTMLElement !== 'undefined') { ... }`)
o separarla en otro archivo.

---

# 8. Glosario y ejercicios

## 8.1 Glosario

| Término | Significado breve |
|---|---|
| **arrow function** | `(x) => x * 2`. Función corta, sin `this` propio. |
| **async / await** | `async` hace que una función devuelva una Promise; `await` la pausa hasta que otra Promise termine, sin bloquear la página. |
| **bubbling** | Un evento sube del elemento tocado hacia sus padres. |
| **callback** | Función que le pasas a otra para que la llame después (`addEventListener('click', callback)`). |
| **cascada** | Las reglas para decidir qué declaración CSS gana. |
| **closure** | Una función que recuerda las variables del lugar donde se creó. |
| **composed** | Opción de un evento para cruzar los límites del Shadow DOM. |
| **container query** | `@container`: CSS que depende del ancho del contenedor, no de la ventana. |
| **custom element** | Etiqueta HTML propia, registrada con `customElements.define`. |
| **delegación de eventos** | Un solo listener en un ancestro que decide qué hacer según `event.target`. |
| **destructuring** | `const [a, b] = arr; const { x } = obj;` |
| **DOM** | El árbol de objetos JS que representa la página. |
| **driver** | Aquí: el objeto de §3 que sabe hablar con una marca concreta. |
| **event loop** | El ciclo que toma tareas una por una, corre las microtareas y redibuja. |
| **falsy** | Valores que cuentan como falso: `false`, `0`, `''`, `null`, `undefined`, `NaN`. |
| **fixture** | Datos de ejemplo fijos para pruebas. |
| **función pura** | Misma entrada → misma salida, sin efectos externos. `parseAction` y `normalizeConfig` lo son. |
| **getter / setter** | `get x()` / `set x(v)`: código que se ejecuta al leer o asignar una propiedad. |
| **hass** | El objeto con el estado de HA y `callService`. |
| **host** | El custom element que contiene un shadow root. En CSS, `:host`. |
| **IIFE** | `(() => { ... })()`: función que se ejecuta al definirse. |
| **módulo ES** | Archivo JS con `import`/`export` y ámbito propio. |
| **optional chaining** | `a?.b`: lee `b` solo si `a` no es `null`/`undefined`. |
| **Promise** | Objeto que representa un resultado futuro: pendiente, cumplida o rechazada. |
| **prototipo** | Objeto donde JS busca las propiedades que un objeto no tiene. |
| **retargeting** | Al salir de un shadow root, `event.target` pasa a ser el host. |
| **Shadow DOM** | Árbol DOM privado dentro de un elemento, con CSS encapsulado. |
| **spread / rest** | `...`: desparrama (`{...obj}`, `[...set]`) o junta (`function f(...args)`). |
| **template literal** | String entre backticks con `${}`. |
| **unión discriminada** | Objetos con un campo `type` que indica qué otros campos tienen. |

## 8.2 Ejercicios

Hazlos con el archivo abierto. Para los que piden ejecutar código, crea un archivo
de pruebas en tu carpeta temporal (no en el repo) o usa `node` interactivo:

```bash
cd /home/ian/HAdesigns/TV-Control-Card
node --input-type=module -e "
import { parseAction } from './minimalist-tv-control-card.js';
console.log(parseAction('KEY_RETURN'));
"
```

1. **Predice** qué devuelve cada llamada y luego compruébalo:
   `parseAction('select')`, `parseAction('KEY_HDMI')`, `parseAction('script.cine')`,
   `parseAction('  pendiente  ')`, `parseAction(['1', '2'])`.
2. ¿Qué llamada a HA genera `executeAction(hass, parseAction('mute'), ROKU)`?
   Escribe `domain`, `service` y `data`.
3. ¿Por qué `PLATFORMS.roku.turnOn` existe si no aparece escrito dentro del objeto
   `roku`? ¿Qué `entity_id` usaría?
4. En `parseAction`, ¿qué pasaría si la regla `KEYS[str]` estuviera **después** de
   `CODE_TO_KEY.get(str)`? Pista: busca un código de una plataforma que sea igual al
   nombre de otra tecla semántica.
5. Escribe una prueba nueva que compruebe que `parseAction('command:ssap://tv/channelUp')`
   y `parseAction({ type: 'command', command: 'ssap://tv/channelUp' })` devuelven lo
   mismo.
6. Si cambiaras el `for` de `case 'sequence'` por
   `resolved.steps.forEach(async (s) => await executeAction(hass, s, device))`,
   ¿qué prueba fallaría y por qué?
7. En la v3, ¿qué variable deja de ser alcanzable cuando `render()` reemplaza el
   `<path>` durante un hold? ¿Por qué `stopHold` del nodo nuevo no la limpia?
8. CSS: ¿qué especificidad tienen `.mode-button.active` y `.mode-grid .mode-button`?
   ¿Cuál gana si ambas ponen `background`?
9. Escribe el `grid-template-areas` de una botonera inferior de 4 botones en una
   fila, con áreas `back home exit menu`.
10. ¿Por qué `this.style.setProperty('--x', 'red;')` no cambia nada?
11. ¿Qué devuelve `normalizeConfig({ entity: 'media_player.tv', mode_slot_1: 'navegacion' }).tvs[0].settings.modes`?
12. En la delegación de eventos (6.4), ¿por qué se usa `e.target.closest('[data-action]')`
    en vez de `e.target.dataset.action`?

## 8.3 Respuestas cortas

1. `{type:'key', key:'enter'}` (código Roku); `{type:'button', button:'KEY_HDMI'}`;
   `{type:'service', service:'script.turn_on', data:{entity_id:'script.cine'}}`;
   `null` (se aplica `trim()` y se compara en minúsculas); una `sequence` con
   `digit_1` y `digit_2` y `delay: 400`.
2. `remote.send_command` con `{ entity_id: 'remote.roku', command: 'volume_mute' }`.
   (En la tarjeta real, `mute` está en `TV_ONLY_KEYS` y se mandará a la TV, no al
   Roku; `executeAction` no decide eso, solo ejecuta sobre el `device` que recibe.)
3. Porque `roku` tiene como prototipo a `PLATFORM_DEFAULTS`, donde está `turnOn`.
   Usaría `device.entity`, o sea `media_player.roku`.
4. Hoy no cambiaría nada: comprobé con Node que ningún código de `CODE_TO_KEY`
   coincide con el nombre de una tecla semántica **distinta** (el código Roku
   `'up'` apunta a la tecla `up`, que es la misma). Pero si algún día se agrega un
   código así (por ejemplo, una marca cuyo código para "info" fuera `'guide'`),
   `parseAction('guide')` dejaría de devolver la tecla `guide`. Revisar primero
   `KEYS` garantiza que un nombre semántico siempre gane.
5. Por ejemplo:
   ```js
   test('command: con ssap:// en string y en objeto da lo mismo', () => {
     assert.deepEqual(
       parseAction('command:ssap://tv/channelUp'),
       parseAction({ type: 'command', command: 'ssap://tv/channelUp' }),
     );
   });
   ```
6. `'una secuencia se ejecuta en orden y espera entre pasos'`. Curiosamente, la
   comprobación del orden seguiría pasando: cada `executeAction` del `forEach` corre
   de forma síncrona hasta llamar `callService`, así que las 4 llamadas se anotan
   en orden, de inmediato. Lo que falla es `assert.ok(elapsed >= 60)`: no hay
   ninguna espera de 20 ms y `elapsed` es casi 0. En una TV real, los 4 botones
   saldrían al mismo tiempo.
7. `holdInterval` del closure viejo (el id del `setInterval`). `stopHold` del nodo
   nuevo pertenece a otro closure cuyo `holdInterval` es `null`, así que
   `clearInterval(null)` no hace nada.
8. Ambas (0, 2, 0). Gana la que aparezca más abajo en el CSS.
9. `grid-template-areas: "back home exit menu";` con
   `grid-template-columns: repeat(4, 1fr);`.
10. Porque `red;` no es un valor válido para una variable CSS (el `;` suelto no está
    permitido) y `setProperty` ignora los valores inválidos sin avisar.
11. `['menu', 'busqueda', 'audio']`: `navegacion` se convierte en `menu` por
    `MODE_ALIASES` y los otros dos slots toman sus valores por defecto.
12. Porque el clic suele caer en un hijo (por ejemplo, el `<ha-icon>`), que no tiene
    `data-action`. `closest` sube hasta encontrar el botón que sí lo tiene.
