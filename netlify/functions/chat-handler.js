// chat-handler.js
// Modernized backend utilizing the @google/genai SDK and GEMINI_API_KEY vault variable.

const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event, context) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const prompt = body.prompt;

        if (!prompt) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Prompt is required' }) };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error: GEMINI_API_KEY is missing from environment variables.' }) };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ reply: text }),
        };

    } catch (error) {
        console.error("Backend Execution Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to generate AI response from DuckieDuck.' }),
        };
    }
};
