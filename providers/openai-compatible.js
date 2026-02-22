/**
 * Factory for providers that use the OpenAI-compatible chat completions API.
 *
 * @param {{ name: string; url: string | ((model: string) => string); envKey: string; apiKey?: string; requiresKey?: boolean }} opts
 * @returns {import("./index.js").Provider}
 */
export function createOpenAICompatibleProvider({ name, url, envKey, apiKey, requiresKey = true, extraHeaders }) {
  if (requiresKey && !apiKey) {
    throw new Error(`${envKey} not set.`);
  }

  return {
    name,
    async generateContent(systemPrompt, userPrompt) {
      const endpoint = typeof url === "function" ? url(this._model) : url;
      const headers = { "Content-Type": "application/json", ...extraHeaders };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: this._model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`${name} API error ${res.status}: ${err}`);
      }

      const data =
        /** @type {{ choices?: Array<{ message?: { content?: string } }> }} */ (
          await res.json()
        );
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error(`Empty result from ${name}.`);
      }
      return text;
    },
  };
}

/**
 * Fetches models from a standard OpenAI-compatible /v1/models endpoint
 * and classifies each model by category.
 * @param {string} url   The models endpoint URL
 * @param {string} [apiKey]  Bearer token (omit for unauthenticated endpoints)
 * @returns {Promise<Array<{ id: string; category: string }>>}
 */
export async function fetchOpenAIModelIds(url, apiKey) {
  const { classifyModel } = await import("../lib/model-classify.js");
  const headers = { Accept: "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const data = json.data ?? json;
  if (!Array.isArray(data)) throw new Error("Unexpected response format");
  return data
    .filter((m) => m.id)
    .map((m) => ({
      id: m.id,
      category: classifyModel(m.id, { type: m.type, description: m.description }),
    }));
}

/**
 * Convenience wrapper: creates a provider factory function for OpenAI-compatible APIs.
 *
 * @param {string} name     Provider name
 * @param {string | ((model: string) => string)} url  API endpoint
 * @param {string} envKey   Environment variable name for the API key
 * @param {{ requiresKey?: boolean }} [extra]
 * @returns {(apiKey: string | undefined, model?: string) => import("./index.js").Provider}
 */
export function makeOpenAICompatible(name, url, envKey, extra = {}) {
  return (apiKey, model) => {
    const provider = createOpenAICompatibleProvider({
      name,
      url,
      envKey,
      apiKey,
      requiresKey: extra.requiresKey ?? true,
      extraHeaders: extra.extraHeaders,
    });
    provider._model = model;
    return provider;
  };
}
