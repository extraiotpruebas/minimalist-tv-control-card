# Glosario

Definiciones cortas de los conceptos de JavaScript, CSS, HTML, Lit, Vite y Home
Assistant que aparecen en este proyecto. Está en orden alfabético y pensado para
buscar con **Ctrl + F**. Cada entrada trae sus nombres alternativos ("También:"), para
que la encuentres la busques como la busques.

Formato de cada entrada: qué es, un ejemplo y, cuando ayuda, su equivalente en C.
Para entender cómo encajan estas piezas en la tarjeta, lee
[GUIA-DE-ESTUDIO.md](GUIA-DE-ESTUDIO.md).

---

## Símbolos

### `?.` (encadenamiento opcional)
También: optional chaining.
Lee una propiedad solo si lo de la izquierda existe. Si es `null` o `undefined`,
devuelve `undefined` en vez de lanzar un error.
`hass?.states?.[id]` → `undefined` si `hass` aún no llegó.
En C: `p ? p->x : NULL`, encadenado.

### `??` (fusión de nulos)
También: nullish coalescing, valor por defecto.
Si lo de la izquierda es `null` o `undefined`, usa lo de la derecha.
`value ?? ''` → `''` si `value` no existe.
Diferencia con `||`: `||` también reemplaza `0`, `''` y `false`; `??` no.

### `...` (spread / rest)
También: operador de propagación, tres puntos.
Copia los elementos de un arreglo o las propiedades de un objeto dentro de otro.
`{ ...global, ...overrides }` → objeto nuevo; lo de la derecha gana.
`[...lista, nuevo]` → arreglo nuevo con un elemento más.
Se usa para no modificar el original (ver *Inmutabilidad*).

### `=>` (función flecha)
También: arrow function, lambda.
Forma corta de escribir una función. `(x) => x * 2` equivale a
`function (x) { return x * 2; }`.
Diferencia importante: no tiene su propio `this`; usa el de donde se escribió.
Por eso sirve en listeners dentro de una clase.

### `` ` `` (template literal)
También: plantilla de texto, backticks, comillas invertidas, interpolación.
Texto entre comillas invertidas que puede incluir valores con `${...}`.
`` `HDMI ${n}` `` → `'HDMI 2'` si `n = 2`.
En C: `sprintf(buf, "HDMI %d", n)`.

### `===` / `!==`
También: igualdad estricta.
Compara valor **y** tipo: `2 === '2'` es `false`. Úsalos siempre en lugar de `==`
y `!=`, que convierten tipos de formas sorprendentes.
Con objetos compara la **referencia** (si son el mismo objeto en memoria), no el
contenido. Ver *Referencia*.

---

## A

### Acción (en la tarjeta)
También: action, `{ type }`.
Objeto que describe qué hace un botón: `{ type: 'key', key: 'up' }`,
`{ type: 'input', input: 'hdmi2' }`, etc. `parseAction` convierte cualquier forma del
YAML a este objeto. Ver *Unión discriminada*.

### `addEventListener`
También: listener, escuchar un evento.
Registra una función que se ejecuta cuando ocurre un evento en un elemento.
`el.addEventListener('click', (e) => { ... })`.
En C: registrar un callback.

### Arreglo
También: array, lista, `[]`.
Lista ordenada de valores. `['hdmi1', 'tv']`. Su tamaño crece solo.
Métodos que usamos: `includes`, `map`, `filter`, `find`, `some`, `every`.
En C: `char *arr[]`, pero sin tamaño fijo.

### `async` / `await`
También: función asíncrona, esperar.
`async` marca una función que devuelve una *Promise*. Dentro, `await` pausa **esa
función** hasta que la Promise termine, sin congelar la página.
`await hass.callService(...)` → espera a que HA conteste.
Diferencia con C: no bloquea un hilo; el *event loop* sigue atendiendo clics.

### Atributo (HTML)
También: attribute.
Dato escrito en la etiqueta: `<button disabled data-act="up">`. Siempre es texto.
Diferente de una *propiedad* (ver *Propiedad*).

---

## B

### Binding (Lit)
También: enlace, expresión en plantilla.
Un `${...}` dentro de una plantilla `html`. Lit lo actualiza en cada render.
Tipos: texto (`${x}`), atributo (`class=${x}`), propiedad (`.value=${x}`),
evento (`@click=${fn}`), booleano (`?disabled=${x}`).

### Build
También: compilar, empaquetar, `npm run build`.
Proceso en el que Vite junta todos los módulos de `src/` (y Lit) en un solo archivo:
`dist/minimalist-tv-control-card.js`. Es el archivo que se instala en HA.

### Bundle
También: paquete, archivo final.
El archivo único que produce el *build*.

---

## C

### `callService`
También: `hass.callService`, llamar un servicio, acción de HA.
Cómo la tarjeta le pide algo a Home Assistant:
`hass.callService('media_player', 'turn_on', { entity_id: 'media_player.tv' })`.
Devuelve una *Promise*: se puede esperar con `await` y atrapar errores con `catch`.

### Catálogo
También: tabla, `KEYS`, `SOURCES`, `INPUTS`.
Objeto o arreglo fijo con datos que la tarjeta consulta, por ejemplo qué código manda
cada tecla en cada marca. Se congela con `deepFreeze` para que nadie lo modifique.

### `class` / clase
También: class, `extends`.
Molde para crear objetos con datos y métodos. `class TvControlCard extends LitElement`
crea una tarjeta que hereda todo lo de `LitElement`.
En C: un `struct` con punteros a función, más herencia.

### `classMap` (Lit)
Directiva que pone o quita clases CSS según un objeto:
`class=${classMap({ active: true, pressed: false })}`. Respeta las clases que otro
código haya agregado a mano (por eso se usa en el touchpad).

### Closure
También: clausura, cierre.
Una función que "recuerda" las variables del lugar donde se creó, aunque ese lugar ya
terminó. `const tv = this._tv;` dentro de `_stream`: si el usuario cambia de TV, el
flujo sigue con la TV original.
En C: parecido a una variable `static` local, pero una por cada vez que se crea la
función.

### `composed` / `composedPath()`
Un evento con `composed: true` atraviesa el *Shadow DOM* hacia afuera.
`e.composedPath()` devuelve todos los elementos por los que pasó el evento, incluidos
los que están dentro de shadow roots. Sirve para saber si un clic fue dentro de la
tarjeta.

### `const`
Declara una variable que no se puede reasignar: `const x = 5;`.
Ojo: si guarda un objeto, el objeto sí puede cambiar por dentro (para impedirlo, ver
*Object.freeze*).
En C: `const int x = 5;`.

### Container query
También: `@container`, consulta de contenedor.
CSS que cambia según el **ancho de la tarjeta**, no de la ventana. La misma tarjeta se
ve bien en un celular y en una columna angosta de una tablet.
`@container (min-width: 600px) { ... }`.

### CSS custom property
También: variable CSS, token, `--tv-accent`, `var()`.
Variable definida en CSS que se puede leer y cambiar: `--tv-accent: #e50914;` y se usa
con `color: var(--tv-accent);`. Los temas de la tarjeta son grupos de estas variables.

### `CustomEvent`
También: evento propio, `dispatchEvent`.
Evento creado por el código. La tarjeta manda `haptic` (vibración) y el editor manda
`config-changed`:
`this.dispatchEvent(new CustomEvent('config-changed', { detail, bubbles: true, composed: true }))`.

### Custom element
También: elemento personalizado, web component, `customElements.define`.
Etiqueta HTML inventada (`<tv-control-card>`) con su propio comportamiento.
`customElements.define('tv-control-card', TvControlCard)` la registra. Un nombre solo
se puede registrar una vez por página (por eso existe `?tag=`).

---

## D

### `data-*` (atributo)
También: data attribute, `dataset`.
Atributo propio en HTML: `<button data-act="up">`. En JS se lee con
`el.dataset.act`. La tarjeta lo usa para la delegación de eventos y para los estados
en CSS (`.card[data-roku="true"]`).

### `deepFreeze`
Función del proyecto (`util.js`) que aplica `Object.freeze` a un objeto y a todo lo que
tiene dentro. Protege los catálogos.

### Delegación de eventos
También: event delegation.
Un solo listener en el contenedor atiende los clics de todos los botones de adentro, y
mira `data-act` para saber cuál fue. Evita registrar un listener por botón (y evita
listeners huérfanos cuando el DOM cambia).

### Desestructuración
También: destructuring.
Sacar valores de un objeto o arreglo a variables en una línea:
`const { platform, entity } = device;` o `const [a, b] = lista;`.

### `dist/`
Carpeta con el archivo final del *build*. Se sube a git porque HACS la descarga tal
cual (HACS no corre `npm run build`).

### DOM
También: Document Object Model, árbol de elementos.
La representación en memoria de la página: un árbol de objetos (elementos) que JS
puede leer y modificar.

---

## E

### Entrada por puerto
También: input, `input:hdmi2`, `INPUTS`.
Acción que cambia la TV a un puerto (`hdmi1`…`hdmi4`, `tv`) sin depender del nombre que
la entrada tenga. LG usa `tv/switchInput`; Samsung, `ST_HDMIn`.

### ES module
También: ESM, módulo, `import` / `export`.
Archivo JS que declara qué comparte (`export`) y qué usa de otros (`import`).
`import { KEYS } from './keys.js';`.
En C: parecido a `#include` + `extern`, pero cada módulo tiene su propio espacio de
nombres.

### Event loop
También: bucle de eventos.
Cómo JS hace varias cosas con un solo hilo: ejecuta una tarea, luego la siguiente
(clics, respuestas de red, timers). Mientras se espera algo con `await`, el event loop
atiende otras cosas.

### Expresión regular
También: regex, regexp, `/patrón/`.
Patrón para buscar texto. `/[\s_-]/g` = cualquier espacio, guion bajo o guion, todas
las veces.
Piezas: `[...]` cualquiera de estos caracteres · `\s` espacio · `\d` dígito ·
`^` inicio · `$` fin · `+` uno o más · `g` todas las coincidencias · `i` sin distinguir
mayúsculas.
En C: `regex.h`.

---

## F

### `filter` / `map` / `find` / `some` / `every`
Métodos de arreglo que reciben una función:
- `map(f)` → arreglo nuevo con `f` aplicada a cada elemento.
- `filter(f)` → solo los elementos donde `f` da `true`.
- `find(f)` → el primero donde `f` da `true` (o `undefined`).
- `some(f)` → `true` si **alguno** cumple.
- `every(f)` → `true` si **todos** cumplen.
En C: un `for` con un `if`, cada vez.

### `for...of`
Recorre los valores de un arreglo: `for (const step of steps) { ... }`. Con `await`
adentro, los pasos se ejecutan en orden, uno tras otro.

### Función pura
También: pure function.
Función que con la misma entrada siempre da la misma salida y no toca nada externo (ni
el DOM ni HA). `normalizeConfig`, `routeAction` y `normalizeInputId` son puras: por eso
se prueban en Node.

---

## G

### `getCardSize` / `getGridOptions`
Métodos que HA le pregunta a la tarjeta para acomodarla: altura aproximada en
dashboards Masonry, y columnas en dashboards de secciones.

---

## H

### HACS
Home Assistant Community Store. Instala tarjetas e integraciones desde GitHub. Toma el
archivo de `dist/` según `hacs.json`. Lo que llega a `main` se les ofrece como
actualización a los clientes.

### `hass`
El objeto que HA le pasa a la tarjeta con todo el estado de la casa:
`hass.states[entity_id]`, `hass.callService`, `hass.user`, `hass.themes`. HA lo
reasigna con **cada** cambio de cualquier entidad: la tarjeta filtra (ver `set hass`).

### Herencia por prototipo
También: prototype, `Object.setPrototypeOf`.
Si un objeto no tiene una propiedad, JS la busca en su prototipo. Los drivers heredan
de `PLATFORM_DEFAULTS` lo que no definen (por ejemplo `selectInput`, que rechaza en
Roku).

### Hold
Mantener presionado un botón para que se repita. En la tarjeta, solo las flechas, cada
~250 ms, esperando la respuesta de cada envío y con un tope de repeticiones.

---

## I

### Idempotente
Que hacerlo una o varias veces da el mismo resultado. `_view()` es idempotente: siempre
calcula la vista desde cero a partir del estado actual.

### `import.meta.url`
La URL del archivo JS actual. La tarjeta la usa para leer `?tag=` del recurso.

### Inmutabilidad
También: inmutable, immutable.
No modificar un objeto, sino crear uno nuevo con los cambios. HA crea objetos nuevos en
cada cambio de estado; por eso basta comparar con `===` para saber si algo cambió.

### `includes`
`arreglo.includes(x)` → `true` si `x` está en el arreglo. En strings:
`'hdmi2'.includes('hdmi')` → `true`.

---

## J

### JSON
También: `JSON.parse`, `JSON.stringify`.
Formato de texto para datos (objetos, arreglos, números, textos). `JSON.stringify(obj)`
convierte a texto; `JSON.parse(texto)` vuelve a objeto.

---

## L

### `let`
Declara una variable que sí se puede reasignar: `let n = 0; n = 1;`.

### Lit
Librería para hacer custom elements con plantillas (`html\`...\``). Al cambiar el
estado, solo actualiza las partes que cambiaron del DOM. Versión 3.3.3 en el proyecto.

### `LitElement`
Clase base de Lit para crear componentes: `class X extends LitElement`. Aporta
`render()`, `requestUpdate()`, `updateComplete`, `static properties` y
`static styles`.

### Lockfile
También: `package-lock.json`.
Archivo con las versiones exactas de cada dependencia instalada. Va en git, para que el
*build* dé el mismo archivo en cualquier máquina. `npm ci` instala exactamente eso.

### `localStorage`
Almacenamiento del navegador por sitio. La tarjeta guarda ahí, por ejemplo, si estaba en
modo Roku. Siempre dentro de `try/catch`, porque puede no estar disponible.

---

## M

### `Map` / `Set`
- `Map`: diccionario clave → valor (`map.get(k)`, `map.set(k, v)`, `map.has(k)`).
- `Set`: colección sin repetidos (`set.add(x)`, `set.has(x)`).
Más rápidos y claros que un objeto o un arreglo para buscar.

### Método
Función que pertenece a un objeto y se llama con punto: `'abc'.toUpperCase()`,
`card.setConfig(cfg)`.

### Métodos encadenados
También: chaining.
Aplicar un método al resultado del anterior, de izquierda a derecha:
`str.toLowerCase().replace(/[\s_-]/g, '')`.
En C: `f(g(x))`, pero se lee en el orden en que ocurre.

---

## N

### `node --test`
También: `node:test`, `npm test`.
El sistema de pruebas incluido en Node. Las pruebas viven en `test/*.test.mjs`.

### `normalizeConfig`
Función pura que convierte el YAML (de cualquier versión) en un modelo interno limpio
y congelado. Lanza un `Error` si la config no se puede usar y avisa en `warnings` lo que
entiende a medias.

### `nothing` (Lit)
Valor especial que en una plantilla no dibuja nada. `${texto || nothing}` deja el
elemento realmente vacío, para que funcione el selector CSS `:empty`.

### npm
Gestor de paquetes de Node. `npm install` instala dependencias; `npm run <script>`
corre los scripts de `package.json` (`dev`, `build`, `test`, `check`).

### `null` / `undefined`
Las dos significan "sin valor":
- `undefined`: nunca se asignó (variable sin valor, propiedad que no existe).
- `null`: vacío a propósito.
En C: las dos se parecen a `NULL`.

---

## O

### Objeto
También: object, `{}`, diccionario.
Conjunto de pares clave → valor: `{ platform: 'lg', entity: 'media_player.tv' }`. Se lee
con `obj.platform` u `obj['platform']`.
En C: un `struct`, pero se le pueden agregar campos en cualquier momento.

### `Object.freeze`
Congela un objeto: ya no se pueden agregar, quitar ni cambiar sus propiedades (solo en
el primer nivel; para todo, ver `deepFreeze`).

### `Object.keys` / `Object.entries`
- `Object.keys(obj)` → arreglo con los nombres de las claves.
- `Object.entries(obj)` → arreglo de pares `[clave, valor]`.

---

## P

### Payload
Datos extra que acompañan a un command de LG:
`{ command: 'tv/switchInput', payload: { inputId: 'HDMI_2' } }`.

### Plataforma (driver)
También: driver, `PLATFORMS`.
Objeto con las mismas funciones para cada marca (`sendCode`, `sendCommand`,
`selectSource`, `selectInput`…). El resto del código llama `platform.sendCode(...)`
sin preguntar qué marca es.
En C: un `struct` de punteros a función.

### Promise
También: promesa, `.then`, `.catch`.
Objeto que representa un resultado que llegará después (una llamada a HA, un timer). Se
espera con `await` o con `.then()`; los errores se atrapan con `try/catch` o
`.catch()`.

### Propiedad
También: property.
Dato de un objeto JS: `el.value`, `el.disabled`. En un elemento HTML, la propiedad puede
diferir del *atributo* (el atributo es el valor inicial escrito en el HTML).

---

## R

### `render()` (Lit)
Método que **describe** cómo se ve el componente, devolviendo una plantilla `html`. Lit
lo llama cuando algo cambió. No debe cambiar el estado (eso va en `willUpdate`).

### `repeat` (Lit)
Directiva para dibujar listas conservando cada elemento según una clave:
`repeat(items, (i) => i.key, (i) => html\`...\`)`. Evita que un campo pierda el foco
al cambiar la lista.

### Referencia
En JS, una variable con un objeto guarda una **referencia** a él, no una copia (como un
puntero en C). `a === b` con objetos es `true` solo si son el mismo objeto.

### `requestUpdate()` (Lit)
Pide a Lit que vuelva a dibujar el componente. La tarjeta lo usa (vía `_schedule()`)
porque su estado vive en objetos normales.

### Ruta relativa
También: relative path, `./`.
Ruta que depende de la carpeta donde estás parado. `./src/actions/inputs.js` solo
funciona desde la raíz del proyecto.
En C: igual que en `fopen("datos/x.txt")`.

---

## S

### Selector (de HA)
También: `selector`, `ha-form`.
Descripción del tipo de campo en un formulario de HA: `{ entity: {} }`, `{ icon: {} }`,
`{ select: { options } }`. El editor de la tarjeta arma sus formularios con selectores.

### `set hass(hass)`
Setter que HA llama con cada cambio de cualquier entidad. La tarjeta compara solo sus
entidades (por referencia) y pide render solo si algo propio cambió.

### Setter / getter
También: `set`, `get`.
Métodos que se usan como si fueran una propiedad: `card.hass = x` llama a
`set hass(x)`.

### Shadow DOM
También: shadow root, `this.shadowRoot`.
Un DOM privado dentro de un elemento: su CSS no se mezcla con el del resto de la página
y viceversa. Cada tarjeta tiene el suyo.

### `static properties` (Lit)
Lista de propiedades reactivas: si cambian, Lit vuelve a dibujar. Sin decoradores, se
declaran así y se inicializan en el `constructor` (no como class fields).

### `static styles` (Lit)
El CSS del componente. Lit lo comparte entre todas las instancias
(`adoptedStyleSheets`): no se vuelve a analizar por cada tarjeta.

### String
También: texto, cadena.
En JS un string **no se puede modificar**: cada método (`toLowerCase`, `replace`,
`trim`) devuelve uno nuevo.
Métodos frecuentes:
- `trim()`: quita los espacios de los extremos.
- `toLowerCase()` / `toUpperCase()`: cambia a minúsculas o mayúsculas.
- `replace(patrón, nuevo)`: reemplaza.
- `startsWith(x)`: dice si empieza con `x`.
- `slice(a, b)`: corta un trozo.
- `split(sep)`: parte en un arreglo.
- `includes(x)`: dice si contiene `x`.

### `String(x)`
Convierte cualquier valor a texto: `String(2)` → `'2'`, `String(null)` → `'null'`.

---

## T

### `this`
El objeto sobre el que se llamó el método. En `card.setConfig(x)`, dentro de
`setConfig`, `this` es `card`. Las funciones flecha no tienen su propio `this`.

### `throw` / `try...catch`
También: lanzar un error, excepción, `Error`.
`throw new Error('mensaje')` interrumpe y sube hasta un `try { } catch (e) { }` que lo
atrape. Si `setConfig` lanza, HA muestra la tarjeta roja con el mensaje.

### Toast
Mensaje breve que aparece en la tarjeta (por ejemplo, un error de HA o "Enciende la TV").

---

## U

### Unión discriminada
También: tagged union, `type`.
Objetos con un campo `type` que dice qué otros campos tienen. Las acciones de la tarjeta
lo son, y se procesan con un solo `switch (action.type)`.
En C: un `struct` con un `enum type` y un `union` con los datos.

### `updateComplete` (Lit)
Promise que se resuelve cuando Lit terminó de dibujar. En las pruebas:
`await el.updateComplete` antes de revisar el DOM.

---

## V

### Vite
Herramienta que sirve el proyecto en desarrollo (`npm run dev`) y arma el archivo final
(`npm run build`). Versión 8 en el proyecto.

---

## W

### `willUpdate()` (Lit)
Método que Lit llama antes de `render()`. Ahí van los cambios de estado que dependen de
lo que cambió (cerrar el numpad si la TV se apagó, cortar un hold).

---

## Errores frecuentes

### `ReferenceError: Cannot access 'x' before initialization`
Usaste una variable declarada con `const` o `let` antes de su línea, o dentro de su
propia definición (`const x = x + 1;`).

### `ReferenceError: x is not defined`
La variable no existe en ese lugar: falta un `import`, está mal escrita o se declaró en
otro bloque `{ }`.

### `TypeError: x is not a function`
Escribiste `x(...)`, pero `x` no es una función (por ejemplo, un string o `undefined`).

### `TypeError: Cannot read properties of undefined (reading 'y')`
Hiciste `x.y` con `x` igual a `undefined`. Solución típica: `x?.y`.

### `ERR_MODULE_NOT_FOUND`
Node no encontró el archivo de un `import`. Revisa la ruta y desde qué carpeta corres el
comando (ver *Ruta relativa*).
