import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCerebrasProvider } from "../providers/cerebras.js";
import { createGithubModelsProvider } from "../providers/github-models.js";
import { createGroqProvider } from "../providers/groq.js";
import { createCodestralProvider } from "../providers/codestral.js";
import { createMistralProvider } from "../providers/mistral.js";
import { createVercelAIProvider } from "../providers/vercel-ai.js";

const providers = [
  { name: "cerebras", factory: createCerebrasProvider, envKey: "COGE_CEREBRAS_API_KEY" },
  { name: "github-models", factory: createGithubModelsProvider, envKey: "COGE_GITHUB_MODELS_TOKEN" },
  { name: "groq", factory: createGroqProvider, envKey: "COGE_GROQ_API_KEY" },
  { name: "codestral", factory: createCodestralProvider, envKey: "COGE_CODESTRAL_API_KEY" },
  { name: "mistral", factory: createMistralProvider, envKey: "COGE_MISTRAL_API_KEY" },
  { name: "vercel-ai", factory: createVercelAIProvider, envKey: "COGE_VERCEL_API_KEY" },
];

for (const { name, factory, envKey } of providers) {
  describe(`create${name}Provider`, () => {
    it("throws when API key is not provided", () => {
      assert.throws(() => factory(undefined, "model"), {
        message: `${envKey} not set.`,
      });
    });

    it("returns provider with correct name", () => {
      const provider = factory("test-key", "test-model");
      assert.equal(provider.name, name);
    });

    it("has generateContent function", () => {
      const provider = factory("test-key", "test-model");
      assert.equal(typeof provider.generateContent, "function");
    });
  });
}
