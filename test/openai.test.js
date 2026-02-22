import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createOpenAIProvider } from "../providers/openai.js";

describe("createOpenAIProvider", () => {
  it("throws when API key is not provided", () => {
    assert.throws(() => createOpenAIProvider(undefined, "model"), {
      message: "COGE_OPENAI_API_KEY not set.",
    });
  });

  it("returns provider with correct name", () => {
    const provider = createOpenAIProvider("test-key", "gpt-4o-mini");
    assert.equal(provider.name, "openai");
  });

  it("returns provider with generateContent function", () => {
    const provider = createOpenAIProvider("test-key", "model");
    assert.equal(typeof provider.generateContent, "function");
  });
});
