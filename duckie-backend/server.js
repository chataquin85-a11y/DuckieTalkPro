const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();

// Configuración de CORS
app.use(cors({
    origin: [
        "https://duckie-guai-faiv-app.web.app",
        "https://www.duckiethemus.com",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options('*', cors());
app.use(express.json());

// Inicialización de la API de Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
    try {
        console.log("Body que llegó:", JSON.stringify(req.body, null, 2));

        let userPrompt = "";

        // 1. Lectura si viene mensaje directo
        if (req.body.message) {
            userPrompt = req.body.message;
        } else if (req.body.text) {
            userPrompt = req.body.text;
        }
        // 2. Lectura si viene en el array de mensajes del frontend
        else if (req.body.messages && Array.isArray(req.body.messages)) {
            const lastUser = [...req.body.messages].reverse().find(m => m.role === 'user');
            if (lastUser) {
                if (typeof lastUser.parts === 'string') {
                    userPrompt = lastUser.parts;
                } else if (Array.isArray(lastUser.parts)) {
                    userPrompt = lastUser.parts.map(p => (typeof p === 'string' ? p : p.text || '')).join('');
                } else if (lastUser.content) {
                    userPrompt = lastUser.content;
                }
            }
        }

        if (!userPrompt) {
            console.log("Error: No se encontró un mensaje válido en el body");
            return res.status(400).json({ error: "No me mandaste ningún mensaje válido, pariente." });
        }

        console.log("Prompt final para Gemini:", userPrompt);

        // --- AJUSTE DE ROLES E INTELIGENCIA PARA TIENDAS VS VIP ---
        const userRole = req.body.role || 'standard';
        let systemInstruction = "";

        if (userRole === "vip_patron") {
            systemInstruction = "Eres Duckie Guai-fai'v 🦆. El fiel asistente y mano derecha de Amado Apolonio Simom. Respondes con trato de confianza, jerga norteña, lealtad absoluta, humor entrón y acceso total al patrón.";
        } else {
            systemInstruction = "Eres Duckie Guai-fai'v 🦆, un asistente digital servicial, educado, neutral y profesional. Mantén un tono seguro y asegúrate de cumplir estrictamente con las políticas de contenido de las tiendas de aplicaciones móviles (Play Store y App Store).";
        }

        const fullPrompt = systemInstruction + "\n\nUsuario: " + userPrompt;

        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: fullPrompt,
        });

        res.json({ reply: response.text });

    } catch (e) {
        console.error("ERROR GEMINI:", e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Servidor Duckie Backend corriendo en puerto " + PORT);
});