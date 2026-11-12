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

// === FAST MUNDIAL - 8b PRIMERO SIEMPRE, INCLUSO PARA BUSCAR ===
const MODELOS_VIVOS = [
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-2.0-flash'
];

// Para busqueda tambien 8b primero - antes usaba 2.0 lento
const MODELOS_SEARCH = [
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-2.0-flash'
];

function necesitaBusquedaWeb(texto) {
  const t = (texto || "").toLowerCase();
  const palabras = [
    'hoy', 'actualmente', 'ahora mismo', 'esta semana', 'este mes', 'este año', '2026', '2025', 'ultima hora', 'reciente', 'today', 'now',
    'noticias', 'noticia', 'news', 'que paso', 'evento', 'concierto', 'elecciones', 'election', 'guerra', 'war',
    'en cines', 'cartelera', 'estreno', 'estrenos', 'pelicula', 'movie', 'serie', 'musica', 'music', 'cancion', 'artista', 'famoso', 'netflix', 'disney',
    'partido', 'marcador', 'resultado', 'quien gano', 'mundial', 'world cup', 'futbol', 'soccer', 'nfl', 'nba', 'boxeo', 'ufc', 'champions', 'f1',
    'clima', 'weather', 'temperatura', 'temperature', 'va a llover', 'pronostico', 'forecast', 'horario', 'abierto hoy', 'que hay', 'donde queda', 'where is',
    'precio', 'price', 'cuanto cuesta', 'cuanto vale', 'how much', 'dolar', 'dollar', 'euro', 'tipo de cambio', 'exchange rate', 'bitcoin', 'crypto', 'bolsa', 'stock', 'gasolina', 'iphone', 'samsung', 'oferta',
    'salio', 'lanzamiento', 'launch', 'nuevo iphone', 'actualizacion', 'update', 'version', 'cuando sale',
    'quien es', 'who is', 'cuantos años', 'edad de', 'how old', 'murio', 'fallecio', 'died', 'biografia', 'presidente', 'president', 'papa', 'pope',
    'que es', 'what is', 'como funciona', 'how does', 'por que', 'why', 'cura', 'enfermedad', 'vacuna', 'vaccine', 'nasa', 'espacio', 'space'
  ];
  return palabras.some(p => t.includes(p));
}

// === BUSQUEDA WEB FAST MUNDIAL - 1 SOLA BUSQUEDA, CON LIMITE 2s, NO SE ESPERA ===
async function buscarEnWeb(query, ubicacionUsuario) {
  try {
    const queryFinal = ubicacionUsuario ? `${query} ${ubicacionUsuario}` : query;
    console.log(`[WEB-FAST] Buscando: ${queryFinal}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(queryFinal)}&format=json&no_html=1&skip_disambig=1`;
      const r1 = await fetch(ddgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal });
      clearTimeout(timeout);
      const j1 = await r1.json().catch(() => ({}));
      let textos = [];
      if (j1.AbstractText) textos.push(`RESUMEN: ${j1.AbstractText}`);
      if (j1.RelatedTopics) {
        j1.RelatedTopics.slice(0, 5).forEach(t => {
          if (t.Text) textos.push(`- ${t.Text}`);
        });
      }
      const resultado = textos.join('\n');
      console.log(`[WEB-FAST] Listo en <2s, ${textos.length} resultados`);
      return resultado || "SIN RESULTADOS";
    } catch (e) {
      clearTimeout(timeout);
      console.log(`[WEB-FAST] Timeout o error, sigo sin esperar: ${e.message}`);
      return "SIN RESULTADOS - seguir con conocimiento";
    }
  } catch (e) {
    return "SIN RESULTADOS";
  }
}

async function generarConReintentos(userPrompt, fullPrompt, usarBusqueda){
  let ultimoError = null;
  const ai = getAI();
  const lista = usarBusqueda ? MODELOS_SEARCH : MODELOS_VIVOS;
  for(let modelo of lista){
    for(let intento=1; intento<=1; intento++){
      try{
        console.log(`[${usarBusqueda ? 'SEARCH-FAST' : 'FAST'}] ${modelo} para: ${userPrompt.substring(0,40)}`);
        const response = await ai.models.generateContent({
          model: modelo,
          contents: fullPrompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 450,
            topP: 0.9,
            topK: 32,
            ...(usarBusqueda ? { tools: [{ googleSearch: {} }] } : {})
          }
        });
        let texto = null;
        if (typeof response.text === 'function') texto = response.text();
        else texto = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
        if(texto){
          console.log(`[${usarBusqueda ? 'SEARCH-FAST' : 'FAST'}] OK ${modelo}`);
          return { texto, modelo, busquedaWeb: usarBusqueda };
        }
        throw new Error('Sin texto');
      }catch(e){
        ultimoError = e;
        console.log(`[${usarBusqueda ? 'SEARCH-FAST' : 'FAST'}] Fallo ${modelo}: ${(e.message||'').substring(0,200)}`);
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
    const ubicacionUsuario = req.body.location || req.body.ciudad || req.body.country || req.body.ubicacion || "";
    const idiomaUsuario = req.body.language || req.body.lang || "español";

    const sys = role === "vip_patron"
      ? "Eres Duckie Guai-fai'v 🦆 mano derecha de Amado Apolonio Sosa. Saludo: Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Jerga norteña."
      : "Eres Duckie Guai-fai'v 🦆 servicial, profesional, MUNDIAL. Saludo: Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Responde RAPIDO, directo y util. Si piden receta da ingredientes y pasos corto. Si capital solo capital.";

    const usarBusqueda = necesitaBusquedaWeb(userPrompt) || req.body.searchWeb === true || req.body.web === true;
    const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric', timeZone: 'UTC' });

    let contextoWeb = "";
    if (usarBusqueda) {
      const resultados = await buscarEnWeb(userPrompt, ubicacionUsuario);
      if (resultados !== "SIN RESULTADOS" && !resultados.includes("SIN RESULTADOS")) {
        contextoWeb = `\n\n=== BUSQUEDA WEB MUNDIAL HOY ${fechaHoy} ===\nUbicacion: ${ubicacionUsuario || 'Mundial'}\nIdioma: ${idiomaUsuario}\n${resultados}\n=== FIN ===\nUsa SOLO esto. NO inventes datos que no esten arriba. Si no esta arriba, dilo y responde corto. Responde en ${idiomaUsuario}.`;
      }
    }

    const sysFinal = sys + contextoWeb;
    const fullPrompt = sysFinal + "\n\nUsuario: " + userPrompt;
    console.log(`Modo: ${usarBusqueda ? 'SEARCH-FAST-MUNDIAL' : 'FAST'} Pregunta: ${userPrompt.substring(0,60)}`);

    try{
      const { texto, modelo, busquedaWeb } = await generarConReintentos(userPrompt, fullPrompt, usarBusqueda);
      return res.json({ reply: texto, modelo: modelo, fast: true, searchWeb: busquedaWeb });
    }catch(eFinal){
      console.error(`ERROR GEMINI FINAL:`, eFinal.message);
      if(eFinal.message && eFinal.message.includes('GEMINI_API_KEY no configurada')){
        return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Configura GEMINI_API_KEY en Render Environment con tu key Tier 1 ...hfSQ Amado 🦆" });
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
  res.json({ status: "Duckie FAST VIVO + SEARCH WEB FAST MUNDIAL", keyConfigurada: hasKey, modelos: MODELOS_VIVOS, modelosSearch: MODELOS_SEARCH, fix: "FAST-MUNDIAL-2s", mode: "FAST-8b + SEARCH-FAST-MUNDIAL" });
});

app.get('/', (req,res)=> res.json({ status: "DuckieTalkPro VIVO FAST + SEARCH WEB FAST MUNDIAL - Android Ready", endpoint: "/api/chat", health: "/health" }));

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
server.listen(PORT, () => console.log(`🦆 Duckie FAST MUNDIAL ${MODELOS_VIVOS[0]} + SEARCH FAST 2s corriendo en ${PORT}`));