import { makeOpenAICompatible } from "./openai-compatible.js";

export const createCodestralProvider = makeOpenAICompatible(
  "codestral",
  "https://codestral.mistral.ai/v1/chat/completions",
  "COGE_CODESTRAL_API_KEY",
);
