import { GoogleGenAI } from "@google/genai";

const GEMINI_CHAT_METHODS = ["generateContent", "countTokens"];

export async function fetchModels() {
  const apiKey = process.env.COGE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("COGE_GEMINI_API_KEY not set.");

  const { classifyModel } = await import("../lib/model-classify.js");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${apiKey}`);
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return data.models
    .filter((m) => m.supportedGenerationMethods?.some((method) => GEMINI_CHAT_METHODS.includes(method)))
    .map((m) => {
      const id = m.name.replace(/^models\//, "");
      return { id, category: classifyModel(id) };
    });
}

/**
 * @param {string} apiKey
 * @param {string} [model]
 * @returns {import("./index.js").Provider}
 */
export function createGeminiProvider(apiKey, model) {
  if (!apiKey) {
    throw new Error("COGE_GEMINI_API_KEY not set.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const resolvedModel = model;

  return {
    name: "gemini",
    async generateContent(systemPrompt, userPrompt) {
      const result = await ai.models.generateContent({
        model: resolvedModel,
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n${userPrompt}` }],
          },
        ],
      });
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) {
        throw new Error("Empty result from Gemini.");
      }
      return text;
    },
  };
}
