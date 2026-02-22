import { makeOpenAICompatible, fetchOpenAIModelIds } from "./openai-compatible.js";

export async function fetchModels() {
  return fetchOpenAIModelIds("https://api.vercel.ai/v1/models", process.env.COGE_VERCEL_API_KEY);
}

export const createVercelAIProvider = makeOpenAICompatible(
  "vercel-ai",
  "https://api.vercel.ai/v1/chat/completions",
  "COGE_VERCEL_API_KEY",
);
