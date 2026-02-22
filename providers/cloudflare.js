import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export async function fetchModels() {
  const accountId = process.env.COGE_CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.COGE_CLOUDFLARE_API_KEY;
  if (!apiKey) throw new Error("COGE_CLOUDFLARE_API_KEY not set.");
  if (!accountId) throw new Error("COGE_CLOUDFLARE_ACCOUNT_ID not set.");

  const { classifyModel } = await import("../lib/model-classify.js");
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search?task=Text Generation&per_page=200`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) throw new Error(`Cloudflare API ${res.status}: ${res.statusText}`);
  const data = await res.json();
  if (!data.success) throw new Error("Cloudflare API error: " + JSON.stringify(data.errors));
  return data.result.map((m) => ({ id: m.name, category: classifyModel(m.name) }));
}

/**
 * @param {string} apiKey
 * @param {string} [model]
 * @returns {import("./index.js").Provider}
 */
export function createCloudflareProvider(apiKey, model) {
  const accountId = process.env.COGE_CLOUDFLARE_ACCOUNT_ID;
  if (!apiKey) {
    throw new Error("COGE_CLOUDFLARE_API_KEY not set.");
  }
  if (!accountId) {
    throw new Error("COGE_CLOUDFLARE_ACCOUNT_ID not set.");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;
  const provider = createOpenAICompatibleProvider({
    name: "cloudflare",
    url,
    envKey: "COGE_CLOUDFLARE_API_KEY",
    apiKey,
  });
  provider._model = model;
  return provider;
}
