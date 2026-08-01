const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fetch = require('node-fetch');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.post('/api/chat', async (req, res) => {
    try {
        const { contents, mensaje, message, prompt } = req.body;

        let formattedContents = [];

        if (contents && Array.isArray(contents)) {
            formattedContents = contents;
        } else {
            const userMessage = mensaje || message || prompt;
            if (!userMessage) {
                return res.status(400).json({ error: "No se proporcionó ningún mensaje." });
            }
            formattedContents = [{
                role: "user",
                parts: [{ text: userMessage }]
            }];
        }

        const respuestaIA = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: formattedContents
            })
        });

        const data = await respuestaIA.json();

        if (data.error) {
            console.error("❌ ERROR REAL DE GOOGLE:", data.error);
            return res.status(respuestaIA.status).json({ error: data.error.message || "Error en la API de Google" });
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            const aiReply = data.candidates[0].content.parts[0].text;
            res.json({ reply: aiReply });
        } else {
            console.log("⚠️ Estructura inesperada de Google:", data);
            res.status(500).json({ error: "Estructura de respuesta inesperada" });
        }

    } catch (error) {
        console.error("❌ Error detallado en servidor:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});