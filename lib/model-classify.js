import { createRequire } from "module";

const require = createRequire(import.meta.url);
const defaultConfig = require("./default-config.json");

const IRRELEVANT_PATTERNS = /whisper|tts|dall-e|embed|moderation|audio|image|vision|realtime|transcri|ocr/i;
const SMALL_PATTERNS = /\bmini\b|\bsmall\b|\bnano\b|\btiny\b|\bfast\b|\binstant\b|[_-]8b\b|[_-]7b\b|[_-]3b\b|[_-]1b\b|[_-]2b\b/i;

const TOP_MODELS = new Set(defaultConfig.topModels ?? []);

/**
 * Classifies a model as "top", "small", "large", or "irrelevant".
 * Top models are checked first (hardcoded list), then API metadata, then name heuristics.
 * @param {string} id  Model ID
 * @param {{ type?: string; description?: string }} [metadata]
 * @returns {"top" | "small" | "large" | "irrelevant"}
 */
export function classifyModel(id, metadata) {
  // Top models — hardcoded curated list
  if (TOP_MODELS.has(id)) return "top";

  // Check metadata
  if (metadata?.type) {
    const t = metadata.type.toLowerCase();
    if (t.includes("audio") || t.includes("image") || t.includes("embed") || t.includes("tts")) {
      return "irrelevant";
    }
  }
  if (metadata?.description) {
    if (IRRELEVANT_PATTERNS.test(metadata.description)) return "irrelevant";
  }

  // Name heuristics
  if (IRRELEVANT_PATTERNS.test(id)) return "irrelevant";
  if (SMALL_PATTERNS.test(id)) return "small";
  return "large";
}

/**
 * Normalizes an available entry to { id, category } object.
 * Handles both plain strings (backward compat) and objects.
 * @param {string | { id: string; category?: string }} entry
 * @returns {{ id: string; category: string }}
 */
export function normalizeAvailableEntry(entry) {
  if (typeof entry === "string") return { id: entry, category: classifyModel(entry) };
  return { id: entry.id, category: entry.category ?? classifyModel(entry.id) };
}

/**
 * Checks whether a model ID is in the provider's blacklist.
 * @param {string} modelId
 * @param {string[]} [blacklist]
 * @returns {boolean}
 */
export function isBlacklisted(modelId, blacklist) {
  return Array.isArray(blacklist) && blacklist.includes(modelId);
}

const CATEGORY_ORDER = { top: 0, small: 1, large: 2, irrelevant: 3, blacklist: 4 };

/**
 * Sorts an array of { id, category } entries by category order: top → small → large → irrelevant.
 * Mutates and returns the array.
 * @param {{ id: string; category: string }[]} entries
 * @returns {{ id: string; category: string }[]}
 */
export function sortByCategory(entries) {
  return entries.sort((a, b) => (CATEGORY_ORDER[a.category] ?? 2) - (CATEGORY_ORDER[b.category] ?? 2));
}
