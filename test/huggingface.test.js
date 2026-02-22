import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createHuggingFaceProvider } from "../providers/huggingface.js";

describe("createHuggingFaceProvider", () => {
  it("throws when API key is not provided", () => {
    assert.throws(() => createHuggingFaceProvider(undefined, "model"), {
      message: "COGE_HUGGINGFACE_API_KEY not set.",
    });
  });

  it("returns provider with correct name", () => {
    const provider = createHuggingFaceProvider("test-key", "meta-llama/Llama-3.1-8B-Instruct");
    assert.equal(provider.name, "huggingface");
  });
});

describe("huggingface generateContent", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("uses the unified router endpoint", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ls" } }] }),
    }));

    const provider = createHuggingFaceProvider("key", "meta-llama/Llama-3.1-8B-Instruct");
    await provider.generateContent("sys", "usr");

    const url = globalThis.fetch.mock.calls[0].arguments[0];
    assert.equal(url, "https://router.huggingface.co/v1/chat/completions");
  });

  it("sends model in the request body", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ls" } }] }),
    }));

    const provider = createHuggingFaceProvider("key", "meta-llama/Llama-3.1-8B-Instruct");
    await provider.generateContent("sys", "usr");

    const body = JSON.parse(globalThis.fetch.mock.calls[0].arguments[1].body);
    assert.equal(body.model, "meta-llama/Llama-3.1-8B-Instruct");
  });
});
