export async function fetchModels() {
  const { classifyModel } = await import("../lib/model-classify.js");
  const res = await fetch("https://openrouter.ai/api/v1/models");
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return (json.data ?? [])
    .filter((m) => m.id)
    .map((m) => ({ id: m.id, category: classifyModel(m.id, { description: m.description }) }));
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * @param {string} apiKey
 * @param {string} [model]
 * @returns {import("./index.js").Provider}
 */
export function createOpenRouterProvider(apiKey, model) {
  if (!apiKey) {
    throw new Error("COGE_OPENROUTER_API_KEY not set.");
  }
  const resolvedModel = model;

  return {
    name: "openrouter",
    async generateContent(systemPrompt, userPrompt) {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: resolvedModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        let message = `OpenRouter API error ${res.status}: ${err}`;
        try {
          const body = JSON.parse(err);
          const msg = body?.error?.message ?? "";
          if (
            res.status === 404 &&
            (msg.includes("data policy") || msg.includes("Zero data retention"))
          ) {
            message =
              "OpenRouter: this model is not available with Zero data retention enabled. " +
              "To use this model, disable the Zero data retention policy at https://openrouter.ai/settings/privacy — or set a different model in config (see https://openrouter.ai/models).";
          }
        } catch (_) {}
        throw new Error(message);
      }

      const data =
        /** @type {{ choices?: Array<{ message?: { content?: string } }> }} */ (
          await res.json()
        );
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error("Empty result from OpenRouter.");
      }
      return text;
    },
  };
}
