# Arquitectura de la TV Control Card (v4)

Documento para quien va a **modificar** la tarjeta. Para **usarla** (instalar y
configurar), ver el [README](../README.md). Para **aprender** JS/CSS con este código
desde cero, ver la [guía de estudio](GUIA-DE-ESTUDIO.md).

---

## 1. Visión general

El código fuente está en **`src/`**, dividido en módulos ES. La única dependencia es
[Lit](https://lit.dev) (render de la tarjeta y el editor), que viaja dentro del build.
[Vite](https://vite.dev) los junta en **un solo archivo**,
`dist/minimalist-tv-control-card.js`, que es el que HA carga como ES module
(`type: module`) y el que descarga HACS. Los módulos conservan la numeración de
secciones (§1–§7) del antiguo archivo único, que se sigue usando en esta
documentación y en la guía de estudio.

| Sección | Módulos | Qué contiene | ¿Pura?* |
|---|---|---|---|
| §1 Teclas | `actions/keys.js` | `KEYS`: tecla semántica → código por marca. `HOLDABLE_KEYS`, `TV_ONLY_KEYS`, `CODE_TO_KEY` | Sí |
| §2 Acciones | `actions/parse.js` | `parseAction` (cualquier forma → objeto `{type,…}`), `resolveForPlatform`, `isHoldable` | Sí |
| §3 Plataformas | `platforms.js` | `PLATFORMS` (drivers `lg`, `samsung`, `roku`) + `PLATFORM_DEFAULTS` por prototipo | Llaman a `hass` |
| §4 Ejecutar | `execute.js` | `executeAction(hass, action, device)` | Llama a `hass` |
| §5 Config | `config/catalogs.js`, `config/normalize.js` | Catálogos (`SOURCES`, `FIXED_MODES`, `DEFAULT_BUTTONS`…) y `normalizeConfig` | Sí |
| §6 Tarjeta | `card/logic.js` | Helpers puros: `routeAction`, `describeNow`, `tvStatus`, `StateWaiters`, `TIMING`, `storage` | Sí |
| | `card/styles.js`, `card/template.js` | CSS (`CARD_CSS`) y la plantilla Lit (`cardTemplate(view)`) | — |
| | `card/tv-control-card.js` | `TvControlCard` (LitElement): ciclo de vida, `_view()`, eventos, flujos | No (DOM) |
| §7 Editor | `editor/paths.js`, `catalogs.js`, `action-form.js`, `view.js`, `ops.js`, `serialize.js` | Lógica pura: `buildEditorView`, `applyFormChange`, `applyOp`, `serializeV4` | Sí |
| | `editor/styles.js`, `editor/tv-control-card-editor.js` | `TvControlCardEditor` (LitElement) | No |
| — | `index.js` | Entrada: lee `?tag=`, registra los elementos, reexporta lo puro | — |
| — | `util.js`, `tag.js`, `version.js` | `has`, `delay`, `deepFreeze`, `firstDefined`; nombre del elemento; versión | — |

\* *Pura* = misma entrada, misma salida, sin tocar el DOM ni HA. `src/index.js`
reexporta todo lo puro, y las pruebas de Node lo importan de ahí sin navegador.

**Reglas de los módulos:** cada módulo exporta al final (`export { … }`) solo lo que
otros usan; no hay imports circulares; las utilidades compartidas viven en `util.js`
y no en el módulo donde se usaron primero.

**`?tag=`:** se lee en `index.js` (`tagFromUrl(import.meta.url)`) y se guarda con
`setCardTag()` antes de registrar los elementos. No puede leerse en otro módulo: en
desarrollo cada módulo tiene su propia URL y solo la entrada recibe el `?tag=`.
`CARD_TAG` y `EDITOR_TAG` son `let` exportados, que los demás módulos ven siempre
actualizados.

### Principios

1. **Separar el "qué" del "cómo".** Un botón dice `vol_up`; §1 y §3 saben que en LG
   es `webostv.button VOLUMEUP` y en Samsung `play_media send_key KEY_VOLUP`.
2. **El YAML se lee en un solo lugar.** `normalizeConfig` convierte cualquier formato
   (v4, repo v3.x, variante v3 multientidad) en un modelo interno congelado. La
   tarjeta nunca vuelve a mirar las claves crudas.
3. **Describir, no parchar.** `render()` describe la tarjeta desde el estado actual
   y Lit aplica solo los cambios. Los nodos se reutilizan: nunca se reconstruye el DOM.
4. **Nunca apagar por accidente.** Ningún flujo automático usa `toggle`; `unavailable`
   nunca se trata como "apagada".
5. **Nada queda corriendo solo.** Todo lo que repite o espera (hold, esperas de
   estado) tiene tope y condición de salida.

---

## 2. Flujo de datos

```text
 YAML (setConfig)
    │
    ▼
 §5 normalizeConfig(raw) ──► modelo congelado
    │                          { format, cardId, style, theme, controlModeEntity,
    │                            tvs: [{ name, entity, platform, companion, settings }],
    │                            warnings }
    ▼
 §6 TvControlCard (LitElement)              set hass(hass)  (muy seguido)
                                                │
                                       ¿cambió una entidad vigilada?
                                                │ sí
                                                ▼
                                   _schedule() = requestUpdate()
                                   (Lit junta varios pedidos en un render)
                                                │
                     willUpdate()   cambio de settings, TV apagada, pausa del centro
                     render()       _view() → cardTemplate(view)   (card/template.js)
                     Lit aplica al DOM solo lo que cambió: clases, data-*, textos, --tv-accent

 Toque del usuario
    │  (delegación: 1 listener por tipo en el shadowRoot)
    ▼
 _onClick / _onPointerDown ──► _actionFor(el) ──► _press(action)
    │                                               │
    │                       routeAction(action) ──► device { platform, entity, remote? }
    ▼                                               │
 §4 executeAction(hass, action, device) ──► §3 PLATFORMS[platform].sendCode / selectSource …
    │
    ▼
 hass.callService(...) ──► Home Assistant ──► TV / Roku
```

---

## 3. El modelo normalizado

`normalizeConfig(raw)` devuelve (congelado con `deepFreeze`):

```js
{
  format: 'v4' | 'legacy',          // 'legacy' → el editor ofrece "Convertir a formato v4"
  cardId: 'sala' | 'auto:media_player.a,media_player.b',
  style: 'relieve' | 'halo' | 'cristal',
  theme: 'dark' | 'light' | 'auto',
  controlModeEntity: 'input_select.modo_tv' | null,
  warnings: ['…'],                  // se imprimen con console.warn en setConfig
  tvs: [{
    name: 'Sala',
    entity: 'media_player.sala',
    platform: 'lg' | 'samsung',
    companion: { platform: 'roku', entity: 'media_player.roku', remote: 'remote.roku' } | null,
    settings: {                      // lo que puede variar por TV
      modes: ['menu', 'audio', 'custom1'],          // siempre los que se muestran, en orden
      modeDefs: { menu: { id, label, icon, pad }, custom1: { … } },
      defaultPad: { up: { icon, action }, left, right, down },   // touchpad sin modo activo
      streaming: [{ index, source, icon, action, accent }] × 4,  // source = entrada de SOURCES
      buttons: { top_left, power, center, back, home, exit, menu }  // { icon, action }
    }
  }]
}
```

- Todas las `action` del modelo ya pasaron por `parseAction`: son objetos o `null`.
- **Overrides:** si una TV no tiene `overrides`, su `settings` es **el mismo objeto**
  que el global (no una copia). Si los tiene, se resuelve `resolveSettings({ ...raw,
  ...overrides })`. El merge es **superficial**: una categoría propia (`buttons`,
  `streaming`, …) reemplaza a la global completa. Por eso el editor, al activar una
  categoría propia, copia primero la global.
- **Detección de formato:** es v4 si aparece alguna de `modes`, `buttons`, `streaming`,
  `custom_modes`, `default_pad`, `theme`, o si alguna TV tiene `platform`/`companion`.

---

## 4. Acciones

Toda acción normalizada es un objeto con `type` (una "unión discriminada"):

| `type` | Campos | Qué hace | Servicio de HA |
|---|---|---|---|
| `key` | `key` | Tecla semántica de `KEYS` | según la marca (§3) |
| `button` | `button` | Código crudo, se manda tal cual | `webostv.button` / `play_media send_key` / `remote.send_command` |
| `command` | `command`, `payload?` | API SSAP de webOS (solo LG) | `webostv.command` |
| `source` | `source` | Cambiar de entrada/app por **nombre** | `media_player.select_source` |
| `input` | `input` (`hdmi1`…`hdmi4`, `tv`) | Cambiar de entrada por **puerto** (`actions/inputs.js`) | LG `webostv.command tv/switchInput`; Samsung `play_media send_key ST_HDMIn`; Roku: no soportado |
| `service` | `service`, `data` | Cualquier servicio | el indicado |
| `sequence` | `steps[]`, `delay` | Pasos en orden con pausa (ms, def. 400) | los de cada paso |
| `platform` | `by: { lg, samsung, roku, default }` | Una variante por marca | la de la variante |
| `numpad` | — | Abre/cierra el teclado numérico | ninguno (lo maneja la tarjeta) |

`parseAction` también acepta los **strings** del formato viejo:

| String | Resultado |
|---|---|
| `''`, `'pendiente'`, `null` | `null` (sin acción) |
| `'numpad'` | `{ type: 'numpad' }` |
| `'script.x'` / `'scene.x'` | `service` `script.turn_on` / `scene.turn_on` |
| `'source:HDMI 1'` | `source` |
| `'input:hdmi2'` | `input` (id del catálogo; inválido → `null`) |
| `'command:ssap://tv/switchInput'` | `command` (se quita el `ssap://`) |
| `'key:vol_up'` o `'vol_up'` | `key` |
| `'VOLUMEUP'`, `'KEY_VOLUP'`, `'volume_up'` | `key: 'vol_up'` (vía `CODE_TO_KEY`, sirve en cualquier marca) |
| cualquier otro (`'KEY_HDMI'`) | `button` crudo |
| una lista `[…]` | `sequence` |

**Holdable:** solo las flechas (`HOLDABLE_KEYS`) se repiten al mantener presionado.

---

## 5. Plataformas y ruteo

### Drivers (§3)

Cada driver implementa `sendCode`, y hereda de `PLATFORM_DEFAULTS` (por
`Object.setPrototypeOf`) `selectSource`, `turnOn`, `turnOff` y un `sendCommand` que
rechaza con `UnsupportedActionError`. Solo LG sobrescribe `sendCommand`. Todas las
funciones devuelven la Promise de `hass.callService`, para poder hacer `await`.

`device` es siempre `{ platform, entity, remote? }`. En el Roku las teclas van por
`remote` y las fuentes por `entity`.

### `routeAction` (§6, pura)

Decide a qué dispositivo va una acción cuando la TV tiene Roku:

1. Sin modo Roku activo, sin `remote` del companion o en los modos `audio` y
   `fuentes` → **TV**.
2. `platform` → al Roku solo si trae variante `roku`.
3. `sequence` → al Roku solo si **todos** sus pasos irían al Roku; si no, toda a la TV.
4. `key` → al Roku si el Roku tiene esa tecla y no es volumen/silencio.
5. Todo lo demás (`button`, `command`, `source`, `service`) → **TV**.

Excepciones fijas: las teclas del numpad siempre van a la TV.

---

## 6. La tarjeta (§6)

### Ciclo de vida

| Método | Cuándo | Qué hace |
|---|---|---|
| `constructor` | al crear | estado inicial |
| `createRenderRoot` | Lit crea el shadow root | listeners delegados (los estilos los pone Lit desde `static styles`) |
| `setConfig` | cada cambio de YAML | `normalizeConfig`, reinicia `_ui`, cierra el picker, pide render |
| `set hass` | cada cambio de cualquier entidad de HA | restaura la TV guardada, resuelve esperas, sincroniza `control_mode_entity`, agenda render solo si cambió algo vigilado |
| `connectedCallback` | entra a la página | `visibilitychange`, render |
| `disconnectedCallback` | sale de la página | corta el hold, cierra el picker |

**Entidades vigiladas** (`_watchedEntities`): la TV activa, su Roku y
`control_mode_entity` (más `themes.darkMode` con `theme: auto`). HA crea un objeto
nuevo por cada cambio de estado, así que se comparan **referencias** (`===`).

### Render

- El estado propio (`_ui`, `_busy`, `_loading`, `_pickerOpen`, `_toastState`) son
  objetos normales, no propiedades reactivas: cada cambio llama `_schedule()`, que
  es `this.requestUpdate()`. Así los flujos quedaron igual que antes de Lit.
- `willUpdate()` (antes de cada render) maneja lo que **cambia estado**: cambio de
  `settings` de la TV activa (y apaga un modo que no exista en ella), TV que dejó de
  estar `on` (corta el hold, cierra el numpad), pausa del centro al pasar a `on`.
  Guarda `_shownStatus`: lo que los toques consideran "lo que se veía".
- `render()` → `cardTemplate(this._view())`. `_view()` es **idempotente**: calcula
  todo desde el estado actual. La plantilla pone en `.card` los atributos
  `data-style`, `data-theme`, `data-status` (`on`/`off`/`unavailable`), `data-mode`,
  `data-roku`, `data-busy`, `data-numpad`, las variables `--tv-accent` / `--tv-glow`
  (`styleMap`) y `disabled` en touchpad, modos y teclas de abajo cuando la TV no está
  `on`. Es el mismo HTML que el antiguo `SKELETON`; los `data-ref` se conservan como
  marcas para la autoprueba.
- Los botones del touchpad usan `classMap`: el hold les agrega `pressed` por su
  cuenta y un render no debe borrarla.
- `_stats` cuenta `builds` (`firstUpdated`, siempre 1), `applies` (cambios de
  settings) y `updates` (renders); los muestran el harness y la autoprueba.

### Estado propio (`this._ui`)

`{ tvIndex, mode, roku, numpad }`. Todo lo demás se deriva del modelo y de `hass`.

### Eventos

Un listener por tipo en el `shadowRoot`. Cada botón lleva `data-act`:

| `data-act` | Acción |
|---|---|
| `pad` (`data-dir`) | dirección del touchpad (`_pad` según el modo) |
| `center` | OK, o Encender con la TV apagada (`_onCenter`) |
| `bottom` (`data-id`) | back / home / exit / menu |
| `top_left` | botón propio del encabezado |
| `target` | selector TV / Roku |
| `power` | encender / apagar |
| `stream` (`data-index`) | botón de streaming |
| `mode` (`data-id`) | activar / desactivar un modo |
| `digit`, `numpad_ok`, `numpad_close` | teclado numérico |
| `picker`, `tv` | selector de TVs |

Las flechas se manejan en `pointerdown` (para responder al instante y repetir); todo
lo demás en `click`. El `click` que sigue a un hold se suprime (`_suppressClick`).

### Flujos

- **Hold** (`_startHold`): primer envío inmediato → espera `holdDelay` (400 ms) →
  repite cada `holdInterval` (250 ms) **después** de que HA contestó → tope
  `holdMaxRepeats` (40). Se corta con `_stopHold` (pointerup/cancel, captura perdida,
  app oculta, desconexión, cambio de TV/modo/Roku, TV apagada).
- **Power** (`_power`): `on` → `turn_off` (o la acción propia del botón); cualquier
  otro estado → `_turnOn`. Mientras espera confirmación ignora más toques.
- **Encender** (`_turnOn` / `_ensureOn`): solo enciende, nunca apaga. Espera `on` hasta
  20 s; si no llega, avisa (en LG, recordando el Wake on LAN).
- **Centro** (`_onCenter`): usa la cara que se veía en el `pointerdown`; tras encender
  ignora OK durante `CENTER_GUARD_MS` (800 ms).
- **Streaming** (`_stream`): enciende si hace falta → acción propia, o abre la app en
  el Roku (cambiando antes la TV a la entrada del Roku si hace falta), o
  `select_source` en la TV con confirmación (`_selectSourceConfirmed`: 6 s, 2 intentos).
  El nombre exacto se busca en el `source_list` de la entidad (`resolveSourceName`).
  Las fuentes con `input` (HDMI) cambian por puerto y **sin confirmación**: HA reporta
  el nombre de la entrada ("PlayStation"), que no dice qué puerto es.
- **Secuencias** (`_runSequence`): una a la vez (`_sequenceRunning`).
- **Numpad**: se cierra al cambiar de modo o TV, al apagarse la TV, con Escape o con
  Cerrar.

### Persistencia (localStorage, mismas claves que producción)

- TV elegida: `tv-card__<card_id>__<user_id>`
- Modo Roku por TV: `tv-card__roku__<card_id>__<user_id>__<entity>` (si nunca se
  eligió, una TV con Roku arranca en modo Roku).

`storage.get/set` atrapan las excepciones (modo privado, WebViews).

---

## 7. CSS

`CARD_CSS` es el `static styles` de la tarjeta: Lit lo convierte una vez en un
`CSSStyleSheet` compartido por todas las instancias (`adoptedStyleSheets`), con
respaldo a `<style>` donde no existe. Está en
**tres capas**:

1. **Estructura común:** layout con `grid-template-areas`, pantalla de estado,
   touchpad, numpad, picker, toast. Responsivo con `@container` (el contenedor es
   `ha-card`): `≤340px` modos solo con ícono; `≥600px` dos columnas (touchpad a la
   derecha); `≥860px` touchpad más grande.
2. **Tokens:** `--tv-surface`, `--tv-ink`, `--tv-line`, `--tv-track`, `--tv-thumb`,
   `--tv-cta-*`, `--tv-press-*`, etc. Cada combinación `data-style` × `data-theme` les
   da valores. JS solo escribe `--tv-accent` y `--tv-glow`.
3. **Forma por estilo:** `.card[data-style="relieve|halo|cristal"]` define losetas o
   círculos, bisel, halo o vidrio.

Reglas útiles:

- Para ocultar se usa el atributo `hidden` (`.card [hidden] { display: none !important }`).
  Los elementos que aparecen animados usan `animation` (p. ej. `tv-pop`), porque una
  `transition` no corre al salir de `display: none`.
- Los degradados no se animan: por eso el fondo del centro "Encender" vive en
  `.ok::before` y se anima su `opacity`.
- La opacidad de un padre se multiplica en sus hijos: para atenuar el touchpad apagado
  se atenúa `.pad .dir` y no el `.pad` (el centro Encender debe verse al 100 %).

---

## 8. El editor (§7)

**Regla:** lo que está en el YAML se muestra; lo que no, aparece como "+ Agregar…" o
"Personalizar". El editor nunca escribe valores por defecto.

```text
 config ──► buildEditorView(config, { model, error, expanded, mediaPlayers })
              │  lista plana de nodos: alert | heading | note | buttons | form
              │  (un `heading` con `fold` es un panel; sus hijos llevan `parent`)
              ▼
 childrenByParent(nodes)        arma el árbol de paneles a partir de los `parent`
 TvControlCardEditor.render()   repeat(nodes, key): reutiliza cada elemento por su
              │                 `key` (un <ha-form> existente solo recibe datos
              │                 nuevos → no pierde el foco; _schemaFor mantiene el
              │                 mismo objeto de schema mientras no cambie)
   value-changed (ha-form) ──► applyFormChange(config, node, data) ─┐
   click en [data-op]      ──► applyOp(config, op)                   ├─► config nueva
                                                                    ┘   (inmutable)
              ▼
 evento config-changed { config }  ──► HA guarda y vuelve a llamar setConfig
```

- **Acordeón.** Cada sección grande es un `<details>`. En la lista de nodos sigue siendo
  un `heading` normal (mismas `key`, mismas pruebas) más `fold: { summary, open, base }`:
  `summary` es la línea que se ve con el panel cerrado, `open` si arranca abierto
  (General, Televisores y la primera TV) y `base` la profundidad de sus hijos, para
  medir la sangría desde el panel. El helper `fold(head, children, opts)` de `view.js`
  etiqueta a los hijos con `parent`. El estado abierto/cerrado vive en el editor
  (`_open`, nunca en el YAML) y es su único dueño: el clic en el `<summary>` se cancela
  y se repinta según ese estado. Los hijos de un panel cerrado no se crean. Un botón
  "+ Agregar…" lleva `op.open` con la `key` del panel que debe quedar abierto.
- **Paletas** (`editor/palettes.js`). `paletteSection` arma el panel *Paletas* y
  `assignmentNodes` el selector que asigna una paleta (tarjeta, TV, Roku, botón de
  streaming; un nombre o un par claro/oscuro). Sus formularios usan códecs propios
  (`palette-ref`, `palette-meta`, `palette-color`, `palette-copy`) que resuelve
  `applyPaletteForm`, y el botón de borrar la op `palette-delete`. Las `key` de cada
  paleta usan su POSICIÓN (`pal.0`), no su nombre: el nombre se emite en cada tecla y,
  si fuera la key, cada tecla recrearía el campo y se perdería el foco.
  `mapPaletteRefs` recorre los 6 lugares donde puede haber `palette:` (tarjeta,
  `streaming[j]`, `tvs[i].companion`, `tvs[i].overrides` y su `streaming[j]`); con
  `renameRef` (una asignación: nombre o par) sirve para renombrar y para borrar sin dejar
  referencias rotas.
- **Nodos `form`** llevan `path` (dónde vive su objeto en la config), `schema` (para
  `ha-form`), `data` y opcionalmente un `codec` (`action`, `modes`) que traduce entre
  el formulario y la forma del YAML, o `defaults` (valores que al elegirse se borran).
- **Operaciones** (`applyOp`): `set`, `delete` (poda los padres que quedan vacíos),
  `unset`, `push`, `remove`, `move`, `convert` (= `serializeV4`). `expand` /
  `collapse` solo cambian estado de UI (`this._expanded`), no la config.
- **`expandShortcuts`** convierte los atajos del YAML (`up: vol_up`, `power: script.x`)
  a la forma objeto antes de editar.
- **`serializeV4(raw)`** convierte cualquier formato a v4 mínimo. Lo garantiza una
  prueba de ida y vuelta: `normalizeConfig(serializeV4(x))` equivale a
  `normalizeConfig(x)`, también con los configs reales de clientes.
- **`ensureHaForm()`**: `ha-form` solo existe después de que HA cargó algún editor; se
  fuerza con `loadCardHelpers()` + `createCardElement({type:'entities'})` y su
  `getConfigElement()`.
- Los `value-changed` de `ha-form` se detienen (`stopPropagation`) para que no lleguen
  a HA como si fueran el valor del editor completo.

---

## 9. Cómo extender

**Una tecla nueva** → agregarla a `KEYS` (§1) con su código por marca (`null` si no
existe). Ya aparece en el editor (`KEY_OPTIONS` se genera de `KEYS`). Si debe
repetirse al mantener, agregarla a `HOLDABLE_KEYS`; si siempre va a la TV aunque haya
Roku, a `TV_ONLY_KEYS`.

**Una fuente de streaming** → agregarla a `SOURCES` (§5): `id`, `name`, `icon`,
`service` (nombre en la TV, o `null` si solo existe en Roku), `rokuSource`, `accent` y
opcionalmente `alternates`. El editor la toma de `SOURCE_OPTIONS`.

**Un comando LG sugerido** → agregarlo a `LG_COMMANDS` (§7). Verificarlo antes en una
TV real (los endpoints "Luna" no funcionan por `webostv.command`).

**Un modo fijo** → agregarlo a `FIXED_MODES` con `pad(...)` (orden: up, left, right,
down) y quitarlo de `RESERVED_MODES` si estaba ahí. Si todo debe ir a la TV aunque
haya Roku, agregarlo a `TV_MODES`. El editor lo lista solo.

**Un botón fijo** → `DEFAULT_BUTTONS`, la plantilla (`card/template.js`, con su `data-act`), `_view()`, `_actionFor`,
`BUTTON_LABELS` del editor y, si es de la fila de abajo, `BOTTOM_BUTTONS`.

**Un tipo de acción** → `ACTION_TYPES` + un `case` en `parseAction` (§2) y en
`executeAction` (§4); en el editor (`editor/catalogs.js`, `editor/action-form.js`,
`editor/serialize.js`): `ACTION_UI_TYPES`, `ALL_ACTION_TYPES`,
`actionToForm`, `formToAction`, `actionSchema`, `serializeAction`. Revisar
`routeAction` (¿a qué dispositivo va?).

**Una marca** (p. ej. Android TV) → un driver en `PLATFORMS` con al menos `sendCode`,
una columna en `KEYS`, `normalizePlatform`, `TV_PLATFORM_OPTIONS`/`BRANDS` del editor.
Si es un companion como el Roku, revisar `normalizeCompanion`, `routeAction` y
`describeNow`.

**Un estilo visual** → agregarlo a `STYLES` y `STYLE_OPTIONS`, darle tokens y forma en
`CARD_CSS` (capas 2 y 3) y su versión en `@supports not (backdrop-filter…)` si usa vidrio.

En todos los casos: agregar pruebas en `test/` y, si toca la UI, una verificación en
`dev/selftest.html`.

---

## 10. Pruebas y herramientas

| Herramienta | Qué prueba | Cómo |
|---|---|---|
| `test/*.test.mjs` | Lo puro: acciones, drivers, config, ruteo, editor, conversión | `npm test` |
| `test/dist.test.mjs` | Que `dist/` se comporta igual que `src/` (exports, catálogos, `parseAction`, `normalizeConfig`, `serializeV4`, vista del editor, ruteo) | `npm run build && npm test` |
| `dev/harness.html` | La tarjeta y el editor con un `hass` simulado (latencia, fallos, TV que no enciende, ruido) | `npm run dev` |
| `dev/selftest.html` | Autoprueba en navegador: hold, power, centro, numpad, bloqueo, editor… | abrirlo; muestra `✓ todo bien` |
| `dev/screenshots.html` | Galería fija para las capturas del README (`docs/img/`) | `?set=estilos` / `?set=estados` |
| `dev/ha-form-stub.js` | `ha-form` simulado (mismo contrato, sin el aspecto de HA) | lo cargan harness y selftest |
| GitHub Action `build` | `npm ci`, build, que `dist/` del commit esté actualizado, pruebas | en cada push |

Las páginas de `dev/` cargan `src/index.js`, que importa `lit` por nombre de paquete:
hay que abrirlas con `npm run dev` (Vite resuelve ese nombre). Con `?build=dist`
cargan el archivo final, que ya trae Lit, y sirve cualquier servidor
(`python3 -m http.server`). En Chrome headless, usar un perfil nuevo en cada corrida:
con uno reutilizado, los módulos de `src/` pueden salir de la caché.

```bash
npm install                                # una vez
npm run dev                                # http://localhost:5173/dev/harness.html (recarga al guardar)
npm test                                   # pruebas de Node
npm run build                              # dist/minimalist-tv-control-card.js
npm run check                              # solo sintaxis (src/ y dist/)
```

**Build** (`vite.config.js`): library mode, solo formato `es`, un archivo, target
Chrome/Edge 111, Safari 16.4, Firefox 113 (el mínimo del README). **Sin minificar**:
con gzip son ~50 KB (Lit incluido) contra unos 11 KB menos minificado, y a cambio el archivo se puede leer y
depurar en el HA de un cliente (conserva nombres, JSDoc y marcas `// src/…`). `dist/`
se incluye en los commits porque HACS lo descarga del repositorio.

**Configs reales de clientes:** viven en `test/fixtures/private/` (en `.gitignore`)
junto con las pruebas que mencionan sus entidades. Las pruebas públicas descubren esos
archivos sin nombrarlos; en un clon sin la carpeta simplemente no corren.

**Verificar en HA sin reemplazar la versión instalada:** cargar el recurso con
`?tag=tv-control-card-v4` y usar `type: custom:tv-control-card-v4`.

---

## 11. Límites conocidos

- `webostv.command` no devuelve la respuesta de la TV: los endpoints `get…` no sirven
  desde la tarjeta. Los endpoints "Luna" (`showInputPicker`, `setSystemSettings`) no
  funcionan por ese servicio.
- `turn_on` en LG requiere el Wake on LAN configurado en la integración.
- El modo `info` es experimental: sus teclas (`GUIDE`, `INFO`, `MYAPPS`, `ASTERISK` y
  sus equivalentes Samsung) no se han probado en TVs reales.
- Las entradas por puerto no se confirman (ver `_stream`). En Samsung, `ST_HDMIn`
  depende de ha-samsungtv-smart (el fork de TheFab21 lo resuelve en local, por
  SmartThings o con `KEY_HDMIn`).
- Las fuentes "solo por Roku" (`service: null`) necesitan un companion Roku.

---

## 12. Fase 3

- **3a (hecha): Vite + módulos.** El archivo único se separó en `src/` moviendo el
  código por rangos de línea, sin reescribirlo; los imports se generaron con ESLint
  (`no-undef`). Verificado: las pruebas de Node contra `src/` y `dist/`, la
  autoprueba contra ambos, y capturas idénticas a las del archivo único.
- **3b (hecha): Lit 3.3.3.** El editor (`repeat` en lugar de `_reconcile`) y la
  tarjeta (`willUpdate` + `render()` + `card/template.js` en lugar de `SKELETON` +
  `_build`/`_applySettings`/`_update`). Sin decoradores (`static properties`, JS
  puro). La lógica pura de `src/` no cambió. Verificado: pruebas de Node contra `src/`
  y `dist/` (con un DOM mínimo simulado para importar el Lit de navegador), la
  autoprueba contra ambos con perfiles limpios (3 verificaciones adaptadas: esperar
  a `updateComplete` y "sin rebuild"), y capturas iguales a las de antes de Lit
  (diferencias por debajo del ruido entre corridas).
