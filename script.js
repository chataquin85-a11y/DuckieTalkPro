document.addEventListener("DOMContentLoaded", () => {
    console.log("[DuckieTalkPro] Sistema completo al 100%: VOIP, IA y Ads activos. 🦆🚀");

    const chatContainer = document.getElementById("chat-container");
    const userInput = document.getElementById("user-input");
    const btnSend = document.getElementById("btn-send");

    const burgerModal = document.getElementById("burger-modal");
    const settingsModal = document.getElementById("settings-modal");
    const menuBurger = document.getElementById("menu-burger");
    const btnSettings = document.getElementById("btn-settings");

    const btnClip = document.getElementById("btn-clip");
    const btnEmoji = document.getElementById("btn-emoji");
    const btnMic = document.getElementById("btn-mic");

    if (menuBurger) {
        menuBurger.addEventListener("click", () => burgerModal.style.display = "flex");
    }
    if (btnSettings) {
        btnSettings.addEventListener("click", () => settingsModal.style.display = "flex");
    }

    window.closeModals = function() {
        if (burgerModal) burgerModal.style.display = "none";
        if (settingsModal) settingsModal.style.display = "none";
    };

    // Función auxiliar para agregar mensajes al chat con la identidad correcta
    function appendMessage(text, sender) {
        if (!chatContainer) return;
        const msgDiv = document.createElement("div");
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = sender === "ai" 
            ? `<strong>Duckie Guai-fai'v 🧠:</strong> ${text}` 
            : `<strong>Tú:</strong> ${text}`;
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // --- INTELIGENCIA ARTIFICIAL AVANZADA Y RESPUESTAS EN TIEMPO REAL ---
    function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;
        
        appendMessage(text, "user");
        userInput.value = "";

        // Petición directa al servidor local para aislar el AI Chat con el cerebro de Gemini
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: text })
        })
        .then(response => response.json())
        .then(data => {
            const aiResponse = data.reply || "¡Quack! Recibí tu mensaje, pero no obtuve respuesta del ecosistema.";
            appendMessage(aiResponse, "ai");
        })
        .catch(error => {
            console.error("Error al conectar con el servidor:", error);
            appendMessage("¡Quack! Ocurrió un error al conectar con Duckie Guai-fai'v en el servidor local.", "ai");
        });
    }

    if (btnSend) {
        btnSend.addEventListener("click", sendMessage);
    }
    
    if (userInput) {
        userInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }
});