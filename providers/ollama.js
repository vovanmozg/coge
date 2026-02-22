import { makeOpenAICompatible } from "./openai-compatible.js";

const baseUrl = process.env.COGE_OLLAMA_BASE_URL || "http://localhost:11434";

export async function fetchModels() {
  const { classifyModel } = await import("../lib/model-classify.js");
  const res = await fetch(`${baseUrl}/api/tags`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return (json.models ?? [])
    .filter((m) => m.name)
    .map((m) => ({ id: m.name, category: classifyModel(m.name) }));
}

export const createOllamaProvider = makeOpenAICompatible(
  "ollama",
  `${baseUrl}/v1/chat/completions`,
  "COGE_OLLAMA_BASE_URL",
  { requiresKey: false },
);
