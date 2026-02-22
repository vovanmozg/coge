---
# app-n6ro
title: Per-provider model definitions
status: completed
type: feature
priority: normal
created_at: 2026-02-22T06:59:01Z
updated_at: 2026-02-22T07:00:50Z
---

Each provider defines its own models (default + available list). providers/index.js aggregates them. lib/config.js uses them for defaults. coge.js --configure shows available models.

## Tasks
- [x] Add `export const models` to all 14 provider files
- [x] Update providers/index.js: import models, export getDefaultModels/getAvailableModels
- [x] Update lib/config.js: use getDefaultModels() for defaultConfig.models
- [x] Update coge.js --configure: show available models for selected provider
- [x] Add/update tests
- [x] Run tests and verify

## Summary of Changes

Each of the 14 provider files now exports a `models` object with `default` and `available` fields. `providers/index.js` aggregates these into `PROVIDER_MODELS` and exports `getDefaultModels()` and `getAvailableModels()`. `lib/config.js` builds `defaultConfig.models` dynamically from `getDefaultModels()`. `coge.js --configure` shows available models after provider selection. Added `test/provider-models.test.js` with tests for all providers. All 140 tests pass.
