import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export default async function getSummaryFromDescription(summary) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents:
      'Create an SEO-friendly description and tags based on this text: "' +
      summary +
      '". Focus on clarity, keywords, and readability. Return only the plain text. And Put Tags at the end without any text formatting',
  });

  return response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
}