import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyModel, normalizeAvailableEntry, sortByCategory, isBlacklisted } from "../lib/model-classify.js";

describe("classifyModel", () => {
  it("classifies top models from curated list", () => {
    assert.equal(classifyModel("gemini-2.5-flash"), "top");
    assert.equal(classifyModel("gpt-4o-mini"), "top");
    assert.equal(classifyModel("gpt-4o"), "top");
    assert.equal(classifyModel("mistral-small-latest"), "top");
    assert.equal(classifyModel("codestral-latest"), "top");
    assert.equal(classifyModel("llama-3.3-70b-versatile"), "top");
    assert.equal(classifyModel("command-a-03-2025"), "top");
    assert.equal(classifyModel("devstral-small-latest"), "top");
  });

  it("classifies audio/tts/embed/ocr models as irrelevant", () => {
    assert.equal(classifyModel("whisper-1"), "irrelevant");
    assert.equal(classifyModel("tts-1-hd"), "irrelevant");
    assert.equal(classifyModel("dall-e-3"), "irrelevant");
    assert.equal(classifyModel("text-embedding-3-small"), "irrelevant");
    assert.equal(classifyModel("text-moderation-latest"), "irrelevant");
    assert.equal(classifyModel("mistral-ocr-latest"), "irrelevant");
  });

  it("classifies small models as small", () => {
    assert.equal(classifyModel("llama-3.1-8b-instant"), "small");
    assert.equal(classifyModel("gemini-2.0-flash-nano"), "small");
    assert.equal(classifyModel("ministral-8b-latest"), "small");
    assert.equal(classifyModel("mistral-tiny-latest"), "small");
  });

  it("classifies large models as large", () => {
    assert.equal(classifyModel("gemini-2.5-pro"), "top");
    assert.equal(classifyModel("mistral-large-2512"), "large");
    assert.equal(classifyModel("mistral-medium-2508"), "large");
    assert.equal(classifyModel("magistral-medium-latest"), "large");
  });

  it("uses metadata type to classify", () => {
    assert.equal(classifyModel("some-model", { type: "audio" }), "irrelevant");
    assert.equal(classifyModel("some-model", { type: "embedding" }), "irrelevant");
  });

  it("uses metadata description to classify", () => {
    assert.equal(classifyModel("model-x", { description: "Audio transcription model" }), "irrelevant");
  });

  it("top list takes priority over all heuristics", () => {
    // gpt-4o-mini would match "mini" → small, but it's in the top list
    assert.equal(classifyModel("gpt-4o-mini"), "top");
    // devstral-small-latest would match "small" → small, but it's in the top list
    assert.equal(classifyModel("devstral-small-latest"), "top");
  });
});

describe("normalizeAvailableEntry", () => {
  it("normalizes plain string to object with classification", () => {
    const entry = normalizeAvailableEntry("ministral-8b-latest");
    assert.equal(entry.id, "ministral-8b-latest");
    assert.equal(entry.category, "small");
  });

  it("passes through existing objects", () => {
    const entry = normalizeAvailableEntry({ id: "my-model", category: "large" });
    assert.equal(entry.id, "my-model");
    assert.equal(entry.category, "large");
  });

  it("adds category to objects missing it", () => {
    const entry = normalizeAvailableEntry({ id: "whisper-1" });
    assert.equal(entry.category, "irrelevant");
  });
});

describe("sortByCategory", () => {
  it("sorts entries in order: top → small → large → irrelevant", () => {
    const entries = [
      { id: "whisper-1", category: "irrelevant" },
      { id: "mistral-large-2512", category: "large" },
      { id: "gpt-4o", category: "top" },
      { id: "llama-3.1-8b-instant", category: "small" },
      { id: "text-embedding-3", category: "irrelevant" },
      { id: "gemini-2.5-flash", category: "top" },
    ];
    const sorted = sortByCategory(entries);
    const categories = sorted.map((e) => e.category);
    assert.deepEqual(categories, ["top", "top", "small", "large", "irrelevant", "irrelevant"]);
  });

  it("preserves relative order within the same category", () => {
    const entries = [
      { id: "b-large", category: "large" },
      { id: "a-large", category: "large" },
      { id: "top-1", category: "top" },
    ];
    const sorted = sortByCategory(entries);
    assert.deepEqual(sorted.map((e) => e.id), ["top-1", "b-large", "a-large"]);
  });

  it("returns the same array reference (mutates in place)", () => {
    const entries = [
      { id: "b", category: "large" },
      { id: "a", category: "small" },
    ];
    const result = sortByCategory(entries);
    assert.equal(result, entries);
  });

  it("puts blacklist tier after irrelevant", () => {
    const entries = [
      { id: "blacklisted-model", category: "blacklist" },
      { id: "whisper-1", category: "irrelevant" },
      { id: "gpt-4o", category: "top" },
      { id: "llama-8b", category: "small" },
    ];
    const sorted = sortByCategory(entries);
    const categories = sorted.map((e) => e.category);
    assert.deepEqual(categories, ["top", "small", "irrelevant", "blacklist"]);
  });
});

describe("isBlacklisted", () => {
  it("returns true when model is in the blacklist", () => {
    assert.equal(isBlacklisted("openai/gpt-5-mini", ["openai/gpt-5-mini", "some-other"]), true);
  });

  it("returns false when model is not in the blacklist", () => {
    assert.equal(isBlacklisted("gpt-4o", ["openai/gpt-5-mini"]), false);
  });

  it("returns false for undefined blacklist", () => {
    assert.equal(isBlacklisted("gpt-4o", undefined), false);
  });

  it("returns false for empty blacklist", () => {
    assert.equal(isBlacklisted("gpt-4o", []), false);
  });

  it("returns false for non-array blacklist", () => {
    assert.equal(isBlacklisted("gpt-4o", "not-an-array"), false);
  });
});
