import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PROVIDER_MODELS, getDefaultModels, getAvailableModels } from "../providers/index.js";
import { classifyModel } from "../lib/model-classify.js";

describe("PROVIDER_MODELS", () => {
  const expectedProviders = [
    "gemini",
    "openrouter",
    "openai",
    "ollama",
    "cerebras",
    "cloudflare",
    "cohere",
    "github-models",
    "groq",
    "huggingface",
    "codestral",
    "mistral",
    "vercel-ai",
  ];

  it("has an entry for every provider", () => {
    for (const name of expectedProviders) {
      assert.ok(PROVIDER_MODELS[name], `Missing PROVIDER_MODELS entry for ${name}`);
    }
  });

  for (const name of expectedProviders) {
    describe(name, () => {
      it("has a non-empty default model", () => {
        const m = PROVIDER_MODELS[name];
        assert.equal(typeof m.default, "string");
        assert.ok(m.default.length > 0);
      });

      it("has a non-empty available array", () => {
        const m = PROVIDER_MODELS[name];
        assert.ok(Array.isArray(m.available));
        assert.ok(m.available.length > 0);
      });

      it("default model is included in available list", () => {
        const m = PROVIDER_MODELS[name];
        assert.ok(
          m.available.includes(m.default),
          `Default model "${m.default}" not in available: ${m.available.join(", ")}`,
        );
      });

      it("available models are sorted by category (top → small → large → irrelevant)", () => {
        const m = PROVIDER_MODELS[name];
        const order = { top: 0, small: 1, large: 2, irrelevant: 3 };
        const categories = m.available.map((id) => classifyModel(id));
        for (let i = 1; i < categories.length; i++) {
          const prev = order[categories[i - 1]] ?? 2;
          const curr = order[categories[i]] ?? 2;
          assert.ok(
            prev <= curr,
            `${name}: "${m.available[i - 1]}" (${categories[i - 1]}) should not come before "${m.available[i]}" (${categories[i]})`,
          );
        }
      });
    });
  }
});

describe("getDefaultModels", () => {
  it("returns an object with one key per provider", () => {
    const defaults = getDefaultModels();
    const keys = Object.keys(defaults);
    assert.ok(keys.length >= 13);
    for (const key of keys) {
      assert.equal(typeof defaults[key], "string");
      assert.ok(defaults[key].length > 0);
    }
  });

  it("matches PROVIDER_MODELS defaults", () => {
    const defaults = getDefaultModels();
    for (const [name, m] of Object.entries(PROVIDER_MODELS)) {
      assert.equal(defaults[name], m.default);
    }
  });
});

describe("getAvailableModels", () => {
  it("returns available array for known provider", () => {
    const models = getAvailableModels("mistral");
    assert.ok(Array.isArray(models));
    assert.ok(models.includes("mistral-small-latest"));
  });

  it("returns empty array for unknown provider", () => {
    const models = getAvailableModels("nonexistent");
    assert.deepEqual(models, []);
  });
});
