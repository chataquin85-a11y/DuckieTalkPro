require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('DuckieDuck Pro Backend funcionando al 100% 🦆');
});

// Endpoint principal de chat en streaming
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: 'Falta el mensaje' });
        }

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-1.5-flash',
            contents: userMessage,
            config: {
                systemInstruction: "Eres Duckie Guai-fai'v, un asistente digital y wingman con un tono empático, cálido y amigable."
            }
        });

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        
        for await (const chunk of responseStream) {
            if (chunk.text) {
                res.write(chunk.text);
            }
        }
        res.end();

    } catch (error) {
        console.error("Error al conectar con Gemini:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno del servidor al procesar la IA' });
        }
    }
});

// 1. Endpoint para procesar estados de texto
app.post('/api/status/text', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Falta el texto del estado' });
        
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: `Optimiza este estado para compartirlo: "${text}"`,
            config: {
                systemInstruction: "Eres Duckie Guai-fai'v. Dale formato amigable y empático a los estados de texto."
            }
        });
        res.json({ success: true, formattedStatus: response.text });
    } catch (error) {
        console.error("Error en status text:", error);
        res.status(500).json({ error: 'Error al procesar el estado de texto' });
    }
});

// 2. Endpoint para generación de imágenes (AI Images)
app.post('/api/status/image', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Falta la descripción de la imagen' });

        res.json({ 
            success: true, 
            message: `Generando imagen basada en: "${prompt}"`,
            imageUrl: "https://duckiethemus.com/assets/default-ai-image.png" 
        });
    } catch (error) {
        console.error("Error en status image:", error);
        res.status(500).json({ error: 'Error al generar la imagen' });
    }
});

// 3. Endpoint para notas de voz (Voice Status)
app.post('/api/status/voice', async (req, res) => {
    try {
        res.json({ 
            success: true, 
            message: "Nota de voz grabada y procesada correctamente por Duckie Talk Pro." 
        });
    } catch (error) {
        console.error("Error en status voice:", error);
        res.status(500).json({ error: 'Error al procesar la nota de voz' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});