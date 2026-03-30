# TV Control Card

🌐 [English version](README.en.md)

Tarjeta personalizada minimalista para controlar televisores LG WebOS y Samsung en Home Assistant.

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/extraiotpruebas/minimalist-tv-control-card)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

![Control Default](Control-default.png)

---

## Características

- **Diseño Adaptativo**: Temas visuales dinámicos que cambian según la fuente activa (Netflix, YouTube, Prime Video, Disney+)
- **Soporte Multi-marca**: Compatible con LG WebOS y Samsung (Tizen)
- **Modos de Control Configurables**: 3 slots personalizables para elegir qué modos mostrar en la rueda
- **Modos Custom**: Hasta 3 modos completamente personalizables con íconos y acciones propias
- **Botón Exit Personalizable**: Ícono y acción configurables desde el editor o YAML
- **Soporte de Scripts**: Los botones pueden ejecutar scripts de Home Assistant
- **Soporte de Fuentes**: Cambio directo de entrada HDMI u otras fuentes
- **Touchpad Virtual**: Control direccional con botones configurables por modo
- **Accesos Rápidos**: Botones para servicios de streaming (Netflix, Disney+, YouTube, Prime Video)
- **Indicadores de Estado**: Visualización del estado del TV y fuente activa
- **Editor UI**: Configuración visual integrada en el editor de Lovelace
- **Feedback Háptico**: Vibración en dispositivos móviles al presionar botones

---

## Capturas de Pantalla

| | | | |
|---|---|---|---|
| ![Control 1](Control-1.png) | ![Control 2](Control-2.png) | ![Control 3](Control-3.png) | ![Control 4](Control-4.png) |

---

## Requisitos

- Home Assistant 2021.12.0 o superior
- [HACS](https://hacs.xyz/) instalado
- Integración **LG WebOS TV** (para TVs LG) — disponible en Home Assistant
- Integración **[SamsungTV Smart](https://github.com/ollo69/ha-samsungtv-smart)** (para TVs Samsung) — instalación via HACS requerida
- **[Custom Brand Icons](https://github.com/elax46/custom-brand-icons)** — requerido para los íconos de streaming (Netflix, Disney+, Prime Video)

---

## Instalación

### Via HACS (Recomendado)

1. Abre HACS en tu instancia de Home Assistant
2. Ve a **Frontend**
3. Haz clic en el menú de tres puntos → **Custom repositories**
4. Agrega `https://github.com/extraiotpruebas/minimalist-tv-control-card` como repositorio
5. Selecciona **Lovelace** como categoría
6. Busca **TV Control Card** y haz clic en **Instalar**
7. Reinicia Home Assistant

### Manual

1. Descarga `minimalist-tv-control-card.js`
2. Cópialo a `/config/www/`
3. Agrega el recurso en tu configuración de Lovelace:

```yaml
resources:
  - url: /local/minimalist-tv-control-card.js
    type: module
```

---

## Configuración

### Configuración Mínima

```yaml
type: custom:tv-control-card
entity: media_player.mi_tv
```

### Configuración Completa

```yaml
type: custom:tv-control-card
entity: media_player.mi_tv
colorMode: dark
modelConfig: samsung
mode_slot_1: navegacion
mode_slot_2: busqueda
mode_slot_3: audio
```

---

## Parámetros de Configuración

| Parámetro | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `entity` | string | **Sí** | — | ID de entidad del `media_player` |
| `colorMode` | string | No | `dark` | Tema por defecto: `dark` o `light` |
| `modelConfig` | string | No | `LG TV` | Marca de la TV: `LG TV` o `samsung` |
| `control_mode_entity` | string | No | — | Entidad `input_select` para sincronizar el modo activo |
| `mode_slot_1` | string | No | `navegacion` | Modo asignado al slot 1 de la rueda |
| `mode_slot_2` | string | No | `busqueda` | Modo asignado al slot 2 de la rueda |
| `mode_slot_3` | string | No | `audio` | Modo asignado al slot 3 de la rueda |
| `exit_icon` | string | No | `mdi:lock-alert` | Ícono del botón exit |
| `exit_type` | string | No | `button` | Tipo de acción del botón exit: `button`, `command`, `script` |
| `exit_value` | string | No | `EXIT` / `KEY_EXIT` | Acción del botón exit |

---

## Modos Disponibles

### Modos Default

| ID | Descripción | Botones del Touchpad |
|---|---|---|
| `navegacion` | Navegación general | Inicio, Menú, Salir, Atrás |
| `busqueda` | Control de canales | Subir/Bajar canal, Info, Guía |
| `audio` | Control de volumen | Subir/Bajar volumen, Silenciar, Sonido |

### Modos Custom

Hasta 3 modos completamente personalizables. Cada modo permite definir:
- Ícono del botón en la rueda
- Nombre del modo
- Ícono y acción para cada dirección (up, down, left, right)
- Tipo de acción: `button` (comando de control remoto), `command` (endpoint WebOS), `script` (script de HA)

| ID | Descripción |
|---|---|
| `custom1` | Modo personalizado 1 |
| `custom2` | Modo personalizado 2 |
| `custom3` | Modo personalizado 3 |

#### Ejemplo de configuración YAML para un modo custom:

```yaml
type: custom:tv-control-card
entity: media_player.mi_tv
mode_slot_1: custom1
custom1_mode_icon: mdi:home-sound-in
custom1_label: Amplificador
custom1_up_icon: mdi:volume-plus
custom1_up_type: script
custom1_up_value: script.subir_volumen_ampli
custom1_down_icon: mdi:volume-minus
custom1_down_type: script
custom1_down_value: script.bajar_volumen_ampli
custom1_left_icon: mdi:power
custom1_left_type: button
custom1_left_value: MUTE
custom1_right_icon: mdi:surround-sound
custom1_right_type: button
custom1_right_value: ASTERISK
```

### Modos Adicionales

| ID | Descripción | Botones del Touchpad |
|---|---|---|
| `fuentes` | Selección de entradas | HDMI 1, 2, 3, 4 |
| `info` | Información | Guía, Info, Mis Apps, Info App activa |
| `text` | Controles de texto | Enviar texto, Teclado en pantalla, Borrar |

---

## Temas

La tarjeta adapta automáticamente su apariencia según la fuente activa:

| Fuente | Tema |
|---|---|
| Netflix | Rojo oscuro |
| Disney+ | Azul marino |
| Prime Video | Azul turquesa |
| Default | Oscuro neutro (o claro si `colorMode: light`) |

---

## Botón Exit

El botón exit (esquina superior izquierda) es completamente personalizable:

```yaml
# Ejecutar un script al presionar exit
exit_icon: mdi:shield-home
exit_type: script
exit_value: script.activar_alarma

# Enviar un botón del control remoto
exit_icon: mdi:television-off
exit_type: button
exit_value: EXIT
```

---

## Estructura del Proyecto

```
minimalist-tv-control-card/
├── minimalist-tv-control-card.js  # Archivo principal
├── README.md                       # Documentación (español)
├── README.en.md                    # Documentación (inglés)
├── hacs.json                       # Configuración HACS
├── info.md                         # Info corta para HACS
└── .github/
    └── workflows/
        └── validate.yaml
```

---

## Solución de Problemas

**La tarjeta no aparece**
1. Verifica que el archivo esté en `/config/www/`
2. Asegúrate de haber agregado el recurso en Lovelace
3. Limpia el caché del navegador (Ctrl + F5)
4. Revisa la consola del navegador para errores

**Los botones no funcionan**
1. Verifica que tu TV esté encendida y accesible en la red
2. Confirma que la integración LG WebOS o SamsungTV Smart esté correctamente configurada
3. Verifica que `modelConfig` esté configurado correctamente (`LG TV` o `samsung`)

**Los íconos de streaming no aparecen**
1. Verifica que Custom Brand Icons esté instalado y activo

**El tema no cambia**
La tarjeta detecta el tema automáticamente del atributo `source` de tu entidad `media_player`. Verifica que tu TV reporte correctamente la fuente activa.

---

## Contribuir

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/NuevaFuncion`
3. Commit: `git commit -m 'feat: descripción'`
4. Push: `git push origin feature/NuevaFuncion`
5. Abre un Pull Request

---

## Licencia

MIT — ver [LICENSE](LICENSE) para más detalles.

---

Desarrollado con ❤️ para la comunidad de Home Assistant

> Esta es una tarjeta personalizada no oficial, no afiliada con LG Electronics ni Samsung Electronics.