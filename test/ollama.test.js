import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createOllamaProvider } from "../providers/ollama.js";

describe("createOllamaProvider", () => {
  it("does not throw without API key", () => {
    const provider = createOllamaProvider(undefined, "llama3.2");
    assert.equal(provider.name, "ollama");
  });

  it("returns provider with generateContent function", () => {
    const provider = createOllamaProvider(undefined, "llama3.2");
    assert.equal(typeof provider.generateContent, "function");
  });
});
