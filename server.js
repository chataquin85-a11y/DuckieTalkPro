// DuckieTalkPro - Controlador Unificado de Paneles Flotantes y Telecomunicaciones[span_0](start_span)[span_0](end_span)
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inyección Dinámica del Subtítulo Oficial[span_1](start_span)[span_1](end_span)
    const headerTitle = document.querySelector('.header b, [id*="title"]');[span_2](start_span)[span_2](end_span)
    if (headerTitle) {[span_3](start_span)[span_3](end_span)
        headerTitle.innerHTML = 'DuckieTalkPro<br><span style="font-size: 13px; color: #a5d6a7; font-weight: normal;">DuckieTalk^+^_/</span>';[span_4](start_span)[span_4](end_span)
    }

    // 2. Función Universal para Crear Paneles Flotantes Estables[span_5](start_span)[span_5](end_span)
    const crearPanelFlotante = (titulo, contenidoHTML) => {[span_6](start_span)[span_6](end_span)
        const panelViejo = document.getElementById('duckie-floating-panel');[span_7](start_span)[span_7](end_span)
        if (panelViejo) panelViejo.remove();[span_8](start_span)[span_8](end_span)

        const panel = document.createElement('div');[span_9](start_span)[span_9](end_span)
        panel.id = 'duckie-floating-panel';[span_10](start_span)[span_10](end_span)
        panel.style.position = 'fixed';[span_11](start_span)[span_11](end_span)
        panel.style.top = '15%';[span_12](start_span)[span_12](end_span)
        panel.style.left = '10%';[span_13](start_span)[span_13](end_span)
        panel.style.width = '80%';[span_14](start_span)[span_14](end_span)
        panel.style.maxHeight = '60%';[span_15](start_span)[span_15](end_span)
        panel.style.backgroundColor = '#0b141a';[span_16](start_span)[span_16](end_span)
        panel.style.color = '#e9edef';[span_17](start_span)[span_17](end_span)
        panel.style.borderRadius = '12px';[span_18](start_span)[span_18](end_span)
        panel.style.border = '2px solid #00a884';[span_19](start_span)[span_19](end_span)
        panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';[span_20](start_span)[span_20](end_span)
        panel.style.zIndex = '9999';[span_21](start_span)[span_21](end_span)
        panel.style.padding = '15px';[span_22](start_span)[span_22](end_span)
        panel.style.overflowY = 'auto';[span_23](start_span)[span_23](end_span)
        panel.style.fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';[span_24](start_span)[span_24](end_span)

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #00a884; padding-bottom: 8px; margin-bottom: 12px;">
                <h3 style="margin: 0; color: #00a884; font-size: 16px;">${titulo}</h3>
                <button id="close-duckie-panel" style="background: none; border: none; color: #ff5c5c; font-size: 20px; cursor: pointer;">✕</button>
            </div>
            <div style="font-size: 14px; line-height: 1.5; color: #aebac1;">${contenidoHTML}</div>
        `;[span_25](start_span)[span_25](end_span)

        document.body.appendChild(panel);[span_26](start_span)[span_26](end_span)

        document.getElementById('close-duckie-panel').addEventListener('click', () => {[span_27](start_span)[span_27](end_span)
            panel.remove();[span_28](start_span)[span_28](end_span)
        });
    };

    // 3. Vinculación del Menú de Hamburguesa (Tres líneas horizontales)[span_29](start_span)[span_29](end_span)
    const btnMenu = document.querySelector('.fa-bars, [id*="menu"]');[span_30](start_span)[span_30](end_span)
    if (btnMenu) {[span_31](start_span)[span_31](end_span)
        btnMenu.addEventListener('click', (e) => {[span_32](start_span)[span_32](end_span)
            e.preventDefault();[span_33](start_span)[span_33](end_span)
            crearPanelFlotante('Menú DuckieTalkPro', `
                <p><b>Información de Canales Seguros:</b></p>
                <ul>
                    <li>Servidor Backend: Enlazado a Render Cloud Active</li>
                    <li>Dominio Oficial: www.duckiethemus.com</li>
                    <li>Autenticación: Cifrado de extremo a extremo activo</li>
                </ul>
            `);[span_34](start_span)[span_34](end_span)
        });
    }

    // 4. Vinculación del Engrane de Configuración (⚙️)[span_35](start_span)[span_35](end_span)
    const btnSettings = document.querySelector('.fa-gear, .fa-cog, [id*="settings"]');[span_36](start_span)[span_36](end_span)
    if (btnSettings) {[span_37](start_span)[span_37](end_span)
        btnSettings.addEventListener('click', (e) => {[span_38](start_span)[span_38](end_span)
            e.preventDefault();[span_39](start_span)[span_39](end_span)
            crearPanelFlotante('Ajustes y Herramientas', `
                <p><b>Panel del Administrador (Amado Apolonio):</b></p>
                <label style="display:block; margin-bottom:8px;">
                    <input type="checkbox" checked disabled> Mantener mensajes guardados en el servidor
                </label>
                <label style="display:block; margin-bottom:8px;">
                    <input type="checkbox" checked disabled> Optimización extrema de batería
                </label>
                <p style="font-size:11px; color:#00a884;">Versión de software: v2.6.0 Nativ-Pro</p>
            `);[span_40](start_span)[span_40](end_span)
        });
    }

    // 5. Vinculación del Centro de Comunicaciones Central DuckieTalkPro (🦆)[span_41](start_span)[span_41](end_span)
    const btnDuckiePro = Array.from(document.querySelectorAll('span, button, div')).find(el => el.textContent.includes('DuckieTalkPro') || el.textContent.includes('Duckietalpro'));[span_42](start_span)[span_42](end_span)
    if (btnDuckiePro) {[span_43](start_span)[span_43](end_span)
        btnDuckiePro.addEventListener('click', (e) => {[span_44](start_span)[span_44](end_span)
            e.preventDefault();[span_45](start_span)[span_45](end_span)
            crearPanelFlotante('Centro de Comunicaciones - DuckieTalkPro', `
                <div style="text-align: center; margin-bottom: 15px;">
                    <p style="color: #a5d6a7; font-size: 13px; margin: 0;">Servicios de Comunicación Activos (DuckieTalk^+^_/)</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button onclick="alert('📞 Conectando llamada de voz cifrada a través del servidor Render...')" style="background-color: #00a884; color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; text-align: left;">
                        📞 Hacer Llamada de Voz
                    </button>
                    <button onclick="alert('📹 Inicializando cámara de iPhone/iPad para Video llamada segura...')" style="background-color: #00a884; color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; text-align: left;">
                        📹 Iniciar Video llamada
                    </button>
                    <button onclick="alert('🎙️ Micrófono listo. Mantén presionado para enviar y recibir audios...')" style="background-color: #128c7e; color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; text-align: left;">
                        🎙️ Enviar / Recibir Audios
                    </button>
                    <button onclick="document.getElementById('duckie-floating-panel').remove(); document.querySelector('#chat-input, input[type=\'text\']').focus();" style="background-color: #25d366; color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; text-align: left;">
                        💬 Redactar Mensaje de Texto
                    </button>
                </div>
            `);[span_46](start_span)[span_46](end_span)
        });
    }

    // 6. Vinculación de los Botones Inferiores (Emojis, Stickers, GIFs)[span_47](start_span)[span_47](end_span)
    const btnEmojis = Array.from(document.querySelectorAll('span, button')).find(el => el.textContent.includes('Emojis'));[span_48](start_span)[span_48](end_span)
    const btnStickers = Array.from(document.querySelectorAll('span, button')).find(el => el.textContent.includes('Stickers'));[span_49](start_span)[span_49](end_span)
    const btnGifts = Array.from(document.querySelectorAll('span, button')).find(el => el.textContent.includes('GIFs') || el.textContent.includes('Gifts'));[span_50](start_span)[span_50](end_span)

    if (btnEmojis) {[span_51](start_span)[span_51](end_span)
        btnEmojis.addEventListener('click', (e) => {[span_52](start_span)[span_52](end_span)
            e.preventDefault();[span_53](start_span)[span_53](end_span)
            crearPanelFlotante('Emojis Disponibles', '<div style="font-size: 24px; letter-spacing: 8px;">😊 🦆 🚀 📷 🎙️ ⚙️ 📂 🎁 📱 🤖 👍</div>');[span_54](start_span)[span_54](end_span)
        });
    }
    if (btnStickers) {[span_55](start_span)[span_55](end_span)
        btnStickers.addEventListener('click', (e) => {[span_56](start_span)[span_56](end_span)
            e.preventDefault();[span_57](start_span)[span_57](end_span)
            crearPanelFlotante('Paquete de Stickers', '<p>¡Los stickers del Patito Inteligente están listos para enviarse al servidor de Render!</p>');[span_58](start_span)[span_58](end_span)
        });
    }
    if (btnGifts) {[span_59](start_span)[span_59](end_span)
        btnGifts.addEventListener('click', (e) => {[span_60](start_span)[span_60](end_span)
            e.preventDefault();[span_61](start_span)[span_61](end_span)
            crearPanelFlotante('Regalos Sorpresa', '<p>🎁 Cupón multimedia activo: Presiona para enviar un regalo sorpresa animado a través de la IA.</p>');[span_62](start_span)[span_62](end_span)
        });
    }
});
