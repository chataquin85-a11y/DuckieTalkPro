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

// FIX para foto E2A84C28 - 503 high demand - ahora prueba 4 modelos en orden
const MODELOS_VIVOS = [
  'gemini-1.5-flash',        // 1500/dia - principal
  'gemini-2.0-flash-lite',   // 1500/dia - fallback 1 (menos saturado)
  'gemini-1.5-flash-8b',     // 1500/dia - fallback 2 (super ligero)
  'gemini-2.0-flash'         // 1500/dia - fallback 3
];

async function generarConReintentos(userPrompt, fullPrompt){
  let ultimoError = null;
  for(let modelo of MODELOS_VIVOS){
    for(let intento=1; intento<=2; intento++){
      try{
        console.log(`[vxjto] Intentando ${modelo} intento ${intento} para: ${userPrompt.substring(0,40)}`);
        const response = await ai.models.generateContent({
          model: modelo,
          contents: fullPrompt,
        });
        const texto = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
        if(texto){
          console.log(`[vxjto] OK con ${modelo} intento ${intento}`);
          return { texto, modelo };
        }
        throw new Error('Sin texto');
      }catch(e){
        ultimoError = e;
        const msg = e.message || '';
        console.log(`[vxjto] Intento ${intento} fallo para ${modelo}: ${msg.substring(0,200)}`);
        if(msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')){
          await new Promise(r=>setTimeout(r, 800*intento));
          continue;
        }
        if(msg.includes('429') || msg.includes('quota')){
          await new Promise(r=>setTimeout(r, 1000));
          break;
        }
        await new Promise(r=>setTimeout(r, 600*intento));
      }
    }
  }
  throw ultimoError || new Error('Todos los modelos fallaron');
}

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

    console.log(`Body que llego:`, JSON.stringify({ message: userPrompt }).substring(0,100));
    console.log(`Prompt final para Gemini: ${fullPrompt.substring(0,80)}...`);

    try{
      const { texto, modelo } = await generarConReintentos(userPrompt, fullPrompt);
      console.log(`Usando ${modelo} OK`);
      return res.json({ reply: texto });
    }catch(eFinal){
      console.error(`ERROR GEMINI FINAL:`, eFinal.message);
      if(eFinal.message && (eFinal.message.includes('503') || eFinal.message.includes('high demand'))){
        return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Mi modelo esta con alta demanda en este segundo (pico global), pero ya estoy reconectando con gemini-1.5-flash-8b VIVO. Intenta de nuevo en 3 segundos Amado! 🦆" });
      }
      return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Estoy reconectando mi modelo VIVO 🦆 - intenta de nuevo en 2 seg Amado!" });
    }

  } catch (e) {
    console.error("ERROR CRITICO:", e.message);
    return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Tuve un micro-corte pero ya estoy VIVO de nuevo 🦆" });
  }
});

app.get('/health', (req,res)=> res.json({ status: "Duckie VIVO", modelos: MODELOS_VIVOS, fix: "E2A84C28-503" }));

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
server.listen(PORT, () => console.log(`Duckie Backend VIVO ${MODELOS_VIVOS[0]} corriendo en ${PORT} - Fix E2A84C28 503`));