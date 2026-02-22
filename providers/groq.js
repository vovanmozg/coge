import { makeOpenAICompatible, fetchOpenAIModelIds } from "./openai-compatible.js";

export async function fetchModels() {
  return fetchOpenAIModelIds("https://api.groq.com/openai/v1/models", process.env.COGE_GROQ_API_KEY);
}

export const createGroqProvider = makeOpenAICompatible(
  "groq",
  "https://api.groq.com/openai/v1/chat/completions",
  "COGE_GROQ_API_KEY",
);
