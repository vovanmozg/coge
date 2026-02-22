import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createCohereProvider } from "../providers/cohere.js";

describe("createCohereProvider", () => {
  it("throws when API key is not provided", () => {
    assert.throws(() => createCohereProvider(undefined, "model"), {
      message: "COGE_COHERE_API_KEY not set.",
    });
  });

  it("returns provider with correct name", () => {
    const provider = createCohereProvider("test-key", "command-a");
    assert.equal(provider.name, "cohere");
  });
});

describe("cohere generateContent", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns text from Cohere v2 response format", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        message: { content: [{ text: "  ls -la  " }] },
      }),
    }));

    const provider = createCohereProvider("test-key", "command-a");
    const result = await provider.generateContent("sys", "list files");
    assert.equal(result, "ls -la");
  });

  it("falls back to OpenAI-style response format", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "  echo hi  " } }],
      }),
    }));

    const provider = createCohereProvider("test-key", "command-a");
    const result = await provider.generateContent("sys", "say hi");
    assert.equal(result, "echo hi");
  });

  it("sends correct request to Cohere API", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        message: { content: [{ text: "ok" }] },
      }),
    }));

    const provider = createCohereProvider("my-key", "my-model");
    await provider.generateContent("sys prompt", "user prompt");

    const call = globalThis.fetch.mock.calls[0];
    assert.equal(call.arguments[0], "https://api.cohere.com/v2/chat");
    const opts = call.arguments[1];
    assert.equal(opts.headers.Authorization, "Bearer my-key");
    const body = JSON.parse(opts.body);
    assert.equal(body.model, "my-model");
  });

  it("throws on API error", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    }));

    const provider = createCohereProvider("test-key", "model");
    await assert.rejects(
      () => provider.generateContent("sys", "usr"),
      (err) => {
        assert.match(err.message, /Cohere API error 429/);
        return true;
      }
    );
  });

  it("throws on empty result", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ message: { content: [] } }),
    }));

    const provider = createCohereProvider("test-key", "model");
    await assert.rejects(
      () => provider.generateContent("sys", "usr"),
      { message: "Empty result from Cohere." }
    );
  });
});
