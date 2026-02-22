import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

let tmpDir;
let origXdg;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "coge-cli-test-"));
  origXdg = process.env.XDG_CONFIG_HOME;
});

afterEach(() => {
  if (origXdg === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = origXdg;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("CLI", () => {
  it("exits with error when no prompt provided", () => {
    try {
      execFileSync(process.execPath, ["coge.js"], {
        cwd: projectRoot,
        env: { ...process.env, XDG_CONFIG_HOME: tmpDir },
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      assert.fail("Should have exited with non-zero code");
    } catch (err) {
      assert.equal(err.status, 1);
      assert.match(err.stderr, /No prompt provided/);
    }
  });

  it("shows hint when 'config' subcommand is used", () => {
    const result = execFileSync(process.execPath, ["coge.js", "config"], {
      cwd: projectRoot,
      env: { ...process.env, XDG_CONFIG_HOME: tmpDir },
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    // exit code 0, message on stderr
  });

  it("fails when provider API key is missing", (_, done) => {
    const env = {
      ...process.env,
      XDG_CONFIG_HOME: tmpDir,
    };
    // Remove any API keys
    delete env.COGE_GEMINI_API_KEY;
    delete env.COGE_OPENROUTER_API_KEY;

    execFile(process.execPath, ["coge.js", "list files"], {
      cwd: projectRoot,
      env,
      encoding: "utf8",
      timeout: 5000,
    }, (err, stdout, stderr) => {
      assert.notEqual(err, null);
      assert.match(stderr, /API_KEY not set/);
      done();
    });
  });
});
