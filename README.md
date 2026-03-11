# TV Control Card

Tarjeta personalizada minimalista para controlar televisores LG WebOS en Home Assistant.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

## Características

- **Diseño Adaptativo**: Temas visuales dinámicos que cambian según la fuente activa (Netflix, YouTube, Prime Video)
- **Múltiples Modos de Control**: Navegación, Búsqueda, Audio
- **Touchpad Virtual**: Control direccional intuitivo con centro de acción
- **Accesos Rápidos**: Botones para servicios de streaming y controles comunes
- **Indicadores de Estado**: Visualización clara del estado del TV y modo activo


## Instalación

### Instalación vía HACS (Recomendado)

1. Abre HACS en tu instancia de Home Assistant
2. Ve a "Frontend"
3. Haz clic en el menú de tres puntos en la esquina superior derecha
4. Selecciona "Custom repositories"
5. Agrega `https://github.com/extraiotpruebas/tv-control-card` como repositorio
6. Selecciona "Lovelace" como categoría
7. Haz clic en "Agregar"
8. Busca "TV Control Card" en HACS
9. Haz clic en "Instalar"
10. Reinicia Home Assistant

### Instalación Manual

1. Descarga `minimalist-tv-control-card.js` de este repositorio
2. Copia el archivo a `/config/www/` en tu instalación de Home Assistant
3. Agrega la siguiente referencia al recurso en tu configuración de Lovelace:

```yaml
resources:
  - url: /local/minimalist-tv-control-card.js
    type: module
```

## Configuración

### Configuración Básica

```yaml
type: custom:tv-control-card
entity: media_player.tu_tv_lg
```

### Configuración Completa

```yaml
type: custom:tv-control-card
entity: media_player.tu_tv_lg
control_mode_entity: input_select.tv_control_mode  # Opcional
```

## Parámetros de Configuración

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `entity` | string | **Sí** | ID de entidad del media_player de tu TV LG |
| `control_mode_entity` | string | No | Entidad para sincronizar el modo de control |

## Requisitos

- Home Assistant 2021.12.0 o superior
- Integración LG WebOS TV configurada
- TV LG compatible con WebOS

## Uso

### Modos de Control

La tarjeta tiene tres modos de control principales:

1. **Navegación** 
   - Acceso directo a: Inicio, Menú, Salir, Atrás
   
2. **Búsqueda** 
   - Cambio de canales (arriba/abajo)
   - Info y Guía de canales

3. **Audio** 
   - Control de volumen
   - Silenciar/Activar audio
   - Configuración de sonido

### Touchpad Central

El área central funciona como un pad direccional:
- **Flechas**: Navegación direccional
- **Centro**: Botón ENTER/OK
- Los íconos cambian según el modo activo

### Botones de Streaming

Acceso rápido a tus servicios de streaming favoritos:
- Netflix
- Disney+
- YouTube
- Prime Video

## Temas

La tarjeta adapta automáticamente su apariencia según la fuente activa:

- **Netflix**: Tema rojo oscuro elegante
- **YouTube**: Tema azul moderno
- **Prime Video**: Tema azul turquesa
- **Default**: Tema oscuro neutral

## Desarrollo

### Estructura del Proyecto

```
tv-control-card/
├── minimalist-tv-control-card.js  # Archivo principal
├── README.md                       # Documentación
├── hacs.json                       # Configuración HACS
├── info.md                         # Info corta para HACS
└── .github/
    └── workflows/
        └── validate.yaml           # Validación automática
```

### Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Roadmap

- [ ] Soporte para más servicios de streaming
- [ ] Configuración personalizable de botones
- [ ] Modo landscape/retrato
- [ ] Temas personalizables
- [ ] Soporte para otros televisores (Samsung, Sony)

## Solución de Problemas

### La tarjeta no aparece

1. Verifica que el archivo esté en `/config/www/`
2. Asegúrate de haber agregado el recurso en Lovelace
3. Limpia el caché del navegador (Ctrl + F5)
4. Revisa la consola del navegador para errores

### Los botones no funcionan

1. Verifica que tu TV esté encendida
2. Confirma que la integración LG WebOS esté correctamente configurada
3. Revisa que el `entity_id` sea correcto

### El tema no cambia

La tarjeta detecta el tema automáticamente basándose en el atributo `source` de tu entidad media_player. Asegúrate de que tu TV esté reportando correctamente la fuente activa.

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Créditos

Desarrollado con ❤️ para la comunidad de Home Assistant

## Soporte

Si encuentras útil esta tarjeta, considera:
- Dar una estrella al repositorio
- Reportar bugs
- Sugerir nuevas características

---

**Nota**: Esta es una tarjeta personalizada no oficial y no está afiliada con LG Electronics.
