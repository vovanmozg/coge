import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import os from "os";

import { loadStats, saveStats, recordAction, formatStats } from "../lib/stats.js";

let tmpDir;
let origXdg;
let origAppdata;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "coge-stats-test-"));
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

describe("loadStats / saveStats", () => {
  it("returns empty object when file is missing", () => {
    const stats = loadStats();
    assert.deepEqual(stats, {});
  });

  it("round-trips JSON correctly", () => {
    const stats = {
      "gemini:gemini-2.5-flash": {
        execute: 12, copy: 5, cancel: 3,
        last_used: "2026-02-22T00:00:00.000Z",
      },
    };
    saveStats(stats);
    const loaded = loadStats();
    assert.deepEqual(loaded, stats);
  });

  it("creates config directory if missing", () => {
    const dir = path.join(tmpDir, "coge");
    assert.equal(fs.existsSync(dir), false);
    saveStats({ test: { execute: 1 } });
    assert.equal(fs.existsSync(dir), true);
  });
});

describe("recordAction", () => {
  it("initializes new arm with correct counts", () => {
    recordAction("groq:llama-3.3-70b-versatile", "execute");
    const stats = loadStats();
    const arm = stats["groq:llama-3.3-70b-versatile"];
    assert.equal(arm.execute, 1);
    assert.equal(arm.copy, 0);
    assert.equal(arm.cancel, 0);
    assert.ok(arm.last_used);
  });

  it("increments existing arm", () => {
    recordAction("gemini:gemini-2.5-flash", "execute");
    recordAction("gemini:gemini-2.5-flash", "execute");
    recordAction("gemini:gemini-2.5-flash", "copy");
    recordAction("gemini:gemini-2.5-flash", "cancel");
    const stats = loadStats();
    const arm = stats["gemini:gemini-2.5-flash"];
    assert.equal(arm.execute, 2);
    assert.equal(arm.copy, 1);
    assert.equal(arm.cancel, 1);
  });

  it("tracks multiple arms independently", () => {
    recordAction("a:m1", "execute");
    recordAction("b:m2", "copy");
    const stats = loadStats();
    assert.equal(stats["a:m1"].execute, 1);
    assert.equal(stats["a:m1"].copy, 0);
    assert.equal(stats["b:m2"].execute, 0);
    assert.equal(stats["b:m2"].copy, 1);
  });
});

describe("formatStats", () => {
  it("shows message when no stats", () => {
    const output = formatStats({});
    assert.equal(output, "No usage stats recorded yet.");
  });

  it("produces expected table", () => {
    const stats = {
      "gemini:gemini-2.5-flash": { execute: 12, copy: 5, cancel: 3 },
      "groq:llama-3.3-70b-versatile": { execute: 8, copy: 2, cancel: 1 },
    };
    const output = formatStats(stats);
    assert.ok(output.includes("Provider/Model"));
    assert.ok(output.includes("Exec"));
    assert.ok(output.includes("Accept%"));
    assert.ok(output.includes("gemini:gemini-2.5-flash"));
    assert.ok(output.includes("groq:llama-3.3-70b-versatile"));
    // gemini: (12+5)/20 = 85%
    assert.ok(output.includes("85%"));
    // groq: (8+2)/11 = 91%
    assert.ok(output.includes("91%"));
  });

  it("handles arm with zero total", () => {
    const stats = {
      "test:model": { execute: 0, copy: 0, cancel: 0 },
    };
    const output = formatStats(stats);
    assert.ok(output.includes("0%"));
  });
});
