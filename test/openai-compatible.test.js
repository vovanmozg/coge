import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createOpenAICompatibleProvider, makeOpenAICompatible } from "../providers/openai-compatible.js";

describe("createOpenAICompatibleProvider", () => {
  it("throws when apiKey is required but not provided", () => {
    assert.throws(
      () => createOpenAICompatibleProvider({ name: "test", url: "http://x", envKey: "TEST_KEY", requiresKey: true }),
      { message: "TEST_KEY not set." }
    );
  });

  it("does not throw when requiresKey is false", () => {
    const provider = createOpenAICompatibleProvider({ name: "test", url: "http://x", envKey: "TEST_KEY", requiresKey: false });
    assert.equal(provider.name, "test");
  });

  it("returns provider with correct name", () => {
    const provider = createOpenAICompatibleProvider({ name: "myp", url: "http://x", envKey: "K", apiKey: "k" });
    assert.equal(provider.name, "myp");
  });
});

describe("makeOpenAICompatible", () => {
  it("creates a factory that returns a provider", () => {
    const factory = makeOpenAICompatible("test", "http://x", "TEST_KEY");
    const provider = factory("my-key", "my-model");
    assert.equal(provider.name, "test");
    assert.equal(typeof provider.generateContent, "function");
  });

  it("factory throws when key is missing", () => {
    const factory = makeOpenAICompatible("test", "http://x", "TEST_KEY");
    assert.throws(() => factory(undefined, "m"), { message: "TEST_KEY not set." });
  });

  it("factory allows no key when requiresKey is false", () => {
    const factory = makeOpenAICompatible("test", "http://x", "TEST_KEY", { requiresKey: false });
    const provider = factory(undefined, "m");
    assert.equal(provider.name, "test");
  });
});

describe("OpenAI-compatible generateContent", () => {
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
      json: async () => ({ choices: [{ message: { content: "  echo hello  " } }] }),
    }));

    const factory = makeOpenAICompatible("test", "http://api.test/v1/chat", "K");
    const provider = factory("key", "model-1");
    const result = await provider.generateContent("sys", "usr");
    assert.equal(result, "echo hello");
  });

  it("sends correct request format", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    }));

    const factory = makeOpenAICompatible("test", "http://api.test/v1/chat", "K");
    const provider = factory("my-key", "my-model");
    await provider.generateContent("sys prompt", "user prompt");

    const call = globalThis.fetch.mock.calls[0];
    assert.equal(call.arguments[0], "http://api.test/v1/chat");
    const opts = call.arguments[1];
    assert.equal(opts.method, "POST");
    assert.equal(opts.headers.Authorization, "Bearer my-key");
    const body = JSON.parse(opts.body);
    assert.equal(body.model, "my-model");
    assert.equal(body.messages[0].role, "system");
    assert.equal(body.messages[1].role, "user");
  });

  it("omits Authorization header when no apiKey", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    }));

    const factory = makeOpenAICompatible("test", "http://api.test/v1/chat", "K", { requiresKey: false });
    const provider = factory(undefined, "m");
    await provider.generateContent("sys", "usr");

    const opts = globalThis.fetch.mock.calls[0].arguments[1];
    assert.equal(opts.headers.Authorization, undefined);
  });

  it("throws on API error", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    }));

    const factory = makeOpenAICompatible("myapi", "http://x", "K");
    const provider = factory("key", "m");
    await assert.rejects(
      () => provider.generateContent("sys", "usr"),
      (err) => {
        assert.match(err.message, /myapi API error 500/);
        return true;
      }
    );
  });

  it("throws on empty result", async () => {
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [] }),
    }));

    const factory = makeOpenAICompatible("myapi", "http://x", "K");
    const provider = factory("key", "m");
    await assert.rejects(
      () => provider.generateContent("sys", "usr"),
      { message: "Empty result from myapi." }
    );
  });
});
