---
# app-4p8q
title: Fix cli.test.js and init-config.test.js failing with spawnSync node ENOENT
status: completed
type: bug
priority: normal
created_at: 2026-02-22T23:45:25Z
updated_at: 2026-02-22T23:47:28Z
---

## Description

5 tests fail on macOS when using a Node version manager (nvm/fnm/mise):

- `cli.test.js`: 3 failures — "exits with error when no prompt provided", "shows hint when 'config' subcommand is used", "fails when provider API key is missing"
- `init-config.test.js`: 2 failures — "creates config when missing", "does not throw when config already exists"

All fail with `spawnSync node ENOENT` — `execFileSync("node", ...)` cannot find `node` in PATH.

## Root cause

Tests use `execFileSync("node", ...)` which does not inherit the shell PATH modifications made by version managers.

## Possible fixes

- Use `process.execPath` instead of `"node"` string
- Or import and test functions directly instead of spawning subprocesses
