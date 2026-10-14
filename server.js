const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors({
  origin: [
    "https://duckie-guai-faiv-app.web.app",
    "https://www.duckiethemus.com",
    "https://duckiethemus.com",
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options('*', cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// MODELO QUE SI DEJA GOOGLE GRATIS OCT 2026 - FIX PARA TU FOTO BAB8E6C0
const MODELO_VIVO = 'gemini-1.5-flash';

app.post('/api/chat', async (req, res) => {
  try {
    let userPrompt = req.body.message || req.body.text || "";
    if (req.body.messages && Array.isArray(req.body.messages)) {
      const last = [...req.body.messages].reverse().find(m => m.role === 'user');
      if (last) userPrompt = last.parts || last.content || userPrompt;
    }
    if (!userPrompt) return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy 🦆" });

    const role = req.body.role || 'standard';
    const sys = role === "vip_patron"
      ? "Eres Duckie Guai-fai'v 🦆 mano derecha de Amado Apolonio Sosa. Saludo: Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Jerga norteña."
      : "Eres Duckie Guai-fai'v 🦆 servicial, profesional. Saludo: Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy.";

    const fullPrompt = sys + "\n\nUsuario: " + userPrompt;

    console.log(`Usando ${MODELO_VIVO} para:`, userPrompt);

    const response = await ai.models.generateContent({
      model: MODELO_VIVO,
      contents: fullPrompt,
    });

    return res.json({ reply: response.text });

  } catch (e) {
    console.error("ERROR:", e.message);
    // Si falla, intenta el lite que nunca falla
    try {
      const fallback = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: req.body.message || "Hola",
      });
      return res.json({ reply: fallback.text });
    } catch {
      return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Estoy reconectando mi modelo VIVO 🦆 - intenta de nuevo en 2 seg Amado!" });
    }
  }
});

const connectedUsers = new Map();
wss.on('connection', (ws) => {
  let currentUser = null;
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'register') {
        currentUser = data.userId;
        connectedUsers.set(currentUser, ws);
      } else if (['offer','answer','candidate'].includes(data.type)) {
        const targetSocket = connectedUsers.get(data.target);
        if (targetSocket?.readyState === WebSocket.OPEN) {
          targetSocket.send(JSON.stringify({ type: data.type, from: currentUser, payload: data.payload }));
        }
      }
    } catch {}
  });
  ws.on('close', () => { if (currentUser) connectedUsers.delete(currentUser); });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Duckie Backend VIVO ${MODELO_VIVO} corriendo en ${PORT}`));