import { makeOpenAICompatible, fetchOpenAIModelIds } from "./openai-compatible.js";

export async function fetchModels() {
  return fetchOpenAIModelIds("https://api.mistral.ai/v1/models", process.env.COGE_MISTRAL_API_KEY);
}

// https://console.mistral.ai/home?workspace_dialog=apiKeys
export const createMistralProvider = makeOpenAICompatible(
  "mistral",
  "https://api.mistral.ai/v1/chat/completions",
  "COGE_MISTRAL_API_KEY",
);
