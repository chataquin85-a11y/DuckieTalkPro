const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const fullPrompt = "Eres Duckie Guai-fai'v 🧠. El fiel asistente de Amado Apolonio Simom. Responde directo, empático, con tono norteño y servicial.\n\nUsuario: " + userMessage;
const result = await model.generateContent(fullPrompt);
const responseText = result.response.text();
res.json({ reply: responseText });
} catch (e) {
console.error("ERROR GEMINI:", e);
res.status(500).json({ error: e.message });
}
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log("Servidor Duckie Backend corriendo en puerto " + PORT);
});
