# Changelog

Todos los cambios importantes de la tarjeta se anotan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y las
versiones siguen [Semantic Versioning](https://semver.org/lang/es/).

## [4.0.0] — sin publicar

Reescritura completa sobre la base de producción (commit `dce0f18`). La tarjeta
sigue entendiendo los YAML de la v3 (la migración es *best-effort*); el editor
visual guarda el formato nuevo v4. Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Corregido
- **TV trabada al mantener presionada una flecha (hold infinito).** Si llegaba un
  update de Home Assistant durante la presión, el `setInterval` quedaba huérfano y
  seguía mandando teclas para siempre. Ahora la repetición es un bucle que espera la
  respuesta de HA antes de mandar la siguiente (nunca se acumulan comandos), tiene un
  tope de 40 repeticiones y se detiene con `pointerup`, `pointercancel`,
  `lostpointercapture`, al ocultarse la app, al quitar la tarjeta o al cambiar de TV
  o de modo.
- **TVs que se apagaban solas** al elegir una fuente o al encender. Todo usaba
  `media_player.toggle`, y con un estado viejo o `unavailable` el toggle apagaba una
  TV prendida. Ya no se usa toggle en ningún flujo: con la TV `unavailable` o
  `unknown` siempre se manda `turn_on`.
- **Cambio de fuente lento e inseguro.** Antes se esperaban 5 s *antes* del primer
  intento y el estado se revisaba una sola vez. Ahora se manda de inmediato, se espera
  la confirmación de HA (máx. 6 s) y se reintenta una vez.
- **El botón Salir de abajo no hacía nada.** Ahora manda EXIT (o su acción
  configurada) y es independiente del botón del encabezado.
- **El tema se quedaba "pegado"** (p. ej. colores de Netflix después de pasar a
  HDMI 1) y no reaccionaba a los cambios del Roku.
- Con Roku activo, EXIT y MENÚ se mandaban al Roku, donde no existen. Ahora solo van
  al Roku las teclas que el Roku tiene; volumen y silencio siempre van a la TV.
- (Variante v3) Con dos tarjetas en el mismo dashboard, los modos de la segunda se
  registraban en la primera.
- El selector de TVs no se cerraba al tocar fuera (por el *retargeting* del Shadow
  DOM) y cada render agregaba un listener nuevo a `document`.
- Al arrancar, el modo Roku se cargaba para la TV equivocada, y en la variante v3 no
  se restauraba correctamente la TV guardada.
- Vibración háptica doble, `exit_icon` ignorado, mapeo incorrecto de fuentes en
  Samsung, valor `'pendiente'` mandado a la TV y `console.log` de depuración.

### Agregado
- **Paletas de color.** `palette` y `palettes`: una paleta son 5 colores (`background`,
  `button`, `text`, `accent`, `on`) y una base clara u oscura; el resto de los tonos se
  deriva con `color-mix()`. Incluye 8 paletas (`grafito`, `medianoche`, `ciruela`,
  `bosque`, `oled`, `nube`, `arena`, `menta`) con contraste 4.5:1. Se asignan a la
  tarjeta, a una TV (`overrides.palette`), al modo Roku (`companion.palette`) o a un botón
  de streaming (`streaming[i].palette`); gana el más específico. Cada asignación puede
  ser un nombre o `{ light, dark }`. Un nombre inexistente se salta y se avisa.
- **Editor de paletas** en el editor visual: panel *Paletas* (crear, copiar una incluida,
  renombrar, cambiar la base, agregar o quitar colores con el selector de color de HA,
  muestras y aviso de contraste) y un selector de paleta en General, en cada TV, en el
  Roku y en cada botón de streaming personalizado. Renombrar o borrar una paleta
  actualiza todo lo que la usaba.
- **Rediseño "Ambiente"** con pantalla de estado arriba y tres estilos:
  `style: relieve` (predeterminado), `halo` y `cristal`.
- **Tema** `theme: dark` (predeterminado), `light` o `auto` (sigue el modo oscuro de HA).
- **Diseño responsivo por contenedor** (`@container`): se adapta al ancho real de la
  tarjeta (celular, columna de Masonry o tablet de pared, donde pasa a dos columnas).
- **TV apagada:** el centro del touchpad se vuelve el botón Encender (nunca apaga) y
  el touchpad, los modos y las teclas de abajo quedan bloqueados. Los botones de
  streaming siguen activos: encienden la TV y abren la app.
- **Acciones estructuradas** con tipos `key`, `button`, `command`, `source`, `input`,
  `service`, `sequence`, `platform` (una variante por marca) y `numpad`.
- **Entradas por puerto** (`action: input:hdmi2`, también `tv`): no dependen del nombre
  que la entrada tenga en la TV. LG usa `tv/switchInput` y Samsung `ST_HDMIn`.
- **Teclado numérico** como acción asignable a cualquier botón (`action: numpad`).
- **Secuencias** de pasos con pausa configurable (p. ej. un PIN), que reemplazan al
  PIN fijo de `sendPass`. Un doble toque no mezcla dos secuencias.
- **Configuración propia por TV** (`overrides`): modos, modos personalizados,
  touchpad, streaming y botones distintos para una TV concreta.
- **Commands de LG** (`webostv.command`) con payload, con una lista de los más útiles
  en el editor.
- **Editor visual nuevo**: muestra solo lo que está configurado (lo demás aparece como
  "+ Agregar…"), no escribe valores por defecto, conserva el foco al escribir y
  convierte un YAML viejo al formato v4 con un botón.
- **`?tag=` en la URL del recurso** para instalar la v4 junto a otra versión y
  probarlas en el mismo HA (`type: custom:tv-control-card-v4`).
- `card_id` opcional (se deriva de las entidades si falta).
- 18 fuentes en el catálogo de streaming, con color de marca (`accent`).
- Avisos en la consola del navegador cuando el YAML tiene claves que no se entienden.
- Pruebas automáticas (`npm test`), un harness de desarrollo y una autoprueba en el
  navegador (`dev/`).

### Cambiado
- **Editor visual en paneles plegables.** Con muchos parámetros personalizados el editor
  era una columna larguísima. Ahora cada sección (General, Televisores, cada TV, Modos,
  Touchpad sin modo, Streaming, Botones, cada botón personalizado, cada modo
  personalizado y cada dirección) es un panel con un resumen visible aun cerrado
  ("Menú, Luces, Audio", "2 personalizados: Atrás, Menú"). Arrancan abiertos General,
  Televisores y la primera TV; lo recién agregado se abre solo. El estado de los
  paneles no se guarda en el YAML.
- El modo `navegacion` se migra al modo `menu` (Inicio, Menú, Salir, Atrás) con los
  íconos de cada acción.
- El botón del encabezado se llama `top_left` en v4 (antes `exit_*`). Con Roku es el
  selector TV | Roku y su acción configurada se ignora (se avisa en la consola).
- `colorMode` pasa a ser `theme` y `modelConfig`/`type` pasan a ser `platform`; los
  nombres viejos se siguen leyendo.
- Solo las flechas se repiten al mantener presionado; volumen, canal, scripts,
  commands y fuentes se mandan una vez por toque.
- El modo `fuentes` cambia de entrada por puerto (acción `input`) y deja de ser
  experimental. El modo `info` también deja de serlo: se probó en una LG, donde
  `MYAPPS` y `ASTERISK` no responden, así que en LG sus botones 3 y 4 pasan a ser
  `recent` (Apps recientes) y `qmenu` (Ajustes rápidos); en Samsung siguen siendo
  Mis apps y Herramientas. Con el Roku activo, `info` va a la TV, igual que `audio`
  y `fuentes`.
- Los botones de streaming `hdmi1`…`hdmi4` cambian por puerto, sin esperar
  confirmación.
- Render: el DOM se construye una vez y después solo se actualiza lo que cambió; los
  cambios de entidades ajenas a la tarjeta ya no la repintan.

### Desarrollo
- El código fuente pasa a `src/`, separado en módulos ES. [Vite](https://vite.dev)
  los junta en `dist/minimalist-tv-control-card.js`, que es el archivo que se
  instala en HA (HACS lo toma de `dist/`). Para la instalación manual se copia ese
  archivo. El nombre del archivo y del elemento no cambian.
- La tarjeta y el editor se dibujan con [Lit](https://lit.dev) 3.3.3 (incluido en
  `dist/`): plantillas en lugar de parchar el DOM a mano. Mismo HTML, mismo CSS y
  mismo comportamiento.
- `npm run dev` (harness con recarga automática), `npm run build`, `npm test`
  (incluye una prueba que compara `dist/` con `src/`) y una GitHub Action que
  construye, revisa que `dist/` esté actualizado y corre las pruebas.

### Eliminado
- Los modos `text` y `amplificador` (eran maquetas sin función). Si un YAML los trae
  se omiten con un aviso; volverán en una versión futura.
- La clave `selected_sources`. Las claves `prime_*` se ignoran cuando la config usa
  `appletv_*` para el cuarto botón de streaming (igual que producción).

## [3.x] — producción hasta `dce0f18`

Resumen del historial anterior a la reescritura:

- **2026-06** Roku conectado a la TV (modo TV | Roku) y varias TVs en una tarjeta.
- **2026-05** Selector de TV con la TV elegida guardada por usuario.
- **2026-04** Repetición al mantener presionado (solo flechas) y `pointercancel`.
- **2026-03** Modos personalizados editables, botón exit configurable, soporte de
  `script.` y `source:` en los botones, prueba con Samsung, responsividad para
  pantallas chicas, temas según la fuente activa, editor visual y reintento de
  `select_source`.
