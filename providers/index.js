import { createGeminiProvider, fetchModels as geminiFetch } from "./gemini.js";
import { createOpenRouterProvider, fetchModels as openrouterFetch } from "./openrouter.js";
import { createOpenAIProvider, fetchModels as openaiFetch } from "./openai.js";
import { createOllamaProvider, fetchModels as ollamaFetch } from "./ollama.js";
import { createCerebrasProvider, fetchModels as cerebrasFetch } from "./cerebras.js";
import { createCloudflareProvider, fetchModels as cloudflareFetch } from "./cloudflare.js";
import { createCohereProvider, fetchModels as cohereFetch } from "./cohere.js";
import { createGithubModelsProvider, fetchModels as githubModelsFetch } from "./github-models.js";
import { createGroqProvider, fetchModels as groqFetch } from "./groq.js";
import { createHuggingFaceProvider, fetchModels as huggingfaceFetch } from "./huggingface.js";
import { createCodestralProvider } from "./codestral.js";
import { createMistralProvider, fetchModels as mistralFetch } from "./mistral.js";
import { createVercelAIProvider, fetchModels as vercelAiFetch } from "./vercel-ai.js";

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const defaultConfig = require("../lib/default-config.json");

/** @typedef {{ name: string; generateContent(systemPrompt: string, userPrompt: string): Promise<string> }} Provider */

/** @type {Record<string, (apiKey: string, model?: string) => Provider>} */
const providerFactories = {
  gemini: (apiKey, model) => createGeminiProvider(apiKey, model),
  openrouter: (apiKey, model) => createOpenRouterProvider(apiKey, model),
  openai: (apiKey, model) => createOpenAIProvider(apiKey, model),
  ollama: (apiKey, model) => createOllamaProvider(apiKey, model),
  cerebras: (apiKey, model) => createCerebrasProvider(apiKey, model),
  cloudflare: (apiKey, model) => createCloudflareProvider(apiKey, model),
  cohere: (apiKey, model) => createCohereProvider(apiKey, model),
  "github-models": (apiKey, model) => createGithubModelsProvider(apiKey, model),
  groq: (apiKey, model) => createGroqProvider(apiKey, model),
  huggingface: (apiKey, model) => createHuggingFaceProvider(apiKey, model),
  codestral: (apiKey, model) => createCodestralProvider(apiKey, model),
  mistral: (apiKey, model) => createMistralProvider(apiKey, model),
  "vercel-ai": (apiKey, model) => createVercelAIProvider(apiKey, model),
};

/** @type {Record<string, { default: string; available: string[] }>} */
export const PROVIDER_MODELS = defaultConfig.providers;

/** @type {Record<string, string>} */
export const PROVIDER_PAGE_URLS = {
  gemini: "https://ai.google.dev/gemini-api/docs/models/gemini-v2",
  cerebras: "https://inference-docs.cerebras.ai/models/overview",
  "vercel-ai": "https://sdk.vercel.ai/docs/foundations/providers-and-models",
  cloudflare: "https://developers.cloudflare.com/workers-ai/models/",
};

/** @type {Record<string, () => Promise<string[]>>} */
export const PROVIDER_FETCH_MODELS = {
  gemini: geminiFetch,
  openrouter: openrouterFetch,
  openai: openaiFetch,
  ollama: ollamaFetch,
  cerebras: cerebrasFetch,
  cloudflare: cloudflareFetch,
  cohere: cohereFetch,
  "github-models": githubModelsFetch,
  groq: groqFetch,
  huggingface: huggingfaceFetch,
  mistral: mistralFetch,
  "vercel-ai": vercelAiFetch,
};

/**
 * Returns a map of provider name → default model string.
 * @returns {Record<string, string>}
 */
export function getDefaultModels() {
  const result = {};
  for (const [name, m] of Object.entries(defaultConfig.providers)) {
    result[name] = m.default;
  }
  return result;
}

/**
 * Returns the full providers map: { providerName: { default, available } }.
 * @returns {Record<string, { default: string; available: string[] }>}
 */
export function getDefaultProviders() {
  const result = {};
  for (const [name, m] of Object.entries(defaultConfig.providers)) {
    result[name] = { default: m.default, available: [...m.available] };
  }
  return result;
}

/**
 * Returns available models for a given provider, or empty array if unknown.
 * @param {string} providerName
 * @returns {string[]}
 */
export function getAvailableModels(providerName) {
  return defaultConfig.providers[providerName]?.available ?? [];
}

/** Env var name per provider (null = no key, e.g. ollama). */
export const PROVIDER_ENV_KEYS = {
  gemini: "COGE_GEMINI_API_KEY",
  openrouter: "COGE_OPENROUTER_API_KEY",
  openai: "COGE_OPENAI_API_KEY",
  ollama: null,
  cerebras: "COGE_CEREBRAS_API_KEY",
  cloudflare: "COGE_CLOUDFLARE_API_KEY",
  cohere: "COGE_COHERE_API_KEY",
  "github-models": "COGE_GITHUB_MODELS_TOKEN",
  groq: "COGE_GROQ_API_KEY",
  huggingface: "COGE_HUGGINGFACE_API_KEY",
  codestral: "COGE_CODESTRAL_API_KEY",
  mistral: "COGE_MISTRAL_API_KEY",
  "vercel-ai": "COGE_VERCEL_API_KEY",
};

/**
 * Returns provider names that have API keys configured in environment.
 * Skips providers with null env key (e.g. ollama).
 * @returns {string[]}
 */
export function getConfiguredProviders() {
  return Object.entries(PROVIDER_ENV_KEYS)
    .filter(([, envKey]) => envKey && process.env[envKey])
    .map(([name]) => name);
}

/**
 * Returns the provider. Provider and model come from config; API key from env only.
 * @param {{ provider: string; model?: string; providers?: Record<string, { default: string; available: string[] }>; models?: Record<string, string> }} config
 * @returns {Provider}
 */
export function getProvider(config) {
  const name = (config.provider || "gemini").toLowerCase();
  const factory = providerFactories[name];
  if (!factory) {
    const available = Object.keys(providerFactories).join(", ");
    throw new Error(`Unknown provider: ${name}. Available: ${available}`);
  }
  const envKey = PROVIDER_ENV_KEYS[name];
  const apiKey = envKey ? process.env[envKey] : undefined;
  if (envKey && !apiKey) {
    const configured = getConfiguredProviders();
    const hint =
      configured.length > 0
        ? ` Configured providers: ${configured.join(", ")}. Run 'coge configure' to switch.`
        : ` Run 'coge configure' to set up a provider.`;
    throw new Error(
      `Provider "${name}" requires ${envKey}. Set it: export ${envKey}=your-key.${hint}`
    );
  }
  const model = config.model ?? config.models?.[name];
  return factory(apiKey, model);
}

export { createGeminiProvider } from "./gemini.js";
export { createOpenRouterProvider } from "./openrouter.js";
export { createOpenAIProvider } from "./openai.js";
export { createOllamaProvider } from "./ollama.js";
export { createCerebrasProvider } from "./cerebras.js";
export { createCloudflareProvider } from "./cloudflare.js";
export { createCohereProvider } from "./cohere.js";
export { createGithubModelsProvider } from "./github-models.js";
export { createGroqProvider } from "./groq.js";
export { createHuggingFaceProvider } from "./huggingface.js";
export { createCodestralProvider } from "./codestral.js";
export { createMistralProvider } from "./mistral.js";
export { createVercelAIProvider } from "./vercel-ai.js";
