document.addEventListener("DOMContentLoaded", () => {
    console.log("[DuckieTalkPro] Aplicación inicializada correctamente. 🦆");

    const chatContainer = document.getElementById("chat-container");
    const userInput = document.getElementById("user-input");
    const btnSend = document.getElementById("btn-send");
    
    // Modales
    const burgerModal = document.getElementById("burger-modal");
    const settingsModal = document.getElementById("settings-modal");
    const menuBurger = document.getElementById("menu-burger");
    const btnSettings = document.getElementById("btn-settings");

    // Botones multimedia inferior
    const btnClip = document.getElementById("btn-clip");
    const btnEmoji = document.getElementById("btn-emoji");
    const btnMic = document.getElementById("btn-mic");

    // Abrir / Cerrar Menús
    menuBurger.addEventListener("click", () => burgerModal.style.display = "flex");
    btnSettings.addEventListener("click", () => settingsModal.style.display = "flex");

    window.closeModals = function() {
        burgerModal.style.display = "none";
        settingsModal.style.display = "none";
    };

    // Función principal de envío de mensajes con IA fluida
    function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Mostrar mensaje del usuario
        appendMessage(text, "user");
        userInput.value = "";

        // Simular respuesta inteligente y fluida de DuckieTalk IA
        setTimeout(() => {
            let aiResponse = "¡Quack! Conexión remota activa. Procesando tu solicitud localmente en DuckieTalkPro.";
            
            const lower = text.toLowerCase();
            if (lower.includes("hola") || lower.includes("hello")) {
                aiResponse = "¡Hola Amado! ¿En qué te ayudamos hoy en tu tienda o proyectos de código? 🦆💻";
            } else if (lower.includes("receta") || lower.includes("comida")) {
                aiResponse = "Buscando recetas en la red para ti... ¡Encontré varias opciones deliciosas de cocina local! 🍳";
            } else if (lower.includes("llamada") || lower.includes("video")) {
                aiResponse = "Iniciando protocolo VoIP seguro estilo WhatsApp/Messenger. Conectando canales... 📞🎥";
            }

            appendMessage(aiResponse, "ai");
        }, 800);
    }

    function appendMessage(text, sender) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = sender === "ai" ? `<strong>DuckieTalk IA:</strong> ${text}` : `<strong>Tú:</strong> ${text}`;
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Eventos de envío
    btnSend.addEventListener("click", sendMessage);
    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    // Funciones Multimedia de los botones inferiores
    btnClip.addEventListener("click", () => {
        const choice = confirm("¿Deseas abrir la Photo Library o Tomar una Foco/Video?");
        if (choice) {
            appendMessage("[Archivo adjunto o Foto cargada desde la librería]", "user");
        }
    });

    btnEmoji.addEventListener("click", () => {
        userInput.value += " 🦆😊🚀✨ ";
        userInput.focus();
    });

    btnMic.addEventListener("click", () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                alert("Permiso de Micrófono concedido. Grabando nota de voz...");
                appendMessage("[Audio enviado - Nota de voz VoIP 🎙️]", "user");
            })
            .catch(err => {
                alert("Se requiere acceso al micrófono para enviar audios.");
            });
    });
});
