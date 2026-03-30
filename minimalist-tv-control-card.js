const PREDEFINED_COMMANDS = [
    // Entradas/Fuentes
    { label: 'Selector de fuentes', actionLG: 'command:com.webos.surfacemanager/showInputPicker', actionSamsung: 'KEY_SOURCE' },
    { label: 'HDMI 1', actionLG: 'source:HDMI 1', actionSamsung: 'KEY_SOURCE' },
    { label: 'HDMI 2', actionLG: 'source:HDMI 2', actionSamsung: 'KEY_HDMI' },
    { label: 'HDMI 3', actionLG: 'source:HDMI 3', actionSamsung: 'KEY_TV' },
    { label: 'HDMI 4', actionLG: 'source:HDMI 4', actionSamsung: 'KEY_TV' },

    // Mas usados
    { label: 'Subir volumen', actionLG: 'VOLUMEUP', actionSamsung: 'KEY_VOLUP' },
    { label: 'Bajar volumen', actionLG: 'VOLUMEDOWN', actionSamsung: 'KEY_VOLDOWN' },
    { label: 'Silenciar', actionLG: 'MUTE', actionSamsung: 'KEY_MUTE' },
    { label: 'Arriba', actionLG: 'UP', actionSamsung: 'KEY_UP' },
    { label: 'Abajo', actionLG: 'DOWN', actionSamsung: 'KEY_DOWN' },
    { label: 'Izquierda', actionLG: 'LEFT', actionSamsung: 'KEY_LEFT' },
    { label: 'Derecha', actionLG: 'RIGHT', actionSamsung: 'KEY_RIGHT' },
    { label: 'Enter', actionLG: 'ENTER', actionSamsung: 'KEY_ENTER' },
    { label: 'Atrás', actionLG: 'BACK', actionSamsung: 'KEY_RETURN' },
    { label: 'Salir', actionLG: 'EXIT', actionSamsung: 'KEY_EXIT' },
    { label: 'Inicio', actionLG: 'HOME', actionSamsung: 'KEY_HOME' },
    { label: 'Menú', actionLG: 'MENU', actionSamsung: 'KEY_MENU' },
    { label: 'Info', actionLG: 'INFO', actionSamsung: 'KEY_INFO' },
    { label: 'Guía', actionLG: 'GUIDE', actionSamsung: 'KEY_GUIDE' },
    { label: 'Subir canal', actionLG: 'CHANNELUP', actionSamsung: 'KEY_CHUP' },
    { label: 'Bajar canal', actionLG: 'CHANNELDOWN', actionSamsung: 'KEY_CHDOWN' },
    { label: 'Canal anterior', actionLG: 'BACK', actionSamsung: 'KEY_PRECH' },
    { label: 'Mis Apps', actionLG: 'MYAPPS', actionSamsung: 'KEY_APP_LIST' },
    { label: 'Subtítulos', actionLG: 'CC', actionSamsung: null },
    { label: 'Asterisco', actionLG: 'ASTERISK', actionSamsung: 'KEY_TOOLS' },

    // Medios
    { label: 'Play', actionLG: 'PLAY', actionSamsung: 'KEY_PLAY' },
    { label: 'Pausa', actionLG: 'PAUSE', actionSamsung: 'KEY_PAUSE' },
    { label: 'Stop', actionLG: 'STOP', actionSamsung: 'KEY_STOP' },
    { label: 'Rebobinar', actionLG: 'REWIND', actionSamsung: 'KEY_REWIND' },
    { label: 'Avance rápido', actionLG: 'FASTFORWARD', actionSamsung: 'KEY_FF' },
    { label: 'Grabar', actionLG: 'RECORD', actionSamsung: 'KEY_REC' },
];
class TVControlCard extends HTMLElement {

    constructor() {
        
        super();
        window.ygriega = 0;
        window.helperGlobal = 0;
        this.modeIterations = [
            { count: 0 },
            { count: 0 },
            { count: 0 }
        ];
        this.attachShadow({ mode: 'open' });
        this.state = {
            tvEntityId: null,
            controlModeId: null,
            tvState: null,
            tvStatus: null,
            controlMode: 'default',
            source: null,
            isConnected: false,
            defaultMode: null,
            tvMessage: null,
            modelConfig: 'LG TV',
            isSelectingSource: false,
        };
        this.elements = {};

        
        this.sourceStyles = {
            'Netflix': {
                cardBackground: `
                radial-gradient(circle at 50% 0%, rgba(255, 0, 0, 0.18), transparent 45%), linear-gradient(180deg, rgba(30, 30, 32, 1) 0%,rgba(18, 18, 20, 1) 100%)`,
                cardShadow: '0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 60, 60, 0.12)',
                buttonBackground: 'rgba(35, 35, 38, 0.95)',
                buttonBorder: '1px solid rgba(255, 60, 60, 0.22)',
                buttonColor: 'rgba(255, 255, 255, 0.9)',
                touchpadBackground: 'rgba(28, 28, 30, 0.95)',
                touchpadBorder: '3px solid rgba(255, 60, 60, 0.28)',
                touchpadShadow: 'inset 0 0 35px rgba(0, 0, 0, 0.65), 0 10px 30px rgba(0, 0, 0, 0.5)',
                backgroundCenter: 'radial-gradient(rgba(46, 30, 30, 1), rgba(39, 2, 2, 1))',
                centerShadow: '0 0 140px rgba(255, 60, 60, 0.6)',
                borderActive: 'rgba(234, 102, 102, 0.5)',
                shadowActive: 'rgba(234, 102, 102, 0.8)',
                stateBackgroundOn: 'rgba(182, 45, 45, 0.15);',
                fontColorOn: 'rgba(243, 200, 200, 0.95);',    
                stateBackgroundOff: 'rgba(255, 255, 255, 0.05);',
                fontColorOff: 'rgba(255, 255, 255, 0.3)',                    
                modeActive: 'rgba(234, 102, 102, 0.6)'
            },
            'Disney+': {
                cardBackground: 'linear-gradient(180deg, rgba(8, 28, 45, 1) 0%, rgba(5, 15, 25, 1) 100%)',
                cardShadow: '0 25px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(0, 180, 255, 0.18)',
                
                buttonBackground: 'rgba(12, 35, 55, 0.95)',
                buttonBorder: '1px solid rgba(0, 180, 255, 0.25)',
                buttonColor: 'rgba(225, 245, 255, 0.95)',
                
                touchpadBackground: 'rgba(10, 30, 50, 0.95)',
                touchpadBorder: '3px solid rgba(0, 180, 255, 0.35)',
                touchpadShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.6), 0 10px 35px rgba(0, 0, 0, 0.5)',
                backgroundCenter: 'radial-gradient(rgba(15, 38, 62, 1), rgba(7, 25, 40, 1))',
                centerShadow: '0 0 160px rgba(0, 180, 255, 0.7)',
                borderActive: 'rgba(255, 255, 255, 0.8)',
                shadowActive: 'rgba(255, 255, 255, 1)',
                stateBackgroundOn: 'rgba(8, 28, 45, 0.15);',
                fontColorOn: 'rgba(184, 209, 243, 0.95);',    
                stateBackgroundOff: 'rgba(255, 255, 255, 0.05);',
                fontColorOff: 'rgba(255, 255, 255, 0.3)',                                    
                modeActive: 'rgba(167, 229, 255, 0.8)'
            },
            'Prime Video': {
                cardBackground: 'linear-gradient(180deg, rgba(10, 20, 30, 1) 0%, rgba(5, 10, 15, 1) 100%)',
                cardShadow: '0 25px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(80, 200, 255, 0.12)',
                
                buttonBackground: 'rgba(15, 30, 45, 0.9)',
                buttonBorder: '1px solid rgba(80, 200, 255, 0.18)',
                buttonColor: 'rgba(220, 240, 255, 0.9)',
                
                touchpadBackground: 'rgba(10, 25, 40, 0.9)',
                touchpadBorder: '3px solid rgba(80, 200, 255, 0.25)',
                touchpadShadow: 'inset 0 0 35px rgba(0, 0, 0, 0.6), 0 8px 30px rgba(0, 0, 0, 0.5)',
                backgroundCenter:  'radial-gradient(rgba(10, 24, 38, 1), rgba(5, 12, 19, 1))',
                centerShadow: '0 0 120px rgba(80, 200, 255, 0.45)',
                borderActive: 'rgba(100, 146, 255, 0.6)',
                shadowActive: 'rgba(144, 189, 196, 0.8)',
                stateBackgroundOn: 'rgba(10, 20, 30, 0.15);',
                fontColorOn: 'rgba(210, 225, 240, 0.95);',    
                stateBackgroundOff: 'rgba(255, 255, 255, 0.05);',
                fontColorOff: 'rgba(255, 255, 255, 0.3)',                    
                modeActive: 'rgba(34, 126, 135, 0.7)'
            },
            'default': {
                cardBackground: 'linear-gradient(180deg, rgba(20, 20, 25, 1) 0%, rgba(30, 30, 40, 1) 100%)',
                cardShadow: '0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                buttonBackground: 'rgba(30, 30, 30, 0.9)',
                buttonBorder: '1px solid rgba(255, 255, 255, 0.12)',
                buttonColor: 'rgba(255, 255, 255, 0.85)',
                touchpadBackground: 'rgba(30, 30, 30, 0.9)',
                touchpadBorder: '3px solid rgba(255, 255, 255, 0.2)',
                touchpadShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5), 0 8px 30px rgba(0, 0, 0, 0.4)',
                backgroundCenter:  'radial-gradient(rgba(34, 34, 51, 1), rgba(28, 29, 39, 1))',
                centerShadow: '10px 10px 100px rgba(102, 126, 234, 0.6)',
                borderActive: 'rgba(104, 105, 123, 0.6)',
                shadowActive: 'rgba(144, 189, 196, 0.8)', 
                stateBackgroundOn: 'rgba(45, 47, 182, 0.15);',
                fontColorOn: 'rgba(184, 209, 243, 0.95);',    
                stateBackgroundOff: 'rgba(255, 255, 255, 0.05);',
                fontColorOff: 'rgba(255, 255, 255, 0.3)',              
                modeActive: 'rgba(30, 30, 30, 0.6)'
            },
            'light': {
                cardBackground: `linear-gradient(180deg,
                    rgba(240, 240, 245, 1) 0%,
                    rgba(220, 220, 230, 1) 100%)`,
                cardShadow: `0 25px 60px rgba(0, 0, 0, 0.15)
                , inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
                buttonBackground: 'rgba(255, 255, 255, 0.8)',
                buttonBorder: '1.5px solid rgba(200, 200, 210, 0.4)',
                buttonColor: 'rgba(255, 255, 255, 0.8)',
                touchpadBackground: 'rgba(255, 255, 255, 0.5)',
                touchpadBorder: '3px solid rgba(220, 220, 230, 0.6)',
                touchpadShadow: `inset 0 0 30px rgba(0, 0, 0, 0.05),
                0 8px 30px rgba(0, 0, 0, 0.1)`,
                backgroundCenter:  'radial-gradient(rgba(250, 250, 252, 1), rgba(235, 235, 240, 1))',
                centerShadow: '0 0 40px rgba(255, 255, 255, 0.8), 0 8px 20px rgba(0, 0, 0, 0.08)',
                borderActive: 'rgba(255, 255, 255, 1)',
                shadowActive: 'rgba(144, 189, 196, 0.8)', 
                stateBackgroundOn: 'rgba(45, 47, 182, 0.15);',
                fontColorOn: 'rgba(184, 209, 243, 0.95);',    
                stateBackgroundOff: 'rgba(255, 255, 255, 0.05);',
                fontColorOff: 'rgba(255, 255, 255, 0.3)',              
                modeActive: 'rgba(30, 30, 30, 0.6)'
            },
            'dark': {
                cardBackground: 'linear-gradient(180deg, rgba(20, 20, 25, 1) 0%, rgba(30, 30, 40, 1) 100%)',
                cardShadow: '0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                buttonBackground: 'rgba(30, 30, 30, 0.9)',
                buttonBorder: '1px solid rgba(255, 255, 255, 0.12)',
                buttonColor: 'rgba(255, 255, 255, 0.85)',
                touchpadBackground: 'rgba(30, 30, 30, 0.9)',
                touchpadBorder: '3px solid rgba(255, 255, 255, 0.2)',
                touchpadShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5), 0 8px 30px rgba(0, 0, 0, 0.4)',
                backgroundCenter:  'radial-gradient(rgba(34, 34, 51, 1), rgba(28, 29, 39, 1))',
                centerShadow: '10px 10px 100px rgba(102, 126, 234, 0.6)',
                borderActive: 'rgba(104, 105, 123, 0.6)',
                shadowActive: 'rgba(144, 189, 196, 0.8)', 
                stateBackgroundOn: 'rgba(45, 47, 182, 0.15);',
                fontColorOn: 'rgba(184, 209, 243, 0.95);',    
                stateBackgroundOff: 'rgba(255, 255, 255, 0.05);',
                fontColorOff: 'rgba(255, 255, 255, 0.3)',              
                modeActive: 'rgba(30, 30, 30, 0.6)'
            }
        };
        
        this.streamingServices = [
            { id: 'netflix', name: 'Netflix', icon: 'mdi:netflix', service: 'Netflix' },
            { id: 'disney', name: 'Disney+', icon: 'phu:disney-plus', service: 'Disney+' },
            { id: 'YouTube', name: 'YouTube', icon: 'mdi:youtube', service: 'YouTube' },
            { id: 'prime', name: 'Prime Video', icon: 'phu:prime-video', service: 'Prime Video' }
        ];


        
        this.bottomButtons = [
            { id: 'back', icon: 'mdi:undo-variant', actionLG: 'BACK', actionSamsung: 'KEY_RETURN', label: 'Atrás' },
            { id: 'home', icon: 'mdi:home', actionLG: 'HOME', actionSamsung: 'KEY_HOME', label: 'Inicio' },
            { id: 'exit', icon: 'mdi:exit-to-app', actionLG: 'EXIT', actionSamsung: 'KEY_EXIT', label: 'Salir' },
            { id: 'menu', icon: 'mdi:menu', actionLG: 'MENU', actionSamsung: 'KEY_MENU', label: 'Menú' }
        ];
        
        this.touchpadButtons = {
            'navegacion': {
                up: { icon: 'mdi:menorah', actionLG: 'HOME', actionSamsung: 'KEY_HOME', label: 'Inicio' },
                left: { icon: 'mdi:movie-star', actionLG: 'MENU', actionSamsung: 'KEY_MENU', label: 'Menú' },
                right: { icon: 'mdi:lightbulb-group-outline', actionLG: 'EXIT', actionSamsung: 'KEY_EXIT', label: 'Salir' },
                down: { icon: 'mdi:home-thermometer', actionLG: 'BACK', actionSamsung: 'KEY_RETURN', label: 'Atrás' }
            },
            'busqueda': {
                up: { icon: 'mdi:plus-box', actionLG: 'CHANNELUP', actionSamsung: 'KEY_CHUP', label: 'Subir canal' },
                left: { icon: 'mdi:hdmi-port', actionLG: 'INFO', actionSamsung: 'KEY_SOURCE', label: 'Información' },
                right: { icon: 'mdi:format-list-numbered', actionLG: 'GUIDE', actionSamsung: 'KEY_GUIDE', label: 'Guía' },
                down: { icon: 'mdi:minus-box', actionLG: 'CHANNELDOWN', actionSamsung: 'KEY_CHDOWN', label: 'Bajar canal' }
            },
            'audio': {
                up: { icon: 'mdi:volume-plus', actionLG: 'VOLUMEUP', actionSamsung: 'KEY_VOLUP', label: 'Subir volumen' },
                left: { icon: 'mdi:volume-off', actionLG: 'MUTE', actionSamsung: 'KEY_MUTE', label: 'Silenciar' },
                right: { icon: 'mdi:surround-sound', actionLG: null, actionSamsung: null, label: 'Sonido' },
                down: { icon: 'mdi:volume-minus', actionLG: 'VOLUMEDOWN', actionSamsung: 'KEY_VOLDOWN', label: 'Bajar volumen' }
            },
            'text': {
                up: { icon: 'mdi:comment-text-multiple', actionLG: 'pendiente', actionSamsung: 'pendiente', label: 'Enviar mensaje a TV' },
                left: { icon: 'mdi:keyboard-settings', actionLG: 'SCREEN_REMOTE', actionSamsung: 'pendiente', label: 'Controles en Pantalla' },
                right: { icon: 'mdi:backspace', actionLG: 'pendiente', actionSamsung: 'pendiente', label: 'borrar texto' },
                down: { icon: 'mdi:form-textbox', actionLG: 'pendiente', actionSamsung: 'pendiente',  label: 'escribir texto' }
            },
            'amplificador': {
                up: { icon: 'phu:dolby-atmos', actionLG: 'pendiente', label: 'dolby' },
                left: { icon: 'mdi:home-sound-out-outline', actionLG: 'pendiente', label: 'sonido orange' },
                right: { icon: 'mdi:television-play', actionLG: 'pendiente', label: 'sonido TV' },
                down: { icon: 'mdi:surround-sound-5-1', actionLG: 'pendiente', label: 'surround' }
            },
            'fuentes': {
                up: { icon: 'mdi:numeric-1-box-multiple-outline', actionLG: 'pendiente', actionSamsung: 'KEY_SOURCE', label: 'HDMI 1' },
                left: { icon: 'mdi:numeric-2-box-multiple-outline', actionLG: 'pendiente', actionSamsung: 'KEY_HDMI', label: 'HDMI 2' },
                right: { icon: 'mdi:numeric-3-box-multiple-outline', actionLG: 'pendiente', actionSamsung: 'KEY_TV', label: 'HDMI 3' },
                down: { icon: 'mdi:numeric-4-box-multiple-outline', actionLG: 'pendiente', actionSamsung: 'KEY_AV1', label: 'HDMI 4' }
            },
            'info': {
                up: { icon: 'mdi:television-guide', actionLG: 'GUIDE', actionSamsung: 'KEY_CH_LIST', label: '' },
                left: { icon: 'mdi:information-slab-circle-outline', actionLG: 'INFO', actionSamsung: 'KEY_INFO', label: '' },
                right: { icon: 'mdi:apps', actionLG: 'MYAPPS', actionSamsung: 'KEY_APP_LIST', label: '' },
                down: { icon: 'mdi:book-information-variant', actionLG: 'pendiente', actionSamsung: 'KEY_TOOLS', label: '"com.webos.applicationManager/getForegroundAppInfo"' }
            },
/* AQUI FALTA VER COMO SE VA A IMPLEMENTAR, PORQUE LA RUEDA VA A CAMBIAR A 9 NUMEROS
            'keyboard': {
                up: { icon: '', action: 'pendiente', label: '' },
                left: { icon: '', action: 'pendiente', label: '' },
                right: { icon: '', action: 'pendiente', label: '' },
                down: { icon: '', action: 'pendiente', label: '' }
            },
*/
            'default': {
                up: { icon: 'mdi:circle-medium', actionLG: 'UP', actionSamsung: 'KEY_UP', label: 'Arriba' },
                left: { icon: 'mdi:circle-medium', actionLG: 'LEFT', actionSamsung: 'KEY_LEFT', label: 'Izquierda' },
                right: { icon: 'mdi:circle-medium', actionLG: 'RIGHT', actionSamsung: 'KEY_RIGHT', label: 'Derecha' },
                down: { icon: 'mdi:circle-medium', actionLG: 'DOWN', actionSamsung: 'KEY_DOWN', label: 'Abajo' }
            }
        };
    }
    
    setConfig(config) {
        if (!config.entity) {
            throw new Error('Por favor define una entidad (entity)');
        }
        
        this._config = config;
        this.displayOrder = [
            config.mode_slot_1 || 'navegacion',  // valor por defecto si no está definido
            config.mode_slot_2 || 'busqueda',
            config.mode_slot_3 || 'audio'
        ];
        this.controlModes = [
            { id: 'navegacion', icon: 'mdi:menu-open', label: 'Navegación' },
            { id: 'busqueda', icon: 'mdi:television-classic', label: 'Búsqueda' },
            { id: 'audio', icon: 'mdi:volume-high', label: 'Audio' },
            { id: 'fuentes', icon: 'mdi:television-shimmer', label: 'Fuentes' },
            { id: 'info', icon: 'mdi:information-variant-circle-outline', label: 'Información' },
            { id: 'text', icon: 'mdi:text-account', label: 'Texto' },
            { id: 'custom1', icon: config.custom1_mode_icon || 'mdi:numeric-1-circle-outline', label: config.custom1_label || 'Personalizado 1' },
            { id: 'custom2', icon: config.custom2_mode_icon || 'mdi:numeric-2-circle-outline', label: config.custom2_label || 'Personalizado 2' },
            { id: 'custom3', icon: config.custom3_mode_icon || 'mdi:numeric-3-circle-outline', label: config.custom3_label || 'Personalizado 3' }
        ];
        this.state.defaultMode = config.colorMode;
        //console.log("esto es la nueva propiedad YAML que estamos definiendo" + config.colorMode)
        this.state.tvEntityId = config.entity;
        //console.log("esto es tvEntityID que deberia ser la entidad que defines" + config.entity)
        this.state.modelConfig = config.modelConfig;
        //console.log("modelConfig recibido: " + config.modelConfig);
        let ejemplo = this.getTvSource()
        //console.log("ESTE ES EL ESTADO DE SOURCE " + ejemplo)
        this.state.controlModeId = config.control_mode_entity || null;
        if (this.state.isConnected) {
            this.render();
        }
    }

    //ESTA ES LA CONFIG DEL UI///////////
    static getConfigElement() {
        return document.createElement('tv-control-card-editor');
    }
    
    static getStubConfig() {
        return {
            type: 'custom:tv-control-card',
            entity: 'media_player.tv',
            colorMode: 'dark',
            modelConfig: 'samsung',
            mode_slot_1: 'navegacion',
            mode_slot_2: 'busqueda',
            mode_slot_3: 'audio'
        };
    }    
    ////////////////////////////////////

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getCardSize() {
        return 6;
    }
    
    connectedCallback() {
        this.state.isConnected = true;
        this.render();
    }
    
    disconnectedCallback() {
        this.state.isConnected = false;
    }
    
    render() {
        const styles = this.getCurrentStyles();
        this.shadowRoot.innerHTML = `
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }                
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                }
                
                ha-card {
                    padding: 0;
                    background: transparent !important;
                    box-shadow: none;
                    border: none;    
                }
                
                .tv-control-card {
                    width: 100%;
                    height: 1000px;
                    max-width: 500px;
                    max-height: 1000px;
                    border-radius: 35px;
                    padding: 20px 25px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    position: relative;
                    transition: all 0.3s ease;
                    margin: 0 auto;
                    box-sizing: border-box;
                    background-color: rgba(255,255,255,0);
                    transform: scale(0.78);
                    right: 18px;
                    bottom: 50px;
                    transform-origin: top left;
                    backdrop-filter: blur(12px);
                }
                
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
                        "botones botones botones";
                    grid-template-columns: 1fr 1fr 1fr;
                    grid-template-rows: auto auto 15px 20px auto 20px auto 30px auto;
                    gap: 15px;
                    justify-items: center;
                    align-items: center;
                    width: 100%;
                    max-width: 380px;
                    margin: 0 auto;
                    transform: scale(1.2);
                    position: relative;
                    top: 100px;
                }
                
                .top-section {
                    grid-area: top-section;
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    width: 100%;
                    margin-bottom: 0px;
                    align-items: center;
                }
                
                .exit-button {
                    justify-self: start;
                }
                
                .text {
                    justify-self: center;
                }
                
                .power-button {
                    justify-self: end;
                }
                
                .top-button {
                    background: ${styles.buttonBackground};
                    backdrop-filter: blur(10px);
                    border-radius: 50%;
                    height: 45px;
                    width: 45px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: ${styles.buttonBorder};
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    color: ${styles.buttonColor};
                }
                .tv-status-label {
                    justify-self: center;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    padding: 4px 12px;
                    border-radius: 20px;
                    transition: all 0.4s ease;
                    max-width: 120px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;                    
                }

                .tv-status-label.on {
                    color: ${styles.fontColorOn};
                    background: ${styles.stateBackgroundOn};
                    border: 1px solid rgba(37, 37, 37, 0.3);
                }

                .tv-status-label.off {
                    color: ${styles.fontColorOff};
                    background: ${styles.stateBackgroundOff};
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .streaming-section {
                    grid-area: streaming;
                    background: rgba(30, 30, 45, 0.0);
                    transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
                    border-radius: 20px;
                    padding: 10px 15px;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
                    width: 100%;
                }
                
                .streaming-grid {
                    display: grid;
                    grid-template-areas: 
                        "title title title title"
                        "netflix disney YouTube prime";
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    grid-template-rows: auto 1fr;
                    gap: 0px 15px;
                }
                
                .streaming-title {
                    grid-area: title;
                    font-weight: 600;
                    font-size: 14px;
                    text-align: center;
                    color: white;
                    letter-spacing: 0.5px;
                    margin-bottom: 10px;
                }
                
                .streaming-button {
                    height: 60px;
                    width: 60px;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 20px;
                    transition: all 0.3s ease;
                }
                
                .touchpad-section {
                    grid-area: touchpad;
                    background: ${styles.touchpadBackground};
                    backdrop-filter: blur(15px);
                    border-radius: 50%;
                    border: ${styles.touchpadBorder};
                    width: 230px;
                    height: 230px;
                    box-shadow: ${styles.touchpadShadow};
                    position: relative;
                    transform: scale(1.1);
                }
                
                .touchpad-grid {
                    display: grid;
                    grid-template-areas: 
                        ". up ."
                        "left center right"
                        ". down .";
                    grid-template-columns: 1fr 1fr 1fr;
                    grid-template-rows: 1fr 1fr 1fr;
                    gap: 5px;
                    justify-items: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                }
                
                .touchpad-button {
                    background: none;
                    box-shadow: none;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: ${styles.buttonColor};
                }
                
                .touchpad-button ha-icon {
                    --mdc-icon-size: 28px;
                }
                
                .touchpad-up { grid-area: up; }
                .touchpad-left { grid-area: left; }
                .touchpad-center { grid-area: center; }
                .touchpad-right { grid-area: right; }
                .touchpad-down { grid-area: down; }
                
                .touchpad-center-button {
                    background: ${styles.backgroundCenter};
                    border-radius: 50%;
                    height: 90px;
                    width: 90px;
                    border: 0px solid rgba(255, 255, 255, 0.3);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: ${styles.centerShadow};
                    z-index: 99;
                }
                
                .mode-buttons {
                    grid-area: mode-buttons;
                    width: 110%;
                }
                
                .mode-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 0px 30px;
                    border: none;
                    justify-items: center;
                }
                
                .mode-button {
                    background: rgba(30, 30, 30, 0.6);
                    backdrop-filter: blur(10px);
                    border-radius: 50%;
                    height: 55px;
                    width: 55px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: ${styles.buttonBorder};
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    color: rgba(255, 255, 255, 0.85);
                }
                
                .mode-button ha-icon {
                    --mdc-icon-size: 24px;
                }
                
                .mode-button.active {
                    background: ${styles.modeActive};
                    border: 1px solid ${styles.borderActive};
                    box-shadow: 0 0 20px ${styles.shadowActive};
                }
                
                .bottom-section {
                    grid-area: botones;
                    border: none;
                    background: none;
                    padding: 10px 15px;
                    width: 100%;
                }
                
                .bottom-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    gap: 0px 30px;
                    border: none;
                    justify-items: center;
                }
                
                .bottom-button {
                    background: rgba(30, 30, 30, 0.6);
                    backdrop-filter: blur(10px);
                    border-radius: 50%;
                    height: 55px;
                    width: 55px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    color: rgba(255, 255, 255, 0.85);
                }
                
                .bottom-button ha-icon {
                    --mdc-icon-size: 24px;
                }
                
                .spacer {
                    background: none;
                    box-shadow: none;
                    height: 1px;
                }
                
                .spacer1 { grid-area: spacer1; }
                .spacer2 { grid-area: spacer2; }
                .spacer3 { grid-area: spacer3; }
                .spacer4 { grid-area: spacer4; }
                
                .top-button:hover, 
                .streaming-button:hover, 
                .touchpad-button:hover, 
                .mode-button:hover, 
                .bottom-button:hover {
                    transform: scale(1.05);
                    opacity: 0.9;
                }
                
                .touchpad-center-button:hover {
                    transform: scale(1.05);
                }
                
                .streaming-button.active {
                    border: 2.5px solid ${this.state.source === 'Prime Video' 
                        ? 'rgba(100, 255, 100, 0.6)' 
                        : this.state.source === 'Disney+'
                        ? 'rgba(6, 86, 186, 1)'
                        : 'rgba(255, 100, 100, 0.15)'};
                }
                .tv-message {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    z-index: 100;
                }                        

                @media (min-width: 601px){
                    .tv-control-card {
                        max-width: 500px !important;
                        padding: 20px 25px;
                        height: auto !important;
                        min-height: 700px;
                        transform: scale(1) !important;
                        right: 0 !important;
                        bottom: 0 !important;
                    }

                    .card-grid {
                        max-width: 380px;
                        transform: scale(1) !important;
                        top: 0 !important;
                    }

                    .streaming-section,
                    .top-section,
                    .mode-buttons {
                        width: 100% !important;
                    }
                }

                @media (max-width: 600px) {
                    :host {
                        width: 100% !important;
                    }
                    
                    ha-card {
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    
                    .tv-control-card {
                        max-width: none !important;
                        width: 100% !important;
                        height: auto !important;
                        min-height: 600px;
                        padding: 15px !important;
                        border-radius: 25px;
                        transform: scale(1) !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        margin: 0 !important;
                    }
                    
                    .card-grid {
                        max-width: 100% !important;
                        width: 100%;
                        gap: 10px;
                        transform: scale(1) !important;
                        top: 0 !important;
                        grid-template-rows: auto auto 10px 15px auto 15px auto 20px auto;
                    }
                    
                    .top-section,
                    .streaming-section,
                    .mode-buttons {
                        width: 100% !important;
                    }
                    
                    .touchpad-section {
                        width: 270px;
                        height: 270px;
                        transform: scale(1) !important;
                    }
                    
                    .touchpad-center-button {
                        width: 100px;
                        height: 100px;
                    }
                    .streaming-button {
                        height: 45px;
                        width: 45px;
                        border-radius: 10px;
                    }

                    .streaming-grid {
                        gap: 0px 8px;
                        justify-items: center;
                    }

                    .bottom-grid {
                        gap: 0px 15px;
                    }

                    .bottom-button {
                        height: 45px;
                        width: 45px;
                    }

                    .mode-grid {
                        gap: 0px 15px;
                    }

                    .mode-button {
                        height: 45px;
                        width: 45px;
                    }                        
                }
                @media (max-width: 320px) {
                    .touchpad-section {
                        width: 200px;
                        height: 200px;
                        transform: scale(1) !important;
                    }

                    .touchpad-center-button {
                        width: 80px;
                        height: 80px;
                    }

                    .streaming-button {
                        height: 45px;
                        width: 45px;
                        border-radius: 10px;
                    }

                    .streaming-grid {
                        gap: 0px 8px;
                        justify-items: center;
                    }

                    .bottom-grid {
                        gap: 0px 15px;
                    }

                    .bottom-button {
                        height: 45px;
                        width: 45px;
                    }

                    .mode-grid {
                        gap: 0px 15px;
                    }

                    .mode-button {
                        height: 45px;
                        width: 45px;
                    }

                    .tv-status-label {
                        font-size: 9px;
                        letter-spacing: 0.8px;
                        padding: 4px 8px;
                        max-width: 120px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                }                    
            </style>
            
            <ha-card>
                <div class="tv-control-card">
                    ${this.state.tvMessage ? `
                        <div class="tv-message">
                            ${this.state.tvMessage}
                        </div>
                    ` : ''}
                    <div class="card-grid">
                        <div class="top-section">
                            <div class="top-button exit-button" data-action="exit">
                                <ha-icon icon="${this._config.exit_icon || 'mdi:alert-decagram'}"></ha-icon>
                            </div>
                            <div class="tv-status-label ${this.getTvStatus() === 'on' ? 'on' : 'off'}">
                                ${this.getTvStatus() === 'on' ? `ON - ${this.state.source || ''}` : 'OFF'}
                            </div>

                            <div class="top-button power-button" data-action="power">
                                <ha-icon icon="mdi:power"></ha-icon>
                            </div>
                        </div>
                        
                        <div class="streaming-section">
                            <div class="streaming-grid">
                                <div class="streaming-title"></div>
                                ${this.streamingServices.map(service => `
                                    <div class="streaming-button ${service.id}-button ${this.state.source === service.service ? 'active' : ''}" 
                                        data-service="${service.service}"
                                        style="background: ${this.getStreamingButtonBackground(service.service)}; 
                                                border: ${this.getStreamingButtonBorder(service.service)};
                                                color: ${this.getStreamingButtonColor(service.service)};">
                                        <ha-icon icon="${service.icon}"></ha-icon>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="spacer spacer1"></div>
                        <div class="spacer spacer2"></div>
                        
                        <div class="touchpad-section">
                            <div class="touchpad-grid">
                                ${this.renderTouchpadButtons()}
                                <div class="touchpad-center-button touchpad-center touchpad-button" data-action="center"></div>
                            </div>
                        </div>
                        
                        <div class="spacer spacer3"></div>
                        
                        <div class="mode-buttons">
                            <div class="mode-grid">
                                ${this.displayOrder.map(modeId => {
                                    // Buscar el modo completo en controlModes
                                    const mode = this.controlModes.find(m => m.id === modeId);
                                    if (!mode) return ''; // Si no existe, no renderiza nada
                                    
                                    return `
                                        <div class="mode-button mode-${mode.id} ${this.state.controlMode === mode.id ? 'active' : ''}" 
                                            data-mode="${mode.id}">
                                            <ha-icon icon="${mode.icon}"></ha-icon>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        
                        <div class="spacer spacer4"></div>
                        
                        <div class="bottom-section">
                            <div class="bottom-grid">
                                ${this.bottomButtons.map(button => `
                                    <div class="bottom-button ${button.id}-button" data-action="${button.id}">
                                        <ha-icon icon="${button.icon}"></ha-icon>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </ha-card>
        `;
        
        
        this.saveElementReferences();
        this.updateCardStyles();
        this.listenerModo(this.displayOrder[0], this.modeIterations[0], [this.modeIterations[1], this.modeIterations[2]]);
        this.listenerModo(this.displayOrder[1], this.modeIterations[1], [this.modeIterations[0], this.modeIterations[2]]);
        this.listenerModo(this.displayOrder[2], this.modeIterations[2], [this.modeIterations[0], this.modeIterations[1]]);
        this.listenerPower();
        this.listenerExit();
        this.listenerStreaming();
        this.listenerBottomButtons();
        this.listenerTouchpad();
    }
    
    saveElementReferences() {
        this.elements.card = this.shadowRoot.querySelector('.tv-control-card');
        this.elements.exitButton = this.shadowRoot.querySelector('.exit-button');
        this.elements.powerButton = this.shadowRoot.querySelector('.power-button');
        this.elements.touchpadCenter = this.shadowRoot.querySelector('.touchpad-center-button');
        
        this.streamingServices.forEach(service => {
            this.elements[`${service.id}Button`] = this.shadowRoot.querySelector(`.${service.id}-button`);
        });
        
        this.displayOrder.forEach(modeId => {
            // Buscar el modo completo en controlModes
            const mode = this.controlModes.find(m => m.id === modeId);
            if (mode) {
                const selector = `.mode-${mode.id}`;
                const button = this.shadowRoot.querySelector(selector);
                const elementKey = `mode${mode.id.charAt(0).toUpperCase() + mode.id.slice(1)}Button`;
                this.elements[elementKey] = button;
            } else {
                console.warn(`Modo con id '${modeId}' no encontrado en controlModes`);
            }
        });
        
        this.bottomButtons.forEach(button => {
            this.elements[`${button.id}BottomButton`] = this.shadowRoot.querySelector(`.${button.id}-button`);
        });
        
        ['up', 'left', 'right', 'down'].forEach(direction => {
            this.elements[`touchpad${direction.charAt(0).toUpperCase() + direction.slice(1)}`] = 
                this.shadowRoot.querySelector(`.touchpad-${direction}`);
        });

    }

    
    renderTouchpadButtons() {
        const mode = this.state.controlMode;
    
        let buttons;
    
        if (mode && mode.startsWith('custom')) {
            const num = mode.replace('custom', '');
            buttons = {};
            ['up', 'left', 'right', 'down'].forEach(dir => {
                buttons[dir] = {
                    icon: this._config[`custom${num}_${dir}_icon`] || 'mdi:help',
                    action: this._config[`custom${num}_${dir}_value`] || null,
                    label: dir
                };
            });
        } else {
            buttons = this.touchpadButtons[mode] || this.touchpadButtons['default'];
        }
    
        return ['up', 'left', 'right', 'down'].map(direction => {
            const button = buttons[direction];
            return `
                <div class="touchpad-button touchpad-${direction}" 
                        data-action="${button.action || ''}"
                        title="${button.label}">
                    <ha-icon icon="${button.icon}"></ha-icon>
                </div>
            `;
        }).join('');
    }
    getTvStatus() {
        if (!this._hass || !this.state.tvEntityId) return 'off';
        const tvState = this._hass.states[this.state.tvEntityId];
        if (!tvState) return 'off';
        // 'off' y 'unavailable' = apagado; cualquier otro estado = encendido
        return (tvState.state === 'off' || tvState.state === 'unavailable') ? 'off' : 'on';
    }

    getTvSource() {
        if (!this._hass || !this.state.tvEntityId) return null;
        const tvState = this._hass.states[this.state.tvEntityId];
        if (!tvState) return null;
    
        return tvState.attributes.source ?? null;


    }

    getCurrentStyles() {
        const source = this.state.source;
        const modo = this.state.defaultMode;
        return this.sourceStyles[source] || this.sourceStyles[modo];
    }
    
    getStreamingButtonBackground(service) {
        const source = this.state.source;
        if (source === 'Netflix') return 'rgba(40, 20, 20, 0.6)';
        if (source === 'Disney+') return 'rgba(6, 19, 31, 0.8)';
        if (source === 'Prime Video') return 'rgba(30, 30, 30, 0.6)';
        return 'rgba(30, 30, 30, 0.6)';
    }
    
    getStreamingButtonBorder(service) {
        const source = this.state.source;
        const isActive = this.state.source === service;
        
        if (isActive && service === 'Prime Video') {
            return '2.5px solid rgba(255, 255, 255, 0.7)';
        }
        if (isActive && service === 'Netflix') {
            return '2.5px solid rgba(255, 100, 100, 0.7)';
        }
        if (isActive && service === 'Disney+') {
            return '2.5px solid rgba(255, 255, 210, 0.7)';
        }
        return '1.5px solid rgba(255, 255, 255, 0.15)';
    }
    
    getStreamingButtonColor(service) {
        const source = this.state.source;
        if (source === 'Netflix' && service === 'Netflix') return 'rgba(255, 255, 255, 1)';
        if (source === 'Disney+' && service === 'Disney+') return 'rgba(255, 255, 255, 1)';
        if (source === 'Prime Video' && service === 'Prime Video') return 'rgba(255, 255, 255, 0.85)';
        return 'rgba(255, 255, 255, 0.5)';
    }
    
    updateCardStyles() {
        const styles = this.getCurrentStyles();
        
        if (this.elements.card) {
            this.elements.card.style.background = styles.cardBackground;
            this.elements.card.style.boxShadow = styles.cardShadow;
        }
    }
    
    selectSource(source) {
            if (this._hass && this.state.tvEntityId) {
                this._hass.callService('media_player', 'select_source', {
                    entity_id: this.state.tvEntityId,
                    source: source
                });
            }     

    }

    async selectSourceWithRetry(targetSource, haIcon, originalIcon, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            await this.delay(5000);
            this.selectSource(targetSource);
    
            if (this.state.source === targetSource) {
                // Termina por éxito
                this.state.isSelectingSource = false;
                haIcon.setAttribute('icon', originalIcon);
                haIcon.style.animation = '';
                return;
            }
        }
    
        // Termina por agotar reintentos
        this.state.isSelectingSource = false;
        haIcon.setAttribute('icon', originalIcon);
        haIcon.style.animation = '';
    }
    
    selectControlMode(mode) {
        this.state.controlMode = mode;
        this.render();
    }
        // Función para disparar feedback háptico
    _dispararHaptic(tipo = 'light') {
        // Tipos comunes: 'light', 'medium', 'heavy', 'selection', 'success', 'warning', 'failure'
        const event = new CustomEvent('haptic', {
        detail: tipo,
        bubbles: true,
        composed: true, // Importante para que atraviese el Shadow DOM
        });
        this.dispatchEvent(event);
    }
    
    listenerModo(modeId, iteracion, otrasIteraciones) {
        function find(el, tag="TV-CONTROL-CARD") {
            if(el.tagName === tag) return el;
            if(el.shadowRoot) for(let child of el.shadowRoot.children) {
                let found = find(child, tag);
                if(found) return found;
            }
            for(let child of el.children) {
                let found = find(child, tag);
                if(found) return found;
            }
            return null;
        }
    
        function findBtn() {
            let tvCard = find(document.querySelector("home-assistant"));
            if(!tvCard?.shadowRoot) return null;
    
            let mainDiv = tvCard.shadowRoot.querySelector("div.tv-control-card") || tvCard.shadowRoot.querySelector("div");
            if(!mainDiv) return null;
    
            let searchArea = mainDiv.querySelector("div.card-grid") || mainDiv;
            let btn = searchArea.querySelector(`div[data-mode="${modeId}"], div.mode-${modeId}, div.mode-button.mode-${modeId}`);
    
            if(!btn) {
                let allDivs = searchArea.querySelectorAll("div");
                for(let div of allDivs) {
                    if(div.getAttribute("data-mode") === modeId || div.className?.includes(modeId)) {
                        btn = div;
                        break;
                    }
                }
            }
    
            return btn;
        }
    
        let btn = findBtn();
        if(btn) {
            btn.addEventListener("click", () => {
                this._dispararHaptic('light');
                iteracion.count++;
                if(iteracion.count % 2 === 0) {
                    this.selectControlMode('seleccion');
                } else {
                    this.selectControlMode(modeId);
                    otrasIteraciones.forEach(iter => iter.count = 0);
                }
            });
            btn.style.cursor = "pointer";
        }
    }

    listenerPower(){
        let botonPower = this.shadowRoot.querySelector('.power-button');
        botonPower.addEventListener('click', () => this.togglePower());
    }

    listenerExit() {
        let botonExit = this.shadowRoot.querySelector('.exit-button');
        if (!botonExit) return;
        botonExit.addEventListener('click', () => {
            this._dispararHaptic('light');
            const type = this._config.exit_type || 'button';
            const value = this._config.exit_value || null;
    
            if (type === 'script' && value) {
                this.sendButtonAction(value);
                return;
            }
    
            const action = value || (this._config.modelConfig === 'samsung' ? 'KEY_EXIT' : 'EXIT');
            this.sendButtonAction(action);
        });
    }

    listenerStreaming() {
        this.streamingServices.forEach(service => {
            let botonStreaming = this.shadowRoot.querySelector(`.${service.id}-button`);
            if (botonStreaming) {
                botonStreaming.addEventListener('click', async () => {
                    this._dispararHaptic('light');
                    if (this.getTvStatus() === 'off') {
                        this.state.tvMessage = 'Encendiendo TV...';
                        this.render();
                        this.togglePower();
                        await this.delay(15000);
                        this.selectSource(service.service);
                        this.state.tvMessage = null;
                        this.render();
                        return;
                    }
                    if (this.state.isSelectingSource) return;
                    //console.log("quiero el estado del tv status " + this.getTvStatus());                
                    this.state.isSelectingSource = true;
                    const haIcon = botonStreaming.querySelector('ha-icon');
                    haIcon.setAttribute('icon', 'mdi:dots-circle');
                    haIcon.style.animation = 'spin 0.5s steps(5) infinite';
                
                    this.selectSourceWithRetry(service.service, haIcon, service.icon);
                });
            }
        });
    }
    powerWhenStreaming(){
        this.togglePower();
        setTimeout(() => {
            //console.log("Esto se ejecuta después de 15 segundos");
            this.selectSource(service.service);
          }, 15000); // 2000 ms = 2 segundos
    }

    listenerBottomButtons() {
        this.bottomButtons.forEach(button => {
            let botonGral = this.shadowRoot.querySelector(`.${button.id}-button`);
            if (botonGral) {
                botonGral.addEventListener('click', () => {
                    this._dispararHaptic('light');
                    const action = this._config.modelConfig === 'samsung' ? button.actionSamsung : button.actionLG;
                    this.sendButtonAction(action);
                });
            }
        });
    }
    listenerTouchpad() {
        ['up', 'left', 'right', 'down'].forEach(direction => {
            let botonTouchpad = this.shadowRoot.querySelector(`.touchpad-${direction}`);
            if (botonTouchpad) {
                botonTouchpad.addEventListener('click', () => {
                    this._dispararHaptic('light');
                    this.handleTouchpadButton(direction);
                });
            }
        });
        
        let botonCentral = this.shadowRoot.querySelector('.touchpad-center-button');
        if (botonCentral) {
            botonCentral.addEventListener('click', () => {
                this.handleCenterButton(); // Esta función ya existe
            });
        }
    }
    togglePower() {
        this._dispararHaptic('light');
        if (this._hass && this.state.tvEntityId) {
            this._hass.callService('media_player', 'toggle', {
                entity_id: this.state.tvEntityId
            });
        }
    }
    async sendPass() {
        if (this._config.modelConfig === 'samsung') return;
        this._dispararHaptic('light');
        if (this._hass && this.state.tvEntityId) {
            const buttons = ['1', '1', '0', '2'];
            for (const button of buttons) {
                this.sendButtonAction(button);
                await this.delay(500);
            }
        }
    }
    
    sendButtonAction(button) {
        if (!this._hass || !button) return;
    
        if (button.startsWith('script.')) {
            this._hass.callService('script', 'turn_on', {
                entity_id: button
            });
            return;
        }
        
        if (button.startsWith('source:')) {
            const source = button.replace('source:', '');
            this.selectSource(source);
            return;
        }
    
        if (this.state.tvEntityId) {
            if (this._config.modelConfig === 'samsung') {
                this._hass.callService('media_player', 'play_media', {
                    entity_id: this.state.tvEntityId,
                    media_content_type: 'send_key',
                    media_content_id: button
                });
            } else {
                this._hass.callService('webostv', 'button', {
                    entity_id: this.state.tvEntityId,
                    button: button
                });
            }
        }
    }
    
    handleTouchpadButton(direction) {
        const mode = this.state.controlMode;
    
        if (mode && mode.startsWith('custom')) {
            const num = mode.replace('custom', '');
            const action = this._config[`custom${num}_${direction}_value`];
            //console.log(`[custom mode] direction: ${direction}, action: ${action}`);
            if (action) {
                this.sendButtonAction(action);
            }
            return;
        }
    
        const buttons = this.touchpadButtons[mode] || this.touchpadButtons['default'];
        const button = buttons[direction];
        const action = this._config.modelConfig === 'samsung' ? button.actionSamsung : button.actionLG;
        //console.log(`[normal mode] direction: ${direction}, action: ${action}`);
    
        if (button && action) {
            this.sendButtonAction(action);
        }
    }
    
    handleCenterButton() {
        const action = this._config.modelConfig === 'samsung' ? 'KEY_ENTER' : 'ENTER';
        this.sendButtonAction(action);
    }
    
    
    set hass(hass) {
        const oldHass = this._hass;
        this._hass = hass;
        if (!oldHass) {
            if (this.state.isConnected) {
                this.render();
            }
            return;
        }
        
        let needsRender = false;
        
        // Obtener estado de la TV
        if (this.state.tvEntityId) {
            const newTvState = hass.states[this.state.tvEntityId];
            
            if (newTvState) {
                const newSource = newTvState.attributes?.source || null;
                const newStatus = newTvState.state;
        
                if (this.state.source !== newSource || this.state.tvStatus !== newStatus) {
                    this.state.tvState = newTvState;
                    this.state.source = newSource;
                    this.state.tvStatus = newStatus;
                    needsRender = true;
                }
            }
        }
        
        // Obtener modo de control
        if (this.state.controlModeId) {
            const oldModeState = oldHass.states[this.state.controlModeId];
            const newModeState = hass.states[this.state.controlModeId];
            
            if (newModeState && oldModeState?.state !== newModeState.state) {
                this.state.controlMode = newModeState.state;
                needsRender = true;
            }
        }
        
        // Solo renderizar si algo realmente cambió
        if (needsRender && this.state.isConnected) {
            this.render();
        }
    }
    
}

class TVControlCardEditor extends HTMLElement {
    
    setConfig(config) {
        this._config = config;
        this.render();
    }

    set hass(hass) {
        this._hass = hass;
        // Re-renderizar para tener las entidades disponibles
        if (this._config) {
            this.render();
        }
    }

    render() {
        if (!this._hass || !this._config) return;

        // Obtener todas las entidades media_player disponibles en HA
        const mediaPlayers = Object.keys(this._hass.states).filter(
            entityId => entityId.startsWith('media_player.')
        );

        const custom1InUse = ['1','2','3'].some(s => this._config[`mode_slot_${s}`] === 'custom1');
        const custom2InUse = ['1','2','3'].some(s => this._config[`mode_slot_${s}`] === 'custom2');
        const custom3InUse = ['1','2','3'].some(s => this._config[`mode_slot_${s}`] === 'custom3');

        this.innerHTML = `
            <div style="padding: 16px;">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">
                        Entidad de TV
                    </label>
                    <select id="entity-select" style="width: 100%; padding: 8px; border-radius: 4px;">
                        ${mediaPlayers.map(entity => `
                            <option value="${entity}" ${entity === this._config.entity ? 'selected' : ''}>
                                ${this._hass.states[entity].attributes.friendly_name || entity}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>

            <div style="padding: 16px;">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">
                        Modo default
                    </label>
                <select id="colormode-select" style="width: 100%; padding: 8px; border-radius: 4px;">
                    <option value="dark" ${this._config.colorMode === 'dark' ? 'selected' : ''}>Dark</option>
                    <option value="light" ${this._config.colorMode === 'light' ? 'selected' : ''}>Light</option>
                </select>
                </div>
            </div>
            
            <div style="padding: 16px;">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">
                        Tipo de TV
                    </label>
                    <select id="model-select" style="width: 100%; padding: 8px; border-radius: 4px;">
                    <option value="samsung" ${this._config.modelConfig === 'samsung' ? 'selected' : ''}>SAMSUNG</option>
                    <option value="LG TV" ${this._config.modelConfig === 'LG TV' ? 'selected' : ''}>LG</option>
                </select>
                </div>
            </div>

            <!-- Selector de slots -->
            <div style="padding: 16px;">
                <div style="margin-bottom: 8px; font-weight: bold;">Modos de la rueda</div>
                ${['1', '2', '3'].map(slot => `
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Slot ${slot}</label>
                        <select id="slot-${slot}" style="width: 100%; padding: 8px; border-radius: 4px;">
                            <option value="navegacion" ${this._config[`mode_slot_${slot}`] === 'navegacion' ? 'selected' : ''}>Navegación</option>
                            <option value="busqueda" ${this._config[`mode_slot_${slot}`] === 'busqueda' ? 'selected' : ''}>Búsqueda</option>
                            <option value="audio" ${this._config[`mode_slot_${slot}`] === 'audio' ? 'selected' : ''}>Audio</option>
                            <option value="fuentes" ${this._config[`mode_slot_${slot}`] === 'fuentes' ? 'selected' : ''}>Fuentes</option>
                            <option value="info" ${this._config[`mode_slot_${slot}`] === 'info' ? 'selected' : ''}>Información</option>
                            <option value="text" ${this._config[`mode_slot_${slot}`] === 'text' ? 'selected' : ''}>Texto</option>
                            <option value="custom1" ${this._config[`mode_slot_${slot}`] === 'custom1' ? 'selected' : ''}>Custom 1</option>
                            <option value="custom2" ${this._config[`mode_slot_${slot}`] === 'custom2' ? 'selected' : ''}>Custom 2</option>
                            <option value="custom3" ${this._config[`mode_slot_${slot}`] === 'custom3' ? 'selected' : ''}>Custom 3</option>
                        </select>
                    </div>
                `).join('')}
            </div> 
            <div style="padding: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="margin-bottom: 12px; font-weight: bold;">Custom 1</div>
                ${custom1InUse ? `
                    <div style="margin-bottom: 8px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Ícono del modo</label>
                        <input id="custom1-mode-icon" type="text" placeholder="mdi:help"
                            value="${this._config.custom1_mode_icon || ''}"
                            style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Nombre del modo</label>
                        <input id="custom1-label" type="text" placeholder="Mi modo"
                            value="${this._config.custom1_label || ''}"
                            style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    ${['up', 'left', 'right', 'down'].map(dir => `
                        <div style="margin-bottom: 12px; border-left: 3px solid rgba(255,255,255,0.2); padding-left: 10px;">
                            <div style="margin-bottom: 4px; font-size: 11px; text-transform: uppercase; opacity: 0.7;">${dir}</div>
                            <input id="custom1-${dir}-icon" type="text" placeholder="mdi:help"
                                value="${this._config[`custom1_${dir}_icon`] || ''}"
                                style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box; margin-bottom: 4px;">
                            <select id="custom1-${dir}-type" style="width: 100%; padding: 6px; border-radius: 4px; margin-bottom: 4px;">
                                <option value="button" ${this._config[`custom1_${dir}_type`] === 'button' ? 'selected' : ''}>Button</option>
                                <option value="command" ${this._config[`custom1_${dir}_type`] === 'command' ? 'selected' : ''}>Command</option>
                                <option value="script" ${this._config[`custom1_${dir}_type`] === 'script' ? 'selected' : ''}>Script</option>
                            </select>
                            <select id="custom1-${dir}-value-button" style="width: 100%; padding: 6px; border-radius: 4px; margin-bottom: 4px; ${this._config[`custom1_${dir}_type`] !== 'button' ? 'display:none;' : ''}">
                                <option value="">-- Seleccionar --</option>
                                ${PREDEFINED_COMMANDS.map(cmd => `
                                    <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                                        ${this._config[`custom1_${dir}_value`] === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                                        ${cmd.label}
                                    </option>
                                `).join('')}
                            </select>
                            <select id="custom1-${dir}-value-command" style="width: 100%; padding: 6px; border-radius: 4px; margin-bottom: 4px; ${this._config[`custom1_${dir}_type`] !== 'command' ? 'display:none;' : ''}">
                                <option value="">-- Seleccionar comando --</option>
                                ${PREDEFINED_COMMANDS.map(cmd => `
                                    <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                                        ${this._config[`custom1_${dir}_value`] === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                                        ${cmd.label}
                                    </option>
                                `).join('')}
                            </select>
                            <select id="custom1-${dir}-value-script" style="width: 100%; padding: 6px; border-radius: 4px; ${this._config[`custom1_${dir}_type`] !== 'script' ? 'display:none;' : ''}">
                                <option value="">-- Seleccionar script --</option>
                                ${Object.keys(this._hass.states)
                                    .filter(e => e.startsWith('script.'))
                                    .map(script => `
                                        <option value="${script}" ${this._config[`custom1_${dir}_value`] === script ? 'selected' : ''}>
                                            ${this._hass.states[script].attributes.friendly_name || script}
                                        </option>
                                    `).join('')}
                            </select>
                        </div>
                    `).join('')}
                ` : `
                    <div style="font-size: 12px; opacity: 0.5; font-style: italic;">
                        Asigna Custom 1 a un slot para configurarlo.
                    </div>
                `}
            </div>


            <div style="padding: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="margin-bottom: 12px; font-weight: bold;">Custom 2</div>
                ${custom2InUse ? `
                    <div style="margin-bottom: 8px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Ícono del modo</label>
                        <input id="custom2-mode-icon" type="text" placeholder="mdi:help"
                            value="${this._config.custom2_mode_icon || ''}"
                            style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Nombre del modo</label>
                        <input id="custom2-label" type="text" placeholder="Mi modo"
                            value="${this._config.custom2_label || ''}"
                            style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    ${['up', 'left', 'right', 'down'].map(dir => `
                        <div style="margin-bottom: 12px; border-left: 3px solid rgba(255,255,255,0.2); padding-left: 10px;">
                            <div style="margin-bottom: 4px; font-size: 11px; text-transform: uppercase; opacity: 0.7;">${dir}</div>
                            <input id="custom2-${dir}-icon" type="text" placeholder="mdi:help"
                                value="${this._config[`custom2_${dir}_icon`] || ''}"
                                style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box; margin-bottom: 4px;">
                            <select id="custom2-${dir}-type" style="width: 100%; padding: 6px; border-radius: 4px; margin-bottom: 4px;">
                                <option value="button" ${this._config[`custom2_${dir}_type`] === 'button' ? 'selected' : ''}>Button</option>
                                <option value="command" ${this._config[`custom2_${dir}_type`] === 'command' ? 'selected' : ''}>Command</option>
                                <option value="script" ${this._config[`custom2_${dir}_type`] === 'script' ? 'selected' : ''}>Script</option>
                            </select>
                            <select id="custom2-${dir}-value-button" style="width: 100%; padding: 6px; border-radius: 4px; margin-bottom: 4px; ${this._config[`custom2_${dir}_type`] !== 'button' ? 'display:none;' : ''}">
                                <option value="">-- Seleccionar --</option>
                                ${PREDEFINED_COMMANDS.map(cmd => `
                                    <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                                        ${this._config[`custom2_${dir}_value`] === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                                        ${cmd.label}
                                    </option>
                                `).join('')}
                            </select>
                            <select id="custom2-${dir}-value-command" style="width: 100%; padding: 6px; border-radius: 4px; margin-bottom: 4px; ${this._config[`custom2_${dir}_type`] !== 'command' ? 'display:none;' : ''}">
                                <option value="">-- Seleccionar comando --</option>
                                ${PREDEFINED_COMMANDS.map(cmd => `
                                    <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                                        ${this._config[`custom2_${dir}_value`] === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                                        ${cmd.label}
                                    </option>
                                `).join('')}
                            </select>
                            <select id="custom2-${dir}-value-script" style="width: 100%; padding: 6px; border-radius: 4px; ${this._config[`custom2_${dir}_type`] !== 'script' ? 'display:none;' : ''}">
                                <option value="">-- Seleccionar script --</option>
                                ${Object.keys(this._hass.states)
                                    .filter(e => e.startsWith('script.'))
                                    .map(script => `
                                        <option value="${script}" ${this._config[`custom2_${dir}_value`] === script ? 'selected' : ''}>
                                            ${this._hass.states[script].attributes.friendly_name || script}
                                        </option>
                                    `).join('')}
                            </select>
                        </div>
                    `).join('')}
                ` : `
                    <div style="font-size: 12px; opacity: 0.5; font-style: italic;">
                        Asigna Custom 2 a un slot para configurarlo.
                    </div>
                `}
            </div>
            

            <div style="padding: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="margin-bottom: 12px; font-weight: bold;">Custom 3</div>
                ${custom3InUse ? `
                    <div style="margin-bottom: 8px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Ícono del modo</label>
                        <input id="custom3-mode-icon" type="text" placeholder="mdi:help"
                            value="${this._config.custom3_mode_icon || ''}"
                            style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Nombre del modo</label>
                        <input id="custom3-label" type="text" placeholder="Mi modo"
                            value="${this._config.custom3_label || ''}"
                            style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    ${['up', 'left', 'right', 'down'].map(dir => `
                        <div style="margin-bottom: 12px; border-left: 3px solid rgba(255,255,255,0.2); padding-left: 10px;">
                            <div style="margin-bottom: 4px; font-size: 11px; text-transform: uppercase; opacity: 0.7;">${dir}</div>
                            <input id="custom3-${dir}-icon" type="text" placeholder="mdi:help"
                                value="${this._config[`custom3_${dir}_icon`] || ''}"
                                style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box; margin-bottom: 4px;">
                            <select id="custom3-${dir}-type" style="width: 100%; padding: 6px; border-radius: 4px; margin-bottom: 4px;">
                                <option value="button" ${this._config[`custom3_${dir}_type`] === 'button' ? 'selected' : ''}>Button</option>
                                <option value="command" ${this._config[`custom3_${dir}_type`] === 'command' ? 'selected' : ''}>Command</option>
                                <option value="script" ${this._config[`custom3_${dir}_type`] === 'script' ? 'selected' : ''}>Script</option>
                            </select>
                            <select id="custom3-${dir}-value-button" style="width: 100%; padding: 6px; border-radius: 4px; margin-bottom: 4px; ${this._config[`custom3_${dir}_type`] !== 'button' ? 'display:none;' : ''}">
                                <option value="">-- Seleccionar --</option>
                                ${PREDEFINED_COMMANDS.map(cmd => `
                                    <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                                        ${this._config[`custom3_${dir}_value`] === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                                        ${cmd.label}
                                    </option>
                                `).join('')}
                            </select>
                            <select id="custom3-${dir}-value-command" style="width: 100%; padding: 6px; border-radius: 4px; margin-bottom: 4px; ${this._config[`custom3_${dir}_type`] !== 'command' ? 'display:none;' : ''}">
                                <option value="">-- Seleccionar comando --</option>
                                ${PREDEFINED_COMMANDS.map(cmd => `
                                    <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                                        ${this._config[`custom3_${dir}_value`] === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                                        ${cmd.label}
                                    </option>
                                `).join('')}
                            </select>
                            <select id="custom3-${dir}-value-script" style="width: 100%; padding: 6px; border-radius: 4px; ${this._config[`custom3_${dir}_type`] !== 'script' ? 'display:none;' : ''}">
                                <option value="">-- Seleccionar script --</option>
                                ${Object.keys(this._hass.states)
                                    .filter(e => e.startsWith('script.'))
                                    .map(script => `
                                        <option value="${script}" ${this._config[`custom3_${dir}_value`] === script ? 'selected' : ''}>
                                            ${this._hass.states[script].attributes.friendly_name || script}
                                        </option>
                                    `).join('')}
                            </select>
                        </div>
                    `).join('')}
                ` : `
                    <div style="font-size: 12px; opacity: 0.5; font-style: italic;">
                        Asigna Custom 3 a un slot para configurarlo.
                    </div>
                `}
            </div>

            <div style="padding: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="margin-bottom: 12px; font-weight: bold;">Botón Exit</div>

                <div style="margin-bottom: 8px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 12px;">Ícono</label>
                    <input id="exit-icon" type="text" placeholder="mdi:exit-to-app"
                        value="${this._config.exit_icon || ''}"
                        style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box;">
                </div>            

                <select id="exit-type" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <option value="button" ${this._config.exit_type === 'button' ? 'selected' : ''}>Button</option>
                    <option value="command" ${this._config.exit_type === 'command' ? 'selected' : ''}>Command</option>
                    <option value="script" ${this._config.exit_type === 'script' ? 'selected' : ''}>Script</option>
                </select>

                <select id="exit-value-button" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px; ${this._config.exit_type !== 'button' && this._config.exit_type ? 'display:none;' : ''}">
                    <option value="">-- Default (EXIT) --</option>
                    ${PREDEFINED_COMMANDS.map(cmd => `
                        <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                            ${this._config.exit_value === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                            ${cmd.label}
                        </option>
                    `).join('')}
                </select>

                <select id="exit-value-command" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px; ${this._config.exit_type !== 'command' ? 'display:none;' : ''}">
                    <option value="">-- Default (EXIT) --</option>
                    ${PREDEFINED_COMMANDS.map(cmd => `
                        <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                            ${this._config.exit_value === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                            ${cmd.label}
                        </option>
                    `).join('')}
                </select>

                <select id="exit-value-script" style="width: 100%; padding: 8px; border-radius: 4px; ${this._config.exit_type !== 'script' ? 'display:none;' : ''}">
                    <option value="">-- Seleccionar script --</option>
                    ${Object.keys(this._hass.states)
                        .filter(e => e.startsWith('script.'))
                        .map(script => `
                            <option value="${script}" ${this._config.exit_value === script ? 'selected' : ''}>
                                ${this._hass.states[script].attributes.friendly_name || script}
                            </option>
                        `).join('')}
                </select>
            </div>                        
        `;

        // Escuchar cambios en el select
        this.querySelector('#entity-select').addEventListener('change', (e) => {
            // Disparar evento para que HA guarde el nuevo config
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: {
                    config: {
                        ...this._config,
                        entity: e.target.value
                    }
                }
            }));
        });

        this.querySelector('#colormode-select').addEventListener('change', (e) => {
            // Disparar evento para que HA guarde el nuevo config
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, colorMode: e.target.value }}
            }));
        });

        this.querySelector('#model-select').addEventListener('change', (e) => {
            // Disparar evento para que HA guarde el nuevo config
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, modelConfig: e.target.value }}
            }));
        });
        // Slots
        ['1', '2', '3'].forEach(slot => {
            this.querySelector(`#slot-${slot}`).addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...this._config, [`mode_slot_${slot}`]: e.target.value }}
                }));
            });
        });
        if (custom1InUse) {
            this.querySelector('#custom1-mode-icon').addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...this._config, custom1_mode_icon: e.target.value }}
                }));
            });
            
            this.querySelector('#custom1-label').addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...this._config, custom1_label: e.target.value }}
                }));
            });
            
            ['up', 'left', 'right', 'down'].forEach(dir => {
                this.querySelector(`#custom1-${dir}-icon`).addEventListener('change', (e) => {
                    this.dispatchEvent(new CustomEvent('config-changed', {
                        detail: { config: { ...this._config, [`custom1_${dir}_icon`]: e.target.value }}
                    }));
                });
            
                this.querySelector(`#custom1-${dir}-type`).addEventListener('change', (e) => {
                    const type = e.target.value;
                    this.querySelector(`#custom1-${dir}-value-button`).style.display = type === 'button' ? 'block' : 'none';
                    this.querySelector(`#custom1-${dir}-value-command`).style.display = type === 'command' ? 'block' : 'none';
                    this.querySelector(`#custom1-${dir}-value-script`).style.display = type === 'script' ? 'block' : 'none';
                    this.dispatchEvent(new CustomEvent('config-changed', {
                        detail: { config: { ...this._config, [`custom1_${dir}_type`]: type }}
                    }));
                });
            
                ['button', 'command', 'script'].forEach(valueType => {
                    this.querySelector(`#custom1-${dir}-value-${valueType}`).addEventListener('change', (e) => {
                        this.dispatchEvent(new CustomEvent('config-changed', {
                            detail: { config: { ...this._config, [`custom1_${dir}_value`]: e.target.value }}
                        }));
                    });
                });
            });
        }
        /////////////////
        if (custom2InUse) {
            this.querySelector('#custom2-mode-icon').addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...this._config, custom2_mode_icon: e.target.value }}
                }));
            });
            
            this.querySelector('#custom2-label').addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...this._config, custom2_label: e.target.value }}
                }));
            });

            ['up', 'left', 'right', 'down'].forEach(dir => {
                this.querySelector(`#custom2-${dir}-icon`).addEventListener('change', (e) => {
                    this.dispatchEvent(new CustomEvent('config-changed', {
                        detail: { config: { ...this._config, [`custom2_${dir}_icon`]: e.target.value }}
                    }));
                });
            
                this.querySelector(`#custom2-${dir}-type`).addEventListener('change', (e) => {
                    const type = e.target.value;
                    this.querySelector(`#custom2-${dir}-value-button`).style.display = type === 'button' ? 'block' : 'none';
                    this.querySelector(`#custom2-${dir}-value-command`).style.display = type === 'command' ? 'block' : 'none';
                    this.querySelector(`#custom2-${dir}-value-script`).style.display = type === 'script' ? 'block' : 'none';
                    this.dispatchEvent(new CustomEvent('config-changed', {
                        detail: { config: { ...this._config, [`custom2_${dir}_type`]: type }}
                    }));
                });
            
                ['button', 'command', 'script'].forEach(valueType => {
                    this.querySelector(`#custom2-${dir}-value-${valueType}`).addEventListener('change', (e) => {
                        this.dispatchEvent(new CustomEvent('config-changed', {
                            detail: { config: { ...this._config, [`custom2_${dir}_value`]: e.target.value }}
                        }));
                    });
                });
            });
        }
////////////////
        if (custom3InUse) {
            this.querySelector('#custom3-mode-icon').addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...this._config, custom3_mode_icon: e.target.value }}
                }));
            });
            
            this.querySelector('#custom3-label').addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...this._config, custom3_label: e.target.value }}
                }));
            });

            ['up', 'left', 'right', 'down'].forEach(dir => {
                this.querySelector(`#custom3-${dir}-icon`).addEventListener('change', (e) => {
                    this.dispatchEvent(new CustomEvent('config-changed', {
                        detail: { config: { ...this._config, [`custom3_${dir}_icon`]: e.target.value }}
                    }));
                });
            
                this.querySelector(`#custom3-${dir}-type`).addEventListener('change', (e) => {
                    const type = e.target.value;
                    this.querySelector(`#custom3-${dir}-value-button`).style.display = type === 'button' ? 'block' : 'none';
                    this.querySelector(`#custom3-${dir}-value-command`).style.display = type === 'command' ? 'block' : 'none';
                    this.querySelector(`#custom3-${dir}-value-script`).style.display = type === 'script' ? 'block' : 'none';
                    this.dispatchEvent(new CustomEvent('config-changed', {
                        detail: { config: { ...this._config, [`custom3_${dir}_type`]: type }}
                    }));
                });
            
                ['button', 'command', 'script'].forEach(valueType => {
                    this.querySelector(`#custom3-${dir}-value-${valueType}`).addEventListener('change', (e) => {
                        this.dispatchEvent(new CustomEvent('config-changed', {
                            detail: { config: { ...this._config, [`custom3_${dir}_value`]: e.target.value }}
                        }));
                    });
                });
            });
        }
        ///// EDITOR UI DE BOTON EXIT
        this.querySelector('#exit-icon').addEventListener('change', (e) => {
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, exit_icon: e.target.value }}
            }));
        });
        
        this.querySelector('#exit-type').addEventListener('change', (e) => {
            const type = e.target.value;
            this.querySelector('#exit-value-button').style.display = type === 'button' ? 'block' : 'none';
            this.querySelector('#exit-value-command').style.display = type === 'command' ? 'block' : 'none';
            this.querySelector('#exit-value-script').style.display = type === 'script' ? 'block' : 'none';
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, exit_type: type, exit_value: '' }}
            }));
        });
        
        ['button', 'command', 'script'].forEach(valueType => {
            this.querySelector(`#exit-value-${valueType}`).addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...this._config, exit_value: e.target.value }}
                }));
            });
        });        

    }
}

customElements.define('tv-control-card', TVControlCard);
customElements.define('tv-control-card-editor', TVControlCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'tv-control-card',
    name: 'TV Control Card',
    description: 'Tarjeta de control personalizada para TVs LG y Samsung con funciones personalizables',
    preview: false,
    documentationURL: 'https://github.com/extraiotpruebas/minimalist-tv-control-card'
});


