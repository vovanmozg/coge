import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createOpenRouterProvider } from "../providers/openrouter.js";

describe("createOpenRouterProvider", () => {
  it("throws when apiKey is not provided", () => {
    assert.throws(() => createOpenRouterProvider(undefined, "model"), {
      message: "COGE_OPENROUTER_API_KEY not set.",
    });
  });

  it("throws when apiKey is empty string", () => {
    assert.throws(() => createOpenRouterProvider("", "model"), {
      message: "COGE_OPENROUTER_API_KEY not set.",
    });
  });

  it("returns provider with correct name", () => {
    const provider = createOpenRouterProvider("test-key", "test-model");
    assert.equal(provider.name, "openrouter");
  });

  it("returns provider with generateContent function", () => {
    const provider = createOpenRouterProvider("test-key", "test-model");
    assert.equal(typeof provider.generateContent, "function");
  });
});

describe("openrouter generateContent", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns text from successful API call", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "  ls -la  " } }],
      }),
    }));

    const provider = createOpenRouterProvider("test-key", "test-model");
    const result = await provider.generateContent("system", "list files");
    assert.equal(result, "ls -la");
  });

  it("sends correct request to OpenRouter API", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "echo hello" } }],
      }),
    }));

    const provider = createOpenRouterProvider("my-key", "my-model");
    await provider.generateContent("sys prompt", "user prompt");

    const call = globalThis.fetch.mock.calls[0];
    assert.equal(call.arguments[0], "https://openrouter.ai/api/v1/chat/completions");

    const opts = call.arguments[1];
    assert.equal(opts.method, "POST");
    assert.equal(opts.headers.Authorization, "Bearer my-key");

    const body = JSON.parse(opts.body);
    assert.equal(body.model, "my-model");
    assert.equal(body.messages[0].role, "system");
    assert.equal(body.messages[0].content, "sys prompt");
    assert.equal(body.messages[1].role, "user");
    assert.equal(body.messages[1].content, "user prompt");
  });

  it("throws on API error", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    }));

    const provider = createOpenRouterProvider("test-key", "test-model");
    await assert.rejects(
      () => provider.generateContent("sys", "usr"),
      (err) => {
        assert.match(err.message, /OpenRouter API error 500/);
        return true;
      }
    );
  });

  it("maps 404 data policy error to user-friendly message", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: false,
      status: 404,
      text: async () =>
        JSON.stringify({
          error: { message: "This model requires Zero data retention to be disabled" },
        }),
    }));

    const provider = createOpenRouterProvider("test-key", "test-model");
    await assert.rejects(
      () => provider.generateContent("sys", "usr"),
      (err) => {
        assert.match(err.message, /Zero data retention/);
        assert.match(err.message, /openrouter\.ai\/settings\/privacy/);
        return true;
      }
    );
  });

  it("throws on empty result", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [] }),
    }));

    const provider = createOpenRouterProvider("test-key", "test-model");
    await assert.rejects(
      () => provider.generateContent("sys", "usr"),
      { message: "Empty result from OpenRouter." }
    );
  });
});
