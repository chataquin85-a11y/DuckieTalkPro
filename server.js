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

// === SEARCH WEB GENERAL Y MUNDIAL - PARA TODOS LOS PAISES, APP PARA ANDROID ===
function necesitaBusquedaWeb(texto) {
  const t = (texto || "").toLowerCase();
  const palabras = [
    // Tiempo / actualidad - mundial
    'hoy', 'actualmente', 'ahora mismo', 'en este momento', 'esta semana', 'este mes', 'este año', '2026', '2025', 'ultima hora', 'reciente', 'recientes', 'today', 'now', 'currently',
    // Noticias / eventos - mundial
    'noticias', 'noticia', 'news', 'que paso', 'que pasa', 'evento', 'eventos', 'concierto', 'conferencia', 'elecciones', 'election', 'guerra', 'war', 'accidente', 'sismo', 'terremoto', 'huracan',
    // Cines / entretenimiento - mundial
    'en cines', 'cartelera', 'estreno', 'estrenos', 'peliculas hay', 'pelicula', 'movie', 'serie', 'series', 'musica', 'music', 'cancion', 'song', 'artista', 'famoso', 'celebridad', 'youtuber', 'tiktok', 'netflix', 'disney',
    // Deportes - mundial
    'partido', 'partido de hoy', 'marcador', 'resultado', 'quien gano', 'mundial', 'world cup', 'futbol', 'soccer', 'nfl', 'nba', 'boxeo', 'boxing', 'ufc', 'liga mx', 'champions', 'f1', 'formula 1',
    // Clima / lugares - mundial
    'clima', 'weather', 'temperatura', 'temperature', 'va a llover', 'pronostico', 'forecast', 'horario', 'abierto hoy', 'que hay', 'hay en', 'donde queda', 'donde esta', 'where is',
    // Dinero / precios - mundial
    'precio', 'price', 'cuanto cuesta', 'cuanto vale', 'how much', 'dolar', 'dollar', 'euro', 'tipo de cambio', 'exchange rate', 'bitcoin', 'crypto', 'bolsa', 'stock', 'gasolina', 'gas price', 'iphone', 'samsung', 'carro', 'oferta', 'descuento',
    // Tecnologia / productos - mundial
    'salio', 'lanzamiento', 'launch', 'nuevo iphone', 'nuevo samsung', 'actualizacion', 'version', 'cuando sale', 'when is',
    // Personas / datos reales - mundial
    'quien es', 'who is', 'cuantos años', 'edad de', 'how old', 'murio', 'fallecio', 'died', 'biografia', 'biography', 'cuanto mide', 'presidente', 'president', 'gobernador', 'alcalde', 'papa', 'pope',
    // Salud / ciencia / general factual - mundial
    'que es', 'what is', 'como funciona', 'how does', 'por que', 'why', 'cura', 'enfermedad', 'disease', 'vacuna', 'vaccine', 'descubrimiento', 'nasa', 'espacio', 'space'
  ];
  return palabras.some(p => t.includes(p));
}

// === BUSQUEDA WEB GENERAL Y MUNDIAL - SIN CIUDAD FIJA, BUSCA LO QUE SEA EN CUALQUIER PAIS ===
async function buscarEnWeb(query, ubicacionUsuario) {
  try {
    console.log(`[WEB-MUNDIAL] Buscando en internet: ${query} | ubicacion: ${ubicacionUsuario || 'Mundial'}`);
    const queryFinal = ubicacionUsuario ? `${query} ${ubicacionUsuario}` : query;
    
    // 1. DuckDuckGo - gratis, sin key - mundial
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(queryFinal)}&format=json&no_html=1&skip_disambig=1`;
    const r1 = await fetch(ddgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const j1 = await r1.json().catch(() => ({}));
    let textos = [];
    if (j1.AbstractText) textos.push(`RESUMEN: ${j1.AbstractText} - Fuente: ${j1.AbstractURL || ''}`);
    if (j1.RelatedTopics) {
      j1.RelatedTopics.slice(0, 10).forEach(t => {
        if (t.Text) textos.push(`- ${t.Text} (${t.FirstURL || ''})`);
      });
    }

    // 2. Wikipedia en español + ingles - mundial
    for (const lang of ['es', 'en']) {
      try {
        const wikiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3`;
        const r2 = await fetch(wikiUrl, { headers: { 'User-Agent': 'DuckieTalkPro/1.0' } });
        const j2 = await r2.json().catch(() => ({}));
        if (j2.query && j2.query.search) {
          j2.query.search.forEach(s => {
            const limpio = (s.snippet || '').replace(/<[^>]*>/g, '');
            textos.push(`- WIKI-${lang.toUpperCase()} ${s.title}: ${limpio}`);
          });
        }
      } catch {}
    }
    const resultado = textos.join('\n');
    console.log(`[WEB-MUNDIAL] Encontrado ${textos.length} resultados para: ${queryFinal}`);
    return resultado || "SIN RESULTADOS EN BUSQUEDA WEB";
  } catch (e) {
    console.log(`[WEB-MUNDIAL] Error buscando: ${e.message}`);
    return "SIN RESULTADOS EN BUSQUEDA WEB - error de red";
  }
}

async function generarConReintentos(userPrompt, fullPrompt, usarBusqueda){
  let ultimoError = null;
  const ai = getAI();
  const lista = usarBusqueda ? MODELOS_SEARCH : MODELOS_VIVOS;
  for(let modelo of lista){
    for(let intento=1; intento<=1; intento++){
      try{
        console.log(`[${usarBusqueda ? 'SEARCH-WEB-MUNDIAL' : 'FAST'}] Intentando ${modelo} para: ${userPrompt.substring(0,40)}`);
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
          console.log(`[${usarBusqueda ? 'SEARCH-WEB-MUNDIAL' : 'FAST'}] OK con ${modelo}`);
          return { texto, modelo, busquedaWeb: usarBusqueda };
        }
        throw new Error('Sin texto');
      }catch(e){
        ultimoError = e;
        console.log(`[${usarBusqueda ? 'SEARCH-WEB-MUNDIAL' : 'FAST'}] Fallo ${modelo}: ${(e.message||'').substring(0,300)}`);
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
      contextoWeb = `\n\n=== RESULTADOS REALES DE BUSQUEDA WEB GENERAL Y MUNDIAL HOY ${fechaHoy} ===\nUbicacion del usuario: ${ubicacionUsuario || 'No especificada - busca a nivel MUNDIAL'}\nIdioma del usuario: ${idiomaUsuario} - responde en ese idioma.\n${resultados}\n=== FIN DE RESULTADOS ===\nREGLA OBLIGATORIA GENERAL Y MUNDIAL: Esta app es para usuarios de TODO EL MUNDO en Android. Usa SOLO estos resultados para responder. NO uses tu memoria vieja. NO inventes datos, fechas, precios, nombres, peliculas, resultados o horarios que NO aparezcan arriba. Si arriba dice SIN RESULTADOS o no hay informacion de eso hoy, dilo claramente: "Hoy no encontre informacion actual de eso en la busqueda mundial" y da solo lo que SI esta arriba.`;
    }

    const sysFinal = sys + contextoWeb;
    const fullPrompt = sysFinal + "\n\nUsuario: " + userPrompt;

    console.log(`Modo: ${usarBusqueda ? 'SEARCH-WEB-MUNDIAL' : 'FAST'} Fecha: ${fechaHoy} Ubicacion: ${ubicacionUsuario || 'Mundial'} Pregunta: ${userPrompt.substring(0,60)}`);

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
  res.json({ status: "Duckie FAST VIVO + SEARCH WEB MUNDIAL", keyConfigurada: hasKey, modelos: MODELOS_VIVOS, modelosSearch: MODELOS_SEARCH, fix: "SEARCH-WEB-MUNDIAL-COMPLETO", mode: "FAST-8b + SEARCH-WEB-MUNDIAL" });
});

app.get('/', (req,res)=> res.json({ status: "DuckieTalkPro VIVO FAST + SEARCH WEB MUNDIAL", endpoint: "/api/chat", health: "/health" }));

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
server.listen(PORT, () => console.log(`🦆 Duckie FAST COMPLETO ${MODELOS_VIVOS[0]} + SEARCH WEB MUNDIAL corriendo en ${PORT}`));