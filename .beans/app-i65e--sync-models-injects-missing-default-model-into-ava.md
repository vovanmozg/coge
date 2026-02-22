---
# app-i65e
title: sync-models injects missing default model into available list
status: completed
type: bug
priority: normal
created_at: 2026-02-22T14:39:47Z
updated_at: 2026-02-22T14:40:50Z
---

## Problem

After `coge --pull models cerebras`, config.json has 4 models (llama-3.3-70b is no longer returned by the API).

When running `npm run sync-models`, the script detects that the default model `llama-3.3-70b` is missing from the available list and force-inserts it via `unshift`. Result: default-config.json has 5 models instead of the expected 4.

sync-models should faithfully reflect what the API returned, not silently patch the list.

## Expected behavior

sync-models copies the available array from config.json as-is. If the default model is no longer available, warn the user but don't inject it.

## Steps to reproduce

1. `coge --pull models cerebras` — returns 4 models
2. `npm run sync-models` — writes 5 models to default-config.json (llama-3.3-70b added)

## Plan
- [ ] Remove automatic default model injection in sync-models
- [ ] Add a warning when default model is missing from available
- [ ] Ensure tests pass (test checks default in available — may need to update default)

## Summary of Changes

Replaced automatic default model injection (unshift) with a warning message. sync-models now faithfully copies the available array from user config without modification.
