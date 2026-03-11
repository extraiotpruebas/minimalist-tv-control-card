# TV Control Card

Tarjeta personalizada minimalista y elegante para controlar televisores LG WebOS desde Home Assistant.

## Características Principales

**Diseño Adaptativo** - Temas que cambian dinámicamente según la app activa (Netflix, YouTube, Prime Video)

**Múltiples Modos** - Navegación, Búsqueda y Audio con controles específicos para cada uno

**Touchpad Virtual** - Control direccional intuitivo con botón central

**Accesos Rápidos** - Botones directos a tus servicios de streaming favoritos

**Indicadores Visuales** - Estado claro del TV y modo de control activo

## Instalación Rápida

Después de instalar vía HACS, agrega a tu Lovelace:

```yaml
type: custom:tv-control-card
entity: media_player.tu_tv_lg
```

## Requisitos

- Home Assistant 2021.12.0+
- Integración LG WebOS TV
- TV LG compatible con WebOS

## Soporte

Para reportar problemas o sugerir mejoras, visita el [repositorio en GitHub](https://github.com/extraiotpruebas/minimalist-tv-control-card).
