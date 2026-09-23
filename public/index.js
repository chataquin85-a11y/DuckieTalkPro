const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // O la carpeta donde tengas tus archivos estáticos si aplica

// Inicializar la API de Gemini usando la variable segura de Render
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Endpoint que recibirá las preguntas desde tu index.html
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ reply: "¡Quack! El mensaje está vacío." });
        }

        // Llamada oficial al modelo de Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("Error al procesar con Gemini:", error);
        res.status(500).json({ reply: "¡Quack! Hubo un error conectando con el servidor de la IA." });
    }
});

app.listen(port, () => {
    console.log(`DuckieTalkPro backend corriendo en el puerto ${port}`);
});
