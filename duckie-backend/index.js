const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

admin.initializeApp();
const db = admin.firestore();

// Inicializa el cliente de Gemini (asegúrate de tener tu API Key configurada en las variables de entorno de Firebase)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Endpoint principal conectado a la IA real
app.post("/api", async (req, res) => {
  try {
    const userMessage = req.body.message;
    
    if (!userMessage) {
      return res.status(400).json({ error: "Falta el mensaje del usuario." });
    }

    // Definimos la personalidad de Duckie Guai-fai'v mediante system instructions
    const systemInstruction = "Eres Duckie Guai-fai'v, un asistente digital amigable, experto en tecnología, leal y con un estilo norteño y carismático ('pariente', 'al centavazo'). Respondes de forma dinámica, creativa y siempre manteniendo tu identidad de patito tecnológico.";

    // Llamada al modelo de IA real de Google
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [userMessage],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const aiResponse = response.text || "¡Quack! Ocurrió un detalle al procesar la respuesta, pariente.";

    // Guardar historial en Firestore en tiempo real
    await db.collection("chat_history").add({
      user: "Amado",
      message: userMessage,
      reply: aiResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ reply: aiResponse });
  } catch (error) {
    console.error("Error en el backend con IA:", error);
    return res.status(500).json({ error: "Error interno del servidor de Duckie con IA." });
  }
});

exports.api = functions.https.onRequest(app);