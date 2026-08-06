const express = require('express');
const axios = require('axios'); // Motor profesional ultra compatible con la nube
const app = express();
const PORT = process.env.PORT || 3000;

// Permiso de pase libre (CORS) integrado
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Ruta unificada conectada de forma infalible con Groq
app.post('/api/chat', async (req, res) => {
    try {
        const { mensaje } = req.body;
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "Falta la llave GROQ_API_KEY en el servidor." });
        }

        // Conexión estable usando axios (evita el error de fetch en Render)
        const respuestaIA = await axios.post('https://groq.com', {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: mensaje }]
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (respuestaIA.data && respuestaIA.data.choices && respuestaIA.data.choices[0].message) {
            res.json({ reply: respuestaIA.data.choices[0].message.content });
        } else {
            res.json({ error: "Estructura inesperada de la IA." });
        }

    } catch (error) {
        console.error("Error procesando solicitud:", error.message);
        res.status(500).json({ error: "Error procesando la solicitud de IA." });
    }
});

app.listen(PORT, () => {
    console.log(`Backend seguro corriendo en el puerto ${PORT}`);
});
