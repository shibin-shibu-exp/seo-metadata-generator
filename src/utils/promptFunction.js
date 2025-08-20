import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export default async function getSummaryFromDescription(summary) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents:
      'Create an SEO-friendly title, meta description, and tags from the following text: "' +
      summary +
      '".Focus on clarity, keyword optimization, and readability. Return the result in plain text JSON format with "title", "description", and "tags" fields only. Do not include the ```json markdown wrapper.',
  });

  return (
    response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || ""
  );
}
