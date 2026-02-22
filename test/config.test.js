import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import os from "os";

import {
  defaultConfig,
  getConfigDir,
  getConfigPath,
  loadConfig,
  writeDefaultConfigIfMissing,
  writeConfig,
} from "../lib/config.js";

let tmpDir;
let origXdg;
let origAppdata;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "coge-test-"));
  origXdg = process.env.XDG_CONFIG_HOME;
  origAppdata = process.env.APPDATA;
  process.env.XDG_CONFIG_HOME = tmpDir;
  process.env.APPDATA = tmpDir;
});

afterEach(() => {
  if (origXdg === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = origXdg;
  if (origAppdata === undefined) delete process.env.APPDATA;
  else process.env.APPDATA = origAppdata;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("getConfigDir", () => {
  it("returns path ending with 'coge'", () => {
    const dir = getConfigDir();
    assert.equal(path.basename(dir), "coge");
  });

  it("uses XDG_CONFIG_HOME on non-Windows", () => {
    if (process.platform === "win32") return;
    const dir = getConfigDir();
    assert.equal(dir, path.join(tmpDir, "coge"));
  });

  it("uses APPDATA on Windows", () => {
    if (process.platform !== "win32") return;
    const dir = getConfigDir();
    assert.equal(dir, path.join(tmpDir, "coge"));
  });
});

describe("getConfigPath", () => {
  it("returns path ending with config.json", () => {
    const p = getConfigPath();
    assert.equal(path.basename(p), "config.json");
  });

  it("is inside config dir", () => {
    const p = getConfigPath();
    assert.equal(path.dirname(p), getConfigDir());
  });
});

describe("defaultConfig", () => {
  it("has provider, model, and providers fields", () => {
    assert.equal(typeof defaultConfig.provider, "string");
    assert.equal(typeof defaultConfig.model, "string");
    assert.equal(typeof defaultConfig.providers, "object");
  });

  it("has gemini as default provider", () => {
    assert.equal(defaultConfig.provider, "gemini");
  });

  it("providers entries have default and available", () => {
    for (const [, entry] of Object.entries(defaultConfig.providers)) {
      assert.equal(typeof entry.default, "string");
      assert.ok(Array.isArray(entry.available));
    }
  });

  it("model matches the default provider's default model", () => {
    assert.equal(defaultConfig.model, defaultConfig.providers.gemini.default);
  });
});

describe("loadConfig", () => {
  it("returns defaults when config file is missing", () => {
    const cfg = loadConfig();
    assert.equal(cfg.provider, defaultConfig.provider);
    assert.equal(cfg.model, defaultConfig.model);
    assert.deepEqual(cfg.providers, defaultConfig.providers);
  });

  it("reads new-format config as-is without merging defaults", () => {
    const dir = getConfigDir();
    fs.mkdirSync(dir, { recursive: true });
    const fileCfg = {
      provider: "openrouter",
      model: "custom-model",
      providers: { openrouter: { default: "custom-model", available: ["custom-model"] } },
    };
    fs.writeFileSync(getConfigPath(), JSON.stringify(fileCfg), "utf8");

    const cfg = loadConfig();
    assert.equal(cfg.provider, "openrouter");
    assert.equal(cfg.model, "custom-model");
    assert.deepEqual(cfg.providers, fileCfg.providers);
    // no gemini key — not merged from defaults
    assert.equal(cfg.providers.gemini, undefined);
  });

  it("migrates old format (models map) to new format", () => {
    const dir = getConfigDir();
    fs.mkdirSync(dir, { recursive: true });
    const oldCfg = { provider: "openrouter", models: { openrouter: "custom-model" } };
    fs.writeFileSync(getConfigPath(), JSON.stringify(oldCfg), "utf8");

    const cfg = loadConfig();
    assert.equal(cfg.provider, "openrouter");
    assert.equal(cfg.model, "custom-model");
    assert.equal(cfg.providers.openrouter.default, "custom-model");
    assert.ok(Array.isArray(cfg.providers.openrouter.available));
    // No models key in result
    assert.equal(cfg.models, undefined);
  });

  it("throws on invalid JSON (non-ENOENT error)", () => {
    const dir = getConfigDir();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(getConfigPath(), "{invalid json", "utf8");

    assert.throws(() => loadConfig(), { name: "SyntaxError" });
  });
});

describe("writeDefaultConfigIfMissing", () => {
  it("creates config file when missing and returns true", () => {
    const result = writeDefaultConfigIfMissing();
    assert.equal(result, true);

    const written = JSON.parse(fs.readFileSync(getConfigPath(), "utf8"));
    assert.deepEqual(written, defaultConfig);
  });

  it("returns false when config already exists", () => {
    writeDefaultConfigIfMissing();
    const result = writeDefaultConfigIfMissing();
    assert.equal(result, false);
  });

  it("creates directory structure if missing", () => {
    const dir = getConfigDir();
    assert.equal(fs.existsSync(dir), false);
    writeDefaultConfigIfMissing();
    assert.equal(fs.existsSync(dir), true);
  });
});

describe("writeConfig", () => {
  it("writes valid JSON with new shape to config path", () => {
    const cfg = {
      provider: "openrouter",
      model: "test-model",
      providers: { openrouter: { default: "test-model", available: ["test-model"] } },
    };
    writeConfig(cfg);

    const written = JSON.parse(fs.readFileSync(getConfigPath(), "utf8"));
    assert.equal(written.provider, "openrouter");
    assert.equal(written.model, "test-model");
    assert.deepEqual(written.providers, cfg.providers);
    // No old models key
    assert.equal(written.models, undefined);
  });

  it("creates directory if needed", () => {
    const dir = getConfigDir();
    assert.equal(fs.existsSync(dir), false);

    writeConfig({ provider: "gemini", model: "m", providers: {} });
    assert.equal(fs.existsSync(dir), true);
  });

  it("overwrites existing config", () => {
    writeConfig({ provider: "gemini", model: "old", providers: {} });
    writeConfig({ provider: "openrouter", model: "new", providers: {} });

    const written = JSON.parse(fs.readFileSync(getConfigPath(), "utf8"));
    assert.equal(written.provider, "openrouter");
    assert.equal(written.model, "new");
  });
});
