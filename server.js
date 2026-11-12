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

function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY no configurada en Render Environment');
  }
  return new GoogleGenAI({ apiKey: key });
}

const MODELOS_VIVOS = [
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-2.0-flash'
];

const MODELOS_SEARCH = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite'
];

function necesitaBusquedaWeb(texto) {
  const t = (texto || "").toLowerCase();
  const palabras = [
    'hoy', 'actualmente', 'ahora mismo', 'en este momento',
    'en cines', 'cartelera', 'estreno', 'estrenos', 'peliculas hay',
    'noticias', 'noticia', 'ultima hora', 'que paso',
    'clima', 'temperatura', 'va a llover',
    'precio', 'cuanto cuesta', 'dolar', 'tipo de cambio',
    '2026', '2025', 'esta semana', 'este mes', 'este año',
    'quien gano', 'resultado', 'partido de hoy', 'marcador',
    'que hay', 'hay en', 'abierto hoy', 'horario de hoy'
  ];
  return palabras.some(p => t.includes(p));
}

async function generarConReintentos(userPrompt, fullPrompt, usarBusqueda){
  let ultimoError = null;
  const ai = getAI();
  const lista = usarBusqueda ? MODELOS_SEARCH : MODELOS_VIVOS;
  for(let modelo of lista){
    for(let intento=1; intento<=1; intento++){
      try{
        console.log(`[${usarBusqueda ? 'SEARCH-WEB' : 'FAST'}] Intentando ${modelo} para: ${userPrompt.substring(0,40)}`);
        const response = await ai.models.generateContent({
          model: modelo,
          contents: fullPrompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 800,
            topP: 0.9,
            topK: 32,
            ...(usarBusqueda ? { tools: [{ googleSearch: {} }] } : {})
          }
        });
        let texto = null;
        if (typeof response.text === 'function') texto = response.text();
        else texto = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
        if(texto){
          console.log(`[${usarBusqueda ? 'SEARCH-WEB' : 'FAST'}] OK con ${modelo}`);
          return { texto, modelo, busquedaWeb: usarBusqueda };
        }
        throw new Error('Sin texto');
      }catch(e){
        ultimoError = e;
        console.log(`[${usarBusqueda ? 'SEARCH-WEB' : 'FAST'}] Fallo ${modelo}: ${(e.message||'').substring(0,300)}`);
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

    const role = req.body.role || 'standard';
    const sys = role === "vip_patron"
      ? "Eres Duckie Guai-fai'v 🦆 mano derecha de Amado Apolonio Sosa. Saludo: Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Jerga norteña."
      : "Eres Duckie Guai-fai'v 🦆 servicial, profesional. Saludo: Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Responde RAPIDO, directo y util. Si piden receta da ingredientes y pasos corto. Si capital solo capital.";

    const usarBusqueda = necesitaBusquedaWeb(userPrompt) || req.body.searchWeb === true || req.body.web === true;

    // === CANDADO ANTI-INVENTO NUEVO ===
    const fechaHoy = new Date().toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const sysFinal = usarBusqueda
      ? sys + `\n\nHOY ES: ${fechaHoy} - San Diego, California. REGLA OBLIGATORIA: Usa SOLO los resultados de la busqueda web de Google que acabas de hacer. NO uses tu memoria vieja. NO inventes peliculas. Si en la busqueda NO aparece ninguna pelicula de Marvel en cartelera HOY en San Diego, di claramente: "Hoy no hay ninguna pelicula de Marvel en cartelera en San Diego" y luego da los proximos estrenos de Marvel que SI salgan en la busqueda. Nunca digas Deadpool & Wolverine, Venom, Kraven como si fueran de hoy si la busqueda no lo confirma.`
      : sys;

    const fullPrompt = sysFinal + "\n\nUsuario: " + userPrompt;

    console.log(`Body que llego:`, JSON.stringify({ message: userPrompt }).substring(0,100));
    console.log(`Modo: ${usarBusqueda ? 'SEARCH-WEB' : 'FAST'} Fecha: ${fechaHoy}`);

    try{
      const { texto, modelo, busquedaWeb } = await generarConReintentos(userPrompt, fullPrompt, usarBusqueda);
      console.log(`Usando ${modelo} OK busquedaWeb=${busquedaWeb}`);
      return res.json({ reply: texto, modelo: modelo, fast: !busquedaWeb, searchWeb: busquedaWeb });
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

app.get('/health', (req,res)=> {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ status: "Duckie FAST VIVO + SEARCH WEB ANTI-INVENTO", keyConfigurada: hasKey, modelos: MODELOS_VIVOS, modelosSearch: MODELOS_SEARCH, fix: "SEARCH-WEB-ANTI-INVENTO-FECHA-HOY", mode: "FAST-8b + SEARCH-WEB" });
});

app.get('/', (req,res)=> res.json({ status: "DuckieTalkPro VIVO FAST + SEARCH WEB", endpoint: "/api/chat", health: "/health" }));

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
server.listen(PORT, () => console.log(`🦆 Duckie FAST COMPLETO ${MODELOS_VIVOS[0]} + SEARCH WEB ANTI-INVENTO corriendo en ${PORT}`));