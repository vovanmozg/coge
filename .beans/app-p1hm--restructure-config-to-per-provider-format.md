---
# app-p1hm
title: Restructure config to per-provider format
status: completed
type: task
priority: normal
created_at: 2026-02-22T10:32:49Z
updated_at: 2026-02-22T10:39:45Z
parent: app-x03k
---

## Description

Migrate config from flat `models` map to per-provider structure with `default` + `available` arrays.

## Current format

```json
{
  "provider": "gemini",
  "models": {
    "gemini": "gemini-2.5-flash",
    "cerebras": "llama-3.3-70b"
  }
}
```

## New format

```json
{
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "providers": {
    "gemini": {
      "default": "gemini-2.5-flash",
      "available": ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"]
    }
  }
}
```

## Acceptance criteria

- [x] `writeDefaultConfigIfMissing()` writes new structure with full provider info
- [x] `loadConfig()` reads new structure; does NOT merge hardcoded defaults when config exists
- [x] `loadConfig()` handles old format gracefully (migration)
- [x] `writeConfig()` writes new structure
- [x] `getProvider()` works with new config shape
- [x] Existing tests pass

## Summary of Changes

- **lib/config.js**: Replaced flat `models` map with `{ provider, model, providers }` structure. `defaultConfig` now built from `getDefaultProviders()`. `loadConfig()` returns file config as-is (no merging defaults), with automatic migration from old `models` format. `writeConfig()` writes new shape.
- **providers/index.js**: Added `getDefaultProviders()` export. Updated `getProvider()` to read `config.model` with `config.models?.[name]` fallback for backward compatibility.
- **coge.js**: Updated debug output and `runConfigure()` to use `config.model` and `config.providers`.
- **test/config.test.js**: Updated all assertions for new config shape; added tests for migration and no-merge behavior.
- **test/providers-index.test.js**: Updated config objects to new shape; added backward-compat test for old `models` format.
