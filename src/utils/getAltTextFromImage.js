import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

async function urlToGenerativePart(url, mimeType) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = () => {
            const base64Data = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType || blob.type,
                },
            });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
}

export default async function getAltTextFromImage(imageUrl, mimeType) {
    const imagePart = await urlToGenerativePart(imageUrl, mimeType);

    const response = await ai.models.generateContent({
        model: import.meta.env.VITE_GEMINI_MODEL,
        contents: [
            {
                role: "user",
                parts: [
                    { text: "Generate a concise, SEO-friendly alt text for this image. Keep it plain text only and under 125 characters." },
                    imagePart 
                ]
            }
        ],
    });

    return response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
}