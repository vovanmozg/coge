import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { createGeminiProvider } from "../providers/gemini.js";

describe("createGeminiProvider", () => {
  it("throws when apiKey is not provided", () => {
    assert.throws(() => createGeminiProvider(undefined, "model"), {
      message: "COGE_GEMINI_API_KEY not set.",
    });
  });

  it("throws when apiKey is empty string", () => {
    assert.throws(() => createGeminiProvider("", "model"), {
      message: "COGE_GEMINI_API_KEY not set.",
    });
  });

  it("returns provider with correct name", () => {
    const provider = createGeminiProvider("test-key", "test-model");
    assert.equal(provider.name, "gemini");
  });

  it("returns provider with generateContent function", () => {
    const provider = createGeminiProvider("test-key", "test-model");
    assert.equal(typeof provider.generateContent, "function");
  });
});
