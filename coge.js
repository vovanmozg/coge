#!/usr/bin/env node

import readline from "readline";
import { execSync } from "child_process";
import { loadConfig, writeDefaultConfigIfMissing, writeConfig, getConfigPath, defaultConfig } from "./lib/config.js";
import { getProvider, getConfiguredProviders, getDefaultModels, PROVIDER_MODELS, PROVIDER_FETCH_MODELS, PROVIDER_PAGE_URLS, getAvailableModels } from "./providers/index.js";
import { loadBanditState, saveBanditState, updateArm, pickProviders } from "./lib/bandit.js";
import { recordAction, loadStats, formatStats } from "./lib/stats.js";
import { normalizeAvailableEntry, sortByCategory, isBlacklisted } from "./lib/model-classify.js";
import clipboard from "clipboardy";

process.noDeprecation = true;

writeDefaultConfigIfMissing();
const config = loadConfig();
const args = process.argv.slice(2);

const PROVIDERS = Object.keys(PROVIDER_MODELS);

function ask(rl, question, defaultValue = "") {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  return new Promise((resolve) => {
    rl.question(question + suffix + ": ", (answer) => {
      resolve((answer || defaultValue).trim());
    });
  });
}

async function runConfigure() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const current = loadConfig();
  console.log("Current config:", getConfigPath());

  const strategyAnswer = await ask(rl, "Strategy: auto (bandit picks fastest) / manual (you choose)", current.strategy ?? "auto");
  const strategy = strategyAnswer.toLowerCase() === "manual" ? "manual" : "auto";

  if (strategy === "auto") {
    rl.close();
    const newConfig = { ...current, strategy: "auto" };
    writeConfig(newConfig);
    console.log("Strategy set to auto (bandit will learn fastest providers).");
    console.log("Config saved to", getConfigPath());
    return;
  }

  const provider = await ask(rl, `Provider (${PROVIDERS.join(", ")})`, current.provider);
  if (!PROVIDERS.includes(provider.toLowerCase())) {
    throw new Error(`Unknown provider: ${provider}. Use: ${PROVIDERS.join(", ")}`);
  }
  const providerLower = provider.toLowerCase();
  const blacklist = current.providers?.[providerLower]?.blacklist ?? [];
  const rawAvailable = current.providers?.[providerLower]?.available ?? getAvailableModels(providerLower);
  if (rawAvailable.length > 0) {
    const models = sortByCategory(rawAvailable.map((entry) => {
      const norm = normalizeAvailableEntry(entry);
      if (isBlacklisted(norm.id, blacklist)) norm.category = "blacklist";
      return norm;
    }));
    const colored = models.map((m) => {
      if (m.category === "blacklist") return `\x1b[90m\x1b[9m${m.id}\x1b[0m`;
      if (m.category === "top") return `\x1b[33m${m.id}\x1b[0m`;
      if (m.category === "small") return `\x1b[32m${m.id}\x1b[0m`;
      if (m.category === "irrelevant") return `\x1b[2m${m.id}\x1b[0m`;
      return m.id;
    });
    console.log(`Available models: ${colored.join(", ")}`);
  }
  const defModel = current.providers?.[provider]?.default ?? current.model ?? defaultConfig.model;
  const model = await ask(rl, `Model for ${provider}`, defModel);
  rl.close();
  const providerKey = provider.toLowerCase();
  const chosenModel = model || defModel;
  const updatedProviders = { ...current.providers };
  if (updatedProviders[providerKey]) {
    const sorted = sortByCategory(updatedProviders[providerKey].available.map(normalizeAvailableEntry)).map((m) => m.id);
    updatedProviders[providerKey] = { ...updatedProviders[providerKey], default: chosenModel, available: sorted };
  } else {
    const knownAvailable = sortByCategory(getAvailableModels(providerKey).map(normalizeAvailableEntry)).map((m) => m.id);
    updatedProviders[providerKey] = { default: chosenModel, available: knownAvailable };
  }
  const newConfig = {
    provider: providerKey,
    model: chosenModel,
    providers: updatedProviders,
    strategy: "manual",
  };
  writeConfig(newConfig);
  console.log("Config saved to", getConfigPath());
}

/**
 * Strips HTML tags and collapses whitespace to extract readable text.
 * @param {string} html
 * @returns {string}
 */
function htmlToText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetches model IDs by scraping a documentation page and extracting via LLM.
 * @param {string} url
 * @param {import("./providers/index.js").Provider} llmProvider
 * @returns {Promise<string[]>}
 */
async function fetchModelsFromPage(url, llmProvider) {
  const { classifyModel } = await import("./lib/model-classify.js");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const pageText = htmlToText(html).slice(0, 30000);

  const extractionPrompt = [
    "You are given the text content of a documentation page that lists AI models for an API provider.",
    "Extract all available model IDs (the exact strings used in API calls) from this page.",
    "Return ONLY a JSON array of model ID strings. No explanations, no markdown, no backticks.",
    'Example: ["model-a", "model-b"]',
  ].join(" ");

  const response = await llmProvider.generateContent(extractionPrompt, pageText);
  const modelIds = JSON.parse(response);
  if (!Array.isArray(modelIds) || modelIds.length === 0) {
    throw new Error("LLM returned empty or non-array result");
  }
  return modelIds.map((id) => ({ id, category: classifyModel(id) }));
}

async function runPullModels(providerName) {
  if (!providerName) {
    console.error("Usage: coge --pull models <provider>");
    console.error(`Available providers: ${PROVIDERS.join(", ")}`);
    process.exit(1);
  }
  const name = providerName.toLowerCase();
  if (!PROVIDERS.includes(name)) {
    console.error(`Unknown provider: ${name}. Available: ${PROVIDERS.join(", ")}`);
    process.exit(1);
  }
  const providerMeta = PROVIDER_MODELS[name];
  const fetchFn = PROVIDER_FETCH_MODELS[name];
  const modelsPageUrl = PROVIDER_PAGE_URLS[name];

  if (!fetchFn && !modelsPageUrl) {
    console.error(`Provider "${name}" does not support fetching models.`);
    process.exit(1);
  }

  let modelIds;

  // Try provider's own fetchModels first
  if (fetchFn) {
    console.log(`Fetching models for ${name}...`);
    try {
      modelIds = await fetchFn();
    } catch (err) {
      if (modelsPageUrl) {
        console.log(`API fetch failed (${err.message}), falling back to page scraping...`);
      } else {
        console.error(`Failed to fetch models: ${err.message}`);
        process.exit(1);
      }
    }
  }

  // Fall back to page scraping + LLM extraction
  if (!modelIds && modelsPageUrl) {
    console.log(`Fetching models page: ${modelsPageUrl}`);
    try {
      const llmProvider = getProvider(config);
      modelIds = await fetchModelsFromPage(modelsPageUrl, llmProvider);
    } catch (err) {
      console.error(`Failed to extract model list: ${err.message}`);
      process.exit(1);
    }
  }

  sortByCategory(modelIds);

  const current = loadConfig();
  const updatedProviders = { ...current.providers };
  const existing = updatedProviders[name] ?? { default: providerMeta.default, available: [] };
  updatedProviders[name] = { ...existing, available: modelIds.map((m) => m.id) };
  writeConfig({ ...current, providers: updatedProviders });

  const blacklist = updatedProviders[name]?.blacklist ?? [];
  console.log(`Updated ${name} available models (${modelIds.length}):`);
  for (const m of modelIds) {
    if (blacklist.includes(m.id)) {
      console.log(`  \x1b[9m\x1b[2m${m.id}\x1b[0m [blacklisted]`);
    } else {
      const color = m.category === "top" ? "\x1b[33m" : m.category === "small" ? "\x1b[32m" : m.category === "irrelevant" ? "\x1b[2m" : "";
      const reset = color ? "\x1b[0m" : "";
      console.log(`  ${color}${m.id}${reset}`);
    }
  }
}

async function runPtestAll() {
  const configured = getConfiguredProviders();
  if (configured.length === 0) {
    console.error("No providers configured. Set API key environment variables first.");
    process.exit(1);
  }

  const current = loadConfig();
  const defaults = getDefaultModels();
  const systemPrompt = buildSystemPrompt();
  const testPrompt = "list of files";

  console.log("Testing all configured providers...\n");

  const results = [];

  for (const name of configured) {
    const model = current.providers?.[name]?.default ?? defaults[name] ?? "unknown";
    const label = `${name} (${model})`;
    const padded = label.padEnd(40);

    try {
      const start = Date.now();
      const provider = getProvider({ ...current, provider: name, model });
      const response = await provider.generateContent(systemPrompt, testPrompt);
      const latency = Date.now() - start;
      const preview = response.split("\n")[0].slice(0, 60);
      const startsWithLs = /^ls\b/i.test(response.trim());

      if (startsWithLs) {
        console.log(`  \x1b[32m✓\x1b[0m  ${padded} ${latency}ms  "${preview}"`);
        results.push(true);
      } else {
        console.log(`  \x1b[32m✓\x1b[0m  ${padded} ${latency}ms  "${preview}" \x1b[33m(warning: does not start with "ls")\x1b[0m`);
        results.push(true);
      }
    } catch (err) {
      const msg = err.message?.split("\n")[0].slice(0, 80) ?? "unknown error";
      console.log(`  \x1b[31m✗\x1b[0m  ${padded} ${msg}`);
      results.push(false);
    }
  }

  const passed = results.filter(Boolean).length;
  console.log(`\nResults: ${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
}

function buildSystemPrompt() {
  const platform = process.platform;
  if (platform === "win32") {
    return [
      "You are a Windows command-line assistant. You receive instructions and reply with a single PowerShell command. ",
      "One line only. No explanations, no markdown, no backticks. ",
      "Chain multiple commands with ; or |. Output nothing but the command.",
    ].join("");
  }
  const shell = platform === "darwin" ? "zsh" : "bash";
  return [
    `You are a ${platform === "darwin" ? "macOS" : "Linux"} command-line assistant. You receive instructions and reply with a single ${shell} command. `,
    "One line only. No explanations, no markdown, no backticks. ",
    "Chain multiple commands with && or |. Output nothing but the command.",
  ].join("");
}

if (args[0] === "--help" || args[0] === "-h") {
  console.log(`coge - AI-powered command generator

Usage:
  coge <prompt>                  Generate a shell command from description
  coge --configure | -c          Configure provider and model
  coge --pull models <provider>   Fetch available models for a provider
  coge --ptestall                 Test all configured providers
  coge --stats                     Show usage statistics per provider/model

Options:
  --non-interactive              Print command and exit (for pipelines)
  --debug                        Show config, provider, and timing info
  --help, -h                     Show this help message

Providers: ${PROVIDERS.join(", ")}`);
  process.exit(0);
} else if (args[0] === "--configure" || args[0] === "-c") {
  runConfigure()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });
} else if (args[0] === "--ptestall") {
  runPtestAll()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });
} else if (args[0] === "--stats") {
  console.log(formatStats(loadStats()));
  process.exit(0);
} else if (args[0] === "--pull" && args[1] === "models") {
  runPullModels(args[2])
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });
} else if (args[0] === "config") {
  console.error("Use --configure or -c to configure.");
  process.exit(0);
} else {
  const nonInteractive = args.includes("--non-interactive");
  const debug = args.includes("--debug");
  const filteredArgs = args.filter((a) => a !== "--non-interactive" && a !== "--debug");
  const promptText = filteredArgs.join(" ");
  if (!promptText) {
    console.error("No prompt provided.");
    process.exit(1);
  }

  const systemPrompt = buildSystemPrompt();
  const defaultModels = getDefaultModels();

  function autoBlacklist(results, cfg) {
    const MODEL_ERRORS = /unknown_model|unavailable_model/i;
    const current = loadConfig();
    let changed = false;
    for (const { name, success, error } of results) {
      if (success || !error || !MODEL_ERRORS.test(error)) continue;
      const model = cfg.providers?.[name]?.default ?? defaultModels[name];
      if (!model) continue;
      const entry = current.providers?.[name];
      if (!entry) continue;
      const bl = entry.blacklist ?? [];
      if (!bl.includes(model)) {
        bl.push(model);
        entry.blacklist = bl;
        changed = true;
        console.error(`Auto-blacklisted ${name}:${model} (${error})`);
      }
    }
    if (changed) writeConfig(current);
  }

  function updateBanditAfterRace(results, cfg) {
    const state = loadBanditState();
    for (const { name, latency, success } of results) {
      const model = cfg.providers?.[name]?.default ?? defaultModels[name] ?? "unknown";
      const armKey = `${name}:${model}`;
      updateArm(state, armKey, latency, success);
    }
    saveBanditState(state);
  }

  async function raceProviders(providerNames, cfg, sysPrompt, userPrompt) {
    const results = [];

    const wrappedPromises = providerNames.map(async (name) => {
      const start = Date.now();
      try {
        const provider = getProvider({ ...cfg, provider: name, model: cfg.providers?.[name]?.default });
        const result = await provider.generateContent(sysPrompt, userPrompt);
        const latency = Date.now() - start;
        results.push({ name, latency, success: true });
        return { command: result, provider: name };
      } catch (err) {
        const latency = Date.now() - start;
        results.push({ name, latency, success: false, error: err.message });
        throw err;
      }
    });

    const winner = await Promise.any(wrappedPromises);

    // Wait for stragglers to settle, then update bandit state + auto-blacklist (fire and forget)
    Promise.allSettled(wrappedPromises).then(() => {
      updateBanditAfterRace(results, cfg);
      autoBlacklist(results, cfg);
    });

    return winner;
  }

  async function main() {
    if (debug) {
      console.log(`Config: ${getConfigPath()}`);
      console.log(`Provider: ${config.provider}`);
      console.log(`Model: ${config.model ?? "default"}`);
    }

    const configured = getConfiguredProviders();
    const { selected, banditArms } = pickProviders(config, configured, defaultModels, 3);
    if (debug && banditArms) console.log(`Bandit arms: ${banditArms.join(", ")}`);

    let command;
    let winnerArm;
    const startTime = Date.now();

    if (selected.length <= 1) {
      // 0 or 1 configured — use the user's configured provider directly
      const provider = getProvider(config);
      command = await provider.generateContent(systemPrompt, promptText);
      const model = config.providers?.[config.provider]?.default ?? defaultModels[config.provider] ?? config.model ?? "unknown";
      winnerArm = `${config.provider}:${model}`;
    } else {
      if (debug) {
        console.log(`Racing providers: ${selected.join(", ")}`);
      }
      try {
        const { command: result, provider: winner } = await raceProviders(
          selected, config, systemPrompt, promptText
        );
        command = result;
        const winnerModel = config.providers?.[winner]?.default ?? defaultModels[winner] ?? "unknown";
        winnerArm = `${winner}:${winnerModel}`;
        if (debug) console.log(`Winner: ${winner}`);
      } catch (err) {
        if (err instanceof AggregateError) {
          console.error("All providers failed:");
          for (const e of err.errors) console.error(`  - ${e.message}`);
          process.exit(1);
        }
        throw err;
      }
    }

    const elapsed = Date.now() - startTime;

    if (debug) {
      console.log(`Response time: ${elapsed}ms`);
    }

    if (nonInteractive) {
      recordAction(winnerArm, "execute");
      process.stdout.write(command + "\n");
      process.exit(0);
    }

    process.stdout.write(`\n${command}\n`);
    process.stdout.write(`\x1b[2m  [Enter] Execute  [c] Copy  [Esc] Cancel\x1b[0m\n`);

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (key) => {
      if (key === "\r") {
        recordAction(winnerArm, "execute");
        process.stdin.setRawMode(false);
        process.stdin.pause();
        try {
          execSync(command, { stdio: "inherit", shell: true });
          process.exit(0);
        } catch (err) {
          process.exit(err.status ?? 1);
        }
      } else if (key === "c") {
        recordAction(winnerArm, "copy");
        clipboard.writeSync(command);
        process.exit(0);
      } else if (key === "\u001b") {
        recordAction(winnerArm, "cancel");
        process.exit(0);
      }
    });
  }

  main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}
