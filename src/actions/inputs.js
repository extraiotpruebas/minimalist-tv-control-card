const INPUTS = {
  hdmi1: { label: 'HDMI 1', icon: 'mdi:numeric-1-box-multiple-outline', lg: { inputId: 'HDMI_1' }, samsung: 'ST_HDMI1' },
  hdmi2: { label: 'HDMI 2', icon: 'mdi:numeric-2-box-multiple-outline', lg: { inputId: 'HDMI_2' }, samsung: 'ST_HDMI2' },
  hdmi3: { label: 'HDMI 3', icon: 'mdi:numeric-3-box-multiple-outline', lg: { inputId: 'HDMI_3' }, samsung: 'ST_HDMI3' },
  hdmi4: { label: 'HDMI 4', icon: 'mdi:numeric-4-box-multiple-outline', lg: { inputId: 'HDMI_4' }, samsung: 'ST_HDMI4' },
  tv:    { label: 'TV (antena / cable)', icon: 'mdi:television-classic', lg: { app: 'com.webos.app.livetv' }, samsung: 'ST_TV' },
};
const INPUT_IDS = Object.keys(INPUTS);

function normalizeInputId(value) {
  const str = String(value ?? '').trim();
  if (INPUT_IDS.includes(str)) return str;
  const clean = str.toLowerCase().replace(/[\s_-]/g, '');
  if (INPUT_IDS.includes(clean)) return clean;
  return null;
}

export { INPUTS, INPUT_IDS, normalizeInputId };
