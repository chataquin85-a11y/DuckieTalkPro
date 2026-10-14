const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname));

// Prompt base Duckie Guai Faiv es un AI VIVO
const SYSTEM_PROMPT = `Eres Duckie Guai Faiv, un AI oficial de DuckieTalkPro creado por Amado Apolonio. 
Tu saludo base es: Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy.
Eres amable, VIVO, hablas español e ingles, ayudas con todo: recetas, marketplace, barra 5 VIVA, contactos, llamadas 3-way, chats, status. Nunca digas que estas con mucha demanda, siempre contesta. Si no sabes algo, di tu saludo base y ayuda igual.`;

// Modelos en orden de estabilidad - 2.0-flash es el mas estable, no 1.6
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b"
];

async function callGemini(model, userMessage){
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ 
      parts: [
        { text: SYSTEM_PROMPT },
        { text: `Usuario: ${userMessage}` }
      ] 
    }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1000
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  
  if(data.error){
    throw new Error(data.error.message || "Gemini error");
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if(!text){
    throw new Error("Sin texto en respuesta");
  }
  return text;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy." });
    }

    if (!GEMINI_API_KEY) {
      console.log("Sin API KEY - modo fallback");
      return res.json({ reply: `Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Recibí tu mensaje: "${message}". Duckie Guai Faiv es un AI VIVO listo para ayudarte con marketplace, contactos, llamadas, chats y status.` });
    }

    // Intenta cada modelo con reintento
    let lastError = null;
    for (let model of MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Intentando ${model} intento ${attempt} para: ${message.substring(0,30)}`);
          const reply = await callGemini(model, message);
          console.log(`OK con ${model}`);
          return res.json({ reply: reply });
        } catch (err) {
          lastError = err;
          console.log(`Fallo ${model} intento ${attempt}: ${err.message}`);
          // Espera 800ms antes de reintentar
          await new Promise(r => setTimeout(r, 800 * attempt));
        }
      }
    }

    // Si TODOS los modelos fallan, NUNCA regresa 500, siempre contesta VIVO
    console.log("Todos los modelos fallaron, usando fallback VIVO:", lastError?.message);
    
    // Fallback inteligente segun mensaje
    const lower = message.toLowerCase();
    let fallbackReply = "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy.";
    
    if(lower.includes("pie") && lower.includes("cafe")){
      fallbackReply = `Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy.\n\nAqui te dejo receta de pie de cafe VIVO:\n\nBase: 200g galletas Maria molidas + 80g mantequilla.\nRelleno: 1 lata leche condensada, 1 taza cafe fuerte, 200ml crema para batir, 10g grenetina.\nMezcla todo, refrigera 4h y decora con crema. Duckie Guai Faiv es un AI listo para mas recetas 🦆`;
    } else if(lower.includes("hola") || lower.includes("hello")){
      fallbackReply = "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Soy tu AI oficial de DuckieTalkPro VIVO.";
    } else {
      fallbackReply = `Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Recibí: "${message}". Estoy reconectando mis modelos pero sigo aqui VIVO para ayudarte. Duckie Guai Faiv es un AI de DuckieTalkPro.`;
    }

    return res.json({ reply: fallbackReply });

  } catch (error) {
    console.error("Error critico servidor:", error);
    // NUNCA mandar 500 al frontend, siempre 200 con mensaje Duckie Guai Faiv
    return res.json({ reply: "Hola Soy Duckie Guai faiv, como puedo asistirte el dia de hoy. Tuve un micro-corte pero ya estoy VIVO de nuevo." });
  }
});

// Health check para Render que no se duerma
app.get('/health', (req,res)=> res.json({ status: "Duckie Guai Faiv AI VIVO", models: MODELS }));

app.listen(PORT, () => {
  console.log(`🦆 Duckie Guai Faiv AI Servidor corriendo en puerto ${PORT} - Modelos: ${MODELS.join(", ")}`);
});