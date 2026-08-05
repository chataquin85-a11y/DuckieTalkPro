Const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());

// Allows your GitHub Pages app (www.duckiethemus.com) to talk safely to Render
app.use(cors({
    origin: ['https://duckiethemus.com', 'https://github.io']
}));

app.post('/api/chat', async (req, res) => {
    try {
        const { mensaje } = req.body;

        // Pulls your key safely from Render's hidden Environment Variables
        const apiKey = process.env.AI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "Missing Groq API Key configuration on Render." });
        }

        // Direct connection to the official Groq API endpoint
        const respuestaIA = await fetch('https://groq.com', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: mensaje }],
                stream: true
            })
        });

        // Set up streaming response headers back to your iPad/iPhone interface
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Pipe the stream straight back to your client frontend application
        respuestaIA.body.pipe(res);

    } catch (error) {
        console.error("Error processing AI request:", error);
        res.status(500).json({ error: "Error procesando la solicitud de IA" });
    }
});

// Port configuration for Render deployment environment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend seguro corriendo en el puerto ${PORT}`);
});