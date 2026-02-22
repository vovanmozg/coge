import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getProvider, getConfiguredProviders } from "../providers/index.js";

let savedEnv;

beforeEach(() => {
  savedEnv = { ...process.env };
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("COGE_") && !(key in savedEnv)) {
      delete process.env[key];
    }
  }
  for (const [key, value] of Object.entries(savedEnv)) {
    if (key.startsWith("COGE_")) {
      process.env[key] = value;
    }
  }
});

describe("getProvider", () => {
  it("returns gemini provider with new config shape", () => {
    process.env.COGE_GEMINI_API_KEY = "test-key";
    const provider = getProvider({ provider: "gemini", model: "test-model", providers: {} });
    assert.equal(provider.name, "gemini");
  });

  it("returns openrouter provider with new config shape", () => {
    process.env.COGE_OPENROUTER_API_KEY = "test-key";
    const provider = getProvider({ provider: "openrouter", model: "test-model", providers: {} });
    assert.equal(provider.name, "openrouter");
  });

  it("returns openai provider with new config shape", () => {
    process.env.COGE_OPENAI_API_KEY = "test-key";
    const provider = getProvider({ provider: "openai", model: "gpt-4o-mini", providers: {} });
    assert.equal(provider.name, "openai");
  });

  it("returns ollama provider without API key", () => {
    const provider = getProvider({ provider: "ollama", model: "llama3.2", providers: {} });
    assert.equal(provider.name, "ollama");
  });

  it("returns cerebras provider with new config shape", () => {
    process.env.COGE_CEREBRAS_API_KEY = "test-key";
    const provider = getProvider({ provider: "cerebras", model: "m", providers: {} });
    assert.equal(provider.name, "cerebras");
  });

  it("returns groq provider with new config shape", () => {
    process.env.COGE_GROQ_API_KEY = "test-key";
    const provider = getProvider({ provider: "groq", model: "m", providers: {} });
    assert.equal(provider.name, "groq");
  });

  it("returns mistral provider with new config shape", () => {
    process.env.COGE_MISTRAL_API_KEY = "test-key";
    const provider = getProvider({ provider: "mistral", model: "m", providers: {} });
    assert.equal(provider.name, "mistral");
  });

  it("returns github-models provider with new config shape", () => {
    process.env.COGE_GITHUB_MODELS_TOKEN = "test-key";
    const provider = getProvider({ provider: "github-models", model: "m", providers: {} });
    assert.equal(provider.name, "github-models");
  });

  // Backward compatibility: old format with models map
  it("falls back to models map for old config format", () => {
    process.env.COGE_GEMINI_API_KEY = "test-key";
    const provider = getProvider({ provider: "gemini", models: { gemini: "old-model" } });
    assert.equal(provider.name, "gemini");
  });

  it("throws on unknown provider", () => {
    assert.throws(
      () => getProvider({ provider: "unknown", model: "m", providers: {} }),
      (err) => {
        assert.match(err.message, /Unknown provider: unknown/);
        assert.match(err.message, /Available:/);
        return true;
      }
    );
  });

  it("defaults to gemini when provider is empty", () => {
    process.env.COGE_GEMINI_API_KEY = "test-key";
    const provider = getProvider({ provider: "", model: "m", providers: {} });
    assert.equal(provider.name, "gemini");
  });

  it("is case-insensitive for provider name", () => {
    process.env.COGE_GEMINI_API_KEY = "test-key";
    const provider = getProvider({ provider: "GEMINI", model: "m", providers: {} });
    assert.equal(provider.name, "gemini");
  });
});

describe("getConfiguredProviders", () => {
  it("returns providers with API keys set", () => {
    process.env.COGE_GEMINI_API_KEY = "k1";
    process.env.COGE_GROQ_API_KEY = "k2";
    const result = getConfiguredProviders();
    assert.ok(result.includes("gemini"));
    assert.ok(result.includes("groq"));
  });

  it("excludes ollama (null env key)", () => {
    const result = getConfiguredProviders();
    assert.ok(!result.includes("ollama"));
  });

  it("excludes providers without keys set", () => {
    delete process.env.COGE_OPENAI_API_KEY;
    const result = getConfiguredProviders();
    assert.ok(!result.includes("openai"));
  });
});
