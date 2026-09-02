const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const cors = require("cors")({ origin: true });

// Aquí va la lógica de tu backend que antes tenías en Render
exports.api = onRequest((req, res) => {
  cors(req, res, () => {
    try {
      // Ejemplo de respuesta para tu chat
      const userMessage = req.body.message || "Hola";
      logger.info("Mensaje recibido:", userMessage);

      res.status(200).json({
        success: true,
        reply: "¡Entendido, pariente! Saludos desde Firebase Cloud Functions."
      });
    } catch (error) {
      logger.error("Error en la función:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
});
