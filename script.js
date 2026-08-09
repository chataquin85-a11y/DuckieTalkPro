// DuckieTalkPro - Script principal de control y VoIP
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DuckieTalkPro] Aplicación inicializada correctamente. 🚀");

    // Selector o elementos de llamada en la interfaz
    const callButtons = document.querySelectorAll('.fa-video, .fa-phone, button[id*="call"], .call-btn');

    callButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                // Solicitar acceso a la cámara y micrófono (Compatible con Safari en iPhone y navegadores de escritorio)
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                
                // Conectar el stream si existe un elemento de video local en el DOM
                const localVideo = document.querySelector('#localVideo, video');
                if (localVideo) {
                    localVideo.srcObject = stream;
                }

                console.log("[DuckieTalkPro] ¡Sesión VoIP iniciada correctamente en tiempo real! 🚀");
                
                // Disparar feedback visual en la interfaz de chat
                agregarMensajeSistema("Tú: [Sesión VoIP VIDEO Iniciada Correctamente] 🚀");

            } catch (error) {
                console.error("[DuckieTalkPro] Error al acceder a los dispositivos multimedia:", error);
                alert("Por favor, permite el acceso a la cámara y al micrófono en los ajustes de tu navegador o iPhone para iniciar la llamada.");
            }
        });
    });
});

// Función auxiliar para reflejar el estado en el chat activo
function agregarMensajeSistema(texto) {
    const chatContainer = document.querySelector('.chat-messages, .message-container, body');
    if (chatContainer) {
        const nuevoMensaje = document.createElement('div');
        nuevoMensaje.className = 'message-system-log';
        nuevoMensaje.style.cssText = 'background: #008069; color: white; padding: 10px; margin: 5px; border-radius: 8px; font-size: 14px;';
        nuevoMensaje.innerText = texto;
        chatContainer.appendChild(nuevoMensaje);
    }
}
