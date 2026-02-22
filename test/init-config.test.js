import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

let tmpDir;
let origXdg;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "coge-init-test-"));
  origXdg = process.env.XDG_CONFIG_HOME;
});

afterEach(() => {
  if (origXdg === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = origXdg;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("init-config.js", () => {
  it("creates config when missing", () => {
    const result = execFileSync(process.execPath, ["lib/init-config.js"], {
      cwd: projectRoot,
      env: { ...process.env, XDG_CONFIG_HOME: tmpDir },
      encoding: "utf8",
    });

    assert.match(result, /created default config/);
    const configPath = path.join(tmpDir, "coge", "config.json");
    assert.equal(fs.existsSync(configPath), true);
  });

  it("does not throw when config already exists", () => {
    // Run twice — second run should not throw
    const env = { ...process.env, XDG_CONFIG_HOME: tmpDir };
    execFileSync(process.execPath, ["lib/init-config.js"], { cwd: projectRoot, env, encoding: "utf8" });
    const result = execFileSync(process.execPath, ["lib/init-config.js"], { cwd: projectRoot, env, encoding: "utf8" });

    // Second run produces no "created" message
    assert.equal(result.includes("created default config"), false);
  });
});
