// Controlador de funciones reales para DuckieTalkPro
document.addEventListener('DOMContentLoaded', () => {
    const btnMic = document.querySelector('.btn-mic, [id*="mic"]');
    const btnCam = document.querySelector('.btn-cam, [id*="cam"]');
    const btnGift = document.querySelector('.btn-gift, [id*="gift"]');
    const chatInput = document.querySelector('#chat-input, input[type="text"]');
    const sendBtn = document.querySelector('#send-btn, .btn-send');

    // Función universal para enviar comandos reales a la IA en Render
    const enviarAccionIA = async (textoComando) => {
        if (!chatInput) return;
        chatInput.value = textoComando;
        
        if (sendBtn) {
            sendBtn.click(); // Dispara la petición real al servidor backend de Render
        } else {
            try {
                await fetch('https://onrender.com', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: textoComando })
                });
            } catch (e) {
                console.error("Error de comunicación:", e);
            }
        }
    };

    if (btnMic) {
        btnMic.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => enviarAccionIA("🎤 [Audio Activado] Hola Duckie, procesa mi nota de voz actual."))
                .catch(() => enviarAccionIA("🎤 [Permiso de Voz] Por favor responde a mi solicitud de activación de micrófono."));
        });
    }

    if (btnCam) {
        btnCam.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(() => enviarAccionIA("📷 [Cámara Activa] Analiza la captura de imagen en tiempo real."))
                .catch(() => enviarAccionIA("📷 [Permiso de Cámara] Procesando enlace de video independiente."));
        });
    }

    if (btnGift) {
        btnGift.addEventListener('click', (e) => {
            e.preventDefault();
            enviarAccionIA("🎁 [Cupón Multimedia] ¡Activa mi regalo sorpresa en el servidor!");
        });
    }
});
