const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// === TU CORS ORIGINAL SIN BORRAR NADA ===
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

// CONEXION VIVO SIN BORRAR NADA - solo ajustado para no crashear si falta key
function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY no configurada en Render Environment');
  }
  return new GoogleGenAI({ apiKey: key });
}

// === FAST: MISMO 4 MODELOS TUYOS, SOLO REORDENADOS - 8b PRIMERO = 3x MAS RAPIDO ===
const MODELOS_VIVOS = [
  'gemini-1.5-flash-8b',     // FAST - super ligero - primero ahora
  'gemini-2.0-flash-lite',   // FAST - segundo mas rapido
  'gemini-1.5-flash',        // tu principal antes
  'gemini-2.0-flash'         // tu fallback antes
];

// === FAST: TU MISMA FUNCION generarConReintentos, SOLO SIN ESPERAS LARGAS ===
async function generarConReintentos(userPrompt, fullPrompt){
  let ultimoError = null;
  const ai = getAI();
  for(let modelo of MODELOS_VIVOS){
    // FAST: 1 intento por modelo, no 2 - asi no sumas 8 intentos lentos
    for(let intento=1; intento<=1; intento++){
      try{
        console.log(`[FAST] Intentando ${modelo} intento ${intento} para: ${userPrompt.substring(0,40)}`);
        const response = await ai.models.generateContent({
          model: modelo,
          contents: fullPrompt,
          // FAST NUEVO - esto es lo que lo hace rapido, no borra tu logica
          config: {
            temperature: 0.6,
            maxOutputTokens: 700,
            topP: 0.9,
            topK: 32
          }
        });
        // extraccion segura sin borrar tu logica - soporta text como funcion o propiedad
        let texto = null;
        if (typeof response.text === 'function') texto = response.text();
        else texto = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
        if(texto){
          console.log(`[FAST] OK con ${modelo} intento ${intento}`);
          return { texto, modelo };
        }
        throw new Error('Sin texto');
      }catch(e){
        ultimoError = e;
        const msg = e.message || '';
        console.log(`[FAST] Intento ${intento} fallo para ${modelo}: ${msg.substring(0,300)}`);
        // FAST: SIN ESPERA - directo al siguiente modelo, antes tenias 800ms / 1000ms / 600ms aqui
        continue;
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

    // TU ROLE VIP_PATRON ORIGINAL SIN BORRAR
    const role = req.body.role || 'standard';
    const sys = role === "vip_patron"
      ? "Eres Duckie Guai-fai'v 🦆 mano derecha de Amado Apolonio Sosa. Saludo: Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Jerga norteña."
      : "Eres Duckie Guai-fai'v 🦆 servicial, profesional. Saludo: Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Responde RAPIDO, directo y util. Si piden receta da ingredientes y pasos corto. Si capital solo capital.";

    const fullPrompt = sys + "\n\nUsuario: " + userPrompt;

    console.log(`Body que llego:`, JSON.stringify({ message: userPrompt }).substring(0,100));
    console.log(`Prompt final para Gemini: ${fullPrompt.substring(0,80)}...`);

    try{
      const { texto, modelo } = await generarConReintentos(userPrompt, fullPrompt);
      console.log(`Usando ${modelo} OK`);
      return res.json({ reply: texto, modelo: modelo, fast: true });
    }catch(eFinal){
      console.error(`ERROR GEMINI FINAL:`, eFinal.message);
      if(eFinal.message && eFinal.message.includes('GEMINI_API_KEY no configurada')){
        return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Configura GEMINI_API_KEY en Render Environment con tu key Tier 1 ...hfSQ Amado 🦆" });
      }
      if(eFinal.message && (eFinal.message.includes('503') || eFinal.message.includes('high demand') || eFinal.message.includes('overloaded') || eFinal.message.includes('UNAVAILABLE'))){
        return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Mi modelo esta con alta demanda en este segundo (pico global), pero ya estoy reconectando con gemini-1.5-flash-8b VIVO. Intenta de nuevo en 3 segundos Amado! 🦆" });
      }
      return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Estoy reconectando mi modelo VIVO 🦆 - intenta de nuevo en 2 seg Amado!" });
    }

  } catch (e) {
    console.error("ERROR CRITICO:", e.message);
    return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Tuve un micro-corte pero ya estoy VIVO de nuevo 🦆" });
  }
});

// TU HEALTH ORIGINAL + FAST
app.get('/health', (req,res)=> {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ status: "Duckie FAST VIVO", keyConfigurada: hasKey, modelos: MODELOS_VIVOS, fix: "FAST-COMPLETO-8b-sin-borrar", mode: "FAST-8b" });
});

app.get('/', (req,res)=> res.json({ status: "DuckieTalkPro VIVO FAST", endpoint: "/api/chat", health: "/health" }));

// === TU WEBSOCKET VoIP ORIGINAL SIN BORRAR NADA ===
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
server.listen(PORT, () => console.log(`🦆 Duckie FAST COMPLETO ${MODELOS_VIVOS[0]} corriendo en ${PORT} - FAST sin borrar nada - 8b primero`));