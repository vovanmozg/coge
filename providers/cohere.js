export async function fetchModels() {
  const { classifyModel } = await import("../lib/model-classify.js");
  const apiKey = process.env.COGE_COHERE_API_KEY;
  if (!apiKey) throw new Error("COGE_COHERE_API_KEY not set.");
  const res = await fetch("https://api.cohere.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return (json.models ?? [])
    .filter((m) => m.name)
    .map((m) => ({ id: m.name, category: classifyModel(m.name) }));
}

const COHERE_URL = "https://api.cohere.com/v2/chat";

/**
 * @param {string} apiKey
 * @param {string} [model]
 * @returns {import("./index.js").Provider}
 */
export function createCohereProvider(apiKey, model) {
  if (!apiKey) {
    throw new Error("COGE_COHERE_API_KEY not set.");
  }

  return {
    name: "cohere",
    async generateContent(systemPrompt, userPrompt) {
      const res = await fetch(COHERE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Cohere API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      const text =
        data.message?.content?.[0]?.text?.trim() ??
        data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error("Empty result from Cohere.");
      }
      return text;
    },
  };
}
