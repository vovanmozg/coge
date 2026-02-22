---
# app-7lzo
title: Ensure models are stored sorted by category in config files
status: completed
type: task
priority: normal
created_at: 2026-02-22T14:17:30Z
updated_at: 2026-02-22T14:20:06Z
---

## Context

Models have 4 categories: top, small, large (normal), irrelevant. Currently sorting (top → small → large → irrelevant) is applied only for display in `--configure` and `--pull`. But when models are written to config files (`config.json` and `default-config.json`), they are saved in whatever order they arrive (e.g. from API response).

## Requirements

- [x] When `--pull models` saves fetched models to config, sort them by category before writing
- [x] When `--configure` writes config, preserve sorted order of `available` arrays
- [x] Ensure `default-config.json` has models in sorted order (top → small → large → irrelevant)
- [x] Verify `writeDefaultConfigIfMissing()` preserves sorted order
- [x] Add tests for model ordering in config: after `--pull` saves models, the `available` array should be sorted by category
- [x] Add tests that `default-config.json` has models in the expected order (top first, irrelevant last)

## Notes

- Sorting logic lives in `lib/model-classify.js` (`classifyModel` + `normalizeAvailableEntry`)
- Sort order: `{ top: 0, small: 1, large: 2, irrelevant: 3 }`
- Extract the sorting into a reusable helper so it's shared between display and storage

## Summary of Changes

- Added `sortByCategory()` helper to `lib/model-classify.js`
- `coge.js`: sort models before saving in both `--pull` and `--configure`
- `default-config.json`: sorted available arrays for all providers
- Added tests: `sortByCategory` unit tests, ordering check for every provider in `provider-models.test.js`
