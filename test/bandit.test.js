import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import os from "os";

import {
  loadBanditState,
  saveBanditState,
  computeReward,
  applyDecay,
  selectArms,
  updateArm,
  selectRaceProviders,
  pickProviders,
} from "../lib/bandit.js";

let tmpDir;
let origXdg;
let origAppdata;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "coge-bandit-test-"));
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

describe("loadBanditState / saveBanditState", () => {
  it("returns empty object when file is missing", () => {
    const state = loadBanditState();
    assert.deepEqual(state, {});
  });

  it("round-trips JSON correctly", () => {
    const state = {
      "groq:llama-3.3-70b-versatile": {
        n: 10, avg_latency: 500, success_rate: 0.9,
        reward: 0.8, last_used: "2026-02-20T00:00:00.000Z",
      },
    };
    saveBanditState(state);
    const loaded = loadBanditState();
    assert.deepEqual(loaded, state);
  });

  it("creates config directory if missing", () => {
    const dir = path.join(tmpDir, "coge");
    assert.equal(fs.existsSync(dir), false);
    saveBanditState({ test: { n: 1 } });
    assert.equal(fs.existsSync(dir), true);
  });
});

describe("computeReward", () => {
  it("rewards faster + more reliable arms higher", () => {
    const state = {
      fast: { n: 10, avg_latency: 200, success_rate: 0.95, reward: 0 },
      slow: { n: 10, avg_latency: 800, success_rate: 0.95, reward: 0 },
    };
    computeReward(state);
    assert.ok(state.fast.reward > state.slow.reward,
      `fast reward ${state.fast.reward} should be > slow reward ${state.slow.reward}`);
  });

  it("penalizes unreliable arms even if fast", () => {
    const state = {
      fast_unreliable: { n: 10, avg_latency: 100, success_rate: 0.2, reward: 0 },
      slow_reliable: { n: 10, avg_latency: 800, success_rate: 1.0, reward: 0 },
    };
    computeReward(state);
    assert.ok(state.slow_reliable.reward > state.fast_unreliable.reward,
      `reliable reward ${state.slow_reliable.reward} should be > unreliable ${state.fast_unreliable.reward}`);
  });

  it("sets reward=1 when only one arm", () => {
    const state = {
      solo: { n: 10, avg_latency: 500, success_rate: 1.0, reward: 0 },
    };
    computeReward(state);
    // normalized=1, reward = 1.0 * (0.3 + 0.7 * 1) = 1.0
    assert.equal(state.solo.reward, 1.0);
  });

  it("handles all arms with same latency", () => {
    const state = {
      a: { n: 10, avg_latency: 500, success_rate: 0.8, reward: 0 },
      b: { n: 10, avg_latency: 500, success_rate: 0.9, reward: 0 },
    };
    computeReward(state);
    // Both normalized=1, so reward = success_rate * 1.0
    assert.equal(state.a.reward, 0.8);
    assert.equal(state.b.reward, 0.9);
  });

  it("does nothing for empty state", () => {
    const state = {};
    computeReward(state);
    assert.deepEqual(state, {});
  });
});

describe("applyDecay", () => {
  it("does not decay arms used within 7 days", () => {
    const now = new Date("2026-02-22T12:00:00Z");
    const state = {
      recent: { reward: 0.9, last_used: "2026-02-20T00:00:00.000Z" },
    };
    applyDecay(state, now);
    assert.equal(state.recent.reward, 0.9);
  });

  it("decays arms older than 7 days toward 0.5", () => {
    const now = new Date("2026-02-22T12:00:00Z");
    const state = {
      old: { reward: 0.9, last_used: "2026-02-01T00:00:00.000Z" }, // ~21 days old
    };
    applyDecay(state, now);
    assert.ok(state.old.reward < 0.9, "reward should decrease");
    assert.ok(state.old.reward > 0.5, "reward should not yet reach 0.5");
  });

  it("fully decays very old arms to 0.5", () => {
    const now = new Date("2026-02-22T12:00:00Z");
    const state = {
      ancient: { reward: 0.9, last_used: "2025-12-01T00:00:00.000Z" }, // ~83 days old
    };
    applyDecay(state, now);
    assert.ok(Math.abs(state.ancient.reward - 0.5) < 0.01,
      `reward ${state.ancient.reward} should be ~0.5`);
  });

  it("decays low-reward arms upward toward 0.5", () => {
    const now = new Date("2026-02-22T12:00:00Z");
    const state = {
      low: { reward: 0.1, last_used: "2026-02-01T00:00:00.000Z" },
    };
    applyDecay(state, now);
    assert.ok(state.low.reward > 0.1, "low reward should increase toward 0.5");
  });

  it("skips arms without last_used", () => {
    const state = {
      nodate: { reward: 0.9 },
    };
    applyDecay(state);
    assert.equal(state.nodate.reward, 0.9);
  });
});

describe("selectArms", () => {
  it("returns all candidates when fewer than n", () => {
    const state = {};
    const candidates = ["a:m1", "b:m2"];
    const result = selectArms(state, candidates, 3);
    assert.equal(result.length, 2);
    assert.ok(candidates.every((c) => result.includes(c)));
  });

  it("returns n arms from larger candidate list", () => {
    const state = {};
    const candidates = ["a:m1", "b:m2", "c:m3", "d:m4", "e:m5"];
    const result = selectArms(state, candidates, 3);
    assert.equal(result.length, 3);
    for (const arm of result) {
      assert.ok(candidates.includes(arm));
    }
  });

  it("cold arms get optimistic reward and are considered", () => {
    const state = {
      "a:m1": { n: 100, avg_latency: 500, success_rate: 0.3, reward: 0.2 },
    };
    const candidates = ["a:m1", "b:m2"];
    // Cold arm b:m2 has reward=0.5 vs a:m1 reward=0.2
    // Over many runs, b:m2 should be preferred for slot 1
    let bFirst = 0;
    for (let i = 0; i < 100; i++) {
      const result = selectArms(state, candidates, 2);
      if (result[0] === "b:m2") bFirst++;
    }
    assert.ok(bFirst > 50, `cold arm should be preferred but was first only ${bFirst}/100 times`);
  });

  it("prefers best arm for exploitation (slot 1)", () => {
    const state = {
      "a:m1": { n: 100, avg_latency: 200, success_rate: 1.0, reward: 1.0, last_used: new Date().toISOString() },
      "b:m2": { n: 100, avg_latency: 800, success_rate: 0.5, reward: 0.15, last_used: new Date().toISOString() },
      "c:m3": { n: 100, avg_latency: 600, success_rate: 0.6, reward: 0.3, last_used: new Date().toISOString() },
    };
    const candidates = ["a:m1", "b:m2", "c:m3"];
    let aFirst = 0;
    for (let i = 0; i < 200; i++) {
      const result = selectArms(state, candidates, 2);
      if (result[0] === "a:m1") aFirst++;
    }
    // With ε=0.1, a:m1 should be first ~90% of the time
    assert.ok(aFirst > 140, `best arm should be first most of the time but was first only ${aFirst}/200 times`);
  });

  it("returns empty array for empty candidates", () => {
    const result = selectArms({}, [], 3);
    assert.deepEqual(result, []);
  });

  it("returns no duplicates", () => {
    const state = {};
    const candidates = ["a:m1", "b:m2", "c:m3", "d:m4"];
    for (let i = 0; i < 50; i++) {
      const result = selectArms(state, candidates, 3);
      const unique = new Set(result);
      assert.equal(unique.size, result.length, "should have no duplicates");
    }
  });
});

describe("updateArm", () => {
  it("initializes a new arm correctly on first update", () => {
    const state = {};
    updateArm(state, "a:m1", 500, true);
    const arm = state["a:m1"];
    assert.equal(arm.n, 1);
    assert.equal(arm.avg_latency, 500);
    assert.equal(arm.success_rate, 1);
    assert.ok(arm.last_used);
  });

  it("computes incremental average correctly", () => {
    const state = {};
    updateArm(state, "a:m1", 400, true);
    updateArm(state, "a:m1", 600, true);
    const arm = state["a:m1"];
    assert.equal(arm.n, 2);
    assert.equal(arm.avg_latency, 500);
    assert.equal(arm.success_rate, 1);
  });

  it("tracks failures in success_rate", () => {
    const state = {};
    updateArm(state, "a:m1", 400, true);
    updateArm(state, "a:m1", 600, false);
    const arm = state["a:m1"];
    assert.equal(arm.n, 2);
    assert.equal(arm.success_rate, 0.5);
  });

  it("recalculates reward after update", () => {
    const state = {};
    updateArm(state, "a:m1", 200, true);
    updateArm(state, "b:m2", 800, true);
    // a:m1 is faster, should have higher reward
    assert.ok(state["a:m1"].reward > state["b:m2"].reward);
  });

  it("handles many updates with correct running average", () => {
    const state = {};
    const latencies = [100, 200, 300, 400, 500];
    for (const lat of latencies) {
      updateArm(state, "a:m1", lat, true);
    }
    const arm = state["a:m1"];
    assert.equal(arm.n, 5);
    assert.equal(arm.avg_latency, 300); // mean of [100..500]
    assert.equal(arm.success_rate, 1);
  });
});

describe("selectRaceProviders", () => {
  it("returns all configured when fewer than max", () => {
    const result = selectRaceProviders(["a", "b"], "a", 3);
    assert.deepEqual(result.sort(), ["a", "b"]);
  });

  it("includes preferred provider when configured", () => {
    const configured = ["a", "b", "c", "d", "e"];
    for (let i = 0; i < 20; i++) {
      const result = selectRaceProviders(configured, "c", 3);
      assert.equal(result.length, 3);
      assert.equal(result[0], "c");
    }
  });

  it("returns max providers from larger list", () => {
    const configured = ["a", "b", "c", "d", "e"];
    const result = selectRaceProviders(configured, "x", 3);
    assert.equal(result.length, 3);
  });
});

describe("pickProviders", () => {
  it("manual strategy returns only the configured provider", () => {
    const config = { strategy: "manual", provider: "github-models", providers: {} };
    const configured = ["groq", "mistral", "github-models", "gemini"];
    const defaultModels = { groq: "m1", mistral: "m2", "github-models": "m3", gemini: "m4" };

    const { selected, banditArms } = pickProviders(config, configured, defaultModels, 3);
    assert.deepEqual(selected, ["github-models"]);
    assert.equal(banditArms, undefined);
  });

  it("manual strategy ignores configured providers list", () => {
    // Even with many providers configured, manual should only use the chosen one
    const config = { strategy: "manual", provider: "openai", providers: {} };
    const configured = ["groq", "mistral", "openai", "gemini", "cohere"];
    const defaultModels = {};

    const { selected } = pickProviders(config, configured, defaultModels, 3);
    assert.deepEqual(selected, ["openai"]);
  });

  it("auto strategy with multiple providers uses bandit selection", () => {
    const config = {
      strategy: "auto",
      provider: "gemini",
      providers: {
        groq: { default: "llama" },
        gemini: { default: "flash" },
        mistral: { default: "small" },
        openai: { default: "gpt" },
      },
    };
    const configured = ["groq", "gemini", "mistral", "openai"];
    const defaultModels = {};

    const { selected, banditArms } = pickProviders(config, configured, defaultModels, 3);
    assert.equal(selected.length, 3);
    assert.ok(Array.isArray(banditArms));
    assert.equal(banditArms.length, 3);
    // Each arm should be "provider:model" format
    for (const arm of banditArms) {
      assert.ok(arm.includes(":"), `arm "${arm}" should contain ":"`);
    }
  });

  it("auto strategy with single provider falls back to that provider", () => {
    const config = { strategy: "auto", provider: "gemini", providers: {} };
    const configured = ["gemini"];
    const defaultModels = { gemini: "flash" };

    const { selected, banditArms } = pickProviders(config, configured, defaultModels, 3);
    assert.deepEqual(selected, ["gemini"]);
    assert.equal(banditArms, undefined);
  });

  it("undefined strategy (default) with multiple providers uses bandit", () => {
    const config = {
      provider: "gemini",
      providers: { groq: { default: "llama" }, gemini: { default: "flash" } },
    };
    const configured = ["groq", "gemini"];
    const defaultModels = {};

    const { selected, banditArms } = pickProviders(config, configured, defaultModels, 3);
    assert.equal(selected.length, 2);
    assert.ok(Array.isArray(banditArms));
  });

  it("provider with blacklisted default model still participates in selection", () => {
    // Blacklist affects model display (configure/pull), not provider selection.
    // The bandit tracks provider:model arms independently.
    const config = {
      strategy: "auto",
      provider: "gemini",
      providers: {
        groq: { default: "llama", blacklist: ["llama"] },
        gemini: { default: "flash" },
        mistral: { default: "small" },
      },
    };
    const configured = ["groq", "gemini", "mistral"];
    const defaultModels = {};

    const { selected } = pickProviders(config, configured, defaultModels, 3);
    assert.equal(selected.length, 3);
    assert.ok(selected.includes("groq"), "groq should still be selected despite blacklisted default");
  });
});
