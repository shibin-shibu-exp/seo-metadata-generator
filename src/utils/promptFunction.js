import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export default async function getSummaryFromDescription(summary) {
  const response = await ai.models.generateContent({
    model: import.meta.env.VITE_GEMINI_MODEL,
    contents: `You are an assistant that strictly outputs JSON. 
Given the following text, generate an SEO-friendly title, meta description, and tags. 

Rules:
- Output must be valid JSON only.
- Keys must be exactly: "title", "description", "tags".
- "tags" must always be an array of strings.
- Do not include any explanation, markdown, or extra text outside JSON.

Text: "${summary}"`,
  });

  return (
    response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || ""
  );
}
