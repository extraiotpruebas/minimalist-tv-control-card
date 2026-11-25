/* Módulo §1b: entradas físicas de la TV (HDMI, antena). */

/* ============================================================================
 * ENTRADAS POR PUERTO, NO POR NOMBRE
 * ----------------------------------------------------------------------------
 * `select_source` necesita el NOMBRE que la TV publica en `source_list`, y ese
 * nombre cambia: en LG el usuario renombra la entrada ("PlayStation"); en
 * Samsung lo define el instalador o SmartThings ("CINEMA 60"). Por eso la acción
 * `input` habla de PUERTOS (`hdmi2`) y cada driver los traduce a algo que no
 * depende del nombre (igual que las teclas: 'up' → 'UP' / 'KEY_UP').
 *
 *   lg:      { inputId } → webostv.command tv/switchInput { inputId }
 *            { app }     → webostv.command system.launcher/launch { id: app }
 *   samsung: código para play_media send_key. `ST_` es la clave de fuente de
 *            ha-samsungtv-smart: el fork de TheFab21 la cambia en local por el id
 *            del puerto y, si no puede, por SmartThings o con la tecla KEY_HDMIn.
 *   roku:    un Roku no tiene entradas (el driver lo rechaza).
 * ========================================================================== */
const INPUTS = {
  hdmi1: { label: 'HDMI 1', icon: 'mdi:numeric-1-box-multiple-outline', lg: { inputId: 'HDMI_1' }, samsung: 'ST_HDMI1' },
  hdmi2: { label: 'HDMI 2', icon: 'mdi:numeric-2-box-multiple-outline', lg: { inputId: 'HDMI_2' }, samsung: 'ST_HDMI2' },
  hdmi3: { label: 'HDMI 3', icon: 'mdi:numeric-3-box-multiple-outline', lg: { inputId: 'HDMI_3' }, samsung: 'ST_HDMI3' },
  hdmi4: { label: 'HDMI 4', icon: 'mdi:numeric-4-box-multiple-outline', lg: { inputId: 'HDMI_4' }, samsung: 'ST_HDMI4' },
  // La TV en vivo no es una "entrada" en webOS: es una app.
  tv:    { label: 'TV (antena / cable)', icon: 'mdi:television-classic', lg: { app: 'com.webos.app.livetv' }, samsung: 'ST_TV' },
};
const INPUT_IDS = Object.keys(INPUTS);

/**
 * Lo que escribió el usuario → id del catálogo ('hdmi2'), o null si no es una
 * entrada conocida. La forma exacta ('hdmi2') siempre funciona.
 */
function normalizeInputId(value) {
  const str = String(value ?? '').trim();
  if (INPUT_IDS.includes(str)) return str;
  // Variantes escritas a mano ('HDMI 2', 'HDMI_2', 'hdmi-2', 'TV'): minúsculas y
  // sin separadores. Se devuelve la versión LIMPIA, la misma que se revisó.
  const clean = str.toLowerCase().replace(/[\s_-]/g, '');
  if (INPUT_IDS.includes(clean)) return clean;
  return null;
}

export { INPUTS, INPUT_IDS, normalizeInputId };
