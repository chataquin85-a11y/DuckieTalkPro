const express = require('express');
const cors = require('cors');
<<<<<<< HEAD
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "API key no configurada en el servidor" });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }]
=======

const app = express();
app.use(cors({
    origin: ["https://www.duckiethemus.com", "https://duckiethemus.com"],
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get('/', (req, res) => {
    res.send('DuckieDuck Pro Backend funcionando al 100% 🦆');
});

app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: 'Falta el mensaje' });
    }

    try {
        // Conexión directa HTTP REST (sin librerías intermedias que fallen)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: `Instrucción del sistema: Eres Duckie Guai-fai'v, un asistente digital amigable, con un estilo de comunicación natural, casual y fluido.\n\nUsuario: ${userMessage}` }
                        ]
                    }
                ]
>>>>>>> 54126cff02ef89982363dbe68d59acf8fb863cf5
            })
        });

        const data = await response.json();
<<<<<<< HEAD
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.status(500).json({ error: "Respuesta inválida de la API de Gemini" });
        }
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
=======

        if (!response.ok) {
            throw new Error(data.error?.message || 'Error en la API de Google');
        }

        // Extraer la respuesta del JSON de Google
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No obtuve respuesta';
        res.json({ reply: aiReply });

    } catch (error) {
        console.error('Error al generar respuesta:', error);
        res.status(500).json({ error: error.message || 'Error al procesar la respuesta con la IA' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
>>>>>>> 54126cff02ef89982363dbe68d59acf8fb863cf5
