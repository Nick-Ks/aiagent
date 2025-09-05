
import { Notice } from 'obsidian';

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=";

/**
 * Fetches a result from the Gemini API based on a given context and instruction.
 * @param apiKey - The user's Google Gemini API key.
 * @param context - The contextual text to provide to the AI.
 * @param instruction - The instruction for the AI to perform.
 * @returns The AI-generated text as a string.
 * @throws An error if the API call fails or returns an unexpected structure.
 */
export async function fetchGeminiResult(apiKey: string, context: string, instruction: string): Promise<string> {
    const fullApiUrl = `${API_URL}${apiKey}`;

    const prompt = `Using the following context:
---
${context}
---
Perform this instruction: "${instruction}"`;

    try {
        const response = await fetch(fullApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            // Try to get more specific error info from the response body
            const errorBody = await response.json().catch(() => null); // Gracefully handle non-JSON error responses
            const errorMessage = errorBody?.error?.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();

        // Navigate the expected response structure to get the content
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (typeof text !== 'string') {
            console.error("API response did not contain expected text structure:", data);
            throw new Error("Invalid response structure from API.");
        }

        return text;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Re-throw the error to be caught by the calling function in main.ts
        // This allows for specific error messages in the UI.
        throw error;
    }
}
