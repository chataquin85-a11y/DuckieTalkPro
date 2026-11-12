Const express = require('express');
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

// === LEARNING - MEMORIA PARA QUE CADA VEZ SEA MAS RAPIDO ===
const LEARNING = new Map(); // pregunta -> respuesta aprendida
const LEARNING_STATS = { hits: 0, total: 0, aprendidas: 0 };

function normalizarPregunta(texto) {
  return (texto || "").toLowerCase().trim()
    .replace(/[¿?¡!.,]/g, '')
    .replace(/\s+/g, ' ')
    .substring(0, 120);
}

function buscarEnLearning(pregunta) {
  const clave = normalizarPregunta(pregunta);
  // 1. Igualita
  if (LEARNING.has(clave)) return LEARNING.get(clave);
  // 2. Parecida - si contiene las palabras clave
  for (const [k, v] of LEARNING) {
    const palabras = clave.split(' ').filter(w => w.length > 3);
    const coincide = palabras.length > 0 && palabras.every(p => k.includes(p));
    if (coincide && palabras.length >= 2) return v;
  }
  return null;
}

function guardarEnLearning(pregunta, respuesta) {
  const clave = normalizarPregunta(pregunta);
  // No guardar saludos ni cosas muy cortas
  if (clave.length < 8) return;
  if (LEARNING.size > 500) {
    // Si ya aprendio mucho, borra la mas vieja
    const primera = LEARNING.keys().next().value;
    LEARNING.delete(primera);
  }
  LEARNING.set(clave, respuesta);
  LEARNING_STATS.aprendidas = LEARNING.size;
  console.log(`[LEARNING] Aprendido: "${clave}" - Total aprendidas: ${LEARNING.size}`);
}

const MODELOS_VIVOS = [
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-2.0-flash'
];

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
    'en cines', 'cartelera', 'estreno', 'estrenos', 'pelicula', 'movie', 'serie', 'musica', 'music', 'cancion', 'artista', 'famoso', ' 【entity-netflix¦canonical_name=netflix】', ' 【entity-disney¦canonical_name=disney】',
    'partido', 'marcador', 'resultado', 'quien gano', 'mundial', 'world cup', 'futbol', 'soccer', ' 【entity-nfl¦canonical_name=nfl】', ' 【entity-nba¦canonical_name=nba】', 'boxeo', ' 【entity-ufc¦canonical_name=ufc】', ' 【entity-champions¦canonical_name=UEFA Champions League】', ' 【entity-f1¦canonical_name=f1】',
    'clima', 'weather', 'temperatura', 'temperature', 'va a llover', 'pronostico', 'forecast', 'horario', 'abierto hoy', 'que hay', 'donde queda', 'where is',
    'precio', 'price', 'cuanto cuesta', 'cuanto vale', 'how much', 'dolar', 'dollar', 'euro', 'tipo de cambio', 'exchange rate', 'bitcoin', 'crypto', 'bolsa', 'stock', 'gasolina', 'iphone', ' 【entity-samsung¦canonical_name=samsung】', 'oferta',
    'salio', 'lanzamiento', 'launch', 'nuevo iphone', 'actualizacion', 'update', 'version', 'cuando sale',
    'quien es', 'who is', 'cuantos años', 'edad de', 'how old', 'murio', 'fallecio', 'died', 'biografia', 'presidente', 'president', 'papa', 'pope',
    'que es', 'what is', 'como funciona', 'how does', 'por que', 'why', 'cura', 'enfermedad', 'vacuna', 'vaccine', ' nasa', 'espacio', 'space'
  ];
  return palabras.some(p => t.includes(p));
}

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
      return textos.join('\n') || "SIN RESULTADOS";
    } catch (e) {
      clearTimeout(timeout);
      return "SIN RESULTADOS";
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
          return { texto, modelo, busquedaWeb: usarBusqueda };
        }
        throw new Error('Sin texto');
      }catch(e){
        ultimoError = e;
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

    // === LEARNING PRIMERO - SI YA LO APRENDIO, CONTESTA AL INSTANTE SIN IR A GEMINI ===
    LEARNING_STATS.total++;
    const aprendida = buscarEnLearning(userPrompt);
    if (aprendida && !req.body.forzarNuevo) {
      LEARNING_STATS.hits++;
      console.log(`[LEARNING] HIT - ya lo sabia, respuesta instantanea en <0.5s - Hits: ${LEARNING_STATS.hits}/${LEARNING_STATS.total}`);
      return res.json({ reply: aprendida, modelo: "learning-cache", fast: true, learning: true, learningHit: true });
    }

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
        contextoWeb = `\n\n=== BUSQUEDA WEB MUNDIAL HOY ${fechaHoy} ===\nUbicacion: ${ubicacionUsuario || 'Mundial'}\nIdioma: ${idiomaUsuario}\n${resultados}\n=== FIN ===\nUsa SOLO esto. NO inventes datos que no esten arriba. Responde en ${idiomaUsuario}.`;
      }
    }

    const sysFinal = sys + contextoWeb;
    const fullPrompt = sysFinal + "\n\nUsuario: " + userPrompt;
    console.log(`Modo: ${usarBusqueda ? 'SEARCH-FAST-MUNDIAL' : 'FAST'} - Learning miss, voy a Gemini y aprendo`);

    try{
      const { texto, modelo, busquedaWeb } = await generarConReintentos(userPrompt, fullPrompt, usarBusqueda);
      // === LEARNING: GUARDA LA RESPUESTA PARA LA PROXIMA VEZ SEA INSTANTANEA ===
      // Solo guarda si NO es de hoy / noticias / clima - eso cambia cada dia y no se debe guardar viejo
      if (!usarBusqueda) {
        guardarEnLearning(userPrompt, texto);
      }
      return res.json({ reply: texto, modelo: modelo, fast: true, searchWeb: busquedaWeb, learning: false });
    }catch(eFinal){
      console.error(`ERROR GEMINI FINAL:`, eFinal.message);
      return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Estoy reconectando mi modelo VIVO 🦆 - intenta de nuevo en 2 seg Amado!" });
    }

  } catch (e) {
    console.error("ERROR CRITICO:", e.message);
    return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Tuve un micro-corte pero ya estoy VIVO de nuevo 🦆" });
  }
});

// Ver cuanto ha aprendido Duckie
app.get('/learning', (req,res)=> res.json({ status: "Duckie Learning", ...LEARNING_STATS, aprendidas: LEARNING.size }));

app.get('/health', (req,res)=> {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ status: "Duckie FAST VIVO + SEARCH WEB FAST MUNDIAL + LEARNING", keyConfigurada: hasKey, modelos: MODELOS_VIVOS, learning: LEARNING_STATS, fix: "LEARNING-CACHE-MAS-RAPIDO", mode: "FAST-8b + SEARCH-FAST + LEARNING" });
});

app.get('/', (req,res)=> res.json({ status: "DuckieTalkPro VIVO FAST + SEARCH WEB + LEARNING - Android Ready", endpoint: "/api/chat", health: "/health", learning: "/learning" }));

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
server.listen(PORT, () => console.log(`🦆 Duckie FAST MUNDIAL ${MODELOS_VIVOS[0]} + SEARCH FAST + LEARNING corriendo en ${PORT}`));