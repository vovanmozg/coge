import { makeOpenAICompatible, fetchOpenAIModelIds } from "./openai-compatible.js";

export async function fetchModels() {
  return fetchOpenAIModelIds("https://api.openai.com/v1/models", process.env.COGE_OPENAI_API_KEY);
}

export const createOpenAIProvider = makeOpenAICompatible(
  "openai",
  "https://api.openai.com/v1/chat/completions",
  "COGE_OPENAI_API_KEY",
);
