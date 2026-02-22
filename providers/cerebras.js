import { makeOpenAICompatible, fetchOpenAIModelIds } from "./openai-compatible.js";

export async function fetchModels() {
  return fetchOpenAIModelIds("https://api.cerebras.ai/v1/models", process.env.COGE_CEREBRAS_API_KEY);
}

export const createCerebrasProvider = makeOpenAICompatible(
  "cerebras",
  "https://api.cerebras.ai/v1/chat/completions",
  "COGE_CEREBRAS_API_KEY",
);
