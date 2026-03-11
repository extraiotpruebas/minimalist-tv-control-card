class TVControlCard extends HTMLElement {

    constructor() {
        
        super();
        window.ygriega = 0;
        window.helperGlobal = 0;
        window.iteracionAudio = 0;
        window.iteracionBusq = 0;
        window.iteracionNav = 0;
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
            'Disney Plus': {
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
            { id: 'disney', name: 'Disney Plus', icon: 'phu:disney-plus', service: 'Disney Plus' },
            { id: 'YouTube', name: 'YouTube', icon: 'mdi:youtube', service: 'YouTube' },
            { id: 'prime', name: 'Prime Video', icon: 'phu:prime-video', service: 'Prime Video' }
        ];
        this.controlModes = [
            { id: 'navegacion', icon: 'mdi:menu-open', label: 'Navegación' },
            { id: 'busqueda', icon: 'mdi:television-classic', label: 'Búsqueda' },
            { id: 'audio', icon: 'mdi:volume-high', label: 'Audio' }
        ];
        
        this.bottomButtons = [
            { id: 'back', icon: 'mdi:undo-variant', action: 'BACK', label: 'Atrás' },
            { id: 'home', icon: 'mdi:home', action: 'HOME', label: 'Inicio' },
            { id: 'exit', icon: 'mdi:exit-to-app', action: 'EXIT', label: 'Salir' },
            { id: 'menu', icon: 'mdi:menu', action: 'MENU', label: 'Menú' }
        ];
        
        this.touchpadButtons = {
            'navegacion': {
                up: { icon: 'mdi:menorah', action: 'HOME', label: 'Inicio' },
                left: { icon: 'mdi:movie-star', action: 'MENU', label: 'Menú' },
                right: { icon: 'mdi:lightbulb-group-outline', action: 'EXIT', label: 'Salir' },
                down: { icon: 'mdi:home-thermometer', action: 'BACK', label: 'Atrás' }
            },
            'busqueda': {
                up: { icon: 'mdi:plus-box', action: 'CHANNELUP', label: 'Subir canal' },
                left: { icon: 'mdi:hdmi-port', action: 'INFO', label: 'Información' },
                right: { icon: 'mdi:format-list-numbered', action: 'GUIDE', label: 'Guía' },
                down: { icon: 'mdi:minus-box', action: 'CHANNELDOWN', label: 'Bajar canal' }
            },
            'audio': {
                up: { icon: 'mdi:volume-plus', action: 'VOLUMEUP', label: 'Subir volumen' },
                left: { icon: 'mdi:volume-off', action: 'MUTE', label: 'Silenciar' },
                right: { icon: 'mdi:surround-sound', action: null, label: 'Sonido' },
                down: { icon: 'mdi:volume-minus', action: 'VOLUMEDOWN', label: 'Bajar volumen' }
            },
            'default': {
                up: { icon: 'mdi:circle-medium', action: 'UP', label: 'Arriba' },
                left: { icon: 'mdi:circle-medium', action: 'LEFT', label: 'Izquierda' },
                right: { icon: 'mdi:circle-medium', action: 'RIGHT', label: 'Derecha' },
                down: { icon: 'mdi:circle-medium', action: 'DOWN', label: 'Abajo' }
            }
        };
    }
    
    setConfig(config) {
        if (!config.entity) {
            throw new Error('Por favor define una entidad (entity)');
        }
        
        this._config = config;
        this.state.defaultMode = config.colorMode;
        console.log("esto es la nueva propiedad YAML que estamos definiendo" + config.colorMode)
        this.state.tvEntityId = config.entity;
        console.log("esto es tvEntityID que deberia ser la entidad que defines" + config.entity)
        let ejemplo = this.getTvSource
        console.log("ESTE ES EL ESTADO DE SOURCE " + ejemplo)
        this.state.controlModeId = config.control_mode_entity || null;
        if (this.state.isConnected) {
            this.render();
        }
    }
    
    getCardSize() {
        return 6;
    }
    
    static getStubConfig() {
        return {
            entity: 'media_player.tv',
            mode: 'dark',
        };
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
                        : this.state.source === 'Disney Plus'
                        ? 'rgba(6, 86, 186, 1)'
                        : 'rgba(255, 100, 100, 0.15)'};
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
                        width: 200px;
                        height: 200px;
                        transform: scale(1) !important;
                    }
                    
                    .touchpad-center-button {
                        width: 80px;
                        height: 80px;
                    }
                }
            </style>
            
            <ha-card>
                <div class="tv-control-card">
                    <div class="card-grid">
                        <div class="top-section">
                            <div class="top-button exit-button" data-action="exit">
                                <ha-icon icon="mdi:lock-alert"></ha-icon>
                            </div>
                            <div class="tv-status-label ${this.getTvStatus() === 'on' ? 'on' : 'off'}">
                                ${this.getTvStatus() === 'on' ? 'ON' : 'OFF'}
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
                                ${this.controlModes.map(mode => `
                                    <div class="mode-button mode-${mode.id} ${this.state.controlMode === mode.id ? 'active' : ''}" 
                                        data-mode="${mode.id}">
                                        <ha-icon icon="${mode.icon}"></ha-icon>
                                    </div>
                                `).join('')}
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
        this.listenerAudio();
        this.listenerBusqueda();
        this.listenerNavegacion();
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
        
        this.controlModes.forEach(mode => {
            const selector = `.mode-${mode.id}`;
            const button = this.shadowRoot.querySelector(selector);
            const elementKey = `mode${mode.id.charAt(0).toUpperCase() + mode.id.slice(1)}Button`;
            this.elements[elementKey] = button;
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
        const buttons = this.touchpadButtons[mode] || this.touchpadButtons['default'];
        
        const html = ['up', 'left', 'right', 'down'].map(direction => {
            const button = buttons[direction];
            return `
                <div class="touchpad-button touchpad-${direction}" 
                        data-action="${button.action || ''}"
                        title="${button.label}">
                    <ha-icon icon="${button.icon}"></ha-icon>
                </div>
            `;
        }).join('');
        return html;
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
        if (source === 'Disney Plus') return 'rgba(6, 19, 31, 0.8)';
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
        if (isActive && service === 'Disney Plus') {
            return '2.5px solid rgba(255, 255, 210, 0.7)';
        }
        return '1.5px solid rgba(255, 255, 255, 0.15)';
    }
    
    getStreamingButtonColor(service) {
        const source = this.state.source;
        if (source === 'Netflix' && service === 'Netflix') return 'rgba(255, 255, 255, 1)';
        if (source === 'Disney Plus' && service === 'Disney Plus') return 'rgba(255, 255, 255, 1)';
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
    selectControlMode(mode) {
        this.state.controlMode = mode;
        this.render();
    }
    
    listenerAudio(){
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
        
        function findAudioBtn() {
            let tvCard = find(document.querySelector("home-assistant"));
            if(!tvCard?.shadowRoot) return null;
        
            let mainDiv = tvCard.shadowRoot.querySelector("div.tv-control-card") || tvCard.shadowRoot.querySelector("div");
            if(!mainDiv) return null;
        
            let searchArea = mainDiv.querySelector("div.card-grid") || mainDiv;
            let btn = searchArea.querySelector('div[data-mode="audio"], div.mode-audio, div.mode-button.mode-audio');
        
            if(!btn) {
                let allDivs = searchArea.querySelectorAll("div");
                for(let div of allDivs) {
                    if(div.getAttribute("data-mode") === "audio" || div.className?.includes("audio")) {
                        btn = div;
                        break;
                    }
                }
            }
        
            return btn;
        }
        
        let audioBtn = findAudioBtn();
        if(audioBtn) {
            audioBtn.addEventListener("click", () => {
                iteracionAudio++;
                if(iteracionAudio % 2 === 0) {
                    this.selectControlMode('seleccion');
                } else {
                    this.selectControlMode('audio');
                    if(window.iteracionBusq % 2 === 1 || window.iteracionNav % 2 === 1){
                        window.iteracionBusq = 0;
                        window.iteracionNav = 0;
                        this.estadoActual();
                        console.log("ESTADO " + this.state.tvEntityId );
                    }
                        
                }
            });
            
            audioBtn.style.cursor = "pointer";
            window.audioBtn = audioBtn;
        } else {
        }              


    }
    listenerBusqueda(){
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
        
        function findBusqBtn() {
            let tvCard = find(document.querySelector("home-assistant"));
            if(!tvCard?.shadowRoot) return null;
        
            let mainDiv = tvCard.shadowRoot.querySelector("div.tv-control-card") || tvCard.shadowRoot.querySelector("div");
            if(!mainDiv) return null;
        
            let searchArea = mainDiv.querySelector("div.card-grid") || mainDiv;
            let btn = searchArea.querySelector('div[data-mode="busqueda"], div.mode-busqueda, div.mode-button.mode-busqueda');
        
            if(!btn) {
                let allDivs = searchArea.querySelectorAll("div");
                for(let div of allDivs) {
                    if(div.getAttribute("data-mode") === "busqueda" || div.className?.includes("busqueda")) {
                        btn = div;
                        break;
                    }
                }
            }
        
            return btn;
        }
        
        let busqBtn = findBusqBtn();
        if(busqBtn) {
            busqBtn.addEventListener("click", () => {
                iteracionBusq++;
                if(iteracionBusq % 2 === 0) {
                    this.selectControlMode('seleccion');
                } else {
                    this.selectControlMode('busqueda');
                    if(window.iteracionAudio % 2 === 1 || window.iteracionNav % 2 === 1){
                        window.iteracionAudio = 0;
                        window.iteracionNav = 0;
                    }
                }
            });
            busqBtn.style.cursor = "pointer";
            window.busqBtn = busqBtn;
        } else {
        }        


    }    
    listenerNavegacion(){
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
        
        function findNavBtn() {
            let tvCard = find(document.querySelector("home-assistant"));
            if(!tvCard?.shadowRoot) return null;
        
            let mainDiv = tvCard.shadowRoot.querySelector("div.tv-control-card") || tvCard.shadowRoot.querySelector("div");
            if(!mainDiv) return null;
        
            let searchArea = mainDiv.querySelector("div.card-grid") || mainDiv;
            let btn = searchArea.querySelector('div[data-mode="navegacion"], div.mode-navegacion, div.mode-button.mode-navegacion');
        
            if(!btn) {
                let allDivs = searchArea.querySelectorAll("div");
                for(let div of allDivs) {
                    if(div.getAttribute("data-mode") === "navegacion" || div.className?.includes("navegacion")) {
                        btn = div;
                        break;
                    }
                }
            }
        
            return btn;
        }
        
        let navBtn = findNavBtn();
        if(navBtn) {
            navBtn.addEventListener("click", () => {
                iteracionNav++;
                if(iteracionNav % 2 === 0) {
                    this.selectControlMode('seleccion');
                } else {
                    this.selectControlMode('navegacion');
                    if(window.iteracionBusq % 2 === 1 || window.iteracionAudio % 2 === 1){
                        window.iteracionBusq = 0;
                        window.iteracionAudio = 0;
                    }
                }
            });
            navBtn.style.cursor = "pointer";
            window.navBtn = navBtn;
        } else {
        }        
    }

    listenerPower(){
        let botonPower = this.shadowRoot.querySelector('.power-button');
        botonPower.addEventListener('click', () => this.togglePower());
    }

    listenerExit(){
        let botonPower = this.shadowRoot.querySelector('.exit-button');
        botonPower.addEventListener('click', () => this.sendPass());
    }

    listenerStreaming() {
        this.streamingServices.forEach(service => {
            let botonStreaming = this.shadowRoot.querySelector(`.${service.id}-button`);
            if (botonStreaming) {
                botonStreaming.addEventListener('click', () => {
                    this.selectSource(service.service);
                });
            }
        });
    }

    listenerBottomButtons() {
        this.bottomButtons.forEach(button => {
            let botonGral = this.shadowRoot.querySelector(`.${button.id}-button`);
            if (botonGral) {
                botonGral.addEventListener('click', () => {
                    this.sendButtonAction(button.action);
                });
            }
        });
    }
    listenerTouchpad() {
        ['up', 'left', 'right', 'down'].forEach(direction => {
            let botonTouchpad = this.shadowRoot.querySelector(`.touchpad-${direction}`);
            if (botonTouchpad) {
                botonTouchpad.addEventListener('click', () => {
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
        
        if (this._hass && this.state.tvEntityId) {
            this._hass.callService('media_player', 'toggle', {
                entity_id: this.state.tvEntityId
            });
        }
    }
    sendPass() {
        
        if (this._hass && this.state.tvEntityId) {
            this._hass.callService('script', 'lg_passwd', {
            });
        }
    }    
    
    sendButtonAction(button) {
        
        if (this._hass && this.state.tvEntityId) {
            this._hass.callService('webostv', 'button', {
                entity_id: this.state.tvEntityId,
                button: button
            });
        }
    }
    
    handleTouchpadButton(direction) {
        const mode = this.state.controlMode;
        const buttons = this.touchpadButtons[mode] || this.touchpadButtons['default'];
        const button = buttons[direction];
        
        if (button && button.action) {
            this.sendButtonAction(button.action);
        }
    }
    
    handleCenterButton() {
        this.sendButtonAction('ENTER');
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
customElements.define('tv-control-card', TVControlCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'tv-control-card',
    name: 'TV Control Card',
    description: 'Tarjeta de control personalizada para TV LG WebOS',
    preview: false,
    documentationURL: 'https://github.com/tu-usuario/tv-control-card'
});


