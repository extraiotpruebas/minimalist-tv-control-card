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
            activeTvIndex: 0,
            activeTvName: null,            
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
            { id: 'appletv', name: 'AppleTV', icon: 'phu:apple-tv', service: 'Netflix' },
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
    
    _saveActiveTv(index) {
        if (!this._cardId || !this._hass) return;
        const userId = this._hass.user?.id || 'default';
        const key = `tv-card__${this._cardId}__${userId}`;
        localStorage.setItem(key, index);
        console.log(`[tv-card] guardado index ${index} para key: ${key}`);
    }
    
    _loadActiveTv() {
        if (!this._cardId || !this._hass) return null;
        const userId = this._hass.user?.id || 'default';
        const key = `tv-card__${this._cardId}__${userId}`;
        const saved = localStorage.getItem(key);
        const index = saved !== null ? parseInt(saved) : null;
        console.log(`[tv-card] cargado index ${index} para key: ${key}`);
        return index;
    }
    
    _switchTv(index) {
        if (!this._tvList || index < 0 || index >= this._tvList.length) return;
        if (index === this.state.activeTvIndex) return;
    
        const tv = this._tvList[index];
        this.state.activeTvIndex = index;
        this.state.activeTvName  = tv.name;
        this.state.tvEntityId    = tv.entity;
        this.state.modelConfig   = tv.type;
        this.state.tvState       = null;
    
        // --- NUEVO: leer estado real de la nueva entidad inmediatamente ---
        if (this._hass && this._hass.states[tv.entity]) {
            const newTvState = this._hass.states[tv.entity];
            this.state.source   = newTvState.attributes?.source || null;
            this.state.tvStatus = newTvState.state;
        } else {
            this.state.source   = null;
            this.state.tvStatus = null;
        }
        // --- FIN NUEVO ---
    
        this._saveActiveTv(index);
        this._dispararHaptic('medium');
    
        console.log(`[tv-card] TV cambiada a: ${tv.name} | ${tv.entity} | ${tv.type}`);
    
        this.render();
    }  

    setConfig(config) {
        // Validación original
        if (!config.entity && (!config.tvs || config.tvs.length === 0)) {
            throw new Error('Por favor define una entidad (entity) o una lista de TVs (tvs)');
        }
    
        // Validación nueva: si hay tvs[], card_id es obligatorio
        if (config.tvs && config.tvs.length > 0 && !config.card_id) {
            throw new Error('Por favor define un card_id cuando usas una lista de TVs (tvs)');
        }
    
        this._config = config;
    
        // --- NUEVO: leer y validar tvs[] ---
        if (config.tvs && config.tvs.length > 0) {
            this._tvList = config.tvs.map((tv, index) => {
                if (!tv.entity) throw new Error(`TV en posición ${index} no tiene entidad definida`);
                if (!tv.name)   throw new Error(`TV en posición ${index} no tiene nombre definido`);
                return {
                    name:   tv.name,
                    entity: tv.entity,
                    type:   tv.type || 'LG TV'   // fallback al default existente
                };
            });
            this._cardId = config.card_id;
            const firstTv = this._tvList[0];
            this.state.activeTvIndex  = 0;
            this.state.activeTvName   = firstTv.name;
            this.state.tvEntityId     = firstTv.entity;
            this.state.modelConfig    = firstTv.type;            
            console.log(`[tv-card] card_id: ${this._cardId}, TVs cargadas:`, this._tvList);
            console.log(`[tv-card] estado activo: ${this.state.tvEntityId} | ${this.state.activeTvName} | ${this.state.modelConfig}`);
        } else {
            // Modo legacy: config.entity directa, sin lista
            this._tvList = null;
            this._cardId = null;
            this.state.tvEntityId   = config.entity;
            this.state.modelConfig  = config.modelConfig;
            this.state.activeTvName = config.entity; // fallback al entity id            
            console.log('[tv-card] modo legacy: entidad única', config.entity);
        }
        // --- FIN NUEVO ---
    
        this.displayOrder = [
            config.mode_slot_1 || 'navegacion',
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
        this.state.tvEntityId  = config.entity;
        this.state.modelConfig = config.modelConfig;
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
            card_id: 'mi_tv',
            colorMode: 'dark',
            mode_slot_1: 'navegacion',
            mode_slot_2: 'busqueda',
            mode_slot_3: 'audio',
            tvs: [
                {
                    name: 'Mi TV',
                    entity: 'media_player.tv',
                    type: 'LG TV'
                }
            ]
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
                        "botones botones botones"
                        "tv-selector tv-selector tv-selector";  /* NUEVA FILA */
                    grid-template-columns: 1fr 1fr 1fr;
                    grid-template-rows: auto auto 15px 20px auto 20px auto 30px auto 28px;
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
                .tv-selector-trigger {
                    grid-area: tv-selector;
                    justify-self: center;
                    align-self: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;              /* ocupa todo el ancho de la celda */
                    cursor: pointer;
                    color: rgba(255, 255, 255, 0.4);
                    transition: all 0.3s ease;
                    padding: 4px;
                }

                .tv-selector-trigger:hover {
                    color: rgba(255, 255, 255, 0.8);
                }

                .tv-selector-trigger ha-icon {
                    --mdc-icon-size: 20px;
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
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                    padding: 4px 12px;
                    border-radius: 20px;
                    transition: all 0.4s ease;
                    max-width: 140px;
                    min-width: 0;
                    overflow: hidden;
                }

                .tv-name {
                    font-size: 11px;      /* era 9px */
                    font-weight: 700;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                    text-align: center;
                    opacity: 0.7;
                }

                .tv-state {
                    font-size: 10px;      /* era 11px, lo bajamos un poco para dar protagonismo al nombre */
                    font-weight: 600;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                    text-align: center;
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
                    -webkit-tap-highlight-color: transparent;
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
                .tv-selector-popup {
                    position: absolute;
                    bottom: 70px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(20, 20, 30, 0.97);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 16px;
                    padding: 8px;
                    min-width: 200px;
                    max-width: 280px;
                    z-index: 200;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(12px);
                }

                .tv-selector-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .tv-selector-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    cursor: pointer;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .tv-selector-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: rgba(255, 255, 255, 1);
                }

                .tv-selector-item.active {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 1);
                }

                .tv-selector-item ha-icon {
                    --mdc-icon-size: 18px;
                    flex-shrink: 0;
                }

                .tv-check-icon {
                    margin-left: auto;
                    opacity: 0.7;
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
                                ${this._tvList ? `
                                    <span class="tv-name">${this.state.activeTvName}</span>
                                ` : ''}
                                <span class="tv-state">
                                    ${this.getTvStatus() === 'on' ? `ON${this.state.source ? ` - ${this.state.source}` : ''}` : 'OFF'}
                                </span>
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
                            ${this.renderSVGOverlay()}
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

                        <!-- NUEVO: botón selector de TV -->
                        ${this._tvList ? `
                            <div class="tv-selector-trigger">
                                <ha-icon icon="mdi:chevron-down"></ha-icon>
                            </div>
                        ` : ''}

                    </div> <!-- cierre card-grid -->
                    <!-- NUEVO: popup selector de TV -->
                    ${this._tvList ? `
                        <div class="tv-selector-popup" style="display:none;">
                            <div class="tv-selector-list">
                                ${this._tvList.map((tv, index) => `
                                    <div class="tv-selector-item ${index === this.state.activeTvIndex ? 'active' : ''}" 
                                        data-index="${index}">
                                        <ha-icon icon="${tv.type === 'samsung' ? 'mdi:television' : 'mdi:television-play'}"></ha-icon>
                                        <span>${tv.name}</span>
                                        ${index === this.state.activeTvIndex ? '<ha-icon icon="mdi:check" class="tv-check-icon"></ha-icon>' : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}                                            
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
        this.listenerTvSelector();
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
    renderSVGOverlay() {
        // Centro y radio del círculo
        const cx = 115, cy = 115, r = 115, rInner = 45;
    
        // Función para calcular un path de sector
        // Cada sector va de un ángulo a otro, con "dona" interior para respetar el botón central
        const sector = (startDeg, endDeg) => {
            const toRad = deg => (deg * Math.PI) / 180;
            const x1 = cx + r * Math.cos(toRad(startDeg));
            const y1 = cy + r * Math.sin(toRad(startDeg));
            const x2 = cx + r * Math.cos(toRad(endDeg));
            const y2 = cy + r * Math.sin(toRad(endDeg));
            const ix1 = cx + rInner * Math.cos(toRad(startDeg));
            const iy1 = cy + rInner * Math.sin(toRad(startDeg));
            const ix2 = cx + rInner * Math.cos(toRad(endDeg));
            const iy2 = cy + rInner * Math.sin(toRad(endDeg));
    
            return `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} L ${ix2} ${iy2} A ${rInner} ${rInner} 0 0 0 ${ix1} ${iy1} Z`;
        };
    
        // UP: -135° a -45° | RIGHT: -45° a 45° | DOWN: 45° a 135° | LEFT: 135° a 225°
        const sectors = [
            { direction: 'up',    path: sector(-135, -45)  },
            { direction: 'right', path: sector(-45,   45)  },
            { direction: 'down',  path: sector( 45,  135)  },
            { direction: 'left',  path: sector(135,  225)  },
        ];
    
        return `
            <svg class="touchpad-svg-overlay"
                viewBox="0 0 230 230"
                xmlns="http://www.w3.org/2000/svg"
                style="position:absolute;top:0;left:0;width:100%;height:100%;border-radius:50%;z-index:10;-webkit-tap-highlight-color:transparent;">
                ${sectors.map(s => `
                    <path
                        data-direction="${s.direction}"
                        d="${s.path}"
                        fill="transparent"
                        stroke="none"
                        style="cursor:pointer;-webkit-tap-highlight-color:transparent;">
                    </path>
                `).join('')}
            </svg>
        `;
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
        if (source === 'Netflix') return 'rgba(22, 22, 22, 0.6)';
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

    _nuevoMetodo(element, holdDuration = 500, onHoldCallback){
        this.element = element;
        this.holdDuration = holdDuration;
        this.onHold = onHoldCallback;
        this.timeoutId = null;

        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);

        this._addEvents();
    }    

    _onTouchStart(event) {
        event.preventDefault();
        this.timeoutId = setTimeout(() => {
            this.onHold(event);
            this.timeoutId = null;
        }, this.holdDuration);    
    }

    _onTouchMove() {
        if(this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }    
    } 

    _onTouchEnd() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }   
    
    _addEvents() {
        this.element.addEventListener("touchstart", this._onTouchStart);
        this.element.addEventListener("touchmove", this._onTouchMove);
        this.element.addEventListener("touchend", this._onTouchEnd);
    }
    
    destroy() {
        this.element.removeEventListener("touchstart", this._onTouchStart);
        this.element.removeEventListener("touchmove", this._onTouchMove);
        this.element.removeEventListener("touchend", this._onTouchEnd);
        if (this.timeoutId) clearTimeout(this.timeoutId);
    }     
    
    selectControlMode(mode) {
        this.state.controlMode = mode;
        this.render();
    }
        // Función para disparar feedback háptico
    _dispararHaptic(tipo = 'medium') {
        const event = new CustomEvent('haptic', {
            detail: tipo,
            bubbles: true,
            composed: true,
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
                this._dispararHaptic('medium');
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
        let botonExit = this.shadowRoot.querySelector('.bottom-section .exit-button');
        if (!botonExit) return;
        botonExit.addEventListener('click', () => {
            this._dispararHaptic('medium');
            const configValue = this._config.exit_value || null;
            const action = configValue
                ? configValue
                : (this.state.modelConfig === 'samsung' ? 'KEY_EXIT' : 'EXIT');
            console.log('[tv-card] exit command:', action);
            this.sendButtonAction(action);
        });
    }

    listenerStreaming() {
        this.streamingServices.forEach(service => {
            let botonStreaming = this.shadowRoot.querySelector(`.${service.id}-button`);
            if (botonStreaming) {
                botonStreaming.addEventListener('click', async () => {
                    this._dispararHaptic('medium');

                    // Obtener acción configurada (si existe) o caer al comportamiento original
                    const configValue = this._config[`${service.id}_value`] || null;

                    if (this.getTvStatus() === 'off') {
                        this.state.tvMessage = 'Encendiendo TV...';
                        this.render();
                        this.togglePower();
                        await this.delay(15000);
                        if (configValue) {
                            this.sendButtonAction(configValue);
                        } else {
                            this.selectSource(service.service);
                        }
                        this.state.tvMessage = null;
                        this.render();
                        return;
                    }
                    if (this.state.isSelectingSource) return;
                    console.log("quiero el estado del tv status " + this.getTvStatus());
                    this.state.isSelectingSource = true;
                    const haIcon = botonStreaming.querySelector('ha-icon');
                    haIcon.setAttribute('icon', 'mdi:dots-circle');
                    haIcon.style.animation = 'spin 0.5s steps(5) infinite';

                    if (configValue) {
                        this.sendButtonAction(configValue);
                        haIcon.setAttribute('icon', service.icon);
                        haIcon.style.animation = '';
                        this.state.isSelectingSource = false;
                    } else {
                        this.selectSourceWithRetry(service.service, haIcon, service.icon);
                    }
                });
            }
        });
    }
    powerWhenStreaming(){
        this.togglePower();
        setTimeout(() => {
            console.log("Esto se ejecuta después de 15 segundos");
            this.selectSource(service.service);
          }, 15000); // 2000 ms = 2 segundos
    }

    listenerBottomButtons() {
        this.bottomButtons.forEach(button => {
            if (button.id === 'exit') return;
            let botonGral = this.shadowRoot.querySelector(`.${button.id}-button`);
            if (botonGral) {
                botonGral.addEventListener('click', () => {
                    this._dispararHaptic('medium');
                    const configValue = this._config[`${button.id}_value`] || null;
                    const action = configValue
                        ? configValue
                        : (this.state.modelConfig === 'samsung' ? button.actionSamsung : button.actionLG);                    
                    this.sendButtonAction(action);
                });
            }
        });
    }
    
    listenerTouchpad() {
        const HOLD_ACTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'KEY_UP', 'KEY_DOWN', 'KEY_LEFT', 'KEY_RIGHT'];
    
        ['up', 'left', 'right', 'down'].forEach(direction => {
            const sector = this.shadowRoot.querySelector(
                `.touchpad-svg-overlay [data-direction="${direction}"]`
            );
            if (sector) {
                let holdTimeout = null;
                let holdInterval = null;
                let isHold = false;
    
                const getAction = () => {
                    const mode = this.state.controlMode;
                    if (mode && mode.startsWith('custom')) {
                        const num = mode.replace('custom', '');
                        return this._config[`custom${num}_${direction}_value`] || null;
                    }
                    const buttons = this.touchpadButtons[mode] || this.touchpadButtons['default'];
                    const button = buttons[direction];
                    return this._config.modelConfig === 'samsung' ? button.actionSamsung : button.actionLG;
                };
    
                const startHold = () => {
                    sector.setAttribute('fill', 'rgba(255, 255, 255, 0.15)');
                    isHold = false;
    
                    holdTimeout = setTimeout(() => {
                        const action = getAction();
                        if (!action || !HOLD_ACTIONS.includes(action)) return;
                        isHold = true;
                        console.log(`[touchpad] hold start - direction: ${direction}, action: ${action}`);
                        holdInterval = setInterval(() => {
                            this.handleTouchpadButton(direction);
                        }, 10);
                    }, 500);
                };
    
                const stopHold = () => {
                    sector.setAttribute('fill', 'transparent');
                    clearTimeout(holdTimeout);
                    clearInterval(holdInterval);
                    holdTimeout = null;
                    holdInterval = null;
                };
    
                sector.addEventListener('pointerdown', startHold);
                sector.addEventListener('pointerup', stopHold);
                sector.addEventListener('pointerleave', stopHold);
    
                sector.addEventListener('click', () => {
                    if (isHold) {
                        console.log(`[touchpad] click ignorado - fue hold - direction: ${direction}`);
                        isHold = false;
                        return;
                    }
                    console.log(`[touchpad] click simple - direction: ${direction}, action: ${getAction()}`);
                    this._dispararHaptic('medium');
                    this.handleTouchpadButton(direction);
                });
            }
        });
    
        let botonCentral = this.shadowRoot.querySelector('.touchpad-center-button');
        if (botonCentral) {
            botonCentral.addEventListener('click', () => {
                this._dispararHaptic('medium');
                this.handleCenterButton();
            });
        }
    }

    listenerTvSelector() {
        const trigger = this.shadowRoot.querySelector('.tv-selector-trigger');
        const popup = this.shadowRoot.querySelector('.tv-selector-popup');
        if (!trigger || !popup) return;
    
        // Abrir/cerrar al click en la flecha
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = popup.style.display === 'block';
            popup.style.display = isOpen ? 'none' : 'block';
            trigger.style.color = isOpen ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)';
        });
    
        // Cerrar al click fuera del popup
        document.addEventListener('click', (e) => {
            if (!this.shadowRoot.contains(e.target)) {
                popup.style.display = 'none';
                trigger.style.color = 'rgba(255,255,255,0.4)';
            }
        }, { once: true });
    
        // Click en un item de la lista
        popup.querySelectorAll('.tv-selector-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(item.dataset.index);
                this._switchTv(index);
                popup.style.display = 'none';
                trigger.style.color = 'rgba(255,255,255,0.4)';
            });
        });
    }    

    togglePower() {
        this._dispararHaptic('medium');
        if (this._hass && this.state.tvEntityId) {
            this._hass.callService('media_player', 'toggle', {
                entity_id: this.state.tvEntityId
            });
        }
    }
    async sendPass() {
        if (this._config.modelConfig === 'samsung') return;
        this._dispararHaptic('medium');
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
            if (this.state.modelConfig === 'samsung') {
                console.log(`[tv-card] samsung command: ${button} → ${this.state.tvEntityId}`);
                this._hass.callService('media_player', 'play_media', {
                    entity_id: this.state.tvEntityId,
                    media_content_type: 'send_key',
                    media_content_id: button
                });
            } else {
                console.log(`[tv-card] LG command: ${button} → ${this.state.tvEntityId}`);
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
            console.log(`[custom mode] direction: ${direction}, action: ${action}`);
            if (action) {
                this.sendButtonAction(action);
            }
            return;
        }
    
        const buttons = this.touchpadButtons[mode] || this.touchpadButtons['default'];
        const button = buttons[direction];
        const action = this.state.modelConfig === 'samsung' ? button.actionSamsung : button.actionLG;
        console.log(`[normal mode] direction: ${direction}, action: ${action}`);
    
        if (button && action) {
            this.sendButtonAction(action);
        }
    }
    
    handleCenterButton() {
        this._dispararHaptic('medium');
        const configValue = this._config.center_value || null;
        const action = configValue
            ? configValue
            : (this.state.modelConfig === 'samsung' ? 'KEY_ENTER' : 'ENTER');
        this.sendButtonAction(action);
    }
    
    
    set hass(hass) {
        const oldHass = this._hass;
        this._hass = hass;
        if (!oldHass) {
            // --- NUEVO: primera vez que llega hass, restaurar TV guardada ---
            if (this._tvList) {
                const savedIndex = this._loadActiveTv();
                if (savedIndex !== null && savedIndex < this._tvList.length) {
                    const tv = this._tvList[savedIndex];
                    this.state.activeTvIndex = savedIndex;
                    this.state.activeTvName  = tv.name;
                    this.state.tvEntityId    = tv.entity;
                    this.state.modelConfig   = tv.type;
                    console.log(`[tv-card] TV restaurada: ${tv.name}`);
                }
            }
            // --- FIN NUEVO ---
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
        if (!this._hass) {
            this._hass = hass;
            if (this._config) {
                this.render();
            }
            return;
        }
        this._hass = hass;
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
                        Card ID
                    </label>
                    <input id="card-id-input" type="text" 
                        placeholder="ej: tv_sala"
                        value="${this._config.card_id || ''}"
                        style="width: 100%; padding: 8px; border-radius: 4px; box-sizing: border-box;">
                    <div style="font-size: 11px; opacity: 0.5; margin-top: 4px;">
                        Identificador único para esta tarjeta. Necesario para usar la lista de TVs.
                    </div>
                </div>
            </div>

            <div style="padding: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="margin-bottom: 12px; font-weight: bold;">Lista de TVs</div>
                
                ${(this._config.tvs && this._config.tvs.length > 0) ? `
                    ${this._config.tvs.map((tv, index) => `
                        <div class="tv-item" style="
                            display: grid;
                            grid-template-columns: 1fr 1fr auto auto;
                            gap: 6px;
                            align-items: center;
                            margin-bottom: 8px;
                            padding: 8px;
                            border-radius: 8px;
                            background: rgba(255,255,255,0.05);
                            border: 1px solid rgba(255,255,255,0.08);">
                            <input class="tv-name-input" data-index="${index}" type="text" 
                                placeholder="Nombre" value="${tv.name || ''}"
                                style="padding: 6px; border-radius: 4px; box-sizing: border-box; width: 100%;">
                            <select class="tv-entity-select" data-index="${index}"
                                style="padding: 6px; border-radius: 4px; width: 100%;">
                                ${mediaPlayers.map(entity => `
                                    <option value="${entity}" ${entity === tv.entity ? 'selected' : ''}>
                                        ${this._hass.states[entity].attributes.friendly_name || entity}
                                    </option>
                                `).join('')}
                            </select>
                            <select class="tv-type-select" data-index="${index}"
                                style="padding: 6px; border-radius: 4px;">
                                <option value="LG TV" ${tv.type === 'LG TV' ? 'selected' : ''}>LG</option>
                                <option value="samsung" ${tv.type === 'samsung' ? 'selected' : ''}>Samsung</option>
                            </select>
                            <div class="tv-remove-btn" data-index="${index}" style="
                                cursor: pointer;
                                padding: 6px;
                                border-radius: 4px;
                                background: rgba(255,60,60,0.15);
                                color: rgba(255,100,100,0.9);
                                font-size: 16px;
                                text-align: center;
                                border: 1px solid rgba(255,60,60,0.2);">✕</div>
                        </div>
                    `).join('')}
                ` : `
                    <div style="font-size: 12px; opacity: 0.5; font-style: italic; margin-bottom: 12px;">
                        No hay TVs configuradas. Agrega una con el botón de abajo.
                    </div>
                `}

                <div id="tv-add-btn" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 8px;
                    border-radius: 8px;
                    cursor: pointer;
                    border: 1px dashed rgba(255,255,255,0.2);
                    color: rgba(255,255,255,0.5);
                    font-size: 13px;
                    margin-top: 4px;
                    transition: all 0.2s ease;">
                    + Agregar TV
                </div>
            </div>        
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
                <div style="margin-bottom: 12px; font-weight: bold;">Botón Netflix</div>

                <div style="margin-bottom: 8px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 12px;">Ícono</label>
                    <input id="netflix-icon" type="text" placeholder="mdi:netflix"
                        value="${this._config.netflix_icon || ''}" 
                        style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box;">
                </div>

                <select id="netflix-type" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <option value="button" ${this._config.netflix_type === 'button' ? 'selected' : ''}>Button</option>
                    <option value="command" ${this._config.netflix_type === 'command' ? 'selected' : ''}>Command</option>
                    <option value="script" ${this._config.netflix_type === 'script' ? 'selected' : ''}>Script</option>
                </select>

                <select id="netflix-value-button" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px; ${this._config.netflix_type !== 'button' && this._config.netflix_type ? 'display:none;' : ''}">
                    <option value="">-- Default (Netflix) --</option>
                    ${PREDEFINED_COMMANDS.map(cmd => `
                        <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                            ${this._config.netflix_value === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                            ${cmd.label}
                        </option>
                    `).join('')}
                </select>

                <select id="netflix-value-command" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px; ${this._config.netflix_type !== 'command' ? 'display:none;' : ''}">
                    <option value="">-- Default (Netflix) --</option>
                    ${PREDEFINED_COMMANDS.map(cmd => `
                        <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                            ${this._config.netflix_value === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                            ${cmd.label}
                        </option>
                    `).join('')}
                </select>

                <select id="netflix-value-script" style="width: 100%; padding: 8px; border-radius: 4px; ${this._config.netflix_type !== 'script' ? 'display:none;' : ''}">
                    <option value="">-- Seleccionar script --</option>
                    ${Object.keys(this._hass.states)
                        .filter(e => e.startsWith('script.'))
                        .map(script => `
                            <option value="${script}" ${this._config.netflix_value === script ? 'selected' : ''}>
                                ${this._hass.states[script].attributes.friendly_name || script}
                            </option>
                        `).join('')}
                </select>
            </div>
            <div style="padding: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="margin-bottom: 12px; font-weight: bold;">Botón Disney+</div>

                <div style="margin-bottom: 8px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 12px;">Ícono</label>
                    <input id="disney-icon" type="text" placeholder="phu:disney-plus"
                        value="${this._config.disney_icon || ''}" 
                        style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box;">
                </div>

                <select id="disney-type" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <option value="button" ${this._config.disney_type === 'button' ? 'selected' : ''}>Button</option>
                    <option value="command" ${this._config.disney_type === 'command' ? 'selected' : ''}>Command</option>
                    <option value="script" ${this._config.disney_type === 'script' ? 'selected' : ''}>Script</option>
                </select>

                <select id="disney-value-button" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px; ${this._config.disney_type !== 'button' && this._config.disney_type ? 'display:none;' : ''}">
                    <option value="">-- Default (Disney+) --</option>
                    ${PREDEFINED_COMMANDS.map(cmd => `
                        <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                            ${this._config.disney_value === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                            ${cmd.label}
                        </option>
                    `).join('')}
                </select>

                <select id="disney-value-command" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px; ${this._config.disney_type !== 'command' ? 'display:none;' : ''}">
                    <option value="">-- Default (Disney+) --</option>
                    ${PREDEFINED_COMMANDS.map(cmd => `
                        <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                            ${this._config.disney_value === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                            ${cmd.label}
                        </option>
                    `).join('')}
                </select>

                <select id="disney-value-script" style="width: 100%; padding: 8px; border-radius: 4px; ${this._config.disney_type !== 'script' ? 'display:none;' : ''}">
                    <option value="">-- Seleccionar script --</option>
                    ${Object.keys(this._hass.states)
                        .filter(e => e.startsWith('script.'))
                        .map(script => `
                            <option value="${script}" ${this._config.disney_value === script ? 'selected' : ''}>
                                ${this._hass.states[script].attributes.friendly_name || script}
                            </option>
                        `).join('')}
                </select>
            </div>
            <div style="padding: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="margin-bottom: 12px; font-weight: bold;">Botón YouTube</div>

                <div style="margin-bottom: 8px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 12px;">Ícono</label>
                    <input id="YouTube-icon" type="text" placeholder="mdi:youtube"
                        value="${this._config.YouTube_icon || ''}" 
                        style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box;">
                </div>

                <select id="YouTube-type" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <option value="button" ${this._config.YouTube_type === 'button' ? 'selected' : ''}>Button</option>
                    <option value="command" ${this._config.YouTube_type === 'command' ? 'selected' : ''}>Command</option>
                    <option value="script" ${this._config.YouTube_type === 'script' ? 'selected' : ''}>Script</option>
                </select>

                <select id="YouTube-value-button" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px; ${this._config.YouTube_type !== 'button' && this._config.YouTube_type ? 'display:none;' : ''}">
                    <option value="">-- Default (YouTube) --</option>
                    ${PREDEFINED_COMMANDS.map(cmd => `
                        <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                            ${this._config.YouTube_value === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                            ${cmd.label}
                        </option>
                    `).join('')}
                </select>

                <select id="YouTube-value-command" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px; ${this._config.YouTube_type !== 'command' ? 'display:none;' : ''}">
                    <option value="">-- Default (YouTube) --</option>
                    ${PREDEFINED_COMMANDS.map(cmd => `
                        <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                            ${this._config.YouTube_value === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                            ${cmd.label}
                        </option>
                    `).join('')}
                </select>

                <select id="YouTube-value-script" style="width: 100%; padding: 8px; border-radius: 4px; ${this._config.YouTube_type !== 'script' ? 'display:none;' : ''}">
                    <option value="">-- Seleccionar script --</option>
                    ${Object.keys(this._hass.states)
                        .filter(e => e.startsWith('script.'))
                        .map(script => `
                            <option value="${script}" ${this._config.YouTube_value === script ? 'selected' : ''}>
                                ${this._hass.states[script].attributes.friendly_name || script}
                            </option>
                        `).join('')}
                </select>
            </div>
            <div style="padding: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="margin-bottom: 12px; font-weight: bold;">Botón Prime Video</div>

                <div style="margin-bottom: 8px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 12px;">Ícono</label>
                    <input id="prime-icon" type="text" placeholder="phu:prime-video"
                        value="${this._config.prime_icon || ''}" 
                        style="width: 100%; padding: 6px; border-radius: 4px; box-sizing: border-box;">
                </div>

                <select id="prime-type" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <option value="button" ${this._config.prime_type === 'button' ? 'selected' : ''}>Button</option>
                    <option value="command" ${this._config.prime_type === 'command' ? 'selected' : ''}>Command</option>
                    <option value="script" ${this._config.prime_type === 'script' ? 'selected' : ''}>Script</option>
                </select>

                <select id="prime-value-button" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px; ${this._config.prime_type !== 'button' && this._config.prime_type ? 'display:none;' : ''}">
                    <option value="">-- Default (Prime Video) --</option>
                    ${PREDEFINED_COMMANDS.map(cmd => `
                        <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                            ${this._config.prime_value === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                            ${cmd.label}
                        </option>
                    `).join('')}
                </select>

                <select id="prime-value-command" style="width: 100%; padding: 8px; border-radius: 4px; margin-bottom: 8px; ${this._config.prime_type !== 'command' ? 'display:none;' : ''}">
                    <option value="">-- Default (Prime Video) --</option>
                    ${PREDEFINED_COMMANDS.map(cmd => `
                        <option value="${this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG}"
                            ${this._config.prime_value === (this._config.modelConfig === 'samsung' ? cmd.actionSamsung : cmd.actionLG) ? 'selected' : ''}>
                            ${cmd.label}
                        </option>
                    `).join('')}
                </select>

                <select id="prime-value-script" style="width: 100%; padding: 8px; border-radius: 4px; ${this._config.prime_type !== 'script' ? 'display:none;' : ''}">
                    <option value="">-- Seleccionar script --</option>
                    ${Object.keys(this._hass.states)
                        .filter(e => e.startsWith('script.'))
                        .map(script => `
                            <option value="${script}" ${this._config.prime_value === script ? 'selected' : ''}>
                                ${this._hass.states[script].attributes.friendly_name || script}
                            </option>
                        `).join('')}
                </select>
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

        // Card ID
        this.querySelector('#card-id-input').addEventListener('change', (e) => {
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, card_id: e.target.value }}
            }));
        });
        // Editar nombre de TV
        this.querySelectorAll('.tv-name-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const newTvs = [...(this._config.tvs || [])];
                newTvs[index] = { ...newTvs[index], name: e.target.value };
                const { entity, modelConfig, ...cleanConfig } = this._config;
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...cleanConfig, tvs: newTvs }}
                }));
            });
        });

        // Editar entidad de TV
        this.querySelectorAll('.tv-entity-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const newTvs = [...(this._config.tvs || [])];
                newTvs[index] = { ...newTvs[index], entity: e.target.value };
                const { entity, modelConfig, ...cleanConfig } = this._config;
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...cleanConfig, tvs: newTvs }}
                }));
            });
        });

        // Editar tipo de TV
        this.querySelectorAll('.tv-type-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const newTvs = [...(this._config.tvs || [])];
                newTvs[index] = { ...newTvs[index], type: e.target.value };
                const { entity, modelConfig, ...cleanConfig } = this._config;
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...cleanConfig, tvs: newTvs }}
                }));
            });
        });

        // Eliminar TV
        this.querySelectorAll('.tv-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const newTvs = [...(this._config.tvs || [])];
                newTvs.splice(index, 1);
                const { entity, modelConfig, ...cleanConfig } = this._config;
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...cleanConfig, tvs: newTvs }}
                }));
            });
        });

        // Agregar TV
        this.querySelector('#tv-add-btn').addEventListener('click', () => {
            const mediaPlayers = Object.keys(this._hass.states).filter(
                e => e.startsWith('media_player.')
            );
            const newTvs = [...(this._config.tvs || [])];
            newTvs.push({
                name: `TV ${newTvs.length + 1}`,
                entity: mediaPlayers[0] || 'media_player.tv',
                type: 'LG TV'
            });
            const { entity, modelConfig, ...cleanConfig } = this._config;
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...cleanConfig, tvs: newTvs }}
            }));
        });

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
        ///// EDITOR UI DE BOTON NETFLIX
        this.querySelector('#netflix-icon').addEventListener('change', (e) => {
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, netflix_icon: e.target.value }}
            }));
        });
        
        this.querySelector('#netflix-type').addEventListener('change', (e) => {
            const type = e.target.value;
            this.querySelector('#netflix-value-button').style.display = type === 'button' ? 'block' : 'none';
            this.querySelector('#netflix-value-command').style.display = type === 'command' ? 'block' : 'none';
            this.querySelector('#netflix-value-script').style.display = type === 'script' ? 'block' : 'none';
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, netflix_type: type, netflix_value: '' }}
            }));
        });
        
        ['button', 'command', 'script'].forEach(valueType => {
            this.querySelector(`#netflix-value-${valueType}`).addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...this._config, netflix_value: e.target.value }}
                }));
            });
        });

        ///// EDITOR UI DE BOTON DISNEY
        this.querySelector('#disney-icon').addEventListener('change', (e) => {
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, disney_icon: e.target.value }}
            }));
        });
        
        this.querySelector('#disney-type').addEventListener('change', (e) => {
            const type = e.target.value;
            this.querySelector('#disney-value-button').style.display = type === 'button' ? 'block' : 'none';
            this.querySelector('#disney-value-command').style.display = type === 'command' ? 'block' : 'none';
            this.querySelector('#disney-value-script').style.display = type === 'script' ? 'block' : 'none';
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, disney_type: type, disney_value: '' }}
            }));
        });
        
        ['button', 'command', 'script'].forEach(valueType => {
            this.querySelector(`#disney-value-${valueType}`).addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...this._config, disney_value: e.target.value }}
                }));
            });
        });

        ///// EDITOR UI DE BOTON YOUTUBE
        this.querySelector('#YouTube-icon').addEventListener('change', (e) => {
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, YouTube_icon: e.target.value }}
            }));
        });
        
        this.querySelector('#YouTube-type').addEventListener('change', (e) => {
            const type = e.target.value;
            this.querySelector('#YouTube-value-button').style.display = type === 'button' ? 'block' : 'none';
            this.querySelector('#YouTube-value-command').style.display = type === 'command' ? 'block' : 'none';
            this.querySelector('#YouTube-value-script').style.display = type === 'script' ? 'block' : 'none';
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, YouTube_type: type, YouTube_value: '' }}
            }));
        });
        
        ['button', 'command', 'script'].forEach(valueType => {
            this.querySelector(`#YouTube-value-${valueType}`).addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...this._config, YouTube_value: e.target.value }}
                }));
            });
        });

        ///// EDITOR UI DE BOTON PRIME
        this.querySelector('#prime-icon').addEventListener('change', (e) => {
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, prime_icon: e.target.value }}
            }));
        });
        
        this.querySelector('#prime-type').addEventListener('change', (e) => {
            const type = e.target.value;
            this.querySelector('#prime-value-button').style.display = type === 'button' ? 'block' : 'none';
            this.querySelector('#prime-value-command').style.display = type === 'command' ? 'block' : 'none';
            this.querySelector('#prime-value-script').style.display = type === 'script' ? 'block' : 'none';
            this.dispatchEvent(new CustomEvent('config-changed', {
                detail: { config: { ...this._config, prime_type: type, prime_value: '' }}
            }));
        });
        
        ['button', 'command', 'script'].forEach(valueType => {
            this.querySelector(`#prime-value-${valueType}`).addEventListener('change', (e) => {
                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: { ...this._config, prime_value: e.target.value }}
                }));
            });
        });        
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


