const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai'); // <-- Ojo aquí con el nombre nuevo

const app = express();

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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // <-- Instanciación nueva

app.post('/api/chat', async (req, res) => {
try {
console.log("Body que llegó:", req.body);
let userMessage = "";
if (req.body.messages && Array.isArray(req.body.messages)) {
const lastMsg = req.body.messages[req.body.messages.length - 1];
userMessage = lastMsg.content || "";
} else {
userMessage = req.body.message || req.body.text || "";
}
if (!userMessage) {
return res.status(400).json({ error: "No me mandaste ningún mensaje válido, pariente." });
}

// Llamada adaptada al SDK nuevo de Google Gen AI
const response = await ai.models.generateContent({
  model: 'gemini-1.5-flash',
  contents: `Eres Duckie Guai-fai'v 🧠. El fiel asistente de Amado Apolonio Simom. Responde directo, empático, con tono norteño y servicial.\n\nUsuario: ${userMessage}`,
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
