// netlify/functions/chat-handler.js
// This is your secure backend function. It reads the key you put in the Netlify vault.

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
    // 1. Security Check: Ensure it's a POST request
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // 2. Parse the user's prompt from the frontend
    let prompt;
    try {
        const body = JSON.parse(event.body);
        prompt = body.prompt;
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    if (!prompt) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required' }) };
    }

    // 3. Get the API Key from the Netlify Vault (This is what you set in image_7.png)
    // Netlify securely injects this when the function runs.
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Server Configuration Error: API Key not found' }) };
    }

    // 4. Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    // We are using the recommended gemini-1.5-flash for speed and cost efficiency
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 5. Call the Gemini API (SECURELY)
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 6. Send the response back to your frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ reply: text }),
        };

    } catch (error) {
        console.error("Gemini API Error:", error);
        return {
            statusCode: 500,
            // DO NOT expose the actual Google error message to the public
            body: JSON.stringify({ error: 'Failed to generate AI response.' }),
        };
    }
};
