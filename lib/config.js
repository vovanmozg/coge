import fs from "fs";
import path from "path";
import os from "os";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

/** @type {{ provider: string; model: string; providers: Record<string, { default: string; available: string[] }> }} */
export const defaultConfig = require("./default-config.json");

const CONFIG_FILENAME = "config.json";

/**
 * Returns the config directory for the current platform (Linux/macOS/Windows).
 * @returns {string}
 */
export function getConfigDir() {
  const name = "coge";
  if (process.platform === "win32") {
    const base = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    return path.join(base, name);
  }
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(base, name);
}

/**
 * @returns {string}
 */
export function getConfigPath() {
  return path.join(getConfigDir(), CONFIG_FILENAME);
}

/**
 * Migrates old flat { models: { provider: model } } format to new per-provider structure.
 * @param {object} fileConfig
 * @returns {{ provider: string; model: string; providers: Record<string, { default: string; available: string[] }> }}
 */
/**
 * Merges blacklists from defaultConfig into user providers (additive).
 * @param {Record<string, object>} providers
 */
function mergeDefaultBlacklists(providers) {
  for (const [name, defEntry] of Object.entries(defaultConfig.providers)) {
    if (!defEntry.blacklist?.length) continue;
    const userEntry = providers[name];
    if (!userEntry) continue;
    const merged = new Set([...(defEntry.blacklist), ...(userEntry.blacklist ?? [])]);
    userEntry.blacklist = [...merged];
  }
}

function migrateOldConfig(fileConfig) {
  const provider = fileConfig.provider ?? defaultConfig.provider;
  const providers = {};
  for (const [name, modelId] of Object.entries(fileConfig.models)) {
    const defEntry = defaultConfig.providers[name] ?? {};
    const knownAvailable = defEntry.available ?? [];
    const entry = { default: modelId, available: [...knownAvailable] };
    if (defEntry.blacklist?.length) entry.blacklist = [...defEntry.blacklist];
    providers[name] = entry;
  }
  return {
    provider,
    model: fileConfig.models[provider] ?? defaultConfig.model,
    providers,
    strategy: "auto",
  };
}

/**
 * Loads config from file. Returns defaultConfig when file is missing.
 * When file exists, reads as-is (no merging with hardcoded defaults).
 * Handles old format migration transparently.
 * @returns {{ provider: string; model: string; providers: Record<string, { default: string; available: string[] }> }}
 */
export function loadConfig() {
  const configPath = getConfigPath();
  let fileConfig;
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    fileConfig = JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return defaultConfig;
    throw err;
  }
  // Old format: has `models` but no `providers`
  if (fileConfig.models && !fileConfig.providers) {
    return migrateOldConfig(fileConfig);
  }
  const providers = fileConfig.providers ?? {};
  mergeDefaultBlacklists(providers);
  return {
    provider: fileConfig.provider ?? defaultConfig.provider,
    model: fileConfig.model ?? defaultConfig.model,
    providers,
    strategy: fileConfig.strategy ?? "auto",
  };
}

/**
 * Writes default config file if it does not exist. Creates config directory if needed.
 * @returns {boolean} true if file was created, false if it already existed
 */
export function writeDefaultConfigIfMissing() {
  const dir = getConfigDir();
  const configPath = getConfigPath();
  try {
    fs.accessSync(configPath);
    return false;
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2) + "\n", "utf8");
  return true;
}

/**
 * Writes config to file. Creates config directory if needed.
 * @param {{ provider: string; model: string; providers: Record<string, { default: string; available: string[] }> }} config
 */
export function writeConfig(config) {
  const dir = getConfigDir();
  const configPath = getConfigPath();
  fs.mkdirSync(dir, { recursive: true });
  const data = { provider: config.provider, model: config.model, providers: config.providers, strategy: config.strategy };
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}
