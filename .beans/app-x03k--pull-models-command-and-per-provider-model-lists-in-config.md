---
# app-x03k
title: Add 'pull models' command and store per-provider model lists in config
status: completed
type: epic
priority: normal
created_at: 2026-02-22T12:00:00Z
updated_at: 2026-02-22T11:31:03Z
---

## Description

Restructure the config file to store per-provider model lists (not just selected model) and add a `coge pull models <provider>` command that fetches current models from provider documentation.

## Motivation

Model lists go stale — providers add/remove models over time. Currently models are hardcoded in provider files and the user has no way to update them without upgrading coge. This feature lets users refresh available models on demand.

## Current config structure

```json
{
  "provider": "gemini",
  "models": {
    "gemini": "gemini-2.5-flash",
    "cerebras": "llama-3.3-70b"
  }
}
```

## New config structure

```json
{
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "providers": {
    "gemini": {
      "default": "gemini-2.5-flash",
      "available": ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"]
    },
    "cerebras": {
      "default": "llama-3.3-70b",
      "available": ["llama-3.3-70b", "llama-3.1-8b"]
    }
  }
}
```

- `provider` — current active provider
- `model` — current active model (for the active provider)
- `providers` — per-provider info: default model + list of available models

## Config lifecycle

1. First run: config file does NOT exist → create with defaults from provider files
2. Config file EXISTS → load as-is, do NOT merge/overwrite with hardcoded defaults
3. This preserves model lists updated by `pull models`

## `coge pull models <provider>` command

1. Accept provider name as argument: `coge pull models cerebras`
2. Fetch the provider's models documentation page (URL defined per provider)
3. Send page content to the current default model with a prompt: "Extract model IDs from this page as a JSON array"
4. If fetch or extraction fails — keep the existing model list unchanged, print an error
5. On success — update `providers.<name>.available` in config with extracted list
6. Keep the rest of config unchanged

## Example flow

1. User installs coge → config created with hardcoded defaults
2. Month later, cerebras updates models
3. User runs: `coge pull models cerebras`
4. coge fetches `https://inference-docs.cerebras.ai/models/overview`
5. coge sends page content to current model to extract model IDs
6. coge updates config: `providers.cerebras.available = [extracted models]`
7. Next `coge --configure` shows updated model list

## Implementation notes

- Each provider file should export optional `modelsPageUrl` for providers that support pulling
- `loadConfig()` must stop merging hardcoded defaults when config file exists
- `writeDefaultConfigIfMissing()` should write the new config structure with full provider info
- Add `pullModels(providerName)` function in a new module or in config.js
- Add CLI handling for `pull models <provider>` in coge.js
- Use a single LLM request to current default model to extract model list from fetched page

## Acceptance criteria

- [x] Config file uses new structure with per-provider `default` + `available` arrays
- [x] Config file is only created with defaults if it does not exist; existing configs are not overwritten
- [x] `coge pull models <provider>` fetches models page and updates config
- [x] If fetch or model extraction fails, existing model list is preserved (not deleted)
- [x] `coge --configure` uses model lists from config (not hardcoded)
- [x] Existing functionality (prompt generation, provider selection) continues to work

## Summary

Epic completed across 4 tasks:
- app-p1hm: Restructured config to per-provider format
- app-i7kq: Updated --configure to read models from config
- app-tbak: Added pull models command with per-provider fetchModels()
- app-6vk7: Migrated HuggingFace to router.huggingface.co
