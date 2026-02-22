import { makeOpenAICompatible, fetchOpenAIModelIds } from "./openai-compatible.js";

export async function fetchModels() {
  return fetchOpenAIModelIds(
    "https://router.huggingface.co/v1/models",
    process.env.COGE_HUGGINGFACE_API_KEY,
  );
}

export const createHuggingFaceProvider = makeOpenAICompatible(
  "huggingface",
  "https://router.huggingface.co/v1/chat/completions",
  "COGE_HUGGINGFACE_API_KEY",
);
