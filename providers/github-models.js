import { makeOpenAICompatible } from "./openai-compatible.js";
import { classifyModel } from "../lib/model-classify.js";

const GITHUB_API_HEADERS = {
  "X-GitHub-Api-Version": "2022-11-28",
};

export async function fetchModels() {
  const apiKey = process.env.COGE_GITHUB_MODELS_TOKEN;
  const headers = { Accept: "application/json", ...GITHUB_API_HEADERS };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const res = await fetch("https://models.github.ai/catalog/models", { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const data = Array.isArray(json) ? json : json.data ?? [];
  return data
    .filter((m) => m.id)
    .map((m) => ({
      id: m.id,
      category: classifyModel(m.id, { type: m.type, description: m.summary }),
    }));
}

export const createGithubModelsProvider = makeOpenAICompatible(
  "github-models",
  "https://models.github.ai/inference/chat/completions",
  "COGE_GITHUB_MODELS_TOKEN",
  { extraHeaders: GITHUB_API_HEADERS },
);
