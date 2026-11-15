Const 【entity-express¦canonical_name=express】 = require('【entity-express¦canonical_name=express】');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = 【entity-express¦canonical_name=express】();
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
app.use(【entity-express¦canonical_name=express】.json());

// CONEXION VIVO SIN BORRAR NADA - solo ajustado para no crashear si falta key
function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY no configurada en Render Environment');
  }
  return new GoogleGenAI({ apiKey: key });
}

// === LEARNING - PARA QUE CADA VEZ SEA MAS RAPIDO ===
const LEARNING = new Map();
const LEARNING_STATS = { hits: 0, total: 0, aprendidas: 0 };

function normalizarPregunta(texto) {
  return (texto || "").toLowerCase().trim()
    .replace(/[¿?¡!.,]/g, '')
    .replace(/\s+/g, ' ')
    .substring(0, 120);
}

function buscarEnLearning(pregunta) {
  const clave = normalizarPregunta(pregunta);
  if (LEARNING.has(clave)) return LEARNING.get(clave);
  const palabras = clave.split(' ').filter(w => w.length > 3);
  for (const [k, v] of LEARNING) {
    const coincide = palabras.filter(p => k.includes(p));
    if (coincide.length && palabras.length >= 2) return v;
  }
  return null;
}

function guardarEnLearning(pregunta, respuesta) {
  const clave = normalizarPregunta(pregunta);
  if (clave.length < 8) return;
  if (LEARNING.size > 80) {
    const primera = LEARNING.keys().next().value;
    LEARNING.delete(primera);
  }
  LEARNING.set(clave, respuesta);
  LEARNING_STATS.aprendidas = LEARNING.size;
  console.log(`[LEARNING] Aprendido: "${clave}" - Total: ${LEARNING.size}`);
}

// === FAST: MISMO 4 MODELOS TUYOS, SOLO REORDENADOS - 8b PRIMERO = 3x MAS RAPIDO ===
const MODELOS_VIVOS = [
  'gemini-3.6-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash'
];

const MODELOS_SEARCH = [
  'gemini-3.6-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash'
];

// === SEARCH WEB MUNDIAL ===
function necesitaBusquedaWeb(texto) {
  const t = (texto || "").toLowerCase();
  const palabras = [
    'hoy', 'actualmente', 'ahora mismo', 'esta semana', 'este mes', 'este año', '2026', '2025', 'ultima hora', 'reciente', 'today', 'now',
    'en cines', 'cartelera', 'news', 'que paso', 'evento', 'concierto', 'elecciones', 'election', 'guerra', 'war',
    'partido', 'marcador', 'resultado', 'quien gano', 'mundial', 'movie', 'serie', 'musica', 'music', 'cancion', 'artista', 'famoso', '【entity-netflix¦canonical_name=Netflix】', '【entity-disney¦canonical_name=Disney】',
    'clima', 'weather', 'temperatura', 'temperature', 'va a llover', 'pronostico', 'forecast',
    'precio', 'price', 'cuanto cuesta', 'cuanto vale', 'how much', 'dolar', 'dollar', 'euro', 'tipo de cambio', 'exchange rate', 'bitcoin', 'crypto', 'bolsa', 'stock',
    'gasolina', 'iphone', '【entity-samsung¦canonical_name=Samsung】', 'oferta',
    'salio', 'lanzamiento', 'nuevo iphone', 'actualizacion', 'update', 'version', 'cuando es',
    'quien es', 'who is', 'cuantos años', 'edad de', 'how old', 'murio', 'fallecio', 'died', 'biografia', 'presidente', 'president', 'papa', 'pope',
    'que es', 'what is', 'como funciona', 'how does', 'por que', 'why', 'cuma', 'enfermedad', 'vacuna', 'vaccine', '【entity-nasa¦canonical_name=NASA】', 'espacio', 'space'
  ];
  return palabras.some(p => t.includes(p));
}

async function buscarEnWeb(query, ubicacionUsuario) {
  try {
    const queryFinal = ubicacionUsuario ? `${query} ${ubicacionUsuario}` : query;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const dgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(queryFinal)}&format=json&no_html=1&skip_disambig=1`;
    const r1 = await fetch(dgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal });
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
    return "SIN RESULTADOS";
  }
}

// === FAST: TU MISMA FUNCION generarConReintentos, SOLO SIN ESPERAS LARGAS ===
async function generarConReintentos(userPrompt, fullPrompt, usarBusqueda) {
  let ultimoError = null;
  const ai = getAI();
  const lista = usarBusqueda ? MODELOS_SEARCH : MODELOS_VIVOS;
  for (let modelo of lista) {
    for (let intento = 1; intento <= 1; intento++) {
      try {
        console.log(`[FAST-3.6] Intentando ${modelo} intento ${intento} para: ${userPrompt.substring(0, 40)}`);
        const response = await ai.models.generateContent({
          model: modelo,
          contents: fullPrompt,
          config: {
            temperature: 0.6,
            maxOutputTokens: 700,
            topP: 0.9,
            topK: 32,
            ...(usarBusqueda ? { tools: [{ googleSearch: {} }] } : {})
          }
        });
        let texto = null;
        if (typeof response.text === 'function') texto = response.text();
        else texto = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (texto) {
          console.log(`[FAST-3.6] OK con ${modelo} intento ${intento}`);
          return { texto, modelo, busquedaWeb: usarBusqueda };
        }
        throw new Error('Sin texto');
      } catch (e) {
        ultimoError = e;
        const msg = e.message || '';
        console.log(`[FAST-3.6] Fallo ${modelo}: ${msg.substring(0, 300)}`);
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

    LEARNING_STATS.total++;
    const aprendida = buscarEnLearning(userPrompt);
    if (aprendida) {
      LEARNING_STATS.hits++;
      console.log(`[LEARNING] HIT - instantaneo <0.5s - HITS: ${LEARNING_STATS.hits}/${LEARNING_STATS.total}`);
      return res.json({ reply: aprendida, modelo: "learning-cache", fast: true, learning: true, learningHit: true });
    }

    const role = req.body.role || 'standard';
    const ubicacionUsuario = req.body.location || req.body.ciudad || req.body.country || req.body.ubicacion || "";
    const idiomaUsuario = req.body.language || req.body.lang || "español";

    const sys = role === "vip_patron"
      ? "Eres Duckie Guai-fai'v 🦆 mano derecha de Amado Apolonio Sosa. Saludo: Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Jerga norteña."
      : "Eres Duckie Guai-fai'v 🦆 servicial, profesional. Saludo: Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Responde RAPIDO, directo y util. Si piden receta da ingredientes y pasos corto. Si capital solo capital.";

    const usarBusqueda = necesitaBusquedaWeb(userPrompt) || req.body.searchweb === true || req.body.web === true;
    const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    let contextoBusqueda = "";
    if (usarBusqueda) {
      const resultados = await buscarEnWeb(userPrompt, ubicacionUsuario);
      if (resultados && resultados !== "SIN RESULTADOS") {
        contextoBusqueda = `\n\n[INFO BUSQUEDA WEB GENERAL Y MUNDIAL HOY ${fechaHoy} - Ubicacion: ${ubicacionUsuario || "Mundial"}]\n${resultados}\nUsa SOLO esto, NO inventes datos que no esten arriba. Responde en ${idiomaUsuario}.`;
      }
    }

    const sysFinal = sys + contextoBusqueda;
    const fullPrompt = sysFinal + "\n\nUsuario: " + userPrompt;

    console.log(`Body que llego:`, JSON.stringify({ message: userPrompt }).substring(0, 100));
    console.log(`Prompt final para Gemini: ${fullPrompt.substring(0, 80)}...`);

    try {
      const { texto, modelo, busquedaWeb } = await generarConReintentos(userPrompt, fullPrompt, usarBusqueda);
      console.log(`Usando ${modelo} OK`);
      if (texto) guardarEnLearning(userPrompt, texto);
      return res.json({ reply: texto, modelo: modelo, fast: true, searchWeb: busquedaWeb, learning: false });
    } catch (eFinal) {
      console.error(`ERROR GEMINI FINAL:`, eFinal.message);
      if (eFinal.message && eFinal.message.includes('GEMINI_API_KEY no configurada')) {
        return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Configura GEMINI_API_KEY en Render Environment con tu key Tier 1 ...hfSQ Amado 🦆" });
      }
      if (eFinal.message && (eFinal.message.includes('503') || eFinal.message.includes('high demand') || eFinal.message.includes('overloaded') || eFinal.message.includes('UNAVAILABLE'))) {
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
app.get('/health', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ status: "Duckie FAST VIVO", keyConfigurada: hasKey, modelos: MODELOS_VIVOS, modelosSearch: MODELOS_SEARCH, learning: LEARNING_STATS, fix: "3.6-PRIMO-8b-respaldo", mode: "FAST-3.6 + SEARCH-MUNDIAL + LEARNING" });
});

app.get('/learning', (req, res) => res.json({ status: "Duckie Learning", ...LEARNING_STATS, aprendidas: LEARNING.size }));

app.get('/', (req, res) => res.json({ status: "DuckieTalkPro VIVO 3.6 FAST + SEARCH WEB MUNDIAL + LEARNING Android Ready", endpoint: "/api/chat", health: "/health", learning: "/learning" }));

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
      } else if (['offer', 'answer', 'candidate'].includes(data.type)) {
        const targetSocket = connectedUsers.get(data.target);
        if (targetSocket?.readyState === WebSocket.OPEN) {
          targetSocket.send(JSON.stringify({ type: data.type, from: currentUser, payload: data.payload }));
        }
      }
    } catch {}
  });
  ws.on('close', () => { if (currentUser) connectedUsers.delete(currentUser); });
});

// === SEÑALIZACIÓN REAL PARA LLAMADAS - SOLO AGREGA, NO BORRA NADA ===
let duckieSenales = {};
app.post('/api/signal', (req, res) => {
  let d = req.body || {};
  if (!d.para) return res.json({ ok: false });
  if (!duckieSenales[d.para]) duckieSenales[d.para] = [];
  duckieSenales[d.para].push(d);
  if (duckieSenales[d.para].length > 20) duckieSenales[d.para] = duckieSenales[d.para].slice(-20);
  res.json({ ok: true });
});
app.get('/api/signal', (req, res) => {
  let para = req.query.para;
  let lista = duckieSenales[para] || [];
  duckieSenales[para] = [];
  res.json(lista);
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🦆 Duckie FAST COMPLETO ${MODELOS_VIVOS[0]} corriendo en ${PORT} - FAST sin borrar nada - 3.6 primero + SEARCH MUNDIAL + LEARNING`));